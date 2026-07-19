"use server";

import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { hashPasskey } from "@/lib/crypto";
import type { DocType, DocumentData } from "@/lib/types";
import { app } from "@/lib/firebase";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

async function authenticateEditor() {
  const auth = getAuth(app);
  if (auth.currentUser) return; // already signed in
  
  const email = process.env.FIREBASE_EDITOR_EMAIL;
  const password = process.env.FIREBASE_EDITOR_PASSWORD;
  
  if (!email || !password) {
    console.error("Firebase editor credentials are not configured in environment variables.");
    throw new Error("Server misconfiguration: Editor credentials missing.");
  }
  
  await signInWithEmailAndPassword(auth, email, password);
}

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const generateShortId = (length = 8) => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const MAX_CONTENT_SIZE = 1_048_576; // 1 MB

export async function saveDocument(
  name: string,
  content: string,
  type: DocType,
  passkey: string | null
) {
  try {
    // Authenticate server as the editor user
    await authenticateEditor();

    // Server-side content size check
    const byteSize = new TextEncoder().encode(content).length;
    if (byteSize > MAX_CONTENT_SIZE) {
      return { error: "Content exceeds the 1 MB size limit." };
    }

    // Generate document ID
    let docId = "";
    if (name.trim()) {
      const slug = generateSlug(name);
      if (slug) {
        const docRef = doc(db, "documents", slug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          docId = `${slug}-${generateShortId(6)}`;
        } else {
          docId = slug;
        }
      } else {
        docId = generateShortId(8);
      }
    } else {
      docId = generateShortId(8);
    }

    // Hash passkey if provided
    const passkeyHash = passkey ? await hashPasskey(passkey) : null;

    const docRef = doc(db, "documents", docId);
    await setDoc(docRef, {
      name: name.trim() || "",
      content,
      type,
      passkeyHash,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: docId };
  } catch (error) {
    console.error("Error saving document:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return { error: `Failed to save document: ${message}` };
  }
}

export async function updateDocument(
  id: string,
  name: string,
  content: string,
  type: DocType
) {
  try {
    // Authenticate server as the editor user
    await authenticateEditor();

    // Server-side content size check
    const byteSize = new TextEncoder().encode(content).length;
    if (byteSize > MAX_CONTENT_SIZE) {
      return { error: "Content exceeds the 1 MB size limit." };
    }

    const docRef = doc(db, "documents", id);
    await setDoc(
      docRef,
      {
        name: name.trim() || "",
        content,
        type,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    revalidatePath(`/view/${id}`);
    return { id };
  } catch (error) {
    console.error("Error updating document:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return { error: `Failed to update document: ${message}` };
  }
}

export async function getDocument(
  id: string
): Promise<DocumentData | null> {
  try {
    const docRef = doc(db, "documents", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docSnap.data() as DocumentData;
  } catch (error) {
    console.error("Error fetching document:", error);
    return null;
  }
}
