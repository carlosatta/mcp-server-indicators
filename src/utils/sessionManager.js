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
   * Create a new session
   * @param {object} transport - Transport object
   * @param {object} metadata - Session metadata
   * @returns {string} New session ID
   */
  createSession(transport, metadata = {}) {
    const sessionId = randomUUID();
    
    this.transports.set(sessionId, transport);
    this.sessionMetadata.set(sessionId, {
      connectedAt: new Date(),
      lastActivity: new Date(),
      ...metadata
    });

    console.log(`✅ New MCP session created: ${sessionId}`);
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