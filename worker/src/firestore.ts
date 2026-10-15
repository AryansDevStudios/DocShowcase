/**
 * Zero-dependency Firestore REST Client for Cloudflare Worker
 */

import { getFirebaseIdToken } from "./firebase-auth";
import type { DocumentData, Env, FirestoreDocument, FirestoreValue } from "./types";

export const MAX_DOCUMENT_BYTE_SIZE = 980 * 1024; // 980 KB safe limit

/**
 * Convert standard JS value to Firestore REST Value
 */
export function toFirestoreValue(val: any): FirestoreValue {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === "boolean") {
    return { booleanValue: val };
  }
  if (typeof val === "number") {
    if (Number.isInteger(val)) {
      return { integerValue: String(val) };
    }
    return { doubleValue: val };
  }
  if (typeof val === "string") {
    return { stringValue: val };
  }
  if (val instanceof Date) {
    return { timestampValue: val.toISOString() };
  }
  if (typeof val === "object") {
    // Check if it's already a timestamp-like object with seconds
    if (typeof val.seconds === "number") {
      return { timestampValue: new Date(val.seconds * 1000).toISOString() };
    }
    if (Array.isArray(val)) {
      return { arrayValue: { values: val.map(toFirestoreValue) } };
    }
    const fields: Record<string, FirestoreValue> = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

/**
 * Convert JS object to Firestore fields dictionary
 */
export function toFirestoreFields(obj: Record<string, any>): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      fields[key] = toFirestoreValue(value);
    }
  }
  return fields;
}

/**
 * Convert Firestore REST Value to plain JavaScript value
 */
export function fromFirestoreValue(val: FirestoreValue): any {
  if ("stringValue" in val) return val.stringValue;
  if ("booleanValue" in val) return val.booleanValue;
  if ("integerValue" in val) return parseInt(val.integerValue, 10);
  if ("doubleValue" in val) return val.doubleValue;
  if ("nullValue" in val) return null;
  if ("timestampValue" in val) {
    const d = new Date(val.timestampValue);
    const ms = d.getTime();
    return {
      seconds: Math.floor(ms / 1000),
      nanoseconds: (ms % 1000) * 1000000,
      iso: val.timestampValue,
    };
  }
  if ("mapValue" in val) {
    const res: Record<string, any> = {};
    const fields = val.mapValue.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      res[k] = fromFirestoreValue(v);
    }
    return res;
  }
  if ("arrayValue" in val) {
    return (val.arrayValue.values || []).map(fromFirestoreValue);
  }
  return null;
}

/**
 * Convert Firestore document fields to plain DocumentData
 */
