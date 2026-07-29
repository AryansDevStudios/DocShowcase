export type DocType = "markdown" | "html" | "custom";

export interface DocumentData {
  name: string;
  content: string;
  type: DocType;
  passkeyHash: string | null;
  views?: number;
  expiresAt?: { seconds: number; nanoseconds: number } | null;
  burnAfterReading?: boolean;
  createdAt?: { seconds: number; nanoseconds: number };
  updatedAt?: { seconds: number; nanoseconds: number };
}
