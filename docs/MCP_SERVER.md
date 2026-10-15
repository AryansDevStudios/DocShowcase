# 🤖 DocShowcase Remote Model Context Protocol (MCP) Server

The **DocShowcase MCP Server** enables any AI assistant (such as **Claude Desktop**, **Cursor IDE**, **Windsurf**, or autonomous LLM agents) to create, inspect, surgically patch, blind-overwrite, and manage live documents on DocShowcase directly from within chat or coding workflows.

It is hosted as a **zero-dependency, high-speed Cloudflare Worker** at the `/mcp` route, operating over standard **JSON-RPC 2.0** and **Streamable HTTP (Server-Sent Events)**.

---

## 📑 Table of Contents
1. [Core Capabilities](#-core-capabilities)
2. [Zero-Trust Security & Anti-Logging Architecture](#-zero-trust-security--anti-logging-architecture)
3. [Client Configuration & Setup](#-client-configuration--setup)
   - [Claude Desktop](#1-claude-desktop-setup)
   - [Cursor IDE](#2-cursor-ide-setup)
   - [Direct HTTP / SSE Stream](#3-direct-remote-streamable-http--sse)
4. [Comprehensive Tool Reference](#-comprehensive-tool-reference)
   - [`create_document`](#1-create_document)
   - [`get_document`](#2-get_document)
   - [`patch_document`](#3-patch_document)
   - [`update_document`](#4-update_document)
   - [`delete_document`](#5-delete_document)
   - [`get_document_info`](#6-get_document_info)
5. [Multi-Asset Raw Linking & Live HTML Applications](#-multi-asset-raw-linking--live-html-applications)
6. [End-to-End Encryption (E2EE) & Blind Overwrites](#-end-to-end-encryption-e2ee--blind-overwrites)
7. [Local Testing & Verification](#-local-testing--verification)

---

## ⚡ Core Capabilities

- **Playable / Live HTML Execution**: When an AI creates an HTML document, DocShowcase delivers it with `Content-Type: text/html; charset=utf-8` and permissive Content-Security-Policy headers so Three.js, Tailwind, WebGL, Canvas, and browser APIs run natively.
- **Multi-Asset Interlinking**: Link separate files together seamlessly (e.g. an HTML document linking to `/raw/:id/styles.css` and `/raw/:id/app.js` with CORS headers enabled).
- **Surgical Text Patching**: AI models can search and replace code fragments without having to re-emit large multi-megabyte documents over context tokens.
- **End-to-End Encryption**: Zero-knowledge 256-bit AES-GCM encryption with client-side decryption in user browsers.
- **Blind Overwrite**: If a user forgets their View Password, they or an authorized AI can still completely overwrite or delete the document using only their `editPassword`.
- **Ephemeral Auto-Destruction**: Documents can be set to auto-expire (`1h`, `24h`, `7d`, or custom minutes) or self-destruct upon reading ("Burn After Reading").

---

## 🛡️ Zero-Trust Security & Anti-Logging Architecture

DocShowcase is designed under a strict **Zero-Trust Model** for passwords and sensitive content:

| Security Vector | Implementation Detail |
| :--- | :--- |
| **No Query-String Passwords** | Passwords (`viewPassword`, `editPassword`) are **never** permitted in URL query parameters. All credentials must be sent inside the TLS-encrypted JSON-RPC body. |
| **Observability Disabled** | Cloudflare Worker observability body logging is explicitly turned off (`[observability] enabled = false`). |
| **Zero Sensitive Logging** | No request bodies, passwords, derived CryptoKeys, or plaintexts are ever passed to `console.log` or error reporting channels. |
| **In-Memory Memory Scrubbing** | Whenever a password or key buffer is imported or converted into a `Uint8Array`, it is explicitly wiped with zeros (`buffer.fill(0)`) in a guaranteed `finally {}` block immediately after cryptographic operations. |
| **Immutable by Default** | Documents created without an `editPassword` are permanently locked and cannot be edited, overwritten, or deleted by any user or AI. |

---

## 🔌 Client Configuration & Setup

### 1. Claude Desktop Setup
Open your Claude Desktop configuration file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add `docshowcase` under `mcpServers`:

```json
{
  "mcpServers": {
    "docshowcase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch",
        "https://docshowcase.adsbackend01.workers.dev/mcp"
      ]
    }
  }
}
```

### 2. Cursor IDE Setup
1. In Cursor, open **Settings** (`Ctrl+,` or `Cmd+,`).
2. Navigate to **Features** → **MCP Servers**.
3. Click **Add New MCP Server**:
   - **Name:** `DocShowcase`
   - **Type:** `command`
   - **Command:** `npx -y @modelcontextprotocol/server-fetch https://docshowcase.adsbackend01.workers.dev/mcp`

### 3. Direct Remote Streamable HTTP / SSE
For agents or platforms that support remote HTTP/SSE directly:
- **Endpoint URL:** `https://docshowcase.adsbackend01.workers.dev/mcp`
- **Transport:** HTTP `POST` (JSON-RPC 2.0) or `GET` (`Accept: text/event-stream` for SSE)

---

## 🛠️ Comprehensive Tool Reference

### 1. `create_document`
Creates a new anonymous document with optional 256-bit encryption, edit password protection, and auto-expiry.

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "content": {
      "type": "string",
      "description": "The full text, markdown, or code content of the document."
    },
    "title": {
      "type": "string",
      "description": "Document title or filename (e.g. 'neon-rush.html', 'notes.md', 'styles.css')."
    },
    "type": {
      "type": "string",
      "enum": ["markdown", "html", "custom"],
      "description": "Document format type (markdown, html, or custom)."
    },
    "viewPassword": {
      "type": "string",
      "description": "Optional view password. If provided, the content is encrypted with 256-bit AES-GCM before storage."
    },
    "editPassword": {
      "type": "string",
      "description": "Optional edit password. If provided, enables future updating, patching, or deletion."
    },
    "expiration": {
      "type": "string",
      "enum": ["never", "burn", "1h", "24h", "7d"],
      "description": "Auto-destruction duration or 'burn' for view-once deletion."
    },
    "expiresInMinutes": {
      "type": "integer",
      "description": "Custom auto-expiry duration in minutes from now."
    }
  },
  "required": ["content"]
}
```

#### JSON-RPC 2.0 Example
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_document",
    "arguments": {
      "title": "space-invaders.html",
      "content": "<!DOCTYPE html><html><head><title>Space Invaders</title></head><body><canvas id='c'></canvas><script>/* Game Code */</script></body></html>",
      "type": "html",
      "editPassword": "secret-edit-key",
      "expiration": "24h"
    }
  }
}
```

#### Output
Returns formatted markdown with the generated `Document ID`, `View URL`, `Raw URL (Native Delivery)`, document type, and security state.

---

### 2. `get_document`
Retrieves a document by its ID. If the document was encrypted with a `viewPassword`, passing `viewPassword` decrypts the content in Worker memory and returns the plaintext.

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "The unique document ID or slug."
    },
    "viewPassword": {
      "type": "string",
      "description": "The view password required to decrypt encrypted documents."
    }
  },
  "required": ["id"]
}
```

#### JSON-RPC 2.0 Example
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_document",
    "arguments": {
      "id": "space-invaders",
      "viewPassword": "optional-view-password"
    }
  }
}
```

---

### 3. `patch_document`
Performs surgical search-and-replace on a document's content without rewriting the whole document. If the document is encrypted, it is decrypted in memory, patched, re-encrypted with the original view password, and saved back to Firestore.

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "The unique document ID."
    },
    "editPassword": {
      "type": "string",
      "description": "The document's edit password."
    },
    "search": {
      "type": "string",
      "description": "The exact substring to locate inside the document."
    },
    "replace": {
      "type": "string",
      "description": "The replacement substring."
    },
    "viewPassword": {
      "type": "string",
      "description": "View password (required if document is encrypted)."
    },
    "replaceAll": {
      "type": "boolean",
      "description": "Whether to replace all occurrences or only the first (defaults to true)."
    }
  },
  "required": ["id", "editPassword", "search", "replace"]
}
```

#### JSON-RPC 2.0 Example
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "patch_document",
    "arguments": {
      "id": "space-invaders",
      "editPassword": "secret-edit-key",
      "search": "score += 10;",
      "replace": "score += 50;"
    }
  }
}
```

---

### 4. `update_document`
Overwrites the entire document with new content. Supports **Blind Overwrites**: if the view password was forgotten or lost, an authorized user or AI with the valid `editPassword` can completely replace the content (either as plaintext or with a new view password).

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "The unique document ID."
    },
    "editPassword": {
      "type": "string",
      "description": "The document's edit password."
    },
    "content": {
      "type": "string",
      "description": "The new document content."
    },
    "title": {
      "type": "string",
      "description": "Optional updated title or filename."
    },
    "type": {
      "type": "string",
      "enum": ["markdown", "html", "custom"],
      "description": "Optional updated document type."
    },
    "newViewPassword": {
      "type": "string",
      "description": "Optional new view password to re-encrypt the new content."
    }
  },
  "required": ["id", "editPassword", "content"]
}
```

---

### 5. `delete_document`
Permanently purges a document from Firestore using its `editPassword`.

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "The unique document ID."
    },
    "editPassword": {
      "type": "string",
      "description": "The document's edit password."
    }
  },
  "required": ["id", "editPassword"]
}
```

---

### 6. `get_document_info`
Retrieves document metadata without returning or exposing its content.

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "The unique document ID."
    }
  },
  "required": ["id"]
}
```

#### Output Example
```markdown
### Document Info: neon-rush.html
- **ID:** `neon-rush`
- **Type:** `html`
- **Views:** 42
- **Is Encrypted:** Yes
- **Is Editable:** Yes
- **Self-Destruct (Burn):** No
- **Expires At:** "2026-10-16T12:00:00.000Z"
- **Created At:** "2026-10-15T12:00:00.000Z"
- **Updated At:** "2026-10-15T14:30:00.000Z"
```

---

## 🌐 Multi-Asset Raw Linking & Live HTML Applications

When building multi-file web applications, games, or interactive demos via MCP, you can link separate DocShowcase documents together using their raw URLs:

1. Create the stylesheet (`styles.css`):
   ```
   Raw URL: https://docshowcase.adsbackend01.workers.dev/raw/css-id/styles.css
   ```
2. Create the script (`engine.js`):
   ```
   Raw URL: https://docshowcase.adsbackend01.workers.dev/raw/js-id/engine.js
   ```
3. Create the HTML document (`index.html`):
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <link rel="stylesheet" href="https://docshowcase.adsbackend01.workers.dev/raw/css-id/styles.css">
   </head>
   <body>
     <div id="game-canvas"></div>
     <script src="https://docshowcase.adsbackend01.workers.dev/raw/js-id/engine.js"></script>
   </body>
   </html>
   ```

Because every `/raw` route returns `Access-Control-Allow-Origin: *` and `Cross-Origin-Resource-Policy: cross-origin`, the browser resolves all scripts, styles, and assets seamlessly.

---

## 🔐 End-to-End Encryption (E2EE) & Blind Overwrites

### Cryptographic Specification:
- **Algorithm:** AES-256-GCM
- **Key Derivation:** PBKDF2 with SHA-256 and 100,000 iterations
- **Salt:** 16-byte cryptographically secure random value
- **IV:** 12-byte cryptographically secure random value
- **Payload Format:** `"ENC:" + base64(salt[16] + iv[12] + ciphertext)`

### Seamless Interoperability:
1. **Browser Created → AI Inspected:** If a user encrypts a document on the DocShowcase web interface, the AI can read it via `get_document` simply by providing the user's password.
2. **AI Created → Browser Decrypted:** If the AI creates an encrypted document with `create_document`, any user opening the DocShowcase URL in Chrome, Safari, Firefox, or mobile browser decrypts it client-side without downloading any specialized software.
3. **Forgot View Password (Blind Overwrite):** If a user forgets their view password, they are not locked out of their document ID. As long as they retain their `editPassword`, they or an AI assistant can invoke `update_document` to write new content or reset encryption without needing the original view password.

---

## 🧪 Local Testing & Verification

DocShowcase includes a comprehensive test suite covering the entire MCP lifecycle:

```bash
# Run integration tests against Firestore
npm run worker:test
```

This verifies:
- JSON-RPC protocol initialization (`initialize`)
- Schema inspection (`tools/list`)
- Document creation, decryption, surgical patching, and deletion (`tools/call`)
- Zero-trust memory scrubbing validation
