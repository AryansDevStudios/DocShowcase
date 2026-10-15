async function runComprehensiveTests() {
  const workerUrl = 'https://docshowcase.adsbackend01.workers.dev';
  const netlifyUrl = 'https://docshowcase.netlify.app';
  console.log('====================================================');
  console.log('🚀 DOCSHOWCASE COMPREHENSIVE LIVE PRODUCTION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log('  ✅ [PASS]', name, details ? '(' + details + ')' : '');
      passed++;
    } else {
      console.error('  ❌ [FAIL]', name, details ? '(' + details + ')' : '');
      failed++;
    }
  }

  // --- SUITE 1: HEALTH & CORS ---
  console.log('--- 1. WORKER HEALTH & CORS ---');
  try {
    const res = await fetch(workerUrl + '/health');
    assert('Health Status 200', res.status === 200);
    const data = await res.json();
    assert('Service Identity', data.service === 'DocShowcase Cloudflare Worker Backend');
    assert('CORS Header (*)', res.headers.get('access-control-allow-origin') === '*');
  } catch (e) {
    assert('Health check reachable', false, e.message);
  }

  // --- SUITE 2: MCP PROTOCOL & TOOLS ---
  console.log('\n--- 2. REMOTE MCP SERVER (JSON-RPC 2.0) ---');
  let mcpDocId = '';
  try {
    // 2a. tools/list
    const listRes = await fetch(workerUrl + '/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
    });
    const listData = await listRes.json();
    assert('MCP tools/list 200 OK', listRes.status === 200);
    const toolNames = (listData.result?.tools || []).map(t => t.name);
    assert('MCP has all 6 tools', toolNames.length === 6, toolNames.join(', '));

    // 2b. tools/call -> create_document
    const createCall = await fetch(workerUrl + '/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'create_document',
          arguments: {
            title: 'mcp-test-doc.html',
            content: '<h1>Hello MCP</h1><p id="score">10</p>',
            type: 'html',
            editPassword: 'mcp-secret-pass'
          }
        }
      })
    });
    const createCallData = await createCall.json();
    const textOut = createCallData.result?.content?.[0]?.text || '';
    const match = textOut.match(/- \*\*Document ID:\*\* `([^`]+)`/);
    mcpDocId = match ? match[1] : '';
    assert('MCP create_document success', !createCallData.result?.isError && Boolean(mcpDocId), 'ID: ' + mcpDocId);

    // 2c. tools/call -> patch_document (surgical token-saving edit)
    if (mcpDocId) {
      const patchCall = await fetch(workerUrl + '/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: {
            name: 'patch_document',
            arguments: {
              id: mcpDocId,
              editPassword: 'mcp-secret-pass',
              search: '<p id="score">10</p>',
              replace: '<p id="score">999</p>'
            }
          }
        })
      });
      const patchData = await patchCall.json();
      assert('MCP patch_document success', !patchData.result?.isError);

      // 2d. tools/call -> get_document
      const getCall = await fetch(workerUrl + '/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 4,
          method: 'tools/call',
          params: {
            name: 'get_document',
            arguments: { id: mcpDocId }
          }
        })
      });
      const getData = await getCall.json();
      const getDocText = getData.result?.content?.[0]?.text || '';
      assert('MCP get_document content verified', getDocText.includes('<p id="score">999</p>'));

      // 2e. tools/call -> delete_document
      const delCall = await fetch(workerUrl + '/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 5,
          method: 'tools/call',
          params: {
            name: 'delete_document',
            arguments: { id: mcpDocId, editPassword: 'mcp-secret-pass' }
          }
        })
      });
      const delData = await delCall.json();
      assert('MCP delete_document success', !delData.result?.isError);
    }
  } catch (e) {
    assert('MCP protocol suite', false, e.message);
  }

  // --- SUITE 3: RAW MULTI-ASSET & PERMISSIVE CSP ---
  console.log('\n--- 3. RAW ASSET DELIVERY & CSP ---');
  let rawDocId = '';
  try {
    const res = await fetch(workerUrl + '/api/docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'game-canvas.html',
        content: '<!DOCTYPE html><html><head><title>Canvas Game</title></head><body><canvas id="cv"></canvas><script>console.log("Game engine active");</script></body></html>',
        type: 'html',
        editPassword: 'canvas-pw'
      })
    });
    const docData = await res.json();
    rawDocId = docData.id;
    assert('HTML Doc created', res.status === 201 && Boolean(rawDocId), 'ID: ' + rawDocId);

    if (rawDocId) {
      const rawRes = await fetch(workerUrl + '/raw/' + rawDocId + '/game-canvas.html');
      assert('Raw asset status 200', rawRes.status === 200);
      assert('MIME text/html', rawRes.headers.get('content-type')?.includes('text/html'));
      const csp = rawRes.headers.get('content-security-policy') || '';
      assert('Permissive CSP unsafe-inline & eval', csp.includes("'unsafe-inline'") && csp.includes("'unsafe-eval'"));
      assert('Permissive CSP connect-src *', csp.includes('connect-src *'));
      assert('CORP cross-origin', rawRes.headers.get('cross-origin-resource-policy') === 'cross-origin');

      // Cleanup
      await fetch(workerUrl + '/api/docs/' + rawDocId, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editPassword: 'canvas-pw' })
      });
    }
  } catch (e) {
    assert('Raw delivery suite', false, e.message);
  }

  // --- SUITE 4: END-TO-END ENCRYPTION (AES-256-GCM) ---
  console.log('\n--- 4. END-TO-END ENCRYPTION (AES-256-GCM) ---');
  let encDocId = '';
  try {
    const encRes = await fetch(workerUrl + '/api/docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'top-secret.md',
        content: '# Classified Information: 42',
        type: 'markdown',
        viewPassword: 'my-strong-view-key',
        editPassword: 'edit-secret-key'
      })
    });
    const encData = await encRes.json();
    encDocId = encData.id;
    assert('Encrypted Doc created', encRes.status === 201 && Boolean(encDocId), 'ID: ' + encDocId);

    if (encDocId) {
      // Direct raw fetch should return ciphertext beginning with ENC:
      const rawEnc = await fetch(workerUrl + '/raw/' + encDocId);
      const rawText = await rawEnc.text();
      assert('Raw storage is ciphertext (ENC: prefix)', rawText.startsWith('ENC:'));

      // Read via MCP get_document with correct password
      const getEnc = await fetch(workerUrl + '/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 6,
          method: 'tools/call',
          params: {
            name: 'get_document',
            arguments: { id: encDocId, viewPassword: 'my-strong-view-key' }
          }
        })
      });
      const getEncData = await getEnc.json();
      const getEncText = getEncData.result?.content?.[0]?.text || '';
      assert('Decrypted content matches plaintext', getEncText.includes('# Classified Information: 42'));

      // Cleanup
      await fetch(workerUrl + '/api/docs/' + encDocId, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editPassword: 'edit-secret-key' })
      });
    }
  } catch (e) {
    assert('Encryption suite', false, e.message);
  }

  // --- SUITE 5: BURN-AFTER-READING (SELF-DESTRUCT) ---
  console.log('\n--- 5. BURN-AFTER-READING (SELF-DESTRUCT) ---');
  let burnDocId = '';
  try {
    const burnCreate = await fetch(workerUrl + '/api/docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'burn-once.txt',
        content: 'This message will self-destruct upon reading.',
        type: 'custom',
        expiration: 'burn'
      })
    });
    const burnData = await burnCreate.json();
    burnDocId = burnData.id;
    assert('Burn-once doc created', burnCreate.status === 201 && Boolean(burnDocId), 'ID: ' + burnDocId);

    if (burnDocId) {
      // First read: should succeed
      const read1 = await fetch(workerUrl + '/api/docs/' + burnDocId);
      assert('First read status 200', read1.status === 200);
      const read1Data = await read1.json();
      assert('First read content received', read1Data.content === 'This message will self-destruct upon reading.');

      // Burn request: Frontend signals burn after displaying/decrypting
      const burnCall = await fetch(workerUrl + '/api/burn/' + burnDocId, { method: 'POST' });
      assert('Burn trigger returns 200 OK', burnCall.status === 200);

      // Second read: should fail with 404
      const read2 = await fetch(workerUrl + '/api/docs/' + burnDocId);
      assert('Second read status 404 (burned from database)', read2.status === 404);
    }
  } catch (e) {
    assert('Burn suite', false, e.message);
  }

  // --- SUITE 6: NETLIFY REDIRECTS & PROXY ---
  console.log('\n--- 6. NETLIFY PRODUCTION PROXY (/mcp) ---');
  try {
    const netlifyRes = await fetch(netlifyUrl + '/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 10, method: 'tools/list' })
    });
    assert('Netlify proxies /mcp to Worker (200)', netlifyRes.status === 200);
    const netlifyData = await netlifyRes.json();
    assert('Netlify receives MCP tools from Worker', (netlifyData.result?.tools?.length || 0) === 6);
  } catch (e) {
    assert('Netlify proxy reachability', false, e.message);
  }

  console.log('\n====================================================');
  console.log(`🏁 TEST SUITE SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================');
}

runComprehensiveTests();
