import type { DocType } from "./types";

export interface RecentDocument {
  id: string;
  name: string;
  type: DocType | "custom";
  timestamp: number;
  actionType: "created" | "viewed";
  expiresAt?: number | null;
}

const RECENT_DOCS_KEY = "docshowcase_recent_docs";
const MAX_RECENT_DOCS = 10;

export function saveRecentDocument(
  id: string, 
  name: string, 
  type: string, 
  actionType: "created" | "viewed",
  expiresAt: number | null = null,
  burnAfterReading: boolean = false
) {
  if (typeof window === "undefined") return;
  
  // Never save Burn After Reading documents to recent history
  if (burnAfterReading) return;

  try {
    const existingStr = localStorage.getItem(RECENT_DOCS_KEY);
    let docs: RecentDocument[] = existingStr ? JSON.parse(existingStr) : [];

    // Remove existing entry for this ID if it exists (so we can move it to top)
    docs = docs.filter((doc) => doc.id !== id);

    // Add new entry to the front
    docs.unshift({
      id,
      name: name || "Untitled Document",
      type: type as DocType | "custom",
      timestamp: Date.now(),
      actionType,
      expiresAt,
    });

    // Keep only the most recent
    if (docs.length > MAX_RECENT_DOCS) {
      docs = docs.slice(0, MAX_RECENT_DOCS);
    }

    localStorage.setItem(RECENT_DOCS_KEY, JSON.stringify(docs));
  } catch (error) {
    console.error("Error saving recent document:", error);
  }
}

export function getRecentDocuments(): RecentDocument[] {
  if (typeof window === "undefined") return [];

  try {
    const existingStr = localStorage.getItem(RECENT_DOCS_KEY);
    if (!existingStr) return [];
    
    let docs = JSON.parse(existingStr) as RecentDocument[];
    
    // Filter out expired documents
    const now = Date.now();
    docs = docs.filter(doc => !doc.expiresAt || doc.expiresAt > now);
    
    // Backwards compatibility for older history entries
    docs = docs.map(doc => ({
      ...doc,
      actionType: doc.actionType || "viewed"
    }));
    
    return docs;
  } catch (error) {
    console.error("Error getting recent documents:", error);
    return [];
  }
}
