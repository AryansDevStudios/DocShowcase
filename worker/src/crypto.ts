/**
 * Zero-dependency Cryptography Helper for DocShowcase Cloudflare Worker
 * Fully byte-for-byte compatible with frontend crypto-client.ts and crypto.ts
 */

export function scrubBuffer(buf: Uint8Array | ArrayBuffer | null | undefined): void {
  if (!buf) return;
  if (buf instanceof Uint8Array) {
    buf.fill(0);
  } else if (buf instanceof ArrayBuffer) {
    new Uint8Array(buf).fill(0);
  }
}

/**
 * Derive AES-GCM 256-bit key from password and salt using PBKDF2 (100,000 iterations, SHA-256)
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordBytes = enc.encode(password);
  try {
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      passwordBytes,
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    return await crypto.subtle.deriveKey(
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
  } finally {
    scrubBuffer(passwordBytes);
  }
}

/**
 * Encrypt plaintext content with AES-256-GCM
 * Output format: "ENC:" + base64(salt[16] + iv[12] + ciphertext)
 */
export async function encryptContent(content: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  let key: CryptoKey | null = null;
  const enc = new TextEncoder();
  const contentBytes = enc.encode(content);

  try {
    key = await deriveKey(password, salt);

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as any },
      key,
      contentBytes as any
    );

    const packed = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
    packed.set(salt, 0);
    packed.set(iv, salt.length);
    packed.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);

    // Convert packed binary to Base64
    let binary = "";
    const len = packed.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(packed[i]);
    }
    return "ENC:" + btoa(binary);
  } finally {
    scrubBuffer(contentBytes);
  }
}

/**
 * Decrypt "ENC:" prefixed base64 string using AES-256-GCM
 */
export async function decryptContent(encryptedStr: string, password: string): Promise<string> {
  if (!encryptedStr || !encryptedStr.startsWith("ENC:")) {
    throw new Error("Invalid encrypted format: missing ENC: prefix");
  }

  const base64 = encryptedStr.substring(4);
  const binary = atob(base64);
  const packed = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    packed[i] = binary.charCodeAt(i);
  }

  if (packed.length < 28) {
    throw new Error("Invalid encrypted payload: too short for salt + IV");
  }

  const salt = packed.slice(0, 16);
  const iv = packed.slice(16, 28);
  const data = packed.slice(28);

  const key = await deriveKey(password, salt);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as any },
      key,
      data as any
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } finally {
    scrubBuffer(salt);
    scrubBuffer(iv);
    scrubBuffer(packed);
  }
}

/**
 * Hash a passkey using SHA-256 via Web Crypto API.
 * Returns lowercase 64-character hex string.
 * Exact parity with src/lib/crypto.ts.
 */
export async function hashPasskey(passkey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(passkey);
  try {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } finally {
    scrubBuffer(data);
  }
}

/**
 * Generate a cryptographically secure random hex salt.
 */
export function generateSalt(length = 16): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Compute salted SHA-256 hash
 */
export async function hashWithSalt(passkey: string, saltHex: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(saltHex + ":" + passkey);
  try {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } finally {
    scrubBuffer(data);
  }
}

/**
 * Verify passkey against stored hash and optional salt.
 * Supports both modern salted hashes and legacy unsalted SHA-256 hashes.
 */
export async function verifyPasskey(
  passkey: string,
  storedHash: string,
  storedSalt?: string | null
): Promise<boolean> {
  if (!passkey || !storedHash) return false;

  // 1. If salt is present, check salted hash first
  if (storedSalt) {
    const computedSalted = await hashWithSalt(passkey, storedSalt);
    if (computedSalted === storedHash) {
      return true;
    }
  }

  // 2. Check legacy SHA-256 hash
  const legacyHash = await hashPasskey(passkey);
  return legacyHash === storedHash;
}
