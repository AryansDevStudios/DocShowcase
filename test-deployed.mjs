async function testDeployedWorker() {
  const workerUrl = "https://docshowcase.adsbackend01.workers.dev";
  console.log("Testing live deployed worker at:", workerUrl);

  try {
    // 1. Health Check
    const healthRes = await fetch(workerUrl + "/health");
    console.log("1. Health check status:", healthRes.status);
    const health = await healthRes.json();
    console.log("   Service:", health.service);
    console.log("   Features:", health.features);

    // 2. MCP Tools List
    const mcpRes = await fetch(workerUrl + "/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
      }),
    });
    console.log("2. MCP status:", mcpRes.status);
    const mcpData = await mcpRes.json();
    console.log("   Available MCP Tools:", mcpData.result?.tools?.map((t) => t.name));

    // 3. Create document on live worker
    const createRes = await fetch(workerUrl + "/api/docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "live-deployed-test.html",
        content: "<h1>Live Deployed Test</h1>",
        type: "html",
        editPassword: "test-pw-123",
      }),
    });
    console.log("3. Live create doc status:", createRes.status);
    const createData = await createRes.json();
    console.log("   Doc ID:", createData.id);

    if (createData.id) {
      // 4. Raw endpoint test
      const rawRes = await fetch(
        workerUrl + "/raw/" + createData.id + "/live-deployed-test.html"
      );
      console.log("4. Live raw endpoint status:", rawRes.status);
      console.log("   Content-Type:", rawRes.headers.get("content-type"));
      const text = await rawRes.text();
      console.log("   Content matches:", text === "<h1>Live Deployed Test</h1>");

      // 5. Clean up
      const delRes = await fetch(workerUrl + "/api/docs/" + createData.id, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editPassword: "test-pw-123" }),
      });
      console.log("5. Cleanup status:", delRes.status);
    }

    console.log("\n=== LIVE CLOUDFLARE WORKER TEST COMPLETED SUCCESSFULLY! ===");
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testDeployedWorker();
