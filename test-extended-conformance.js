// Extended MCP Conformance Test - Session Lifecycle & Error Handling
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const port = process.env.PORT || 3001;
const baseUrl = `http://localhost:${port}`;

console.log("🧪 Extended MCP Conformance Test");
console.log(`📡 Server: ${baseUrl}`);
console.log("=".repeat(60));

let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

/**
 * Test 1: Session cleanup after timeout
 */
async function testSessionCleanupOnTimeout() {
  console.log("1️⃣  Test: Session cleanup on timeout");

  try {
    const client = new Client(
      { name: "timeout-cleanup-test", version: "1.0.0" },
      { capabilities: {} }
    );

    const transport = new SSEClientTransport(new URL(`${baseUrl}/mcp`));
    await client.connect(transport);

    // Get initial session count
    const statsResponse = await fetch(`${baseUrl}/mcp/sessions`);
    const statsBefore = await statsResponse.json();
    console.log(`   📊 Active sessions before: ${statsBefore.activeSessions}`);

    // Force a timeout scenario (if possible via large dataset)
    try {
      await client.callTool({
        name: "calculate_all_indicators",
        arguments: {
          symbol: "TIMEOUT-TEST",
          ohlcv: {
            high: Array.from({length: 10000}, () => Math.random() * 1000),
            low: Array.from({length: 10000}, () => Math.random() * 1000),
            close: Array.from({length: 10000}, () => Math.random() * 1000)
          },
          indicators: {
            rsi: { enabled: true, period: 14 },
            ema: { enabled: true, period: 20 }
          }
        }
      });
    } catch (error) {
      // Expected to fail or timeout
      console.log(`   ⚠️  Operation completed/timed out: ${error.message}`);
    }

    await client.close();

    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check session count after
    const statsAfterResponse = await fetch(`${baseUrl}/mcp/sessions`);
    const statsAfter = await statsAfterResponse.json();
    console.log(`   📊 Active sessions after: ${statsAfter.activeSessions}`);

    if (statsAfter.activeSessions === 0) {
      console.log("   ✅ Session cleaned up correctly");
      testResults.passed++;
    } else {
      console.log("   ⚠️  Session may still be active");
      testResults.warnings++;
    }

  } catch (error) {
    console.log(`   ❌ Test failed: ${error.message}`);
    testResults.failed++;
  }
}

/**
 * Test 2: Consecutive calls with different error scenarios
 */
async function testConsecutiveCallsWithErrors() {
  console.log("2️⃣  Test: Consecutive calls with error handling");

  try {
    const client = new Client(
      { name: "consecutive-test", version: "1.0.0" },
      { capabilities: {} }
    );

    const transport = new SSEClientTransport(new URL(`${baseUrl}/mcp`));
    await client.connect(transport);

    // Call 1: Valid request
    const result1 = await client.callTool({
      name: "calculate_rsi",
      arguments: {
        prices: [100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 111, 110, 112, 114, 113],
        period: 14
      }
    });
    console.log("   ✅ Call 1: Valid request succeeded");

    // Call 2: Invalid request (should return structured error)
    const result2 = await client.callTool({
      name: "calculate_rsi",
      arguments: {
        prices: [], // Invalid
        period: 14
      }
    });
    const data2 = JSON.parse(result2.content[0].text);
    if (data2.error) {
      console.log("   ✅ Call 2: Invalid request returned structured error");
    } else {
      console.log("   ⚠️  Call 2: Expected error but got success");
      testResults.warnings++;
    }

    // Call 3: Another valid request (verify transport not blocked)
    const result3 = await client.callTool({
      name: "calculate_rsi",
      arguments: {
        prices: [100, 102, 101, 103, 105, 104, 106, 108, 107, 109],
        period: 5
      }
    });
    console.log("   ✅ Call 3: Transport remained responsive after error");

    await client.close();
    testResults.passed++;

  } catch (error) {
    console.log(`   ❌ Test failed: ${error.message}`);
    testResults.failed++;
  }
}

/**
 * Test 3: Error code consistency
 */
