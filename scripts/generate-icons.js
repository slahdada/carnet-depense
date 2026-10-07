import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// 1. Standard App Icon SVG (512x512)
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1120"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>

    <!-- Emerald Glow Gradient -->
    <radialGradient id="glowGrad" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="#059669" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>

    <!-- Ledger Card Gradient -->
    <linearGradient id="ledgerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>

    <!-- Primary Accent Gradient (Emerald to Cyan) -->
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="50%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>

    <!-- Gold/Sparkle Accent -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>

    <filter id="softShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.55"/>
    </filter>
    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Base App Background with Squircle -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  
  <!-- Subtle ambient glow in center -->
  <circle cx="256" cy="240" r="210" fill="url(#glowGrad)"/>
  
  <!-- Outer subtle border rim -->
  <rect width="510" height="510" x="1" y="1" rx="111" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>

  <!-- Main Financial Ledger / Notebook Body -->
  <g filter="url(#softShadow)">
    <!-- Back page edge / 3D depth -->
    <rect x="94" y="96" width="324" height="324" rx="36" fill="#1e293b" opacity="0.6"/>
    <!-- Main Ledger Card -->
    <rect x="100" y="90" width="312" height="324" rx="36" fill="url(#ledgerGrad)" stroke="rgba(16, 185, 129, 0.3)" stroke-width="2.5"/>
    
    <!-- Ledger Spine & Ring Binding on Left -->
    <path d="M100 126 C100 106 116 90 136 90 L146 90 L146 414 L136 414 C116 414 100 398 100 378 Z" fill="#090d16"/>
    <line x1="146" y1="90" x2="146" y2="414" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
    
    <!-- Binding Rings / Slots -->
    <circle cx="123" cy="140" r="6" fill="#334155" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
    <circle cx="123" cy="204" r="6" fill="#334155" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
    <circle cx="123" cy="268" r="6" fill="#334155" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
    <circle cx="123" cy="332" r="6" fill="#334155" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
    <circle cx="123" cy="376" r="6" fill="#334155" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>

    <!-- Finance Growth Bar Chart in background of notebook -->
    <g opacity="0.45">
      <rect x="256" y="270" width="18" height="66" rx="6" fill="#3b82f6"/>
      <rect x="286" y="240" width="18" height="96" rx="6" fill="#06b6d4"/>
      <rect x="316" y="200" width="18" height="136" rx="6" fill="#10b981"/>
      <rect x="346" y="160" width="18" height="176" rx="6" fill="#34d399"/>
      <!-- Trend upward line -->
      <path d="M265 264 L295 234 L325 194 L355 154" fill="none" stroke="#6ee7b7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="355" cy="154" r="4.5" fill="#a7f3d0"/>
    </g>

    <!-- Ledger Heading & Accounting Rules -->
    <rect x="174" y="128" width="86" height="8" rx="4" fill="rgba(255,255,255,0.22)"/>
    <rect x="174" y="146" width="60" height="6" rx="3" fill="rgba(255,255,255,0.1)"/>
    <line x1="174" y1="172" x2="380" y2="172" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" stroke-dasharray="4 4"/>
    <line x1="174" y1="346" x2="380" y2="346" stroke="rgba(255,255,255,0.08)" stroke-width="1.5"/>

    <!-- Prominent Emblem / Coin with Euro Sign -->
    <g transform="translate(236, 252)">
      <!-- Outer coin glow & ring -->
      <circle cx="0" cy="0" r="64" fill="url(#accentGrad)" filter="url(#glowFilter)" opacity="0.35"/>
      <circle cx="0" cy="0" r="58" fill="url(#accentGrad)" stroke="rgba(255,255,255,0.4)" stroke-width="2.5"/>
      <circle cx="0" cy="0" r="50" fill="#064e3b" stroke="rgba(52, 211, 153, 0.4)" stroke-width="1.5"/>
      
      <!-- Vector Euro Symbol (€) for ultra-sharp cross-platform rendering -->
      <path d="M 16 -24 
               C 10 -31, -2 -33, -12 -30
               C -24 -26, -34 -14, -36 2
               C -38 18, -28 32, -14 36
               C -4 38, 8 36, 17 28
               C 19 26, 21 22, 19 20
               C 17 18, 14 18, 11 21
               C 4 27, -6 28, -14 25
               C -24 21, -30 10, -28 -3
               L 12 -3
               C 14 -3, 16 -5, 16 -8
               C 16 -11, 14 -13, 12 -13
               L -27 -13
               C -25 -20, -18 -26, -10 -27
               C -3 -28, 6 -26, 11 -20
               C 13 -17, 17 -17, 19 -19
               C 21 -21, 19 -23, 16 -24 Z" 
            fill="#ffffff" 
            filter="url(#softShadow)"/>
    </g>

    <!-- Top Right Sparkle / Balance Success Star -->
    <g transform="translate(372, 122)">
      <circle cx="0" cy="0" r="14" fill="#10b981" opacity="0.25"/>
      <path d="M 0 -12 Q 2 -2 12 0 Q 2 2 0 12 Q -2 2 -12 0 Q -2 -2 0 -12 Z" fill="url(#goldGrad)"/>
    </g>
  </g>
