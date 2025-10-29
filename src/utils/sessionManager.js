/**
 * MCP Session Manager - Standard Compliant Session Management
 * Implements MCP specification revision 2025-06-18
 */

import { randomUUID } from "crypto";

/**
 * Session Manager class for MCP compliant session handling
 */
export class MCPSessionManager {
  constructor(options = {}) {
    this.transports = new Map();
    this.sessionMetadata = new Map();
    this.sessionServers = new Map();

    // Configuration with environment variables support
    this.inactiveTimeoutMs = options.inactiveTimeoutMs ||
      parseInt(process.env.MCP_SESSION_TIMEOUT_MS) ||
      5 * 60 * 1000; // 5 minutes default

    this.cleanupIntervalMs = options.cleanupIntervalMs ||
      parseInt(process.env.MCP_CLEANUP_INTERVAL_MS) ||
      30 * 1000; // 30 seconds default

    this.allowAutoSessionRecreate = options.allowAutoSessionRecreate ||
      process.env.ALLOW_AUTO_SESSION_RECREATE === 'true' ||
      false; // Default: strict standard compliance

    this.startCleanupTimer();
  }

  /**
   * Check if a session exists
   * @param {string} sessionId - Session ID to check
   * @returns {boolean} True if session exists
   */
  hasSession(sessionId) {
    return this.transports.has(sessionId);
  }

  /**
   * Get transport for a session
   * @param {string} sessionId - Session ID
   * @returns {object|null} Transport object or null if not found
   */
  getTransport(sessionId) {
    return this.transports.get(sessionId) || null;
  }

  /**
   * Get MCP server instance for a session
   * @param {string} sessionId - Session ID
   * @returns {object|null} MCP server or null if not found
   */
  getServer(sessionId) {
    return this.sessionServers.get(sessionId) || null;
  }

  /**
   * Attach or replace the MCP server for a session
   * @param {string} sessionId - Session ID
   * @param {object} server - MCP server instance
   */
  setServer(sessionId, server) {
    if (!sessionId) {
      return;
    }

    if (server) {
      this.sessionServers.set(sessionId, server);
    } else {
      this.sessionServers.delete(sessionId);
    }
  }

  /**
   * Generate a new session ID
   * @returns {string} New session ID
   */
  generateSessionId() {
    return randomUUID();
  }

  /**
   * Register transport, server and metadata for a session
   * @param {object} options - Registration options
   * @param {string} options.sessionId - Session identifier
   * @param {object} options.transport - Transport object
   * @param {object} options.server - MCP server instance
   * @param {object} [options.metadata] - Session metadata
   */
  registerSession({ sessionId, transport, server, metadata = {} }) {
    if (!sessionId) {
      throw new Error('Session ID is required to register session');
    }

    if (transport) {
      this.transports.set(sessionId, transport);
    }

    if (server) {
      this.sessionServers.set(sessionId, server);
    }

    this.sessionMetadata.set(sessionId, {
      connectedAt: new Date(),
      lastActivity: new Date(),
      ...metadata
    });

    console.log(`✅ Session registered: ${sessionId}`);
  }

  /**
   * Create a new session with generated identifier
   * @param {object} transport - Transport object
   * @param {object} server - MCP server instance
   * @param {object} metadata - Session metadata
   * @returns {string} New session ID
   */
  createSession(transport, server, metadata = {}) {
    const sessionId = this.generateSessionId();
    this.registerSession({ sessionId, transport, server, metadata });
    return sessionId;
  }

  /**
   * Update session activity timestamp
   * @param {string} sessionId - Session ID
   */
  updateActivity(sessionId) {
    const metadata = this.sessionMetadata.get(sessionId);
    if (metadata) {
      metadata.lastActivity = new Date();
    }
  }