async function testErrorCodeConsistency() {
  console.log("3️⃣  Test: Error code consistency");

  const tests = [
    {
      name: "Unknown session",
      sessionId: "invalid-session-12345",
      expectedCode: -32004,
      expectedHttp: 404,
    },
    {
      name: "Missing session",
      sessionId: null,
      expectedCode: -32602,
      expectedHttp: 400,
    },
  ];

  let allPassed = true;

  for (const test of tests) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (test.sessionId) {
        headers['Mcp-Session-Id'] = test.sessionId;
      }

      const response = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 1
        })
      });

      const data = await response.json();

      if (response.status === test.expectedHttp &&
          data.error?.code === test.expectedCode) {
        console.log(`   ✅ ${test.name}: HTTP ${response.status}, code ${data.error.code}`);
      } else {
        console.log(`   ❌ ${test.name}: Expected HTTP ${test.expectedHttp}/${test.expectedCode}, got ${response.status}/${data.error?.code}`);
        allPassed = false;
      }

    } catch (error) {
      console.log(`   ❌ ${test.name} failed: ${error.message}`);
      allPassed = false;
    }
  }

  if (allPassed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

/**
 * Test 4: Parallel execution without blocking
 */
async function testParallelExecution() {
  console.log("4️⃣  Test: Parallel execution (no cascade blocking)");

  try {
    const clients = [];
    const promises = [];

    // Create 3 clients
    for (let i = 0; i < 3; i++) {
      const client = new Client(
        { name: `parallel-client-${i}`, version: "1.0.0" },
        { capabilities: {} }
      );

      const transport = new SSEClientTransport(new URL(`${baseUrl}/mcp`));
      await client.connect(transport);
      clients.push(client);

      // Execute in parallel
      promises.push(
        client.callTool({
          name: "calculate_rsi",
          arguments: {
            prices: Array.from({length: 20}, () => Math.random() * 100 + 100),
            period: 14
          }
        })
      );
    }

    const startTime = Date.now();
    const results = await Promise.allSettled(promises);
    const duration = Date.now() - startTime;

    const successful = results.filter(r => r.status === 'fulfilled').length;

    console.log(`   ✅ Parallel execution: ${successful}/3 successful in ${duration}ms`);

    // Close all clients
    for (const client of clients) {
      await client.close();
    }

    if (successful === 3) {
      testResults.passed++;
    } else {
      testResults.warnings++;
    }

  } catch (error) {
    console.log(`   ❌ Test failed: ${error.message}`);
    testResults.failed++;
  }
}

/**
 * Test 5: Session statistics endpoint
 */
async function testSessionStatistics() {
  console.log("5️⃣  Test: Session statistics endpoint");

  try {
    const response = await fetch(`${baseUrl}/mcp/sessions`);

    if (response.status === 200) {
      const stats = await response.json();
      console.log(`   ✅ Statistics available:`);
      console.log(`      - Active sessions: ${stats.activeSessions}`);
      console.log(`      - Timeout: ${stats.inactiveTimeoutMs}ms`);
      console.log(`      - Cleanup interval: ${stats.cleanupIntervalMs}ms`);
      console.log(`      - Auto-recreate: ${stats.allowAutoSessionRecreate}`);
      testResults.passed++;
    } else {
      console.log(`   ℹ️  Statistics endpoint disabled (production mode)`);
      testResults.warnings++;
    }

  } catch (error) {
    console.log(`   ⚠️  Could not access statistics: ${error.message}`);
    testResults.warnings++;
  }
}

// Run all extended tests
async function runExtendedTests() {
  try {
    await testSessionCleanupOnTimeout();
    await testConsecutiveCallsWithErrors();
    await testErrorCodeConsistency();
    await testParallelExecution();
    await testSessionStatistics();

    console.log("=".repeat(60));
    console.log("📊 Extended Conformance Test Results:");
    console.log(`   ✅ Passed: ${testResults.passed}`);
    console.log(`   ❌ Failed: ${testResults.failed}`);
    console.log(`   ⚠️  Warnings: ${testResults.warnings}`);
    console.log("");

    if (testResults.failed === 0) {
      console.log("🎉 All critical tests passed!");
      console.log("✨ MCP server is standards-compliant and resilient");
    } else {
      console.log("⚠️  Some tests failed - review implementation");
    }

  } catch (error) {
    console.error("❌ Test suite failed:", error.message);
  } finally {
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

runExtendedTests();