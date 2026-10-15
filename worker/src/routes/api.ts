/**
 * Core Document CRUD, Auth-Verification, Expiry, & Admin API Routes
 */

import {
  encryptContent,
  generateSalt,
  hashPasskey,
  hashWithSalt,
  verifyPasskey,
} from "../crypto";
import {
  deleteDocument,
  getDocument,
  incrementViews,
  listAllDocuments,
  setDocument,
  updateDocumentFields,
} from "../firestore";
import type { DocType, DocumentData, Env, ExecutionContext } from "../types";

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Password",
    },
  });
}

function generateSlug(name: string): string {
  const base = name.replace(/\.[a-z0-9]+$/i, "").trim() || name.trim();
  return base
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function generateShortId(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function handleApiRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  pathname: string
): Promise<Response> {
  const method = request.method.toUpperCase();

  // Route: POST /api/verify-passkey
  if (pathname === "/api/verify-passkey" && method === "POST") {
    try {
      const { id, passkey } = (await request.json()) as { id?: string; passkey?: string };
      if (!id || !passkey) {
        return jsonResponse({ error: "Document ID and passkey are required." }, 400);
      }

      const doc = await getDocument(env, id);
      if (!doc) {
        return jsonResponse({ error: "Document not found." }, 404);
      }

      if (!doc.passkeyHash && !doc.editPasswordHash) {
        return jsonResponse({ error: "This document is read-only / immutable." }, 403);
      }

      const isValid = await verifyPasskey(
        passkey,
        doc.editPasswordHash || doc.passkeyHash!,
        doc.editPasswordSalt
      );

      if (!isValid) {
        return jsonResponse({ error: "Incorrect passkey." }, 401);
      }

      const token = `${id}-${Date.now()}-${generateShortId(6)}`;
      return jsonResponse({ success: true, token });
    } catch (err: any) {
      return jsonResponse({ error: err.message || "Failed to verify passkey" }, 500);
    }
  }

  // Route: POST /api/burn/:id
  if (pathname.startsWith("/api/burn/") && method === "POST") {
    const id = pathname.replace("/api/burn/", "");
    try {
      const doc = await getDocument(env, id);
      if (!doc) return jsonResponse({ error: "Document not found" }, 404);
      if (!doc.burnAfterReading) {
        return jsonResponse({ error: "Document is not burnable." }, 400);
      }
      await deleteDocument(env, id);
      return jsonResponse({ success: true });
    } catch (err: any) {
      return jsonResponse({ error: err.message || "Failed to burn document" }, 500);
    }
  }

  // Route: POST /api/docs (Create document)
  if (pathname === "/api/docs" && method === "POST") {
    try {
      const body = (await request.json()) as {
        name?: string;
        content: string;
        type?: DocType;
        editPassword?: string;
        viewPassword?: string;
        passkey?: string; // legacy alias for editPassword
        expiration?: "never" | "burn" | "1h" | "24h" | "7d";
        expiresInMinutes?: number;
      };

      if (!body.content || typeof body.content !== "string") {
        return jsonResponse({ error: "Content is required." }, 400);
      }

      const name = (body.name || "").trim();
      let type: DocType = body.type || "markdown";

      // Auto-detect type from extension if not explicitly html/markdown
      if (name.match(/\.md$/i)) type = "markdown";
      else if (name.match(/\.(html?|htm)$/i)) type = "html";
      else if (type === "custom" && !name.match(/\.[a-z0-9]+$/i)) {
        return jsonResponse(
          { error: "Custom format requires a file extension in the document name (e.g. script.py, styles.css)" },
          400
        );
      }

      // Generate document ID
      let docId = "";
      if (name) {
        const slug = generateSlug(name);
        if (slug) {
          const existing = await getDocument(env, slug);
          if (existing) {
            // Slug taken, append short random id
            docId = `${slug}-${generateShortId(4)}`;
          } else {
            docId = slug;
          }
        } else {
          docId = generateShortId(8);
        }
      } else {
        docId = generateShortId(8);
      }

      // Handle Edit Password / Passkey
      const editPass = body.editPassword || body.passkey || null;
      let editPasswordHash: string | null = null;
      let editPasswordSalt: string | null = null;
      let passkeyHash: string | null = null;

      if (editPass) {
        editPasswordSalt = generateSalt(16);
        editPasswordHash = await hashWithSalt(editPass, editPasswordSalt);
        passkeyHash = await hashPasskey(editPass); // Legacy compatibility
      }

      // Handle View Password (Encryption)
      let finalContent = body.content;
      if (body.viewPassword && body.viewPassword.trim()) {
        if (!finalContent.startsWith("ENC:")) {
          finalContent = await encryptContent(finalContent, body.viewPassword.trim());
        }
      }

      // Handle Expiration & Burn-After-Reading
      let burnAfterReading = false;
      let expiresAt: string | null = null;

      if (body.expiration === "burn") {
        burnAfterReading = true;
      } else if (body.expiration === "1h") {
        expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      } else if (body.expiration === "24h") {
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      } else if (body.expiration === "7d") {
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (body.expiresInMinutes && body.expiresInMinutes > 0) {
        expiresAt = new Date(Date.now() + body.expiresInMinutes * 60 * 1000).toISOString();
      }

      const nowIso = new Date().toISOString();
      const newDoc: Partial<DocumentData> = {
        name,
        content: finalContent,
        type,
        passkeyHash,
        editPasswordHash,
        editPasswordSalt,
        burnAfterReading,
        expiresAt,
        views: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await setDocument(env, docId, newDoc);

      const baseUrl = env.APP_URL || new URL(request.url).origin;
      return jsonResponse({
        id: docId,
        url: `${baseUrl}/view/${docId}`,
        rawUrl: `${baseUrl}/raw/${docId}`,
        isEncrypted: finalContent.startsWith("ENC:"),
        isEditable: Boolean(passkeyHash || editPasswordHash),
        burnAfterReading,
        expiresAt,
      }, 201);
    } catch (err: any) {
      return jsonResponse({ error: err.message || "Failed to create document" }, 500);
    }
  }

  // Route: GET /api/docs/:id (Fetch document data)
  if (pathname.startsWith("/api/docs/") && method === "GET") {
    const id = pathname.replace("/api/docs/", "");
    try {
      const doc = await getDocument(env, id);
      if (!doc) {
        return jsonResponse({ error: "Document not found" }, 404);
      }

      // Check auto-expiry
      if (doc.expiresAt) {
        const expiresMs =
          typeof doc.expiresAt === "object" && "seconds" in doc.expiresAt
            ? doc.expiresAt.seconds * 1000
            : new Date(doc.expiresAt as string).getTime();

        if (Date.now() >= expiresMs) {
          ctx.waitUntil(deleteDocument(env, id));
          return jsonResponse({ error: "Document has expired" }, 410);
        }
      }

      // Increment view count asynchronously
      ctx.waitUntil(incrementViews(env, id, doc.views));

      return jsonResponse({
        id: doc.id,
        name: doc.name,
        content: doc.content,
        type: doc.type,
        passkeyHash: doc.passkeyHash,
        isEditable: Boolean(doc.passkeyHash || doc.editPasswordHash),
        isEncrypted: doc.content.startsWith("ENC:"),
        burnAfterReading: doc.burnAfterReading,
        expiresAt: doc.expiresAt,
        views: (doc.views || 0) + 1,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      });
    } catch (err: any) {
      return jsonResponse({ error: err.message || "Failed to fetch document" }, 500);
    }
  }

  // Route: PUT /api/docs/:id (Update or Blind Overwrite)
  if (pathname.startsWith("/api/docs/") && method === "PUT") {
    const id = pathname.replace("/api/docs/", "");
    try {
      const body = (await request.json()) as {
        editPassword?: string;
        passkey?: string;
        content: string;
        name?: string;
        type?: DocType;
        newViewPassword?: string;
      };

      const editPass = body.editPassword || body.passkey;
      if (!editPass) {
        return jsonResponse({ error: "Edit password / passkey is required to update document." }, 400);
      }

      if (!body.content || typeof body.content !== "string") {
        return jsonResponse({ error: "Content is required." }, 400);
      }

      const doc = await getDocument(env, id);
      if (!doc) {
        return jsonResponse({ error: "Document not found." }, 404);
      }

      if (!doc.passkeyHash && !doc.editPasswordHash) {
        return jsonResponse({ error: "Forbidden: This document is immutable and cannot be edited." }, 403);
      }

      const isValid = await verifyPasskey(
        editPass,
        doc.editPasswordHash || doc.passkeyHash!,
        doc.editPasswordSalt
      );

      if (!isValid) {
        return jsonResponse({ error: "Unauthorized: Incorrect edit password." }, 401);
      }

      // Handle Blind Overwrite / View Password update
      let updatedContent = body.content;
      if (body.newViewPassword && body.newViewPassword.trim()) {
        if (!updatedContent.startsWith("ENC:")) {
          updatedContent = await encryptContent(updatedContent, body.newViewPassword.trim());
        }
      }

      const updateFields: Partial<DocumentData> = {
        content: updatedContent,
        updatedAt: new Date().toISOString(),
      };

      if (body.name !== undefined) updateFields.name = body.name.trim();
      if (body.type !== undefined) updateFields.type = body.type;

      await updateDocumentFields(env, id, updateFields);

      return jsonResponse({ success: true, id });
    } catch (err: any) {
      return jsonResponse({ error: err.message || "Failed to update document" }, 500);
    }
  }

  // Route: DELETE /api/docs/:id
  if (pathname.startsWith("/api/docs/") && method === "DELETE") {
    const id = pathname.replace("/api/docs/", "");
    try {
      let body: any = {};
      try {
        body = await request.json();
      } catch {
        // Body might be empty
      }

      const adminHeader = request.headers.get("X-Admin-Password");
      const isAdmin = env.ADMIN_PASSWORD && adminHeader === env.ADMIN_PASSWORD;

      const doc = await getDocument(env, id);
      if (!doc) {
        return jsonResponse({ error: "Document not found" }, 404);
      }

      if (!isAdmin) {
        const editPass = body.editPassword || body.passkey;
        if (!editPass) {
          return jsonResponse({ error: "Edit password required to delete document." }, 400);
        }

        if (!doc.passkeyHash && !doc.editPasswordHash) {
          return jsonResponse({ error: "Forbidden: Immutable document cannot be deleted." }, 403);
        }

        const isValid = await verifyPasskey(
          editPass,
          doc.editPasswordHash || doc.passkeyHash!,
          doc.editPasswordSalt
        );

        if (!isValid) {
          return jsonResponse({ error: "Unauthorized: Incorrect edit password." }, 401);
        }
      }

      await deleteDocument(env, id);
      return jsonResponse({ success: true });
    } catch (err: any) {
      return jsonResponse({ error: err.message || "Failed to delete document" }, 500);
    }
  }

  // Route: GET /api/admin/docs (Admin list)
  if (pathname === "/api/admin/docs" && method === "GET") {
    const adminPass = request.headers.get("X-Admin-Password") || new URL(request.url).searchParams.get("adminPass");
    if (!env.ADMIN_PASSWORD || adminPass !== env.ADMIN_PASSWORD) {
      return jsonResponse({ error: "Unauthorized: Invalid admin credentials." }, 401);
    }

    try {
      const docs = await listAllDocuments(env, 300);
      const summaries = docs.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        views: d.views || 0,
        burnAfterReading: Boolean(d.burnAfterReading),
        expiresAt: d.expiresAt,
        createdAt: d.createdAt,
        contentPreview: d.content ? d.content.substring(0, 150) : "",
        isEncrypted: d.content?.startsWith("ENC:") || false,
      }));
      return jsonResponse({ documents: summaries });
    } catch (err: any) {
      return jsonResponse({ error: err.message || "Failed to list documents" }, 500);
    }
  }

  return jsonResponse({ error: "API Route Not Found" }, 404);
}
