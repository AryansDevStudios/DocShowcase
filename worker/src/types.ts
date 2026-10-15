export interface Env {
  FIREBASE_API_KEY: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_BOT_EMAIL: string;
  FIREBASE_BOT_PASSWORD: string;
  ADMIN_PASSWORD?: string;
  APP_URL?: string;
}

export type DocType = "markdown" | "html" | "custom" | string;

export interface DocumentData {
  id?: string;
  name: string;
  content: string;
  type: DocType;
  passkeyHash: string | null;
  editPasswordHash?: string | null;
  editPasswordSalt?: string | null;
  burnAfterReading?: boolean;
  expiresAt?: string | { seconds: number; nanoseconds: number } | null;
  views?: number;
  createdAt?: string | { seconds: number; nanoseconds: number };
  updatedAt?: string | { seconds: number; nanoseconds: number };
}

export type FirestoreValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { timestampValue: string }
  | { nullValue: null }
  | { mapValue: { fields: Record<string, FirestoreValue> } }
  | { arrayValue: { values: FirestoreValue[] } };

export interface FirestoreDocument {
  name: string;
  fields: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
}

export interface CachedAuthSession {
  idToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in ms
}

// JSON-RPC 2.0 & MCP Types
export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: any;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface McpToolCallContent {
  type: "text" | "image" | "resource";
  text?: string;
  data?: string;
  mimeType?: string;
}

export interface McpToolCallResult {
  content: McpToolCallContent[];
  isError?: boolean;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export interface ScheduledEvent {
  cron: string;
  type: string;
  scheduledTime: number;
}
