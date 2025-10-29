#!/usr/bin/env node

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import cors from "cors";
import net from "net";
import { createMCPServer, getServerStats } from "./src/mcpServer.js";
import { publicToolsHandlers } from "./src/tools/publicTools.js";
import { MCPSessionManager } from "./src/utils/sessionManager.js";
import {
  SERVER_CONFIG,
  CORS_CONFIG,
  MCP_CONFIG
} from "./src/config/config.js";

/**
 * Check if a port is available
 * @param {number} port - Port number to check
 * @param {string} host - Host to check (default: '0.0.0.0')
 * @returns {Promise<boolean>} - True if port is available
 */
function isPortAvailable(port, host = '0.0.0.0') {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen(port, host);
  });
}

/**
 * Find an available port starting from the preferred port
 * @param {number} preferredPort - Preferred port number
 * @param {string} host - Host to bind to
 * @param {number} maxAttempts - Maximum number of ports to try (default: 100)
 * @returns {Promise<number>} - Available port number
 */
async function findAvailablePort(preferredPort, host = '0.0.0.0', maxAttempts = 100) {
  console.log(`🔍 Checking port availability starting from ${preferredPort}...`);

  for (let i = 0; i < maxAttempts; i++) {
    const port = preferredPort + i;
    console.log(`   Checking port ${port}...`);

    const available = await isPortAvailable(port, host);
    if (available) {
      console.log(`✅ Port ${port} is available`);
      return port;
    } else {
      console.log(`❌ Port ${port} is in use`);
    }
  }
  throw new Error(`Could not find an available port after trying ${maxAttempts} ports starting from ${preferredPort}`);
}

const app = express();
const HOST = SERVER_CONFIG.host;
const PREFERRED_PORT = SERVER_CONFIG.port;

// Configure CORS with MCP headers
app.use(cors(CORS_CONFIG));
app.use(express.json());

const server = createMCPServer();

// Initialize MCP Session Manager with configuration
const sessionManager = new MCPSessionManager({
  inactiveTimeoutMs: MCP_CONFIG.sessionTimeoutMs,
  cleanupIntervalMs: MCP_CONFIG.cleanupIntervalMs,
  allowAutoSessionRecreate: MCP_CONFIG.allowAutoSessionRecreate
});

//=============================================================================
// REST API ENDPOINTS - Direct HTTP API access (non-MCP)
//=============================================================================

/**
 * Helper function to extract result from MCP tool handler response
 */
function extractResult(mcpResponse) {
  if (mcpResponse.isError) {
    const errorData = JSON.parse(mcpResponse.content[0].text);
    throw new Error(errorData.error);
  }
  return JSON.parse(mcpResponse.content[0].text);
}

