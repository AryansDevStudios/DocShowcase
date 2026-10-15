/**
 * Zero-Trust Remote Model Context Protocol (MCP) Server for DocShowcase
 * Compliant with MCP JSON-RPC 2.0 specifications over HTTP
 * Zero sensitive logging, in-memory cryptographic scrubbing in finally blocks
 */

import {
  decryptContent,
  encryptContent,
  generateSalt,
  hashPasskey,
  hashWithSalt,
  scrubBuffer,
  verifyPasskey,
} from "../crypto";
import {
  deleteDocument,
  getDocument,
  setDocument,
  updateDocumentFields,
} from "../firestore";
import type {
  DocType,
  DocumentData,
  Env,
  ExecutionContext,
  JsonRpcRequest,
  JsonRpcResponse,
  McpTool,
  McpToolCallResult,
} from "../types";

const MCP_TOOLS: McpTool[] = [
  {
    name: "create_document",
    description:
      "Create a new document on DocShowcase. Supports Markdown, HTML (playable/viewable natively in browsers), JavaScript, CSS, JSON, etc. Supports optional 256-bit view encryption and edit password protection.",
    inputSchema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The full text or code content of the document.",
        },
        title: {
          type: "string",
          description: "Document title or filename (e.g. 'neon-rush.html', 'notes.md', 'styles.css').",
        },
        type: {
          type: "string",
          enum: ["markdown", "html", "custom"],
          description: "Document format type.",
        },
        viewPassword: {
          type: "string",
          description: "Optional view password. If provided, the document is 256-bit AES encrypted before storage.",
        },
        editPassword: {
          type: "string",
          description: "Optional edit password. If provided, allows future updates, patching, or deletion.",
        },
        expiration: {
          type: "string",
          enum: ["never", "burn", "1h", "24h", "7d"],
          description: "Auto-deletion duration or 'burn' for view-once self-destruction.",
        },
        expiresInMinutes: {
          type: "integer",
          description: "Custom auto-expiry duration in minutes from now.",
        },
      },
      required: ["content"],
    },
  },
  {
    name: "get_document",
    description:
      "Fetch a document by its ID. If the document is end-to-end encrypted, provide 'viewPassword' to decrypt the content in memory.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The unique document ID or slug.",
        },
        viewPassword: {
          type: "string",
          description: "The view password required to decrypt encrypted documents.",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "patch_document",
    description:
      "Surgically patch an existing document via search-and-replace without rewriting the entire document. Requires editPassword. If the document is encrypted, viewPassword is also required to decrypt, patch, and re-encrypt.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The unique document ID.",
        },
        editPassword: {
          type: "string",
          description: "The document's edit password.",
        },
        search: {
          type: "string",
          description: "The exact substring in the document content to find.",
        },
        replace: {
          type: "string",
          description: "The replacement substring.",
        },
        viewPassword: {
          type: "string",
          description: "View password if the document is encrypted.",
        },
        replaceAll: {
          type: "boolean",
          description: "Whether to replace all occurrences or just the first occurrence (default: true).",
        },
      },
      required: ["id", "editPassword", "search", "replace"],
    },
  },
  {
    name: "update_document",
    description:
      "Overwrite an existing document with new content. Requires editPassword. Supports blind overwrite if the user forgot the view password.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The unique document ID.",
        },
        editPassword: {
          type: "string",
          description: "The document's edit password.",
        },
        content: {
          type: "string",
          description: "The new document content.",
        },
        title: {
          type: "string",
          description: "Optional updated title or filename.",
        },
        type: {
          type: "string",
          enum: ["markdown", "html", "custom"],
          description: "Optional updated document type.",
        },
        newViewPassword: {
          type: "string",
          description: "Optional new view password to encrypt the new content.",
        },
      },
      required: ["id", "editPassword", "content"],
    },
  },
  {
    name: "delete_document",
    description: "Permanently delete a document from DocShowcase. Requires the document's editPassword.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The unique document ID.",
        },
        editPassword: {
          type: "string",
          description: "The document's edit password.",
        },
      },
      required: ["id", "editPassword"],
    },
  },
  {
    name: "get_document_info",
    description: "Retrieve document metadata (title, type, view count, expiry, whether encrypted or editable) without exposing its content.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The unique document ID.",
        },
      },
      required: ["id"],
    },
  },
];

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

