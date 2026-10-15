/**
 * Multi-Asset Raw Delivery Engine (/raw/:id and /raw/:id/:filename)
 * Delivers live HTML, JS, CSS, JSON, Markdown, and SVG with native MIME types and CORS
 */

import { deleteDocument, getDocument, incrementViews } from "../firestore";
import type { DocumentData, Env, ExecutionContext } from "../types";

/**
 * Determine MIME type from extension or document attributes
 */
export function getMimeType(extension: string, docType?: string, content?: string): string {
  const ext = extension.toLowerCase();

  switch (ext) {
    case "html":
    case "htm":
      return "text/html; charset=utf-8";
    case "js":
    case "mjs":
    case "cjs":
      return "application/javascript; charset=utf-8";
    case "css":
      return "text/css; charset=utf-8";
    case "json":
      return "application/json; charset=utf-8";
    case "md":
    case "markdown":
      return "text/markdown; charset=utf-8";
    case "svg":
      return "image/svg+xml; charset=utf-8";
    case "xml":
      return "application/xml; charset=utf-8";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "csv":
      return "text/csv; charset=utf-8";
    case "txt":
      return "text/plain; charset=utf-8";
  }

  // Fallback to docType
  if (docType === "html") return "text/html; charset=utf-8";
  if (docType === "markdown") return "text/markdown; charset=utf-8";

  // Content sniffing for HTML
  if (content) {
    const trimmed = content.trim().toLowerCase();
    if (trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html")) {
      return "text/html; charset=utf-8";
    }
  }

  return "text/plain; charset=utf-8";
}

/**
 * Extract file extension from filename or path
 */
function extractExtension(name: string): string {
  const match = name.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : "";
}

/**
 * Generate a standalone client-side decryption HTML page for encrypted documents
 */
