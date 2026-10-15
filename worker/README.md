# DocShowcase Cloudflare Worker Backend & Remote MCP Server

A zero-dependency Cloudflare Worker serving as the unified edge backend for **DocShowcase** (`docshowcase.netlify.app` / `AryansDevStudios`):
1. **Document CRUD, Auth-Verification, & Expiry Engine** (Firestore REST API via authenticated Firebase Bot service account).
2. **Multi-Asset Raw Delivery Engine** (`/raw/:id` and `/raw/:id/:filename`) with native browser rendering for HTML, JS, CSS, JSON, Markdown, and SVG.
3. **Zero-Trust Remote Model Context Protocol (MCP) Server** (`/mcp`) supporting JSON-RPC 2.0 and Streamable HTTP SSE.
4. **Automated Cron Expiry Cleanup** running every 15 minutes to purge expired documents from Firestore.

---

## 🚀 Quick Start

### 1. Configure Secrets in Cloudflare Worker
Set the required secrets in your Cloudflare account using Wrangler:

```bash
npx wrangler secret put FIREBASE_API_KEY
npx wrangler secret put FIREBASE_PROJECT_ID
npx wrangler secret put FIREBASE_BOT_EMAIL
npx wrangler secret put FIREBASE_BOT_PASSWORD
npx wrangler secret put ADMIN_PASSWORD
```

*(For local development, `.dev.vars` is automatically loaded by Wrangler).*

### 2. Deploy Worker
```bash
npm run worker:deploy
```
Or with Wrangler directly:
```bash
npx wrangler deploy
```

### 3. Run Integration Tests
Verify all endpoints, encryption, passkey hashing, raw delivery, and MCP tools against the live Firestore backend:
```bash
npm run worker:test
```

---

## 🔒 Firestore Security Rules (`firestore.rules`)
Deploy the restricted security rules so public reads are permitted only on non-expired documents, while all create, update, and delete operations are restricted strictly to the Worker Bot account:

```bash
firebase deploy --only firestore:rules
```

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /documents/{documentId} {
      allow read: if resource == null || 
                     resource.data.expiresAt == null || 
                     resource.data.expiresAt > request.time;

      allow write: if request.auth != null && 
                      (request.auth.token.email == "editor@docshowcase.aryansdevstudios.com" ||
                       request.auth.token.email.matches(".*@docshowcase.*"));
    }
  }
}
```

---

## 🌐 Endpoints

### 1. Multi-Asset Raw Delivery Engine
- **`GET /raw/:id`**
- **`GET /raw/:id/:filename`** (e.g. `/raw/my-app/app.js`, `/raw/my-app/style.css`, `/raw/my-app/game.html`)
  - **HTML:** Native rendering in desktop and mobile browsers (`text/html; charset=utf-8`) with permissive CSP allowing CDNs (Three.js, Tailwind, Google Fonts, unpkg, cdnjs), WebGL, and WebAudio.
  - **JavaScript:** `application/javascript; charset=utf-8`.
  - **CSS:** `text/css; charset=utf-8`.
  - **JSON:** `application/json; charset=utf-8`.
  - **Markdown:** `text/markdown; charset=utf-8`.
  - **Encrypted Documents:** If opened in a browser or with `?unlock=1`, serves a zero-dependency client-side decryption interface that prompts for the view password and decrypts the document directly in memory using Web Crypto AES-GCM without sending passwords to the server.
  - **Cross-Asset Linking:** Full CORS headers (`Access-Control-Allow-Origin: *`, `Cross-Origin-Resource-Policy: cross-origin`).

### 2. Core API
- **`POST /api/docs`**: Create anonymous document (plaintext or 256-bit AES encrypted, optional edit password, auto-expiry, view-once).
- **`GET /api/docs/:id`**: Retrieve document metadata and content.
- **`PUT /api/docs/:id`**: Update or Blind-Overwrite document (requires `editPassword`).
- **`DELETE /api/docs/:id`**: Delete document (requires `editPassword` or `X-Admin-Password`).
- **`POST /api/verify-passkey`**: Verify edit passkey.
- **`POST /api/burn/:id`**: Burn view-once document.
- **`GET /api/admin/docs`**: Admin listing of all documents.

---

## 🤖 Zero-Trust Remote MCP Server (`/mcp`)
Connect any AI assistant (Claude Desktop, Cursor, Custom Agent) to DocShowcase over HTTP JSON-RPC 2.0.

### MCP Configuration (Claude Desktop / Cursor)
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "docshowcase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch", "https://docshowcase-backend.aryansdevstudios.workers.dev/mcp"]
    }
  }
}
```
Or directly connect via remote Streamable HTTP / SSE:
```
URL: https://docshowcase-backend.aryansdevstudios.workers.dev/mcp
```

### Available MCP Tools:
1. **`create_document`**: Create documents with optional 256-bit view encryption, edit password, and auto-expiry.
2. **`get_document`**: Read documents with zero-trust in-memory decryption.
3. **`patch_document`**: Surgically search and replace text in existing documents without rewriting the entire document.
4. **`update_document`**: Blind-overwrite documents using `editPassword` even if `viewPassword` is forgotten.
5. **`delete_document`**: Permanently delete documents using `editPassword`.
6. **`get_document_info`**: Inspect document metadata without exposing sensitive content.

### Zero-Trust & Anti-Logging Guarantee:
- Passwords are **never** accepted in query parameters.
- Observability request/response body logging is disabled (`[observability] enabled = false`).
- All in-memory password buffers and CryptoKey materials are explicitly zeroed out (`buffer.fill(0)`) in `finally` blocks immediately after crypto operations.
