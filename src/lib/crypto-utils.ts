// RSA key pair generation and digital signature utilities using node-forge
// (works on both HTTP and HTTPS, unlike Web Crypto API)

import forge from 'node-forge';

export async function generateRSAKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  return new Promise((resolve, reject) => {
    forge.pki.rsa.generateKeyPair({ bits: 2048, workers: -1 }, (err, keypair) => {
      if (err) {
        reject(err);
        return;
      }
      const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
      const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
      
      // Store as base64 of PEM for consistency
      const publicKey = btoa(publicKeyPem);
      const privateKey = btoa(privateKeyPem);
      
      resolve({ publicKey, privateKey });
    });
  });
}

export async function hashData(data: string): Promise<string> {
  const md = forge.md.sha256.create();
  md.update(data, 'utf8');
  return btoa(md.digest().data);
}

export async function signData(privateKeyBase64: string, data: string): Promise<string> {
  const privateKeyPem = atob(privateKeyBase64);
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  
  const md = forge.md.sha256.create();
  md.update(data, 'utf8');
  
  const signature = privateKey.sign(md);
  return btoa(signature);
}

export async function verifySignature(publicKeyBase64: string, signature: string, data: string): Promise<boolean> {
  try {
    const publicKeyPem = atob(publicKeyBase64);
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    
    const md = forge.md.sha256.create();
    md.update(data, 'utf8');
    
    const sigBytes = atob(signature);
    return publicKey.verify(md.digest().bytes(), sigBytes);
  } catch {
    return false;
  }
}

// AES-GCM encryption of private key using a password
export async function encryptPrivateKey(privateKeyBase64: string, password: string): Promise<string> {
  const salt = forge.random.getBytesSync(16);
  const iv = forge.random.getBytesSync(12);
  
  // Derive key from password using PBKDF2
  const key = forge.pkcs5.pbkdf2(password, salt, 100000, 32, forge.md.sha256.create());
  
  // Encrypt using AES-GCM
  const cipher = forge.cipher.createCipher('AES-GCM', key);
  cipher.start({ iv, tagLength: 128 });
  cipher.update(forge.util.createBuffer(privateKeyBase64, 'utf8'));
  cipher.finish();
  
  const encrypted = cipher.output.data;
  const tag = cipher.mode.tag.data;
  
  // Format: salt(16) + iv(12) + tag(16) + ciphertext → base64
  const combined = salt + iv + tag + encrypted;
  return btoa(combined);
}

export async function decryptPrivateKey(encryptedBase64: string, password: string): Promise<string> {
  const combined = atob(encryptedBase64);
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const tag = combined.slice(28, 44);
  const ciphertext = combined.slice(44);
  
  // Derive same key from password
  const key = forge.pkcs5.pbkdf2(password, salt, 100000, 32, forge.md.sha256.create());
  
  // Decrypt using AES-GCM
  const decipher = forge.cipher.createDecipher('AES-GCM', key);
  decipher.start({ iv, tag: forge.util.createBuffer(tag) });
  decipher.update(forge.util.createBuffer(ciphertext));
  const pass = decipher.finish();
  
  if (!pass) {
    throw new Error('Giải mã thất bại - mật khẩu không đúng');
  }
  
  return decipher.output.toString();
}

// Fetch encrypted private key from server and decrypt with password
export async function getServerPrivateKey(userId: string, password: string): Promise<string | null> {
  const { digitalSignaturesApi } = await import('@/lib/api-client');
  const { data } = await digitalSignaturesApi.get(userId, true);

  const sig = data && data.length > 0 ? data[0] : null;
  if (!sig?.encrypted_private_key) return null;
  
  try {
    return await decryptPrivateKey(sig.encrypted_private_key, password);
  } catch {
    return null;
  }
}

// Legacy localStorage functions (kept for backward compatibility)
export function storePrivateKey(userId: string, privateKey: string): void {
  localStorage.setItem(`private_key_${userId}`, privateKey);
}

export function getPrivateKey(userId: string): string | null {
  return localStorage.getItem(`private_key_${userId}`);
}

export function removePrivateKey(userId: string): void {
  localStorage.removeItem(`private_key_${userId}`);
}
