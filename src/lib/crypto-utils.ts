// RSA Key Pair generation and signing utilities using Web Crypto API

export async function generateRSAKeyPair(): Promise<{ publicKey: string; privateKeyEncrypted: string }> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );

  const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKey = bufferToBase64(publicKeyBuffer);
  const privateKeyEncrypted = bufferToBase64(privateKeyBuffer);

  return { publicKey, privateKeyEncrypted };
}

export async function signData(privateKeyBase64: string, data: string): Promise<string> {
  const privateKeyBuffer = base64ToBuffer(privateKeyBase64);
  
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

  return bufferToBase64(signatureBuffer);
}

export async function verifySignature(publicKeyBase64: string, data: string, signatureBase64: string): Promise<boolean> {
  const publicKeyBuffer = base64ToBuffer(publicKeyBase64);
  
  const publicKey = await window.crypto.subtle.importKey(
    'spki',
    publicKeyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const signatureBuffer = base64ToBuffer(signatureBase64);

  return window.crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, signatureBuffer, dataBuffer);
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function createSignableData(transaction: {
  id: string;
  voucherNo: string;
  amount: number;
  date: string;
  description: string;
}): string {
  return JSON.stringify({
    id: transaction.id,
    voucherNo: transaction.voucherNo,
    amount: transaction.amount,
    date: transaction.date,
    description: transaction.description,
  });
}
