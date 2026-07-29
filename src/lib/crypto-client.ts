export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptContent(content: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const key = await deriveKey(password, salt);
  const enc = new TextEncoder();
  
  const encryptedContent = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as any },
    key,
    enc.encode(content) as any
  );

  // Pack salt + iv + ciphertext into a single base64 string
  const packed = new Uint8Array(salt.length + iv.length + encryptedContent.byteLength);
  packed.set(salt, 0);
  packed.set(iv, salt.length);
  packed.set(new Uint8Array(encryptedContent), salt.length + iv.length);
  
  // Convert to Base64 (browser compatible)
  const binary = Array.from(packed).map(b => String.fromCharCode(b)).join('');
  return "ENC:" + btoa(binary);
}

export async function decryptContent(encryptedStr: string, password: string): Promise<string> {
  if (!encryptedStr.startsWith("ENC:")) {
    throw new Error("Invalid encrypted format");
  }
  
  const base64 = encryptedStr.substring(4);
  const binary = atob(base64);
  const packed = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    packed[i] = binary.charCodeAt(i);
  }
  
  const salt = packed.slice(0, 16);
  const iv = packed.slice(16, 28);
  const data = packed.slice(28);
  
  const key = await deriveKey(password, salt);
  
  const decryptedContent = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as any },
    key,
    data as any
  );
  
  const dec = new TextDecoder();
  return dec.decode(decryptedContent);
}
