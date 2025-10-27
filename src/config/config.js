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
 * CORS configuration
 */
export const CORS_CONFIG = {
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