function renderUnlockPage(docId: string, encryptedContent: string, isBurn = false): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Encrypted Document - DocShowcase</title>
  <style>
    :root {
      --bg: #09090b;
      --card: #18181b;
      --border: #27272a;
      --text: #f4f4f5;
      --muted: #a1a1aa;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --error: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 1rem; width: 100%; max-width: 440px; padding: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; }
    .icon { width: 56px; height: 56px; margin: 0 auto 1.25rem; background: rgba(59, 130, 246, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .icon svg { width: 28px; height: 28px; stroke: var(--primary); stroke-width: 2; fill: none; }
    h1 { font-size: 1.35rem; font-weight: 600; margin-bottom: 0.5rem; }
    p { font-size: 0.875rem; color: var(--muted); margin-bottom: 1.5rem; line-height: 1.5; }
    form { display: flex; flex-direction: column; gap: 0.75rem; }
    input { background: #09090b; border: 1px solid var(--border); border-radius: 0.5rem; color: #fff; padding: 0.75rem 1rem; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
    input:focus { border-color: var(--primary); }
    button { background: var(--primary); color: #fff; border: none; border-radius: 0.5rem; padding: 0.75rem; font-size: 0.95rem; font-weight: 500; cursor: pointer; transition: background 0.2s; }
    button:hover { background: var(--primary-hover); }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .error { color: var(--error); font-size: 0.85rem; margin-top: 0.75rem; display: none; }
    .raw-view { text-align: left; background: #000; padding: 1rem; border-radius: 0.5rem; overflow: auto; max-height: 70vh; font-family: monospace; font-size: 0.9rem; white-space: pre-wrap; word-break: break-all; }
  </style>
</head>
<body>
  <div class="card" id="unlockCard">
    <div class="icon">
      <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
    </div>
    <h1>End-to-End Encrypted</h1>
    <p>This document is protected with 256-bit AES encryption. Enter the view password to decrypt it directly in your browser.</p>
    <form id="unlockForm">
      <input type="password" id="password" placeholder="Enter view password" required autofocus>
      <button type="submit" id="btn">Decrypt & View</button>
    </form>
    <div id="errorMsg" class="error"></div>
  </div>

  <script>
    const encryptedData = ${JSON.stringify(encryptedContent)};
    const docId = ${JSON.stringify(docId)};
    const isBurn = ${JSON.stringify(isBurn)};

    async function deriveKey(password, salt) {
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
      );
      return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );
    }

    async function decryptPayload(cipherStr, password) {
      if (!cipherStr.startsWith("ENC:")) throw new Error("Invalid format");
      const base64 = cipherStr.substring(4);
      const binary = atob(base64);
      const packed = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) packed[i] = binary.charCodeAt(i);
      const salt = packed.slice(0, 16);
      const iv = packed.slice(16, 28);
      const data = packed.slice(28);

      const key = await deriveKey(password, salt);
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        data
      );
      return new TextDecoder().decode(decrypted);
    }

    document.getElementById("unlockForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const pw = document.getElementById("password").value;
      const btn = document.getElementById("btn");
      const err = document.getElementById("errorMsg");
      btn.disabled = true;
      btn.innerText = "Decrypting...";
      err.style.display = "none";

      try {
        const text = await decryptPayload(encryptedData, pw);
        
        // Burn document if view once
        if (isBurn) {
          fetch('/api/burn/' + docId, { method: 'POST' }).catch(() => {});
        }

        // If decrypted content is HTML, render live page
        const trimmed = text.trim().toLowerCase();
        if (trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html")) {
          document.open();
          document.write(text);
          document.close();
          return;
        }

        // Otherwise display clean text preview
        document.body.innerHTML = '<div style="width:100%; max-width:900px; margin:2rem auto; padding:1rem;"><pre class="raw-view"></pre></div>';
        document.querySelector(".raw-view").innerText = text;
      } catch (e) {
        err.innerText = "Incorrect password or corrupted ciphertext.";
        err.style.display = "block";
        btn.disabled = false;
        btn.innerText = "Decrypt & View";
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Handle GET /raw/:id and /raw/:id/:filename
 */
export async function handleRawRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  pathname: string
): Promise<Response> {
  const url = new URL(request.url);

  // Path parsing:
  // Route 1: /raw/:id/:filename
  // Route 2: /raw/:id (where id might have an extension like abc.html)
  const segments = pathname.replace(/^\/raw\/?/, "").split("/").filter(Boolean);

  if (segments.length === 0) {
    return new Response("Missing document ID", { status: 400 });
  }

  let rawId = segments[0];
  const requestedFilename = segments.length > 1 ? segments.slice(1).join("/") : "";

  // Strip extension from ID if present: e.g. "my-doc.html" -> id = "my-doc", ext = "html"
  const idExt = extractExtension(rawId);
  const docId = rawId.replace(/\.[a-z0-9]+$/i, "");

  // Fetch document from Firestore
  const document = await getDocument(env, docId);

  if (!document) {
    return new Response("Document Not Found", {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  // Check auto-expiry
  if (document.expiresAt) {
    const expiresMs =
      typeof document.expiresAt === "object" && "seconds" in document.expiresAt
        ? document.expiresAt.seconds * 1000
        : new Date(document.expiresAt as string).getTime();

    if (Date.now() >= expiresMs) {
      // Lazy-delete expired document
      ctx.waitUntil(deleteDocument(env, docId));
      return new Response("Document has expired", {
        status: 410,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }
  }

  // Determine effective file extension
  let ext = "";
  if (requestedFilename) {
    ext = extractExtension(requestedFilename);
  } else if (idExt) {
    ext = idExt;
  } else if (document.name) {
    ext = extractExtension(document.name);
  }

  if (!ext) {
    if (document.type === "html") ext = "html";
    else if (document.type === "markdown") ext = "md";
  }

  const mimeType = getMimeType(ext, document.type, document.content);
  const isEncrypted = document.content?.startsWith("ENC:");

  // Check if browser requested decryption or client sent ?unlock=1
  const isHtmlAccept = (request.headers.get("Accept") || "").includes("text/html");
  const wantsUnlock = url.searchParams.get("unlock") === "1" || (isHtmlAccept && !requestedFilename.match(/\.(js|css|json|svg)$/i));

  // If document is encrypted and user is opening in browser, serve lightweight unlock page
  if (isEncrypted && wantsUnlock) {
    const unlockHtml = renderUnlockPage(docId, document.content, Boolean(document.burnAfterReading));
    return new Response(unlockHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store, must-revalidate",
        "X-Encrypted": "true",
      },
    });
  }

  // Handle burn-after-reading: permanently delete document once raw payload is served
  if (document.burnAfterReading) {
    ctx.waitUntil(deleteDocument(env, docId));
  } else {
    // Record view increment asynchronously
    ctx.waitUntil(incrementViews(env, docId, document.views));
  }

  // Prepare response headers
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "*");
  headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  headers.set("Content-Type", mimeType);

  if (isEncrypted) {
    headers.set("X-Encrypted", "true");
  }

  // Permissive Content-Security-Policy for native HTML documents (Tailwind, Three.js, unpkg, cdnjs, fonts, etc.)
  if (mimeType.startsWith("text/html")) {
    headers.set(
      "Content-Security-Policy",
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src *;"
    );
  }

  // Handle download display mode
  const display = url.searchParams.get("display");
  if (display === "download") {
    let filename = requestedFilename || document.name || `document.${ext || "txt"}`;
    if (!filename.includes(".")) filename += `.${ext || "txt"}`;
    const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    headers.set("Content-Disposition", `attachment; filename="${safeFilename}"`);
  }

  return new Response(document.content, {
    status: 200,
    headers,
  });
}
