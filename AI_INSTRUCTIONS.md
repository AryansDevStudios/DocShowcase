# 🤖 DocShowcase AI Agent Operating Guide & Deployment Protocol

> **Purpose:** This document is the authoritative instruction manual for any AI assistant (Antigravity, Cursor, Claude, Windsurf, ChatGPT, or custom LLM agents). When a user asks you to **save a document**, **create a document**, **deploy an HTML page / game**, **share a markdown note**, or references **DocShowcase**, follow this guide to execute the task seamlessly.

---

## ⚡ 1. Trigger Conditions
Activate this protocol whenever the user:
- Asks to *"save this to DocShowcase"*, *"host this on DocShowcase"*, or *"give me a DocShowcase link"*.
- Asks to *"instantly deploy this HTML page / game / widget / dashboard"*.
- Asks to *"share this markdown with live preview / LaTeX / Mermaid diagrams"*.
- Asks to *"create a secret / password-protected / self-destructing document"*.
- Mentions **DocShowcase**, `docshowcase.netlify.app`, or `docshowcase.adsbackend01.workers.dev`.

---

## 🌐 2. Live Infrastructure Endpoints

| Resource | Live Production URL | Notes |
| :--- | :--- | :--- |
| **Web Frontend** | `https://docshowcase.netlify.app` | Static viewer UI & editor interface |
| **Cloudflare Worker Backend** | `https://docshowcase.adsbackend01.workers.dev` | Direct zero-dependency edge API |
| **Remote MCP Server** | `https://docshowcase.adsbackend01.workers.dev/mcp` | JSON-RPC 2.0 & Streamable HTTP SSE |
| **Multi-Asset Raw Delivery** | `https://docshowcase.adsbackend01.workers.dev/raw/:id/:filename` | Delivers live HTML, JS, CSS, JSON, SVG |
| **Netlify Raw Proxy** | `https://docshowcase.netlify.app/raw/:id/:filename` | Proxies directly to Worker edge |
| **Document API** | `https://docshowcase.adsbackend01.workers.dev/api/docs` | REST CRUD & auth endpoint |

---

## 🎮 3. How to Deploy Live HTML Pages & Web Games

DocShowcase is specifically built to deliver **live playable HTML pages, WebGL/Three.js games, interactive visualizations, and dashboards** directly in browsers with zero sandboxing hurdles.

### Execution Capabilities:
- **Native Browser Execution:** HTML served at `/raw/:id` or `/raw/:id/:filename` is served with `Content-Type: text/html; charset=utf-8` and executes directly in desktop and mobile browsers.
- **Permissive Content-Security-Policy (CSP):** DocShowcase sets:
  ```http
  Content-Security-Policy: default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src *;
  ```
- **Supported Browser APIs:** Full support for `<canvas>`, WebGL, WebAudio, Gamepad API, LocalStorage, Fetch/AJAX, and external CDNs.
- **External CDNs Permitted:** You can freely include external scripts in your HTML:
  - Tailwind CSS: `<script src="https://cdn.tailwindcss.com"></script>`
  - Three.js: `<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>`
  - Pixi.js, Phaser, Chart.js, Lucide Icons, Google Fonts, etc.

### Single-File HTML Example:
When the user asks for a game (e.g. *Flappy Bird*, *Pong*, *3D Solar System*):
1. Write the complete HTML, CSS, and JS into a single string.
2. Set `name` or `title`: `"neon-pong.html"`.
3. Set `type`: `"html"`.
4. Deploy via MCP `create_document` or direct REST API.
5. Provide the user with the direct playable link:
   `https://docshowcase.adsbackend01.workers.dev/raw/neon-pong/neon-pong.html`

### Multi-File Linking Example:
For larger projects with separate CSS and JavaScript:
1. Create the CSS document (`styles.css`):
   - Returns ID: `game-styles`
   - Raw URL: `https://docshowcase.adsbackend01.workers.dev/raw/game-styles/styles.css`
2. Create the JS document (`game.js`):
   - Returns ID: `game-logic`
   - Raw URL: `https://docshowcase.adsbackend01.workers.dev/raw/game-logic/game.js`
