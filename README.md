<p align="center">
  <h1 align="center">📄 DocShowcase</h1>
  <p align="center">
    <strong>Create, preview, and share Markdown or HTML documents instantly.</strong><br/>
    No account required. Write, save, get a link, share.
  </p>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#remote-mcp-server-for-ai">Remote MCP Server</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#usage">Usage</a> •
  <a href="#url-parameters">URL Parameters</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#license">License</a>
</p>

---

## Features

### ✍️ Editor

- **Markdown Editor** — Full GitHub-Flavored Markdown (GFM) with live side-by-side preview on desktop and tabbed interface on mobile
- **HTML Editor** — Write raw HTML rendered in a sandboxed preview with extensive permission support
- **Resizable Panels** — Drag the divider between editor and preview to your preferred split (15%–85%)
- **Scroll Sync** — Editor and preview scroll positions stay in sync
- **Draft Recovery** — Unsaved work is automatically saved to `localStorage` every 500ms and restored on return
- **Deep Customization** — A robust settings menu with 25 preferences covering typography (custom fonts, ligatures), visuals (minimap, whitespace), behavior (cursor styles, smooth scrolling), and coding assistance (auto-closing tags, bracket pair colorization). Settings persist in `localStorage`
- **Engine Selection** — Use the high-performance Monaco Editor (which powers VS Code) for desktop-class IDE features, or seamlessly switch to a Standard Textarea fallback for maximum speed on low-end devices

### 🧮 Rich Content Support

- **LaTeX Math** — Inline `$...$` and display `$$...$$` equations powered by [KaTeX](https://katex.org/)
- **Mermaid Diagrams** — Write flowcharts, sequence diagrams, and more inside ` ```mermaid ` code blocks
- **Syntax Highlighting** — Automatic language detection and beautiful code coloring for 180+ languages
- **GitHub Alerts** — `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]` callout blocks
- **Emoji** — Use `:emoji_name:` shortcodes (e.g., `:rocket:` → 🚀)
- **Tables, Task Lists, Footnotes** — All standard GFM extensions

### 🔗 Sharing & Viewing

- **Instant Sharing** — Save your document and get a clean, shareable URL
- **Multiple Display Modes** — View documents in compact, extended, or normal UI mode via URL parameters
- **Heading Anchors** — Every heading gets an auto-generated ID for direct linking (`#section-name`)
- **Smooth Scrolling** — Internal anchor links scroll smoothly to their target

### 🔒 Security & Privacy

- **End-to-End Encryption (E2E)** — Set a View Password to encrypt your document using the **Web Crypto API (AES-GCM)** right in the browser! The server only ever receives and stores the encrypted ciphertext. Even the `/raw` endpoint serves encrypted data for these files.
- **Self-Destructing Documents** — Set documents to automatically expire! Choose from **1 Hour, 24 Hours, 7 Days, or "Burn After Reading"**. Burn After Reading ensures the document is permanently deleted from Firestore the moment it is successfully viewed/decrypted by the first person.
- **Passkey Protection** — Optionally protect documents with an edit passkey (SHA-256 hashed, never stored in plain text).
- **Read-Only by Default** — Documents without a passkey are permanently read-only.
- **Sandboxed HTML** — HTML previews run in sandboxed iframes for security.

### 🎨 Design & Experience

- **Dark / Light / System Themes** — Seamless theme switching with full design system support.
- **Theme-Aware Diagrams** — Mermaid flowcharts and code blocks adapt their colors to match the current theme.
- **Recent Documents History** — Never lose track of a document again. Your browser securely saves a history of documents you view or create using `localStorage`, displayed elegantly on the Home Page.
- **Real-Time View Counters** — See exactly how popular your document is. Every successful view triggers an atomic `increment(1)` in Firestore, updating the view counter visible in the header.
- **PDF Export** — Generate beautifully styled, print-ready PDFs directly from the document viewer using optimized `@media print` CSS that strips out unnecessary UI elements.
- **Open Graph Social Previews** — Dynamic titles and rich social media cards generated natively so your shared links look incredible on Discord, Slack, Twitter, and iMessage.
- **Custom Format Auto-Detection** — Add extensions like `.js`, `.py`, `.css`, or `.json` to your document name. The `/raw` endpoint automatically infers the correct `Content-Type` MIME headers for seamless embedding in other websites!
- **Responsive Mobile Overhaul** — A completely revamped, touch-friendly mobile editor toolbar that neatly stacks formatting and security controls for writing on the go.