  /**
   * Remove a session
   * @param {string} sessionId - Session ID to remove
   */
  removeSession(sessionId) {
    const transport = this.transports.get(sessionId);
    if (transport) {
      try {
        if (typeof transport.close === 'function') {
          transport.close();
        }
      } catch (error) {
        console.error(`Error closing transport for session ${sessionId}:`, error.message);
      }
    }

    this.transports.delete(sessionId);
    const server = this.sessionServers.get(sessionId);
    if (server) {
      try {
        if (typeof server.close === 'function') {
          server.close();
        } else if (typeof server.dispose === 'function') {
          server.dispose();
        }
      } catch (error) {
        console.error(`Error closing server for session ${sessionId}:`, error.message);
      }
    }
    this.sessionServers.delete(sessionId);
    this.sessionMetadata.delete(sessionId);
    console.log(`🔌 Session removed: ${sessionId}`);
  }

  /**
   * Validate session for MCP request
   * @param {string} sessionId - Session ID from request
   * @param {string} method - Request method (for initialize detection)
   * @param {string} body - Request body (for initialize detection)
   * @returns {object} Validation result with status and message
   */
  validateSession(sessionId, method, body) {
    const isInitialize = method === 'POST' &&
      body &&
      typeof body === 'object' &&
      body.method === 'initialize';

    // Case 1: Initialize request - should not have existing session
    if (isInitialize) {
      if (sessionId && this.hasSession(sessionId)) {
        return {
          status: 'error',
          httpCode: 400,
          jsonRpcCode: -32602,
          message: 'Initialize called with existing session ID'
        };
      }
      return { status: 'create_new' };
    }

    // Case 2: Non-initialize request without session ID
    if (!sessionId) {
      return {
        status: 'error',
        httpCode: 400,
        jsonRpcCode: -32602,
        message: 'Session ID required (call initialize first)'
      };
    }

    // Case 3: Session ID provided but not found
    if (!this.hasSession(sessionId)) {
      if (this.allowAutoSessionRecreate) {
        console.log(`⚠️  Auto-recreating session ${sessionId} (compatibility mode)`);
        return { status: 'create_new' };
      } else {
        return {
          status: 'error',
          httpCode: 404,
          jsonRpcCode: -32004,
          message: 'Session not found'
        };
      }
    }

    // Case 4: Valid existing session
    return { status: 'use_existing' };
  }

  /**
   * Get session statistics
   * @returns {object} Session statistics
   */
  getStats() {
    return {
      activeSessions: this.transports.size,
      activeServers: this.sessionServers.size,
      inactiveTimeoutMs: this.inactiveTimeoutMs,
      cleanupIntervalMs: this.cleanupIntervalMs,
      allowAutoSessionRecreate: this.allowAutoSessionRecreate,
      sessions: Array.from(this.sessionMetadata.entries()).map(([id, meta]) => ({
        id,
        connectedAt: meta.connectedAt,
        lastActivity: meta.lastActivity,
        inactiveMs: new Date() - meta.lastActivity
      }))
    };
  }

  /**
   * Start the cleanup timer for inactive sessions
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupInactiveSessions();
    }, this.cleanupIntervalMs);
  }

  /**
   * Stop the cleanup timer
   */
  stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Clean up inactive sessions
   */
  cleanupInactiveSessions() {
    const now = new Date();
    const sessionsToRemove = [];

    for (const [sessionId, metadata] of this.sessionMetadata.entries()) {
      if (metadata && metadata.lastActivity) {
        const inactiveMs = now - metadata.lastActivity;
        if (inactiveMs > this.inactiveTimeoutMs) {
          sessionsToRemove.push(sessionId);
        }
      }
    }

    for (const sessionId of sessionsToRemove) {
      console.log(`⏰ Session timeout: ${sessionId} (inactive for ${Math.round((now - this.sessionMetadata.get(sessionId).lastActivity) / 1000)}s)`);
      this.removeSession(sessionId);
    }
  }

  /**
   * Shutdown the session manager
   */
  shutdown() {
    console.log('🛑 Shutting down MCP Session Manager...');

    this.stopCleanupTimer();

    // Close all active sessions
    for (const sessionId of this.transports.keys()) {
      this.removeSession(sessionId);
    }

    console.log('✅ MCP Session Manager shutdown complete');
  }
}

// Export singleton instance
export const mcpSessionManager = new MCPSessionManager();

// Graceful shutdown handling
process.on('SIGINT', () => mcpSessionManager.shutdown());
process.on('SIGTERM', () => mcpSessionManager.shutdown());