export function fromFirestoreDocument(doc: FirestoreDocument): DocumentData {
  const id = doc.name ? doc.name.split("/").pop() || "" : "";
  const fields = doc.fields || {};
  const data: Record<string, any> = { id };

  for (const [k, v] of Object.entries(fields)) {
    data[k] = fromFirestoreValue(v);
  }

  return {
    id,
    name: data.name || "",
    content: data.content || "",
    type: data.type || "markdown",
    passkeyHash: data.passkeyHash ?? null,
    editPasswordHash: data.editPasswordHash ?? null,
    editPasswordSalt: data.editPasswordSalt ?? null,
    burnAfterReading: Boolean(data.burnAfterReading),
    expiresAt: data.expiresAt ?? null,
    views: typeof data.views === "number" ? data.views : 0,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function getBaseUrl(env: Env): string {
  return `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
}

/**
 * Fetch a document by ID from Firestore
 */
export async function getDocument(env: Env, docId: string): Promise<DocumentData | null> {
  const token = await getFirebaseIdToken(env);
  const url = `${getBaseUrl(env)}/documents/${encodeURIComponent(docId)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Firestore GET failed (${response.status}): ${errText}`);
  }

  const firestoreDoc = (await response.json()) as FirestoreDocument;
  return fromFirestoreDocument(firestoreDoc);
}

/**
 * Create or overwrite a document at a specific docId
 */
export async function setDocument(
  env: Env,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  // Validate content byte size limit
  if (data.content) {
    const size = new TextEncoder().encode(data.content).byteLength;
    if (size > MAX_DOCUMENT_BYTE_SIZE) {
      throw new Error(`Document content exceeds safe size limit of 980 KB (actual: ${Math.round(size / 1024)} KB)`);
    }
  }

  const token = await getFirebaseIdToken(env);
  const url = `${getBaseUrl(env)}/documents/${encodeURIComponent(docId)}`;

  // Convert data to Firestore fields
  const payload: Record<string, any> = { ...data };
  delete payload.id; // Firestore ID is in the URL path

  const fields = toFirestoreFields(payload);

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Firestore setDocument failed (${response.status}): ${errText}`);
  }
}

/**
 * Surgically update specified fields on a document
 */
export async function updateDocumentFields(
  env: Env,
  docId: string,
  fieldsToUpdate: Partial<DocumentData>
): Promise<void> {
  if (fieldsToUpdate.content) {
    const size = new TextEncoder().encode(fieldsToUpdate.content).byteLength;
    if (size > MAX_DOCUMENT_BYTE_SIZE) {
      throw new Error(`Document content exceeds safe size limit of 980 KB (actual: ${Math.round(size / 1024)} KB)`);
    }
  }

  const token = await getFirebaseIdToken(env);
  const keys = Object.keys(fieldsToUpdate).filter((k) => k !== "id");
  const updateMaskParams = keys
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join("&");

  const url = `${getBaseUrl(env)}/documents/${encodeURIComponent(docId)}?${updateMaskParams}`;
  const fields = toFirestoreFields(fieldsToUpdate as Record<string, any>);

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Firestore updateDocument failed (${response.status}): ${errText}`);
  }
}

/**
 * Increment views on a document
 */
export async function incrementViews(
  env: Env,
  docId: string,
  currentViews = 0
): Promise<void> {
  try {
    await updateDocumentFields(env, docId, {
      views: currentViews + 1,
    });
  } catch (err) {
    // Non-fatal if view count update fails
    console.error("Failed to increment views:", err);
  }
}

/**
 * Delete a document permanently
 */
export async function deleteDocument(env: Env, docId: string): Promise<boolean> {
  const token = await getFirebaseIdToken(env);
  const url = `${getBaseUrl(env)}/documents/${encodeURIComponent(docId)}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.ok || response.status === 404;
}

/**
 * Query for documents where expiresAt <= now
 */
export async function findExpiredDocuments(env: Env): Promise<string[]> {
  const token = await getFirebaseIdToken(env);
  const url = `${getBaseUrl(env)}:runQuery`;

  const nowIso = new Date().toISOString();

  const queryBody = {
    structuredQuery: {
      from: [{ collectionId: "documents" }],
      where: {
        fieldFilter: {
          field: { fieldPath: "expiresAt" },
          op: "LESS_THAN_OR_EQUAL",
          value: { timestampValue: nowIso },
        },
      },
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(queryBody),
  });

  if (!response.ok) {
    return [];
  }

  const results = (await response.json()) as Array<{ document?: FirestoreDocument }>;
  const docIds: string[] = [];

  for (const item of results) {
    if (item.document?.name) {
      const id = item.document.name.split("/").pop();
      if (id) docIds.push(id);
    }
  }

  return docIds;
}

/**
 * List all documents for the admin dashboard
 */
export async function listAllDocuments(env: Env, pageSize = 300): Promise<DocumentData[]> {
  const token = await getFirebaseIdToken(env);
  const url = `${getBaseUrl(env)}/documents?pageSize=${pageSize}&orderBy=createdAt%20desc`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as { documents?: FirestoreDocument[] };
  if (!data.documents) return [];

  return data.documents.map(fromFirestoreDocument);
}
