/**
 * Firebase IdentityToolkit Authentication & Token Management for Cloudflare Worker
 * Zero-dependency: Uses native fetch()
 */

import type { CachedAuthSession, Env } from "./types";

let cachedSession: CachedAuthSession | null = null;
let inflightAuthPromise: Promise<string> | null = null;

const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiration

/**
 * Perform sign-in with email and password via Google IdentityToolkit
 */
async function signIn(env: Env): Promise<CachedAuthSession> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.FIREBASE_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: env.FIREBASE_BOT_EMAIL,
      password: env.FIREBASE_BOT_PASSWORD,
      returnSecureToken: true,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Firebase bot authentication failed (${response.status}): ${JSON.stringify(errorData)}`
    );
  }

  const data = (await response.json()) as {
    idToken: string;
    refreshToken: string;
    expiresIn: string; // seconds as string, e.g. "3600"
  };

  const expiresInSec = parseInt(data.expiresIn, 10) || 3600;
  return {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + expiresInSec * 1000,
  };
}

/**
 * Refresh an existing idToken using the refreshToken via SecureToken API
 */
async function refreshToken(env: Env, token: string): Promise<CachedAuthSession> {
  const url = `https://securetoken.googleapis.com/v1/token?key=${env.FIREBASE_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token,
    }).toString(),
  });

  if (!response.ok) {
    // If refresh token fails, re-authenticate from scratch
    return await signIn(env);
  }

  const data = (await response.json()) as {
    id_token: string;
    refresh_token: string;
    expires_in: string;
  };

  const expiresInSec = parseInt(data.expires_in, 10) || 3600;
  return {
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + expiresInSec * 1000,
  };
}

/**
 * Returns a valid idToken for Firestore REST requests.
 * Uses global isolate caching and non-blocking in-flight deduplication.
 */
export async function getFirebaseIdToken(env: Env): Promise<string> {
  const now = Date.now();

  // 1. Warm cache hit
  if (cachedSession && now < cachedSession.expiresAt - REFRESH_BUFFER_MS) {
    return cachedSession.idToken;
  }

  // 2. In-flight request deduplication
  if (inflightAuthPromise) {
    return inflightAuthPromise;
  }

  inflightAuthPromise = (async () => {
    try {
      if (cachedSession && cachedSession.refreshToken) {
        // Try refreshing existing token
        cachedSession = await refreshToken(env, cachedSession.refreshToken);
      } else {
        // First login on this isolate
        cachedSession = await signIn(env);
      }
      return cachedSession.idToken;
    } catch (err) {
      // Clear cache on fatal auth failure so next request retries
      cachedSession = null;
      throw err;
    } finally {
      inflightAuthPromise = null;
    }
  })();

  return inflightAuthPromise;
}
