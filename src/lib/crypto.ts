/**
 * Hash a passkey using SHA-256 via the Web Crypto API.
 * Returns the hash as a hex string.
 */
export async function hashPasskey(passkey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(passkey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify a passkey against a stored hash.
 */
export async function verifyPasskey(
  passkey: string,
  storedHash: string
): Promise<boolean> {
  const hash = await hashPasskey(passkey);
  return hash === storedHash;
}
