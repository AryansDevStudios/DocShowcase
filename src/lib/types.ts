export type DocType = "markdown" | "html";

export interface DocumentData {
  name: string;
  content: string;
  type: DocType;
  passkeyHash: string | null;
  createdAt?: { seconds: number; nanoseconds: number };
  updatedAt?: { seconds: number; nanoseconds: number };
}
