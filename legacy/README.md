# Legacy Files Archive

This directory contains obsolete/deprecated files that are no longer used in the current implementation.

## Files

### `index.js.legacy`
**Status:** Deprecated (replaced in commit 66513f0)  
**Reason:** Contained non-compliant MCP session management

**Issues with this version:**
- Returned HTTP 400 for unknown sessions (should be 404 per MCP standard)
- Used error code -32000 instead of -32004 for session not found
- Had 60-second session timeout (now 5 minutes)
- Cleanup interval was 10s (now 30s)
- No structured error handling for tool failures
- Risk of transport blocking cascade failures

**Current implementation:**
- MCP-compliant session management (MCP 2025-06-18)
- HTTP 404 (-32004) for unknown sessions
- HTTP 400 (-32602) for missing sessions
- 5-minute session timeout for trading workflows
- Structured error responses prevent transport blocking
- Aggressive timeouts (1s per indicator, 5s total)
- Session cleanup on timeout to prevent cascade failures

**Do not use this file** - it's kept only for historical reference.

## Migration Notes

If you need to reference the old behavior:
1. Check git history for implementation details
2. Review current implementation in `index.js` (root directory)
3. See `src/utils/sessionManager.js` for session management
4. Review MCP standard compliance in `test-mcp-compliance.js`
