/**
 * Shared MCP Configuration Module
 *
 * This module defines common configuration parameters that should be
 * consistent across all MCP servers (indicators, ccxt, etc.)
 *
 * Usage:
 *   import { MCP_STANDARD_CONFIG } from './mcp-shared-config.js';
 */

/**
 * MCP Standard Configuration (follows MCP spec 2025-06-18)
 * These values ensure consistency across all MCP server implementations
 */
export const MCP_STANDARD_CONFIG = {
  // Session Management
  session: {
    // Session timeout: 5 minutes (suitable for trading workflows)
    timeoutMs: 5 * 60 * 1000,

    // Cleanup interval: 30 seconds (balanced monitoring)
    cleanupIntervalMs: 30 * 1000,

    // Auto-recreate sessions: false (strict standard compliance)
    allowAutoRecreate: false,
  },

  // Timeout Management
  timeout: {
    // Tool execution timeout: 20 seconds (configurable per server)
    toolExecutionMs: 20 * 1000,

    // Individual operation timeout: 5 seconds (for fast operations)
    operationMs: 5 * 1000,

    // Sub-operation timeout: 1 second (for atomic operations)
    atomicOperationMs: 1 * 1000,
  },

  // Error Codes (MCP standard compliant)
  errorCodes: {
    // Invalid request parameters
    invalidParams: -32602,

    // Session not found
    sessionNotFound: -32004,

    // Generic bad request
    badRequest: -32000,

    // Internal server error
    internalError: -32603,

    // Method not found
    methodNotFound: -32601,
  },

  // HTTP Status Codes
  httpStatus: {
    // Session not found
    sessionNotFound: 404,

    // Missing or invalid parameters
    badRequest: 400,

    // Internal server error
    internalError: 500,

    // Success
    ok: 200,
  },
};

/**
 * Get environment-specific configuration
 * Merges standard config with environment overrides
 */
export function getMCPConfig(overrides = {}) {
  return {
    session: {
      timeoutMs: parseInt(process.env.MCP_SESSION_TIMEOUT_MS) ||
        overrides.sessionTimeoutMs ||
        MCP_STANDARD_CONFIG.session.timeoutMs,

      cleanupIntervalMs: parseInt(process.env.MCP_CLEANUP_INTERVAL_MS) ||
        overrides.cleanupIntervalMs ||
        MCP_STANDARD_CONFIG.session.cleanupIntervalMs,

      allowAutoRecreate: process.env.ALLOW_AUTO_SESSION_RECREATE === 'true' ||
        overrides.allowAutoSessionRecreate ||
        MCP_STANDARD_CONFIG.session.allowAutoRecreate,
    },

    timeout: {
      toolExecutionMs: parseInt(process.env.TOOL_EXECUTION_TIMEOUT_MS) ||
        overrides.toolExecutionTimeoutMs ||
        MCP_STANDARD_CONFIG.timeout.toolExecutionMs,

      operationMs: parseInt(process.env.OPERATION_TIMEOUT_MS) ||
        overrides.operationTimeoutMs ||
        MCP_STANDARD_CONFIG.timeout.operationMs,

      atomicOperationMs: parseInt(process.env.ATOMIC_OPERATION_TIMEOUT_MS) ||
        overrides.atomicOperationTimeoutMs ||
        MCP_STANDARD_CONFIG.timeout.atomicOperationMs,
    },

    errorCodes: MCP_STANDARD_CONFIG.errorCodes,
    httpStatus: MCP_STANDARD_CONFIG.httpStatus,
  };
}

/**
 * Validate configuration consistency
 * Ensures timeouts are properly ordered
 */
export function validateMCPConfig(config) {
  const errors = [];

  if (config.timeout.atomicOperationMs >= config.timeout.operationMs) {
    errors.push('Atomic operation timeout must be less than operation timeout');
  }

  if (config.timeout.operationMs >= config.timeout.toolExecutionMs) {
    errors.push('Operation timeout must be less than tool execution timeout');
  }

  if (config.timeout.toolExecutionMs >= config.session.timeoutMs) {
    errors.push('Tool execution timeout must be less than session timeout');
  }

  if (config.session.cleanupIntervalMs >= config.session.timeoutMs) {
    errors.push('Cleanup interval must be less than session timeout');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Export for easy import
export default {
  MCP_STANDARD_CONFIG,
  getMCPConfig,
  validateMCPConfig,
};