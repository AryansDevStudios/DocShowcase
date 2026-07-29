"use server";

import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  increment,
  serverTimestamp,
  collection,
  getDocs,
  query,
  orderBy
} from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { hashPasskey, verifyPasskey } from "@/lib/crypto";
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
  passkey: string | null,
  expiration: "never" | "burn" | "1h" | "24h" | "7d" = "never"
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
          return { error: `The name "${slug}" is already taken. Please choose another name or leave it blank to auto-generate one.` };
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

    let expiresAt = null;
    let burnAfterReading = false;

    if (expiration === "burn") {
      burnAfterReading = true;
    } else if (expiration === "1h") {
      expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    } else if (expiration === "24h") {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else if (expiration === "7d") {
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const docRef = doc(db, "documents", docId);
    await setDoc(docRef, {
      name: name.trim() || "",
      content,
      type,
      passkeyHash,
      burnAfterReading,
      expiresAt,
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
  type: DocType,
  passkey: string
) {
  try {
    const docData = await getDocument(id);
    if (!docData) return { error: "Document not found." };
    if (!docData.passkeyHash) return { error: "Document is read-only." };

    const isValid = await verifyPasskey(passkey, docData.passkeyHash);
    if (!isValid) return { error: "Unauthorized: Incorrect passkey." };

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

export async function registerView(id: string) {
  try {
    const docData = await getDocument(id);
    if (!docData) return;

    // Lazy-delete expired documents
    if (docData.expiresAt && Date.now() > docData.expiresAt.seconds * 1000) {
      await deleteDocument(id);
      return;
    }

    // Always increment view count (even for burn-after-reading — deletion is handled separately by the client after viewing)
    await authenticateEditor();
    const docRef = doc(db, "documents", id);
    await updateDoc(docRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error("Error registering view:", error);
  }
}

export async function burnDocument(id: string) {
  try {
    const docData = await getDocument(id);
    if (!docData || !docData.burnAfterReading) {
      console.warn("Attempted to burn non-burnable document:", id);
      return { error: "Document is not burnable." };
    }

    await authenticateEditor();
    const docRef = doc(db, "documents", id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error("Error burning document:", error);
    return { error: "Failed to burn document" };
  }
}

export async function deleteDocument(id: string) {
  try {
    const docData = await getDocument(id);
    if (!docData) return;

    const isExpired = docData.expiresAt && Date.now() > docData.expiresAt.seconds * 1000;
    if (!isExpired) {
      return { error: "Only expired documents can be lazy-deleted." };
    }

    await authenticateEditor();
    const docRef = doc(db, "documents", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting document:", error);
  }
}

// ==========================================
// ADMIN DASHBOARD ACTIONS
// ==========================================

export async function adminLogin(password: string) {
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass || password !== adminPass) {
    return { success: false, error: "Invalid admin password" };
  }
  
  const cookieStore = await cookies();
  cookieStore.set("admin-token", password, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
  return { success: true };
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin-token");
  return { success: true };
}

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass || token !== adminPass) {
    throw new Error("Unauthorized Admin Access");
  }
}

export async function getAllDocuments() {
  try {
    await verifyAdmin();
    const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name,
        type: data.type,
        views: data.views || 0,
        burnAfterReading: data.burnAfterReading || false,
        expiresAt: data.expiresAt ? data.expiresAt.seconds * 1000 : null,
        createdAt: data.createdAt ? data.createdAt.seconds * 1000 : null,
        contentPreview: data.content ? data.content.substring(0, 150) : "",
        isEncrypted: data.content?.startsWith("ENC:") || false
      };
    });
  } catch (error) {
    console.error("Error fetching all docs:", error);
    return [];
  }
}

export async function adminGetFullDocument(id: string) {
  await verifyAdmin();
  const docData = await getDocument(id);
  if (!docData) {
    return { success: false, error: "Document not found" };
  }
  return { success: true, content: docData.content };
}

export async function adminDeleteDocument(id: string) {
  try {
    await verifyAdmin();
    await authenticateEditor();
    await deleteDoc(doc(db, "documents", id));
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete" };
  }
}