### ⚡ Edge Engine & Multi-Asset Delivery

- **Multi-Asset Raw Delivery Engine** — High-speed asset router (`/raw/:id` and `/raw/:id/:filename`) hosted on Cloudflare Workers edge. Serves live HTML, JS, CSS, JSON, Markdown, and SVG natively with full CORS (`Access-Control-Allow-Origin: *`) and Cross-Origin Resource Policy headers.
- **Playable HTML Execution** — HTML documents render natively in desktop and mobile browsers with permissive Content-Security-Policy headers supporting external CDNs (Three.js, Tailwind, Google Fonts, unpkg, cdnjs), WebGL, and WebAudio.
- **Zero-Dependency Firestore REST** — Communicates with Firebase Firestore over Google's IdentityToolkit and REST API with zero external libraries and near-0ms warm isolate response times.
- **Automated Cron Cleanups** — Cloudflare cron trigger purges expired self-destructing documents from Firestore every 15 minutes.

---

## 🤖 Remote MCP Server (for AI)

DocShowcase features a **Zero-Trust Remote Model Context Protocol (MCP)** server hosted at `/mcp`. Any AI assistant (**Claude Desktop**, **Cursor IDE**, **Windsurf**, or autonomous LLM agents) can create, inspect, surgically patch, blind-overwrite, and manage live documents directly.

### Features
- **JSON-RPC 2.0 & Streamable HTTP / SSE** protocol compliance.
- **Tools Included**: `create_document`, `get_document`, `patch_document`, `update_document`, `delete_document`, `get_document_info`.
- **Zero-Trust Security**: No query-string passwords, observability logging disabled (`[observability] enabled = false`), and guaranteed in-memory zeroing of password/key buffers in `finally` blocks.
- **Detailed Documentation**: See the [📖 Complete MCP Server Guide](docs/MCP_SERVER.md) for full tool schemas, JSON-RPC examples, and client configuration instructions.

### Quick Connect (Claude Desktop / Cursor)
```json
{
  "mcpServers": {
    "docshowcase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch",
        "https://YOUR_CLOUDFLARE_WORKER_URL/mcp"
      ]
    }
  }
}
```

---

## Tech Stack

