# MCP Server - Trading Indicators

> 🔧 **Trading Indicators Server**: A specialized MCP server providing comprehensive technical analysis indicators for trading applications.

A MCP (Model Context Protocol) server that exposes trading indicators via Server-Sent Events (SSE) transport. This server provides access to popular technical analysis indicators using the powerful Tulind library.

## Features

- 🌐 **Web-based MCP server** using SSE transport
- 📊 **7 Popular Trading Indicators**: RSI, EMA, SMA, MACD, Bollinger Bands, Stochastic, ATR
- �� **Extensible tool system** for adding custom indicators
- 🔐 **Environment-based configuration** management
- 📝 **Comprehensive logging** for debugging
- 🔄 **Session-based transport** with UUID tracking
- 🛠️ **Modular architecture** for easy customization
- ⚡ **High Performance** using Tulind (C-based) library
- 🔍 **Automatic Port Detection** - finds available ports automatically

## Trading Indicators Available

### Momentum Indicators
- **RSI** (Relative Strength Index) - Identify overbought/oversold conditions
- **Stochastic Oscillator** - Compare closing price to price range
- **MACD** (Moving Average Convergence Divergence) - Trend and momentum

### Trend Indicators
- **EMA** (Exponential Moving Average) - Trend following with recent price emphasis
- **SMA** (Simple Moving Average) - Classic trend following indicator

### Volatility Indicators
- **ATR** (Average True Range) - Measure market volatility
- **Bollinger Bands** - Volatility bands around moving average

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
HOST=0.0.0.0
PORT=3000
LOG_LEVEL=info

# CORS Configuration (optional)
# CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

## Running the Server

```bash
npm start
```

The server will automatically find an available port if 3000 is occupied.

## Available Tools

### Basic Tools
- **get_server_info** - Server information including available indicators

### Trading Indicators

#### 1. RSI (Relative Strength Index)
```json
{
  "name": "calculate_rsi",
  "arguments": {
    "prices": [100, 102, 101, 103, 105, 104, 106],
    "period": 14
  }
}
```

#### 2. EMA (Exponential Moving Average)
```json
{
  "name": "calculate_ema",
  "arguments": {
    "prices": [100, 102, 101, 103, 105, 104, 106],
    "period": 20
  }
}
```

#### 3. SMA (Simple Moving Average)
```json
{
  "name": "calculate_sma",
  "arguments": {
    "prices": [100, 102, 101, 103, 105, 104, 106],
    "period": 20
  }
}
```

#### 4. MACD
```json
{
  "name": "calculate_macd",
  "arguments": {
    "prices": [100, 102, 101, 103, 105, 104, 106],
    "fastPeriod": 12,
    "slowPeriod": 26,
    "signalPeriod": 9
  }
}
```

#### 5. Bollinger Bands
```json
{
  "name": "calculate_bollinger_bands",
  "arguments": {
    "prices": [100, 102, 101, 103, 105, 104, 106],
    "period": 20,
    "stdDev": 2.0
  }
}
```

#### 6. Stochastic Oscillator
```json
{
  "name": "calculate_stochastic",
  "arguments": {
    "high": [105, 107, 106, 108, 110, 109, 111],
    "low": [95, 97, 96, 98, 100, 99, 101],
    "close": [100, 102, 101, 103, 105, 104, 106],
    "kPeriod": 14,
    "kSmoothPeriod": 3,
    "dPeriod": 3
  }
}
```

#### 7. ATR (Average True Range)
```json
{
  "name": "calculate_atr",
  "arguments": {
    "high": [105, 107, 106, 108, 110, 109, 111],
    "low": [95, 97, 96, 98, 100, 99, 101],
    "close": [100, 102, 101, 103, 105, 104, 106],
    "period": 14
  }
}
```

## Integration with CCXT

These indicators are designed to work seamlessly with CCXT OHLCV data:

```javascript
// Example: Get BTC/USDT data from exchange and calculate RSI
const ohlcv = await exchange.fetchOHLCV('BTC/USDT', '1h', undefined, 100);
const closes = ohlcv.map(candle => candle[4]); // Extract close prices

// Use with MCP client
const rsiResult = await client.callTool({
  name: "calculate_rsi",
  arguments: {
    prices: closes,
    period: 14
  }
});
```

## Data Format