3. Create the HTML document (`index.html`) referencing those raw URLs:
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <link rel="stylesheet" href="https://docshowcase.adsbackend01.workers.dev/raw/game-styles/styles.css">
   </head>
   <body>
     <canvas id="c"></canvas>
     <script src="https://docshowcase.adsbackend01.workers.dev/raw/game-logic/game.js"></script>
   </body>
   </html>
   ```
   *Because `Access-Control-Allow-Origin: *` and `Cross-Origin-Resource-Policy: cross-origin` are active, the browser will seamlessly link the assets across documents.*

---

## 🛠️ 4. Execution Method A: Using MCP Tools (When MCP is Connected)

If you are connected via the DocShowcase MCP Server (`docshowcase`), invoke tools directly:

### 1. Create a Document (`create_document`)
```json
{
  "title": "my-document.html",
  "content": "<!DOCTYPE html><html><body><h1>Hello World</h1></body></html>",
  "type": "html",
  "editPassword": "optional-edit-key-if-user-wants-to-edit-later",
  "viewPassword": "optional-view-password-for-256bit-encryption",
  "expiration": "never"
}
```
*Expiry options:* `"never"`, `"burn"` (view-once self-destruction), `"1h"`, `"24h"`, `"7d"`, or `expiresInMinutes: 60`.

### 2. Surgically Patch a Document (`patch_document`)
Avoid wasting context tokens re-emitting the entire document. Use surgical find-and-replace:
```json
{
  "id": "my-document",
  "editPassword": "your-edit-key",
  "search": "score += 10;",
  "replace": "score += 50;",
  "viewPassword": "view-password-if-encrypted"
}
```

### 3. Blind-Overwrite a Document (`update_document`)
If the user forgot their `viewPassword` but knows their `editPassword`, you can overwrite or reset the content:
```json
{
  "id": "my-document",
  "editPassword": "your-edit-key",
  "content": "# Completely New Content",
  "newViewPassword": "new-view-password-or-empty-for-plaintext"
}
```

### 4. Read & Decrypt Document (`get_document`)
```json
{
  "id": "my-document",
  "viewPassword": "view-password-if-encrypted"
}
```

### 5. Delete Document (`delete_document`)
```json
{
  "id": "my-document",
  "editPassword": "your-edit-key"
}
```

---

## 🚀 5. Execution Method B: Direct REST API (When MCP is Not Available)

If your environment does not have MCP tools equipped, make a standard HTTP request using `fetch()` or `curl`:

### Creating a Document:
```bash
curl -X POST https://docshowcase.adsbackend01.workers.dev/api/docs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "solar-system.html",
    "content": "<!DOCTYPE html><html><head><title>3D Solar System</title></head><body><script src=\"https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js\"></script><script>/* Three.js Scene */</script></body></html>",
    "type": "html",
    "editPassword": "optional-edit-password",
    "expiration": "never"
  }'
```

**JSON Response (HTTP 201 Created):**
```json
{
  "id": "solar-system",
  "url": "https://docshowcase.netlify.app/view/solar-system",
  "rawUrl": "https://docshowcase.adsbackend01.workers.dev/raw/solar-system",
  "isEncrypted": false,
  "isEditable": true,
  "burnAfterReading": false,
  "expiresAt": null
}
```

### Updating / Patching:
```bash
curl -X PUT https://docshowcase.adsbackend01.workers.dev/api/docs/solar-system \
  -H "Content-Type: application/json" \
  -d '{
    "editPassword": "optional-edit-password",
    "content": "<!DOCTYPE html><html><body><h1>Updated Version</h1></body></html>"
  }'
```

### Deleting:
```bash
curl -X DELETE https://docshowcase.adsbackend01.workers.dev/api/docs/solar-system \
  -H "Content-Type: application/json" \
  -d '{
    "editPassword": "optional-edit-password"
  }'
```

---

## 🔒 6. Security, Privacy & Password Guidelines

1. **Zero-Trust Rule:** **NEVER** put passwords in URL query parameters (e.g. `?pw=...`). Always send passwords in the JSON POST body.
2. **Immutable by Default:** If neither `editPassword` nor `passkey` is provided when creating a document, the document is permanently immutable. No one (not even the user or AI) can edit or delete it. If the user expects to make updates, **always set an `editPassword`**.
3. **End-to-End Encryption (E2EE):**
   - When `viewPassword` is passed, the Cloudflare Worker encrypts the document with **256-bit AES-GCM** using PBKDF2 (100,000 iterations).
   - In memory, all password buffers are strictly scrubbed (`buffer.fill(0)`).
   - When a user opens the document in their browser, decryption happens natively in the client browser with Web Crypto API.
4. **Self-Destruct (Burn-After-Reading):**
   - When `expiration: "burn"` is specified, the document is atomically destroyed the instant it is fetched. Technical users inspecting the network cannot read it a second time.

---

## 📏 7. Limits & Technical Constraints

| Parameter | Limit | Recommendation |
| :--- | :--- | :--- |
| **Max Content Size** | **980 KB** (~1 MB Firestore limit) | For large HTML apps, use external CDN scripts or split CSS/JS into separate documents and cross-link via `/raw/:id/file.ext`. |
| **ID / Slug Generation** | Max 64 characters | Filenames like `cyberpunk-game.html` become slug `cyberpunk-game`. If slug exists, a 4-char suffix is added. If empty, an 8-char random ID is generated. |
| **Supported File Types** | `html`, `markdown`, `custom` | For custom types, include the extension in the title (e.g. `main.py`, `bundle.js`, `theme.css`, `data.json`, `logo.svg`). |
| **Allowed CORS Origins** | `*` (Any origin) | All raw endpoints support cross-origin embedding, `<script>`, `<link>`, and `fetch()`. |

---

## 📋 8. Standard AI Response Template

When you create or deploy a document for the user, format your final response with clear markdown links and credentials:

```markdown
### 🚀 Document Deployed to DocShowcase!

- 🎮 **Live Playable Link:** [View Fullscreen HTML](https://docshowcase.adsbackend01.workers.dev/raw/:id/:filename)
- 📄 **DocShowcase Viewer Link:** [Open in DocShowcase](https://docshowcase.netlify.app/view/:id)
- 🔗 **Raw Source:** `https://docshowcase.adsbackend01.workers.dev/raw/:id/:filename`
- 🔑 **Edit Password:** `[password or "None (Immutable)"]`
- 🔒 **Encryption:** `[256-bit AES-GCM or "Plaintext"]`
- ⏱️ **Auto-Expiry:** `[Duration or "Never"]`
```
