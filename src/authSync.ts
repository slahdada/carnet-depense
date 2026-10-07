import { 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  subscribeToTransactions, 
  saveCloudTransaction, 
  deleteCloudTransaction,
  CloudTransaction 
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

declare global {
  interface Window {
    FirebaseSync?: {
      currentUser: User | null;
      login: () => Promise<void>;
      logout: () => Promise<void>;
      saveTransaction: (transaction: any) => Promise<void>;
      deleteTransaction: (id: string) => Promise<void>;
      syncLocalTransactions: (localList: any[]) => Promise<void>;
    };
    handleCloudTransactionsUpdate?: (list: any[]) => void;
    updateAuthUI?: (user: User | null) => void;
  }
}

let activeUnsubscribe: (() => void) | null = null;
let currentAuthUser: User | null = null;

// Initialisation de la synchronisation Auth & Firestore
onAuthStateChanged(auth, async (user) => {
  currentAuthUser = user;
  
  if (activeUnsubscribe) {
    activeUnsubscribe();
    activeUnsubscribe = null;
  }

  if (window.updateAuthUI) {
    window.updateAuthUI(user);
  }

  if (user) {
    console.log('Firebase Auth connecté :', user.email, user.uid);
    // Écoute en temps réel des transactions de l'utilisateur
    activeUnsubscribe = subscribeToTransactions(
      user.uid,
      (cloudList) => {
        if (window.handleCloudTransactionsUpdate) {
          window.handleCloudTransactionsUpdate(cloudList);
        }
      },
      (error) => {
        console.warn('Notification synchronisation:', error);
      }
    );
  }
});

// Objet global exposé pour l'interface utilisateur
window.FirebaseSync = {
  get currentUser() {
    return currentAuthUser;
  },

  async login() {
    try {
      const user = await loginWithGoogle();
      if (window.updateAuthUI) {
        window.updateAuthUI(user);
      }
    } catch (err: any) {
      console.error('Erreur connexion Google:', err);
      throw err;
    }
  },

  async logout() {
    try {
      if (activeUnsubscribe) {
        activeUnsubscribe();
        activeUnsubscribe = null;
      }
      await logoutUser();
      currentAuthUser = null;
      if (window.updateAuthUI) {
        window.updateAuthUI(null);
      }
    } catch (err) {
      console.error('Erreur déconnexion:', err);
      throw err;
    }
  },

  async saveTransaction(transaction: any) {
    if (!currentAuthUser) return;
    const cloudItem: CloudTransaction = {
      id: String(transaction.id),
      userId: currentAuthUser.uid,
      type: transaction.type,
      amount: Number(transaction.amount),
      category: transaction.category,
      description: transaction.description || '',
      date: transaction.date,
      createdAt: transaction.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await saveCloudTransaction(currentAuthUser.uid, cloudItem);
  },

  async deleteTransaction(id: string) {
    if (!currentAuthUser) return;
    await deleteCloudTransaction(currentAuthUser.uid, String(id));
  },

  async syncLocalTransactions(localList: any[]) {
    if (!currentAuthUser || !Array.isArray(localList) || localList.length === 0) return;
    for (const item of localList) {
      try {
        await window.FirebaseSync?.saveTransaction(item);
      } catch (e) {
        console.warn('Erreur migration transaction locale vers cloud:', e);
      }
    }
  }
};
