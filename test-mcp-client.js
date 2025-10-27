#!/usr/bin/env node

/**
 * MCP Client Test Script
 * Tests the MCP server template via SSE connection
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const SERVER_URL = process.env.MCP_SERVER_URL || "http://localhost:3000";

console.log("=".repeat(60));
console.log("🧪 MCP Trading Indicators Server Test");
console.log("=".repeat(60));
console.log(`📡 Connecting to: ${SERVER_URL}`);
console.log("");

async function testMCPServer() {
  try {
    // Create client
    console.log("1️⃣  Creating MCP client...");
    const client = new Client(
      {
        name: "test-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    // Create SSE transport
    console.log("2️⃣  Creating SSE transport...");
    const transport = new SSEClientTransport(
      new URL(`${SERVER_URL}/sse`),
      new URL(`${SERVER_URL}/message`)
    );

    // Connect to server
    console.log("3️⃣  Connecting to server...");
    await client.connect(transport);
    console.log("✅ Connected successfully!");
    console.log("");

    // List available tools
    console.log("4️⃣  Requesting list of tools...");
    const toolsResponse = await client.listTools();
    console.log(`✅ Received ${toolsResponse.tools.length} tools:`);
    console.log("");

    toolsResponse.tools.forEach((tool, index) => {
      console.log(`   ${index + 1}. ${tool.name}: ${tool.description}`);
    });
    console.log("");

    // Test get_server_info tool
    console.log("5️⃣  Testing get_server_info tool...");
    try {
      const infoResult = await client.callTool({
        name: "get_server_info",
        arguments: {}
      });
      console.log("✅ get_server_info result:");
      const serverInfo = JSON.parse(infoResult.content[0].text);
      console.log(`   Name: ${serverInfo.name}`);
      console.log(`   Version: ${serverInfo.version}`);
      console.log(`   Platform: ${serverInfo.platform}`);
      console.log(`   Node Version: ${serverInfo.nodeVersion}`);
      console.log(`   Uptime: ${Math.round(serverInfo.uptime)}s`);
      console.log(`   Trading Indicators: ${serverInfo.tradingIndicators.total}`);
    } catch (error) {
      console.error("❌ get_server_info failed:", error.message);
    }
    console.log("");

    // Test RSI indicator
    console.log("6️⃣  Testing RSI indicator...");
    try {
      const rsiResult = await client.callTool({
        name: "calculate_rsi",
        arguments: {
          prices: [100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 111, 110, 112, 114, 113],
          period: 14
        }
      });
      console.log("✅ RSI calculation result:");
      const rsiData = JSON.parse(rsiResult.content[0].text);
      console.log(`   Current RSI: ${rsiData.current.rsi}`);
      console.log(`   Signal: ${rsiData.current.signal}`);
    } catch (error) {
      console.error("❌ RSI calculation failed:", error.message);
    }
    console.log("");

    // Test invalid tool call
    console.log("7️⃣  Testing error handling with invalid tool...");
    try {
      await client.callTool({
        name: "nonexistent_tool",
        arguments: {}
      });
    } catch (error) {
      console.log("✅ Error handling works:", error.message);
    }
    console.log("");

    console.log("=".repeat(60));
    console.log("🎉 All tests completed!");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Stack:", error.stack);
  }
}

testMCPServer();
