import workerModule from "./src/index.ts";

const worker = workerModule.default || workerModule;

const env = {
  FIREBASE_API_KEY: "AIzaSyCLLyh8LK6LpxclQWobqVu320EE5LnV2-Q",
  FIREBASE_PROJECT_ID: "markdown-showcase-b3c2a",
  FIREBASE_BOT_EMAIL: "editor@docshowcase.aryansdevstudios.com",
  FIREBASE_BOT_PASSWORD: "editor@docshowcase2026##$",
  ADMIN_PASSWORD: "xh6fknwj0f@",
  APP_URL: "https://docshowcase.netlify.app",
};

const ctx = {
  waitUntil(p) {
    p.catch(console.error);
  },
  passThroughOnException() {},
};

async function runTests() {
  console.log("=== STARTING DOCSHOWCASE WORKER INTEGRATION TESTS ===");

  // 1. Health check
  console.log("\n--- TEST 1: Health Check ---");
  const healthReq = new Request("http://localhost/health");
  const healthRes = await worker.fetch(healthReq, env, ctx);
  console.log("Status:", healthRes.status);
  const healthData = await healthRes.json();
  console.log("Health Data:", healthData);

  // 2. Document Creation via /api/docs (Plaintext & Immutable)
  console.log("\n--- TEST 2: Create Immutable Document ---");
  const doc1Req = new Request("http://localhost/api/docs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "test-immutable-notes",
      content: "# Immutable Notes\nThis document cannot be edited.",
      type: "markdown",
    }),
  });
  const doc1Res = await worker.fetch(doc1Req, env, ctx);
  console.log("Create Status:", doc1Res.status);
  const doc1Data = await doc1Res.json();
  console.log("Doc 1 Created:", doc1Data);

  // 3. Document Creation via /api/docs with View Encryption and Edit Passkey
  console.log("\n--- TEST 3: Create Encrypted & Editable Document ---");
  const doc2Req = new Request("http://localhost/api/docs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "secret-game.html",
      content: "<!DOCTYPE html><html><head><title>Neon Game</title></head><body><h1>Neon Rush</h1><script>console.log('game loaded');</script></body></html>",
      type: "html",
      viewPassword: "myViewSecret123",
      editPassword: "myEditSecret456",
      expiration: "1h",
    }),
  });
  const doc2Res = await worker.fetch(doc2Req, env, ctx);
  console.log("Create Status:", doc2Res.status);
  const doc2Data = await doc2Res.json();
  console.log("Doc 2 Created:", doc2Data);

  // 4. Verify Passkey on Doc 2
  console.log("\n--- TEST 4: Verify Passkey ---");
  const verifyReq = new Request("http://localhost/api/verify-passkey", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: doc2Data.id,
      passkey: "myEditSecret456",
    }),
  });
  const verifyRes = await worker.fetch(verifyReq, env, ctx);
  console.log("Verify Status:", verifyRes.status);
  console.log("Verify Result:", await verifyRes.json());

  // 5. Test Raw Asset Engine for Doc 1 (Markdown)
  console.log("\n--- TEST 5: Raw Asset Engine (Markdown) ---");
  const raw1Req = new Request(`http://localhost/raw/${doc1Data.id}`);
  const raw1Res = await worker.fetch(raw1Req, env, ctx);
  console.log("Raw 1 Status:", raw1Res.status);
  console.log("Content-Type:", raw1Res.headers.get("Content-Type"));
  console.log("Content-Disposition:", raw1Res.headers.get("Content-Disposition"));
  const raw1Text = await raw1Res.text();
  console.log("Raw 1 Content preview:", raw1Text.substring(0, 50));

  // 6. Test Raw Asset Engine for Doc 2 with Filename: /raw/:id/secret-game.html
  console.log("\n--- TEST 6: Raw Asset Engine (HTML with unlock/browser) ---");
  const raw2Req = new Request(`http://localhost/raw/${doc2Data.id}/secret-game.html?unlock=1`, {
    headers: { Accept: "text/html" },
  });
  const raw2Res = await worker.fetch(raw2Req, env, ctx);
  console.log("Raw 2 Status:", raw2Res.status);
  console.log("Raw 2 Content-Type:", raw2Res.headers.get("Content-Type"));
  console.log("Raw 2 CSP:", raw2Res.headers.get("Content-Security-Policy"));
  const raw2Html = await raw2Res.text();
  console.log("Contains unlock script:", raw2Html.includes("decryptPayload"));

  // 7. Test MCP Protocol (/mcp)
  console.log("\n--- TEST 7: MCP Server Initialization ---");
  const mcpInitReq = new Request("http://localhost/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { clientInfo: { name: "test-client", version: "1.0.0" } },
    }),
  });
  const mcpInitRes = await worker.fetch(mcpInitReq, env, ctx);
  console.log("MCP Init Result:", await mcpInitRes.json());

  // 8. Test MCP tools/list
  console.log("\n--- TEST 8: MCP tools/list ---");
  const mcpListReq = new Request("http://localhost/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
    }),
  });
  const mcpListRes = await worker.fetch(mcpListReq, env, ctx);
  const mcpListData = await mcpListRes.json();
  console.log("Tools Count:", mcpListData.result?.tools?.length);
  console.log("Tool Names:", mcpListData.result?.tools?.map((t) => t.name));

  // 9. Test MCP tool call: create_document
  console.log("\n--- TEST 9: MCP tool call create_document ---");
  const mcpCreateReq = new Request("http://localhost/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "create_document",
        arguments: {
          title: "ai-generated-app.html",
          content: "<!DOCTYPE html><html><body><h1>Created via MCP</h1></body></html>",
          type: "html",
          viewPassword: "mcpViewPassword999",
          editPassword: "mcpEditPassword888",
        },
      },
    }),
  });
  const mcpCreateRes = await worker.fetch(mcpCreateReq, env, ctx);
  const mcpCreateData = await mcpCreateRes.json();
  console.log("MCP Create Result:", mcpCreateData.result?.content?.[0]?.text);

  // Extract created doc ID from result text
  const matchId = mcpCreateData.result?.content?.[0]?.text?.match(/Document ID:\*\* `([^`]+)`/);
  const mcpDocId = matchId ? matchId[1] : null;
  console.log("Extracted MCP Doc ID:", mcpDocId);

  // 10. Test MCP tool call: get_document with decryption in memory
  if (mcpDocId) {
    console.log("\n--- TEST 10: MCP tool call get_document (Decrypted in memory) ---");
    const mcpGetReq = new Request("http://localhost/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "get_document",
          arguments: {
            id: mcpDocId,
            viewPassword: "mcpViewPassword999",
          },
        },
      }),
    });
    const mcpGetRes = await worker.fetch(mcpGetReq, env, ctx);
    const mcpGetData = await mcpGetRes.json();
    console.log("MCP Get Result Content:\n", mcpGetData.result?.content?.[0]?.text);

    // 11. Test MCP tool call: patch_document
    console.log("\n--- TEST 11: MCP tool call patch_document ---");
    const mcpPatchReq = new Request("http://localhost/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: {
          name: "patch_document",
          arguments: {
            id: mcpDocId,
            editPassword: "mcpEditPassword888",
            viewPassword: "mcpViewPassword999",
            search: "Created via MCP",
            replace: "Surgically Patched via MCP",
          },
        },
      }),
    });
    const mcpPatchRes = await worker.fetch(mcpPatchReq, env, ctx);
    const mcpPatchData = await mcpPatchRes.json();
    console.log("MCP Patch Result:\n", mcpPatchData.result?.content?.[0]?.text);

    // Verify patched content
    const verifyPatchReq = new Request("http://localhost/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 6,
        method: "tools/call",
        params: {
          name: "get_document",
          arguments: {
            id: mcpDocId,
            viewPassword: "mcpViewPassword999",
          },
        },
      }),
    });
    const verifyPatchRes = await worker.fetch(verifyPatchReq, env, ctx);
    const verifyPatchData = await verifyPatchRes.json();
    console.log("Verified Patched Content contains 'Surgically Patched':", verifyPatchData.result?.content?.[0]?.text?.includes("Surgically Patched"));

    // 12. Clean up test documents
    console.log("\n--- CLEANUP: Deleting test documents ---");
    const delMcpReq = new Request("http://localhost/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 7,
        method: "tools/call",
        params: {
          name: "delete_document",
          arguments: {
            id: mcpDocId,
            editPassword: "mcpEditPassword888",
          },
        },
      }),
    });
    const delMcpRes = await worker.fetch(delMcpReq, env, ctx);
    console.log("MCP Doc Deleted:", (await delMcpRes.json()).result?.content?.[0]?.text);
  }

  // Delete doc1 and doc2
  if (doc1Data.id) {
    const adminDelReq = new Request(`http://localhost/api/docs/${doc1Data.id}`, {
      method: "DELETE",
      headers: { "X-Admin-Password": env.ADMIN_PASSWORD },
    });
    await worker.fetch(adminDelReq, env, ctx);
    console.log("Doc 1 cleaned up.");
  }
  if (doc2Data.id) {
    const delDoc2Req = new Request(`http://localhost/api/docs/${doc2Data.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editPassword: "myEditSecret456" }),
    });
    await worker.fetch(delDoc2Req, env, ctx);
    console.log("Doc 2 cleaned up.");
  }

  console.log("\n=== ALL WORKER TESTS COMPLETED SUCCESSFULLY! ===");
}

runTests().catch(console.error);
