// Quick test with optimized timeout settings
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const port = process.env.PORT || 3001;
const baseUrl = `http://localhost:${port}`;

console.log("�� Quick MCP Timeout Test");
console.log(`📡 Connecting to: ${baseUrl}`);

const client = new Client(
  { name: "test-client", version: "1.0.0" },
  { capabilities: {} }
);

const transport = new SSEClientTransport(new URL(`${baseUrl}/mcp`));

try {
  await client.connect(transport);
  console.log("✅ Connected successfully");

  // Test the optimized calculate_all_indicators
  const result = await client.callTool({
    name: "calculate_all_indicators",
    arguments: {
      symbol: "BTC/USDT",
      ohlcv: {
        high: [100, 110, 120, 115, 125, 130, 135, 140, 145, 150],
        low: [95, 105, 115, 110, 120, 125, 130, 135, 140, 145],
        close: [98, 108, 118, 113, 123, 128, 133, 138, 143, 148]
      },
      indicators: {
        rsi: { enabled: true, period: 5 },
        ema: { enabled: true, period: 5 },
        sma: { enabled: true, period: 5 }
      }
    }
  });

  console.log("✅ Calculate All executed in:", result.content[0].text.match(/"executionTime": (\d+)/)?.[1] || "N/A", "ms");
  console.log("🎉 No timeout errors!");

} catch (error) {
  console.error("❌ Error:", error.message);
  if (error.message.includes('timeout')) {
    console.error("💀 TIMEOUT STILL OCCURRING!");
  }
} finally {
  await client.close();
  process.exit(0);
}