| Layer          | Technology                                                                              |
| -------------- | --------------------------------------------------------------------------------------- |
| **Framework**  | [Next.js 16](https://nextjs.org/) with [Turbopack](https://turbo.build/pack)            |
| **Language**   | [TypeScript 5](https://www.typescriptlang.org/)                                         |
| **UI**         | [React 19](https://react.dev/), [Radix UI](https://www.radix-ui.com/), [Lucide](https://lucide.dev/) |
| **Styling**    | [Tailwind CSS v4](https://tailwindcss.com/)                                             |
| **Markdown**   | [react-markdown](https://github.com/remarkjs/react-markdown) + remark/rehype plugins   |
| **Math**       | [KaTeX](https://katex.org/) via rehype-katex                                            |
| **Diagrams**   | [Mermaid](https://mermaid.js.org/)                                                      |
| **Database**   | [Firebase Firestore](https://firebase.google.com/docs/firestore)                        |
| **Edge Backend**| [Cloudflare Workers](https://workers.cloudflare.com/) (Zero-Dependency REST & MCP Server) |
| **Theming**    | [next-themes](https://github.com/pacocoursey/next-themes)                               |
| **Fonts**      | [Inter](https://fonts.google.com/specimen/Inter) + [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18.17 or later
- A [Firebase](https://firebase.google.com/) project with Firestore enabled

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/docshowcase.git
cd docshowcase
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your Firebase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase project details:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Secure Server-Side Firebase Editor Credentials
FIREBASE_EDITOR_EMAIL="editor@yourdomain.com"
FIREBASE_EDITOR_PASSWORD="your_secure_password"
```

> **Where to find these?** Go to your [Firebase Console](https://console.firebase.google.com/) → Project Settings → General → Your Apps → Web App → Config.
> 
> **For Editor Credentials:** Go to **Authentication** in Firebase, create an Email/Password user, and put those exact credentials in the server `.env.local` to secure database writes.

### 4. Set Up Firestore

1. In the Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (or test mode for development)
4. Select a location closest to your users

No additional collections or indexes need to be created manually — the app creates the `documents` collection automatically.

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

### Creating a Document

1. Visit the homepage and click **"Start Creating"** or go directly to `/editor`
2. Choose **Markdown** or **HTML** from the type selector in the toolbar
3. Give your document a name (optional — a random ID is generated if left blank)
4. Write your content in the editor. The preview updates in real-time
5. Optionally set a **passkey** to allow future editing
6. Click **"Save & Share"**

### Sharing a Document

After saving, you'll be redirected to the share page with your document's public URL. From there you can:

- **Copy URL** — Copies the link to your clipboard
- **Share** — Opens the native share dialog (on supported devices)
- **Open** — Opens the document in a new tab

The public view URL follows the format:
```
https://your-domain.com/view/your-document-name
```

### Editing a Document

If you set a passkey when creating the document:

1. Navigate to `/edit/your-document-id` (or click the **Edit** button on the Markdown view page)
2. Enter your passkey when prompted
3. Make your changes and click **"Update"**

> Documents without a passkey are permanently read-only and cannot be edited.

### Writing Markdown

DocShowcase supports full **GitHub-Flavored Markdown** plus extensions:

#### Math (LaTeX)

```markdown
Inline math: $E = mc^2$

Display math:
$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$
```

#### Mermaid Diagrams

````markdown
```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Do Something]
    B -->|No| D[Do Something Else]
```
````

#### GitHub Alerts

```markdown
> [!NOTE]
> This is a helpful note.

> [!WARNING]
> Be careful with this operation.
```

#### Emoji

```markdown
:rocket: :tada: :thumbsup:
```

---

## URL Parameters

### Viewing Endpoint (`/view/{id}`)

When viewing a document, you can customize the display using query parameters:

| Parameter   | Value      | Behavior                                                                                    |
| ----------- | ---------- | ------------------------------------------------------------------------------------------- |
| *(none)*    | —          | **Default.** Renders with full app UI (header, footer, title, edit button)                  |
| `display`   | `compact`  | Hides app UI. Shows only the Markdown content in a centered, readable-width layout          |
| `display`   | `extended` | Hides app UI. Shows Markdown content stretched to the full width of the screen              |

#### Examples

```
/view/my-document                    → Normal view with full app UI
/view/my-document?display=compact    → Clean, centered content only
/view/my-document?display=extended   → Full-width content only
```

> **Note:** HTML documents always render in full-screen mode (no app UI) by default. Use `?display=compact` to embed them within the app layout.

### Raw Endpoint (`/raw/{id}`)

Access documents natively in the browser without any sandbox, iframes, or website UI. The route automatically infers the MIME type from the file extension.

| Parameter   | Value      | Behavior                                                                                    |
| ----------- | ---------- | ------------------------------------------------------------------------------------------- |
| *(none)*    | —          | **Default.** Renders natively in the browser (`text/plain` for Markdown, `text/css` for CSS, etc.) |
| `display`   | `normal`   | Explicitly acts identical to the default behavior.                                          |
| `display`   | `download` | Triggers a file download to the user's computer with the correct file extension.            |

#### Custom Extensions

You can use custom file extensions in the URL to override the Content-Type. For example:
- `/raw/styles.css` → served as `text/css`
- `/raw/script.js` → served as `application/javascript`
- `/raw/data.json` → served as `application/json`

If no extension is provided in the URL, DocShowcase automatically redirects to the correct extension based on the document type (e.g., `/raw/my-doc` → `/raw/my-doc.md`).

#### Encrypted Documents

If the document is protected with a **View Password** (End-to-End Encryption), the `/raw` endpoint will serve the encrypted ciphertext payload (prefixed with `ENC:` followed by base64 data) instead of the raw plaintext content. Users must manually decrypt this payload using the Web Crypto API on their end if fetching programmatically.

---

## Project Structure

```
docshowcase/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (fonts, theme, header, footer)
│   │   ├── page.tsx                # Landing page with hero & feature cards
│   │   ├── globals.css             # Design system (CSS variables, typography)
│   │   ├── not-found.tsx           # Custom 404 page
│   │   ├── editor/
│   │   │   └── page.tsx            # New document editor
│   │   ├── edit/
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Edit page (server: fetch doc, check passkey)
│   │   │       └── edit-client.tsx  # Passkey gate → editor
│   │   ├── view/
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # View page (server: fetch doc, metadata)
│   │   │       └── view-client.tsx  # Display mode handling, markdown/HTML render
│   │   ├── share/
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Share success page (server)
│   │   │       └── share-client.tsx # Copy/share/open buttons
│   │   └── api/
│   │       └── verify-passkey/
│   │           └── route.ts        # POST: verify passkey hash
│   ├── components/
│   │   ├── editor-view.tsx         # Main editor component (toolbar, panels)
│   │   ├── preview-pane.tsx        # Markdown/HTML renderer
│   │   ├── code-block.tsx          # Styled code block with copy button
│   │   ├── mermaid-block.tsx       # Theme-aware Mermaid diagram renderer
│   │   ├── header.tsx              # App header with logo & theme toggle
│   │   ├── footer.tsx              # App footer
│   │   ├── theme-provider.tsx      # next-themes wrapper
│   │   ├── theme-toggle.tsx        # Light/dark/system toggle
│   │   └── ui/                     # Reusable UI primitives (Radix-based)
│   └── lib/
│       ├── actions.ts              # Server actions (save, update, get document)
│       ├── firebase.ts             # Firebase initialization
│       ├── crypto.ts               # SHA-256 passkey hashing & verification
│       ├── types.ts                # TypeScript types & interfaces
│       └── utils.ts                # Utility functions
├── .env.example                    # Environment variable template
├── apphosting.yaml                 # Firebase App Hosting config
├── next.config.ts                  # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS configuration (if present)
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Dependencies & scripts
```

---

## Available Scripts

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start dev server with Turbopack      |
| `npm run build` | Build for production                 |
| `npm start`     | Start production server              |
| `npm run lint`  | Run ESLint                           |

---

## Deployment

### 1. Cloudflare Worker (Backend, Raw Engine & MCP Server)

DocShowcase uses a zero-dependency Cloudflare Worker for high-speed raw asset delivery, document CRUD/expiry, and the remote MCP server.

1. **Configure Secrets in Cloudflare:**
   ```bash
   npx wrangler secret put FIREBASE_API_KEY
   npx wrangler secret put FIREBASE_PROJECT_ID
   npx wrangler secret put FIREBASE_BOT_EMAIL
   npx wrangler secret put FIREBASE_BOT_PASSWORD
   npx wrangler secret put ADMIN_PASSWORD
   ```
   *(Or configure them in Cloudflare Dashboard: **Workers & Pages** → `docshowcase-backend` → **Settings** → **Variables and Secrets**).*

2. **Deploy Worker:**
   ```bash
   npm run worker:deploy
   ```

3. **Run Automated Integration Tests:**
   ```bash
   npm run worker:test
   ```

### 2. Frontend (Netlify / Static Hosting)

The Next.js frontend is configured for static export (`output: 'export'`), published to the `out` folder:

1. Connect your repository to **Netlify**.
2. Set build command: `npm run build`
3. Set publish directory: `out`
4. Set environment variable: `NEXT_PUBLIC_WORKER_URL=https://YOUR_WORKER_URL`
5. The included `netlify.toml` automatically proxies `/raw/*` and `/mcp` requests directly to the Cloudflare Worker.

---

## Firestore Security Rules

To ensure complete security in production, all write, update, and delete operations are restricted exclusively to the authenticated Cloudflare Worker Bot user:

Deploy the included `firestore.rules`:
```bash
firebase deploy --only firestore:rules
```

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /documents/{documentId} {
      // Public reads allowed for active unexpired documents
      allow read: if resource == null || 
                     resource.data.expiresAt == null || 
                     resource.data.expiresAt > request.time;

      // ONLY the authenticated Cloudflare Worker Bot account can write, update, or delete
      allow write: if request.auth != null && 
                      (request.auth.token.email == "editor@docshowcase.aryansdevstudios.com" ||
                       request.auth.token.email.matches(".*@docshowcase.*"));
    }
  }
}
```

> **Security Note:** Because the Cloudflare Worker authenticates directly via IdentityToolkit REST with your bot credentials, direct unauthorized client-side writes to Firestore are blocked.

---

## Content Limits

| Limit               | Value    |
| -------------------- | -------- |
| Max document size    | **1 MB** |
| Document ID format   | Slug from name, or random 8-char alphanumeric |
| Passkey storage      | SHA-256 hash (never stored in plain text) |

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is open source. Feel free to use it for your own projects.

---

<p align="center">
  Built with ❤️ by <strong>AryansDevStudios</strong>
</p>
