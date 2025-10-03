"use server";

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, setDoc, serverTimestamp, Timestamp, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export type DocType = 'markdown' | 'html';

export interface DocumentData {
  name?: string;
  content: string;
  type: DocType;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
};

const generateShortId = (length = 5) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}


export async function saveDocument(id: string | null, name: string | null, content: string, type: DocType) {
  try {
    if (id) {
      // Update existing document
      const docRef = doc(db, 'documents', id);
      await setDoc(docRef, { name: name || '', content, type, updatedAt: serverTimestamp() }, { merge: true });
      revalidatePath(`/view/${id}`);
      return { id };
    } else {
      // Create new document
      let newId = '';
      if (name) {
        const slug = generateSlug(name);
        const docRef = doc(db, 'documents', slug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          // If slug exists, append a short unique ID
          newId = `${slug}-${generateShortId(5)}`;
        } else {
          newId = slug;
        }
      } else {
        // Fallback to a random short ID if no name is provided
        newId = generateShortId(5);
      }
      
      const docRef = doc(db, 'documents', newId);
      await setDoc(docRef, {
        name: name || '',
        content,
        type,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: newId };
    }
  } catch (error) {
    console.error("Error saving document: ", error);
    let message = 'Unknown Error';
    if (error instanceof Error) message = error.message;
    return { error: `Failed to save document: ${message}` };
  }
}