</svg>`;

// 2. Maskable Icon SVG (512x512) - Content strictly inside inner 80% circle (r=204px around 256,256)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1120"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <radialGradient id="glowGradM" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.3"/>
      <stop offset="70%" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="accentGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="50%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <filter id="softShadowM" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Full bleed background for adaptive OS masks -->
  <rect width="512" height="512" fill="url(#bgGradM)"/>
  <circle cx="256" cy="256" r="220" fill="url(#glowGradM)"/>

  <!-- Centered emblem scaled to fit comfortably inside the safe zone (within r=180px) -->
  <g transform="translate(256, 256) scale(0.84)" filter="url(#softShadowM)">
    <!-- Ledger Base Card -->
    <rect x="-140" y="-140" width="280" height="280" rx="36" fill="#1e293b" stroke="rgba(16, 185, 129, 0.4)" stroke-width="2.5"/>
    
    <!-- Spine -->
    <path d="M-140 -108 C-140 -125 -125 -140 -108 -140 L-95 -140 L-95 140 L-108 140 C-125 140 -140 125 -140 108 Z" fill="#090d16"/>
    <circle cx="-118" cy="-80" r="5.5" fill="#334155"/>
    <circle cx="-118" cy="-25" r="5.5" fill="#334155"/>
    <circle cx="-118" cy="30" r="5.5" fill="#334155"/>
    <circle cx="-118" cy="85" r="5.5" fill="#334155"/>

    <!-- Bar chart background -->
    <rect x="25" y="10" width="16" height="60" rx="5" fill="#3b82f6" opacity="0.6"/>
    <rect x="50" y="-15" width="16" height="85" rx="5" fill="#06b6d4" opacity="0.6"/>
    <rect x="75" y="-45" width="16" height="115" rx="5" fill="#10b981" opacity="0.6"/>
    <rect x="100" y="-75" width="16" height="145" rx="5" fill="#34d399" opacity="0.75"/>

    <!-- Central Euro Coin Shield -->
    <g transform="translate(-15, 5)">
      <circle cx="0" cy="0" r="62" fill="url(#accentGradM)" stroke="rgba(255,255,255,0.4)" stroke-width="3"/>
      <circle cx="0" cy="0" r="52" fill="#064e3b" stroke="rgba(52, 211, 153, 0.5)" stroke-width="1.5"/>
      
      <!-- Euro Symbol -->
      <path d="M 16 -24 
               C 10 -31, -2 -33, -12 -30
               C -24 -26, -34 -14, -36 2
               C -38 18, -28 32, -14 36
               C -4 38, 8 36, 17 28
               C 19 26, 21 22, 19 20
               C 17 18, 14 18, 11 21
               C 4 27, -6 28, -14 25
               C -24 21, -30 10, -28 -3
               L 12 -3
               C 14 -3, 16 -5, 16 -8
               C 16 -11, 14 -13, 12 -13
               L -27 -13
               C -25 -20, -18 -26, -10 -27
               C -3 -28, 6 -26, 11 -20
               C 13 -17, 17 -17, 19 -19
               C 21 -21, 19 -23, 16 -24 Z" 
            fill="#ffffff"/>
    </g>

    <!-- Star -->
    <path d="M 105 -105 Q 107 -97 115 -95 Q 107 -93 105 -85 Q 103 -93 95 -95 Q 103 -97 105 -105 Z" fill="#fbbf24"/>
  </g>
</svg>`;

async function generateAllAssets() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Save standard icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg);
  console.log('Saved public/icon.svg');

  // Generate 512x512 standard PNG
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated public/pwa-512x512.png');

  // Generate 192x192 standard PNG
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated public/pwa-192x192.png');

  // Generate 512x512 maskable PNG
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated public/pwa-maskable-512x512.png');

  // Generate 180x180 Apple Touch Icon (solid background)
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated public/apple-touch-icon.png');

  // Generate 32x32 Favicon PNG (favicon.ico)
  await sharp(Buffer.from(standardSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Generated public/favicon.ico');
}

generateAllAssets().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