// API: Get server info
app.get('/api/info', async (req, res) => {
  try {
    const result = await publicToolsHandlers.get_server_info({});
    res.json(extractResult(result));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Calculate all indicators
app.post('/api/indicators/all', async (req, res) => {
  try {
    const result = await publicToolsHandlers.calculate_all_indicators(req.body);
    res.json(extractResult(result));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API: Calculate RSI
app.post('/api/indicators/rsi', async (req, res) => {
  try {
    const result = await publicToolsHandlers.calculate_rsi(req.body);
    res.json(extractResult(result));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API: Calculate EMA
app.post('/api/indicators/ema', async (req, res) => {
  try {
    const result = await publicToolsHandlers.calculate_ema(req.body);
    res.json(extractResult(result));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API: Calculate SMA
app.post('/api/indicators/sma', async (req, res) => {
  try {
    const result = await publicToolsHandlers.calculate_sma(req.body);
    res.json(extractResult(result));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API: Calculate MACD
app.post('/api/indicators/macd', async (req, res) => {
  try {
    const result = await publicToolsHandlers.calculate_macd(req.body);
    res.json(extractResult(result));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API: Calculate Bollinger Bands
app.post('/api/indicators/bollinger', async (req, res) => {
  try {
    const result = await publicToolsHandlers.calculate_bollinger_bands(req.body);
    res.json(extractResult(result));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API: Calculate Stochastic
app.post('/api/indicators/stochastic', async (req, res) => {
  try {
    const result = await publicToolsHandlers.calculate_stochastic(req.body);
    res.json(extractResult(result));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// API: Calculate ATR
app.post('/api/indicators/atr', async (req, res) => {
  try {
    const result = await publicToolsHandlers.calculate_atr(req.body);
    res.json(extractResult(result));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Find available port and start server
async function startServer() {
  try {
    const PORT = await findAvailablePort(PREFERRED_PORT, HOST);

    if (PORT !== PREFERRED_PORT) {
      console.log(`⚠️  Port ${PREFERRED_PORT} is not available, using port ${PORT} instead`);
    }

    const serverInstance = app.listen(PORT, HOST, () => {
      console.log("=".repeat(60));
      console.log(`🚀 MCP Trading Indicators Server`);
      console.log("=".repeat(60));
      console.log(`🌐 MCP Endpoint:  http://${HOST}:${PORT}/mcp`);
      console.log(`📡 Protocol: Streamable HTTP (2025-03-26)`);
      console.log("");
      console.log(`🔌 REST API Endpoints:`);
      console.log(`   GET  /api/info                    - Server info`);
      console.log(`   POST /api/indicators/all          - All indicators`);
      console.log(`   POST /api/indicators/rsi          - RSI`);
      console.log(`   POST /api/indicators/ema          - EMA`);
      console.log(`   POST /api/indicators/sma          - SMA`);
      console.log(`   POST /api/indicators/macd         - MACD`);
      console.log(`   POST /api/indicators/bollinger    - Bollinger Bands`);
      console.log(`   POST /api/indicators/stochastic   - Stochastic`);
      console.log(`   POST /api/indicators/atr          - ATR`);
      console.log("");
      console.log(`📊 Trading Indicators: RSI, EMA, SMA, MACD, Bollinger Bands, Stochastic, ATR`);
      console.log("=".repeat(60));
    });

    // Handle server errors
    serverInstance.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is still in use. This shouldn't happen!`);
        console.error("   Trying to find another port...");
        startServer(); // Retry with a different port
      } else {
        console.error("❌ Server error:", err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

//=============================================================================
// MCP ENDPOINT - Standard Compliant Session Management (MCP 2025-06-18)
//=============================================================================
app.all('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];

  try {
    // Validate session according to MCP standard
    const validation = sessionManager.validateSession(sessionId, req.method, req.body);
    
    if (validation.status === 'error') {
      // Standard compliant error responses
      const response = {
        jsonrpc: '2.0',
        error: {
          code: validation.jsonRpcCode,
          message: validation.message
        },
        id: null
      };
      
      console.log(`❌ MCP Session Error: ${validation.message} (${validation.httpCode})`);
      res.status(validation.httpCode).json(response);
      return;
    }

    let transport;

    if (validation.status === 'use_existing') {
      // Use existing session
      transport = sessionManager.getTransport(sessionId);
      sessionManager.updateActivity(sessionId);
      
    } else if (validation.status === 'create_new') {
      // Create new session (for initialize or auto-recreate)
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => {
          // Generate session ID and store in session manager
          const newSessionId = sessionManager.createSession(transport, {
            clientIp: req.ip,
            userAgent: req.get('user-agent'),
            createdBy: req.body?.method === 'initialize' ? 'initialize' : 'auto-recreate'
          });
          
          // Set up session lifecycle handlers
          transport.onclose = () => {
            sessionManager.removeSession(newSessionId);
          };
          
          return newSessionId;
        }
      });

      // Connect server to transport
      await server.connect(transport);
    }

    // Handle the request through the transport
    await transport.handleRequest(req, res, req.body);
    
  } catch (error) {
    console.error('❌ MCP Error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error'
        },
        id: null
      });
    }
  }
});

// MCP Session Management Endpoint (for debugging/monitoring)
app.get('/mcp/sessions', (req, res) => {
  const isDev = process.env.NODE_ENV === 'development' || 
                process.env.ENABLE_SESSION_DEBUG === 'true' ||
                !process.env.NODE_ENV; // Default when NODE_ENV is not set
  
  if (isDev) {
    res.json(sessionManager.getStats());
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Start the server with automatic port selection
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  console.error('   Promise:', promise);
  // Don't exit the process, just log the error
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('   Stack:', error.stack);
  // Don't exit the process for non-critical errors
  if (error.code === 'EADDRINUSE' || error.code === 'ECONNRESET') {
    console.log('   Non-critical error, continuing...');
  }
});

// Graceful shutdown with session cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  sessionManager.shutdown();
  console.log('✅ Shutdown complete');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  sessionManager.shutdown();
  console.log('✅ Shutdown complete');
  process.exit(0);
});
