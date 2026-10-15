/**
 * DocShowcase Cloudflare Worker
 * 1. Document CRUD, Auth-Verification, & Expiry Backend
 * 2. Multi-Asset Raw Delivery Engine (/raw/:id and /raw/:id/:filename)
 * 3. Zero-Trust Remote MCP Server (/mcp)
 * 4. Scheduled Cron Auto-Cleanup
 */

import { handleApiRequest } from "./routes/api";
import { handleMcpRequest } from "./routes/mcp";
import { handleRawRequest } from "./routes/raw";
import { handleScheduled } from "./scheduled";
import type { Env, ExecutionContext, ScheduledEvent } from "./types";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Global CORS Preflight
    if (request.method.toUpperCase() === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Password, Accept",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    try {
      // 1. Multi-Asset Raw Engine
      if (pathname.startsWith("/raw/")) {
        return await handleRawRequest(request, env, ctx, pathname);
      }

      // 2. Document CRUD, Auth & Expiry API
      if (pathname.startsWith("/api/")) {
        return await handleApiRequest(request, env, ctx, pathname);
      }

      // 3. Zero-Trust Remote MCP Server
      if (pathname === "/mcp" || pathname.startsWith("/mcp/")) {
        return await handleMcpRequest(request, env, ctx);
      }

      // 4. Health Check / Status
      if (pathname === "/" || pathname === "/health") {
        return new Response(
          JSON.stringify({
            status: "online",
            service: "DocShowcase Cloudflare Worker Backend",
            version: "2.0.0",
            features: [
              "Multi-Asset Raw Delivery (/raw/:id and /raw/:id/:filename)",
              "Document CRUD & Expiry Engine (/api/docs)",
              "Zero-Trust Remote MCP Server (/mcp)",
              "Automated Cron Expiry Cleanup",
            ],
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      return new Response("Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      });
    } catch (err: any) {
      // Never log sensitive data
      console.error("Worker unhandled error:", err?.message || err);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: err?.message || "An unexpected error occurred",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    await handleScheduled(event, env, ctx);
  },
};