### Input Data
- **prices**: Array of closing prices (numbers)
- **high/low/close**: Arrays for OHLC indicators (all same length)
- **period**: Integer for calculation period

### Output Format
All indicators return structured JSON with:
- **indicator**: Name of the indicator
- **values**: Calculated indicator values
- **current**: Current/latest values with interpretation
- **analysis**: Additional analysis and signals
- **parameters**: Used parameters

## Testing

```bash
node test-mcp-client.js
```

## Architecture

```
src/
├── tools/
│   ├── tradingIndicators.js    # Index of all indicators
│   ├── rsi.js                  # RSI indicator
│   ├── ema.js                  # EMA indicator
│   ├── sma.js                  # SMA indicator
│   ├── macd.js                 # MACD indicator
│   ├── bollingerBands.js       # Bollinger Bands
│   ├── stochastic.js           # Stochastic Oscillator
│   ├── atr.js                  # ATR indicator
│   └── publicTools.js          # Public tools including indicators
├── config/
│   └── config.js               # Server configuration
└── mcpServer.js                # MCP server logic
```

## Adding Custom Indicators

1. Create a new file in `src/tools/` (e.g., `myIndicator.js`)
2. Export `myIndicatorDefinition` and `myIndicatorHandler`
3. Add to `src/tools/tradingIndicators.js`
4. Restart the server

## Performance

- **Tulind Library**: C-based calculations for maximum performance
- **Efficient Memory Usage**: Streaming calculations where possible
- **Error Handling**: Comprehensive validation and error messages
- **Parallel Execution**: Multiple indicators calculated concurrently (1-5ms typical)
- **No Event Loop Blocking**: process.nextTick protection for tulind operations

## MCP Standard Compliance

This server follows the **MCP specification revision 2025-06-18**:

### Session Management
- ✅ HTTP 404 (-32004) for unknown session IDs
- ✅ HTTP 400 (-32602) for missing session IDs
- ✅ 5-minute session timeout (configurable via `MCP_SESSION_TIMEOUT_MS`)
- ✅ 30-second cleanup interval (configurable via `MCP_CLEANUP_INTERVAL_MS`)
- ✅ Graceful session cleanup on timeout

### Error Handling
- ✅ Structured error responses (no thrown exceptions)
- ✅ Transport blocking prevention
- ✅ Individual operation timeouts (1s per indicator)
- ✅ Global operation timeout (5s for batch calculations)
- ✅ Partial results on timeout (trading system protection)

### Error Codes
- `-32602`: Invalid parameters / Session ID required
- `-32004`: Session not found
- `-32000`: Bad request
- `-32603`: Internal server error
- `-32601`: Method not found

### Testing
Run conformance tests to verify MCP compliance:

```bash
# Basic conformance test
npm run test

# Extended conformance test (session lifecycle, errors, parallel execution)
node test-extended-conformance.js

# Stress test (concurrent execution, timeout scenarios)
node test-stress-cascade.js
```

### Configuration
Environment variables for MCP behavior:

```env
# Session timeout (default: 5 minutes)
MCP_SESSION_TIMEOUT_MS=300000

# Cleanup interval (default: 30 seconds)
MCP_CLEANUP_INTERVAL_MS=30000

# Tool execution timeout (default: 20 seconds)
TOOL_EXECUTION_TIMEOUT_MS=20000

# Allow auto-recreate sessions (default: false, strict compliance)
ALLOW_AUTO_SESSION_RECREATE=false

# Enable session debug endpoint (default: auto-detect)
ENABLE_SESSION_DEBUG=true
```

## Use Cases

- **Algorithmic Trading**: Real-time indicator calculations
- **Portfolio Analysis**: Technical analysis of holdings
- **Market Research**: Backtesting and strategy development
- **Risk Management**: Volatility and trend analysis
- **AI/ML Training**: Feature generation for models

## Architecture Notes

### Transport Blocking Prevention
This implementation includes protection against transport blocking cascade failures:
- Aggressive timeouts (1s per indicator, 5s total)
- Session cleanup on timeout
- Structured error responses (never throws exceptions)
- Parallel indicator execution
- Event loop protection via process.nextTick

### Legacy Files
The `legacy/` directory contains deprecated implementations for reference only. Do not use these files in production.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/new-indicator`)
3. Add your indicator following the existing pattern
4. Test your changes
5. Submit a pull request

## License

This project is licensed under the ISC License.
