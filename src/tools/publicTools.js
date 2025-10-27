/**
 * Public tools - Do not require authentication
 * These tools can be used without authentication
 */

import { tradingIndicatorsDefinitions, tradingIndicatorsHandlers } from './tradingIndicators.js';

/**
 * Public tools definitions for MCP
 */
export const publicToolsDefinitions = [
  {
    name: "get_server_info",
    description: "Get server information including version, uptime, available trading indicators, and system stats",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  // Include all trading indicators as public tools
  ...tradingIndicatorsDefinitions,
];

/**
 * Public tools handlers
 */
export const publicToolsHandlers = {
  /**
   * Get server information
   */
  get_server_info: async (args) => {
    const serverInfo = {
      name: "MCP Trading Indicators Server",
      version: "1.0.0",
      description: "Specialized MCP Server for Trading Technical Analysis Indicators",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      memory: process.memoryUsage(),
      tradingIndicators: {
        total: tradingIndicatorsDefinitions.length,
        available: tradingIndicatorsDefinitions.map(ind => ind.name)
      }
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(serverInfo, null, 2),
        },
      ],
    };
  },

  // Include all trading indicators handlers
  ...tradingIndicatorsHandlers,
};