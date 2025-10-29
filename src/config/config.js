/**
 * Central MCP server configuration
 * Uses environment variables when available, otherwise uses default values
 */

import dotenv from "dotenv";
dotenv.config();

export const SERVER_CONFIG = {
  name: "mcp-server-trading-indicators",
  version: "1.0.0",
  description: "MCP Server for Trading Indicators - Technical Analysis Tools",
  host: process.env.HOST || "0.0.0.0",
  port: parseInt(process.env.PORT) || 3000,
  logLevel: process.env.LOG_LEVEL || "info",
};

export const ENDPOINTS = {
  sse: "/sse",
  message: "/message",
  health: "/health",
  root: "/",
};

/**
 * MCP Session Configuration
 * Follows MCP specification revision 2025-06-18
 */
export const MCP_CONFIG = {
  // Session timeout: 5 minutes (increased from 60s for trading workflows)
  sessionTimeoutMs: parseInt(process.env.MCP_SESSION_TIMEOUT_MS) || 5 * 60 * 1000,

  // Cleanup interval: 30 seconds (reduced from 10s for better management)
  cleanupIntervalMs: parseInt(process.env.MCP_CLEANUP_INTERVAL_MS) || 30 * 1000,

  // Auto session recreation for backward compatibility (default: false for standard compliance)
  allowAutoSessionRecreate: process.env.ALLOW_AUTO_SESSION_RECREATE === 'true',

  // Tool execution timeout: 20 seconds
  toolExecutionTimeoutMs: parseInt(process.env.TOOL_EXECUTION_TIMEOUT_MS) || 20 * 1000,
};

/**
 * CORS configuration
 */
export const CORS_CONFIG = {
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Mcp-Session-Id'],
  exposedHeaders: ['Mcp-Session-Id'],
};
