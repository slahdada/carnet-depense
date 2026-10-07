import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  getDocFromServer,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialisation Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Error handling types and helper as mandated by Firebase Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Warning/Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection as required by Skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Vérification configuration Firebase (hors-ligne).");
    }
  }
}
testConnection();

// Authentication helpers
export async function loginWithEmail(email: string, password: string): Promise<User> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const result = await signInWithEmailAndPassword(auth, cleanEmail, password);
    if (result.user) {
      try {
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email || cleanEmail,
          displayName: result.user.displayName || cleanEmail.split('@')[0],
          photoURL: result.user.photoURL || '',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Notice profil Firestore (Email):', err);
      }
    }
    return result.user;
  } catch (error) {
    console.error('Erreur connexion Email:', error);
    throw error;
  }
}

export async function registerWithEmail(email: string, password: string, displayName?: string): Promise<User> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const result = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    if (result.user) {
      const finalName = displayName?.trim() || cleanEmail.split('@')[0];
      try {
        await updateProfile(result.user, { displayName: finalName });
      } catch (e) {
        console.warn('Notice mise à jour displayName:', e);
      }
      try {
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email || cleanEmail,
          displayName: finalName,
          photoURL: '',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Notice enregistrement profil Firestore:', err);
      }
    }
    return result.user;
  } catch (error) {
    console.error('Erreur inscription Email:', error);
    throw error;
  }
}

export async function resetPassword(email: string): Promise<void> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    await sendPasswordResetEmail(auth, cleanEmail);
  } catch (error) {
    console.error('Erreur réinitialisation mot de passe:', error);
    throw error;
  }
}

export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      try {
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || '',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Notice profil Firestore:', err);
      }
    }
    return result.user;
  } catch (error) {
    console.error('Erreur authentification Google:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    throw error;
  }
}

// Transaction synchronization
export interface CloudTransaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export function subscribeToTransactions(
  userId: string,
  onData: (transactions: CloudTransaction[]) => void,
  onError?: (error: unknown) => void
) {
  const collectionPath = `users/${userId}/transactions`;
  const q = query(collection(db, 'users', userId, 'transactions'), orderBy('date', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: CloudTransaction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as CloudTransaction;
        list.push({ ...data, id: docSnap.id });
      });
      onData(list);
    },
    (error) => {
      console.warn('Erreur écoute Firestore:', error.message);
      onError?.(error);
    }
  );
}

export async function saveCloudTransaction(userId: string, transaction: CloudTransaction): Promise<void> {
  const path = `users/${userId}/transactions/${transaction.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'transactions', transaction.id);
    const cleanData: Record<string, any> = {
      id: transaction.id,
      userId,
      type: transaction.type,
      amount: Number(transaction.amount),
      category: transaction.category,
      date: transaction.date,
      updatedAt: new Date().toISOString()
    };
    if (transaction.description) {
      cleanData.description = transaction.description;
    }
    if (transaction.createdAt) {
      cleanData.createdAt = transaction.createdAt;
    } else {
      cleanData.createdAt = new Date().toISOString();
    }
    await setDoc(docRef, cleanData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCloudTransaction(userId: string, transactionId: string): Promise<void> {
  const path = `users/${userId}/transactions/${transactionId}`;
  try {
    const docRef = doc(db, 'users', userId, 'transactions', transactionId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