/**
 * Execute an MCP Tool Call with zero-trust in-memory credential scrubbing
 */
async function executeToolCall(
  name: string,
  args: Record<string, any>,
  env: Env,
  requestUrl: string
): Promise<McpToolCallResult> {
  const baseUrl = env.APP_URL || new URL(requestUrl).origin;

  switch (name) {
    case "create_document": {
      let viewPasswordBytes: Uint8Array | null = null;
      let editPasswordBytes: Uint8Array | null = null;

      try {
        const rawContent = args.content;
        const title = (args.title || args.name || "").trim();
        let type: DocType = args.type || "markdown";

        if (title.match(/\.md$/i)) type = "markdown";
        else if (title.match(/\.(html?|htm)$/i)) type = "html";

        // Generate doc ID
        let docId = "";
        if (title) {
          const slug = generateSlug(title);
          if (slug) {
            const existing = await getDocument(env, slug);
            docId = existing ? `${slug}-${generateShortId(4)}` : slug;
          } else {
            docId = generateShortId(8);
          }
        } else {
          docId = generateShortId(8);
        }

        // Handle edit password
        let passkeyHash: string | null = null;
        let editPasswordHash: string | null = null;
        let editPasswordSalt: string | null = null;

        if (args.editPassword) {
          editPasswordBytes = new TextEncoder().encode(args.editPassword);
          editPasswordSalt = generateSalt(16);
          editPasswordHash = await hashWithSalt(args.editPassword, editPasswordSalt);
          passkeyHash = await hashPasskey(args.editPassword);
        }

        // Handle view password (encryption)
        let finalContent = rawContent;
        const isEncrypted = Boolean(args.viewPassword && args.viewPassword.trim());

        if (isEncrypted) {
          viewPasswordBytes = new TextEncoder().encode(args.viewPassword);
          finalContent = await encryptContent(rawContent, args.viewPassword.trim());
        }

        // Handle expiration
        let burnAfterReading = false;
        let expiresAt: string | null = null;

        if (args.expiration === "burn") {
          burnAfterReading = true;
        } else if (args.expiration === "1h") {
          expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        } else if (args.expiration === "24h") {
          expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        } else if (args.expiration === "7d") {
          expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        } else if (args.expiresInMinutes && args.expiresInMinutes > 0) {
          expiresAt = new Date(Date.now() + args.expiresInMinutes * 60 * 1000).toISOString();
        }

        const nowIso = new Date().toISOString();
        await setDocument(env, docId, {
          name: title,
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
        });

        // Build URLs
        const viewUrl = `${baseUrl}/view/${docId}`;
        const rawUrl = `${baseUrl}/raw/${docId}${title ? `/${title}` : ""}`;

        const details = [
          `Document created successfully!`,
          `- **Document ID:** \`${docId}\``,
          `- **View URL:** ${viewUrl}`,
          `- **Raw URL (Native Delivery):** ${rawUrl}`,
          `- **Type:** \`${type}\``,
          `- **Encrypted:** ${isEncrypted ? "Yes (AES-256-GCM)" : "No"}`,
          `- **Editable:** ${passkeyHash ? "Yes (Edit Password configured)" : "No (Permanent & Immutable)"}`,
          burnAfterReading ? `- **Self-Destruct:** Burns after reading (View-Once)` : null,
          expiresAt ? `- **Expires At:** ${expiresAt}` : null,
        ]
          .filter(Boolean)
          .join("\n");

        return {
          content: [{ type: "text", text: details }],
          isError: false,
        };
      } finally {
        scrubBuffer(viewPasswordBytes);
        scrubBuffer(editPasswordBytes);
      }
    }

    case "get_document": {
      let viewPasswordBytes: Uint8Array | null = null;
      try {
        const id = args.id;
        const doc = await getDocument(env, id);

        if (!doc) {
          return {
            content: [{ type: "text", text: `Error: Document '${id}' not found.` }],
            isError: true,
          };
        }

        const isEncrypted = doc.content.startsWith("ENC:");
        let displayedContent = doc.content;

        if (isEncrypted) {
          if (!args.viewPassword) {
            return {
              content: [
                {
                  type: "text",
                  text: `Document '${id}' is encrypted with 256-bit AES. Please provide the 'viewPassword' to decrypt and read the content.\n\nMetadata:\n- Title: ${doc.name || "(Untitled)"}\n- Type: ${doc.type}\n- Views: ${doc.views || 0}\n- Encrypted: Yes`,
                },
              ],
              isError: false,
            };
          }

          viewPasswordBytes = new TextEncoder().encode(args.viewPassword);
          try {
            displayedContent = await decryptContent(doc.content, args.viewPassword);
          } catch {
            return {
              content: [{ type: "text", text: `Error: Decryption failed for document '${id}'. Incorrect viewPassword.` }],
              isError: true,
            };
          }
        }

        const viewUrl = `${baseUrl}/view/${id}`;
        const rawUrl = `${baseUrl}/raw/${id}`;

        const header = [
          `# Document: ${doc.name || id}`,
          `- **ID:** \`${id}\``,
          `- **Type:** \`${doc.type}\``,
          `- **Views:** ${doc.views || 0}`,
          `- **View URL:** ${viewUrl}`,
          `- **Raw URL:** ${rawUrl}`,
          `- **Encrypted:** ${isEncrypted ? "Yes (Decrypted in memory)" : "No"}`,
          `\n--- Content ---\n`,
        ].join("\n");

        return {
          content: [{ type: "text", text: `${header}${displayedContent}` }],
          isError: false,
        };
      } finally {
        scrubBuffer(viewPasswordBytes);
      }
    }

    case "patch_document": {
      let viewPasswordBytes: Uint8Array | null = null;
      let editPasswordBytes: Uint8Array | null = null;

      try {
        const { id, editPassword, search, replace, viewPassword, replaceAll = true } = args;

        const doc = await getDocument(env, id);
        if (!doc) {
          return { content: [{ type: "text", text: `Error: Document '${id}' not found.` }], isError: true };
        }

        if (!doc.passkeyHash && !doc.editPasswordHash) {
          return { content: [{ type: "text", text: `Error: Document '${id}' is immutable and cannot be patched.` }], isError: true };
        }

        editPasswordBytes = new TextEncoder().encode(editPassword);
        const isAuth = await verifyPasskey(editPassword, doc.editPasswordHash || doc.passkeyHash!, doc.editPasswordSalt);
        if (!isAuth) {
          return { content: [{ type: "text", text: `Error: Unauthorized. Incorrect editPassword for document '${id}'.` }], isError: true };
        }

        const isEncrypted = doc.content.startsWith("ENC:");
        let plaintext = doc.content;

        if (isEncrypted) {
          if (!viewPassword) {
            return {
              content: [{ type: "text", text: `Error: Document '${id}' is encrypted. You must provide 'viewPassword' to decrypt before patching.` }],
              isError: true,
            };
          }
          viewPasswordBytes = new TextEncoder().encode(viewPassword);
          try {
            plaintext = await decryptContent(doc.content, viewPassword);
          } catch {
            return { content: [{ type: "text", text: `Error: Incorrect viewPassword for encrypted document '${id}'.` }], isError: true };
          }
        }

        if (!plaintext.includes(search)) {
          return {
            content: [{ type: "text", text: `Error: Search string not found in document '${id}'. Please verify exact character sequence.` }],
            isError: true,
          };
        }

        // Perform patch
        const patched = replaceAll
          ? plaintext.split(search).join(replace)
          : plaintext.replace(search, replace);

        let finalToSave = patched;
        if (isEncrypted) {
          finalToSave = await encryptContent(patched, viewPassword);
        }

        await updateDocumentFields(env, id, {
          content: finalToSave,
          updatedAt: new Date().toISOString(),
        });

        return {
          content: [
            {
              type: "text",
              text: `Document '${id}' successfully patched!\n- Target string replaced: \`${search.length}\` characters -> \`${replace.length}\` characters.\n- Updated At: ${new Date().toISOString()}`,
            },
          ],
          isError: false,
        };
      } finally {
        scrubBuffer(viewPasswordBytes);
        scrubBuffer(editPasswordBytes);
      }
    }

    case "update_document": {
      let editPasswordBytes: Uint8Array | null = null;
      let newViewPasswordBytes: Uint8Array | null = null;

      try {
        const { id, editPassword, content, title, type, newViewPassword } = args;

        const doc = await getDocument(env, id);
        if (!doc) {
          return { content: [{ type: "text", text: `Error: Document '${id}' not found.` }], isError: true };
        }

        if (!doc.passkeyHash && !doc.editPasswordHash) {
          return { content: [{ type: "text", text: `Error: Document '${id}' is immutable.` }], isError: true };
        }

        editPasswordBytes = new TextEncoder().encode(editPassword);
        const isAuth = await verifyPasskey(editPassword, doc.editPasswordHash || doc.passkeyHash!, doc.editPasswordSalt);
        if (!isAuth) {
          return { content: [{ type: "text", text: `Error: Unauthorized. Incorrect editPassword.` }], isError: true };
        }

        // Blind overwrite: We do NOT need old viewPassword!
        let finalContent = content;
        if (newViewPassword && newViewPassword.trim()) {
          newViewPasswordBytes = new TextEncoder().encode(newViewPassword);
          finalContent = await encryptContent(content, newViewPassword.trim());
        }

        const updates: Partial<DocumentData> = {
          content: finalContent,
          updatedAt: new Date().toISOString(),
        };
        if (title !== undefined) updates.name = title.trim();
        if (type !== undefined) updates.type = type;

        await updateDocumentFields(env, id, updates);

        const viewUrl = `${baseUrl}/view/${id}`;
        const rawUrl = `${baseUrl}/raw/${id}`;

        return {
          content: [
            {
              type: "text",
              text: `Document '${id}' successfully updated / overwritten!\n- View URL: ${viewUrl}\n- Raw URL: ${rawUrl}\n- Encrypted: ${finalContent.startsWith("ENC:") ? "Yes" : "No"}`,
            },
          ],
          isError: false,
        };
      } finally {
        scrubBuffer(editPasswordBytes);
        scrubBuffer(newViewPasswordBytes);
      }
    }

    case "delete_document": {
      let editPasswordBytes: Uint8Array | null = null;
      try {
        const { id, editPassword } = args;
        const doc = await getDocument(env, id);

        if (!doc) {
          return { content: [{ type: "text", text: `Error: Document '${id}' not found.` }], isError: true };
        }

        if (!doc.passkeyHash && !doc.editPasswordHash) {
          return { content: [{ type: "text", text: `Error: Document '${id}' is immutable and cannot be deleted.` }], isError: true };
        }

        editPasswordBytes = new TextEncoder().encode(editPassword);
        const isAuth = await verifyPasskey(editPassword, doc.editPasswordHash || doc.passkeyHash!, doc.editPasswordSalt);
        if (!isAuth) {
          return { content: [{ type: "text", text: `Error: Unauthorized. Incorrect editPassword.` }], isError: true };
        }

        await deleteDocument(env, id);
        return {
          content: [{ type: "text", text: `Document '${id}' has been permanently deleted from DocShowcase.` }],
          isError: false,
        };
      } finally {
        scrubBuffer(editPasswordBytes);
      }
    }

    case "get_document_info": {
      const doc = await getDocument(env, args.id);
      if (!doc) {
        return { content: [{ type: "text", text: `Error: Document '${args.id}' not found.` }], isError: true };
      }

      const info = [
        `### Document Info: ${doc.name || args.id}`,
        `- **ID:** \`${doc.id}\``,
        `- **Type:** \`${doc.type}\``,
        `- **Views:** ${doc.views || 0}`,
        `- **Is Encrypted:** ${doc.content.startsWith("ENC:") ? "Yes" : "No"}`,
        `- **Is Editable:** ${Boolean(doc.passkeyHash || doc.editPasswordHash) ? "Yes" : "No"}`,
        `- **Self-Destruct (Burn):** ${doc.burnAfterReading ? "Yes" : "No"}`,
        doc.expiresAt ? `- **Expires At:** ${JSON.stringify(doc.expiresAt)}` : `- **Expires:** Never`,
        `- **Created At:** ${JSON.stringify(doc.createdAt)}`,
        `- **Updated At:** ${JSON.stringify(doc.updatedAt)}`,
      ].join("\n");

      return {
        content: [{ type: "text", text: info }],
        isError: false,
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
}

/**
 * Handle MCP JSON-RPC 2.0 requests
 */
export async function handleMcpRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const method = request.method.toUpperCase();

  // Handle GET /mcp for Discovery and Server-Sent Events (SSE)
  if (method === "GET") {
    const acceptHeader = request.headers.get("Accept") || "";

    if (acceptHeader.includes("text/event-stream")) {
      // SSE Streamable endpoint
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      // Send initial endpoint event
      const endpointData = JSON.stringify({
        endpoint: "/mcp",
        capabilities: { tools: { listChanged: false } },
      });
      writer.write(encoder.encode(`event: endpoint\ndata: ${endpointData}\n\n`));

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // JSON info for Discovery
    return new Response(
      JSON.stringify({
        name: "docshowcase-mcp",
        version: "1.0.0",
        description: "Zero-Trust Remote Model Context Protocol Server for DocShowcase",
        protocol: "mcp/1.0",
        endpoint: "/mcp",
        tools: MCP_TOOLS.map((t) => ({ name: t.name, description: t.description })),
      }),
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // MCP JSON-RPC 2.0 via POST
  if (method === "POST") {
    let rpcRequest: JsonRpcRequest;
    try {
      rpcRequest = (await request.json()) as JsonRpcRequest;
    } catch {
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: { code: -32700, message: "Parse error: Invalid JSON" },
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const { id = null, method: rpcMethod, params } = rpcRequest;

    const rpcResponse = (result?: any, error?: any): Response => {
      const body: JsonRpcResponse = {
        jsonrpc: "2.0",
        id,
      };
      if (error) body.error = error;
      else body.result = result ?? {};

      return new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    };

    // Protocol Handlers
    switch (rpcMethod) {
      case "initialize":
        return rpcResponse({
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: { listChanged: false },
          },
          serverInfo: {
            name: "docshowcase-mcp",
            version: "1.0.0",
          },
        });

      case "notifications/initialized":
        return new Response(null, {
          status: 204,
          headers: { "Access-Control-Allow-Origin": "*" },
        });

      case "ping":
        return rpcResponse({});

      case "tools/list":
        return rpcResponse({ tools: MCP_TOOLS });

      case "tools/call": {
        if (!params || !params.name) {
          return rpcResponse(undefined, {
            code: -32602,
            message: "Invalid params: missing tool name",
          });
        }
        try {
          const toolResult = await executeToolCall(
            params.name,
            params.arguments || {},
            env,
            request.url
          );
          return rpcResponse(toolResult);
        } catch (err: any) {
          return rpcResponse({
            content: [{ type: "text", text: `Error: ${err.message || "Internal tool execution error"}` }],
            isError: true,
          });
        }
      }

      default:
        return rpcResponse(undefined, {
          code: -32601,
          message: `Method not found: ${rpcMethod}`,
        });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
}
