// RSA key pair generation and digital signature utilities using Web Crypto API

export async function generateRSAKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // extractable
    ['sign', 'verify']
  );

  const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKey = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));
  const privateKey = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));

  return { publicKey, privateKey };
}

export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

export async function signData(privateKeyBase64: string, data: string): Promise<string> {
  const privateKeyBuffer = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));
  
  const privateKey = await window.crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const signatureBuffer = await window.crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, dataBuffer);

  return btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
}

export async function verifySignature(publicKeyBase64: string, signature: string, data: string): Promise<boolean> {
  try {
    const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
    const signatureBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0));

    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    return await window.crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, signatureBuffer, dataBuffer);
  } catch {
    return false;
  }
}

// Store private key in localStorage (encrypted label by user_id)
export function storePrivateKey(userId: string, privateKey: string): void {
  localStorage.setItem(`private_key_${userId}`, privateKey);
}

export function getPrivateKey(userId: string): string | null {
  return localStorage.getItem(`private_key_${userId}`);
}

export function removePrivateKey(userId: string): void {
  localStorage.removeItem(`private_key_${userId}`);
}
