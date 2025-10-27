# MCP Server Template - Available Tools

This document lists all available tools in the MCP Server Template.

## Public Tools (No Authentication Required)

### 1. hello_world
**Description**: A simple greeting tool that returns a personalized message
**Input Schema**:
- `name` (string, required): Name to include in the greeting

**Example**:
```json
{
  "name": "hello_world",
  "arguments": {
    "name": "Alice"
  }
}
```

### 2. get_server_info
**Description**: Get basic information about the MCP server
**Input Schema**: No parameters required

**Example**:
```json
{
  "name": "get_server_info",
  "arguments": {}
}
```

## Private Tools (May Require Authentication)

### 1. example_private_tool
**Description**: An example private tool that might require authentication
**Input Schema**:
- `message` (string, required): Message to process

**Example**:
```json
{
  "name": "example_private_tool",
  "arguments": {
    "message": "Test message"
  }
}
```

## Adding Custom Tools

### Public Tools
Edit `src/tools/publicTools.js`:
1. Add your tool definition to `publicToolsDefinitions` array
2. Add your tool handler to `publicToolsHandlers` object

## Tool Response Format

All tools should return responses in this format:
```javascript
{
  content: [
    {
      type: "text",
      text: "Your response text here"
    }
  ]
}
```

## Error Handling

Tools should throw errors for invalid inputs:
```javascript
if (!requiredParam) {
  throw new Error("Required parameter is missing");
}
```
