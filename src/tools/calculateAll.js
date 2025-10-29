/**
 * Calculate All Indicators - Aggregated tool for maximum performance
 * Calculates multiple indicators in a single call to minimize HTTP requests
 */

import tulind from "tulind";

/**
 * Tool definition for calculate_all_indicators
 */
export const calculateAllDefinition = {
  name: "calculate_all_indicators",
  description: "Calculate multiple technical indicators in a single call for maximum performance. Returns RSI, EMA, SMA, MACD, Bollinger Bands, Stochastic, and ATR all at once. This tool minimizes HTTP requests and improves efficiency when analyzing market data.",
  inputSchema: {
    type: "object",
    properties: {
      symbol: {
        type: "string",
        description: "Trading symbol (e.g., BTC/USDT, ETH/USDT) - for reference only"
      },
      ohlcv: {
        type: "object",
        description: "OHLCV data arrays",
        properties: {
          high: {
            type: "array",
            items: { type: "number" },
            description: "Array of high prices"
          },
          low: {
            type: "array",
            items: { type: "number" },
            description: "Array of low prices"
          },
          close: {
            type: "array",
            items: { type: "number" },
            description: "Array of closing prices"
          },
          volume: {
            type: "array",
            items: { type: "number" },
            description: "Array of volumes (optional, for volume-based indicators)"
          }
        },
        required: ["high", "low", "close"]
      },
      indicators: {
        type: "object",
        description: "Configuration for each indicator to calculate. Each indicator can be an object (single) or array of objects (multiple with different params)",
        properties: {
          rsi: {
            description: "RSI configuration - can be object or array of objects",
            oneOf: [
              {
                type: "object",
                properties: {
                  enabled: { type: "boolean", description: "Calculate RSI" },
                  period: { type: "number", description: "RSI period (default: 14)" },
                  name: { type: "string", description: "Custom name for this indicator (e.g., 'RSI14')" }
                }
              },
              {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    enabled: { type: "boolean", description: "Calculate RSI" },
                    period: { type: "number", description: "RSI period" },
                    name: { type: "string", description: "Custom name for this indicator (e.g., 'RSI7', 'RSI14')" }
                  }
                }
              }
            ]
          },
          ema: {
            description: "EMA configuration - can be object or array of objects",
            oneOf: [
              {
                type: "object",
                properties: {
                  enabled: { type: "boolean", description: "Calculate EMA" },
                  period: { type: "number", description: "EMA period (default: 20)" },
                  name: { type: "string", description: "Custom name (e.g., 'EMA20')" }
                }
              },
              {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    enabled: { type: "boolean", description: "Calculate EMA" },
                    period: { type: "number", description: "EMA period" },
                    name: { type: "string", description: "Custom name (e.g., 'EMA9', 'EMA20', 'EMA50')" }
                  }
                }
              }
            ]
          },
          sma: {
            description: "SMA configuration - can be object or array of objects",
            oneOf: [
              {
                type: "object",
                properties: {
                  enabled: { type: "boolean", description: "Calculate SMA" },
                  period: { type: "number", description: "SMA period (default: 20)" },
                  name: { type: "string", description: "Custom name (e.g., 'SMA20')" }
                }
              },
              {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    enabled: { type: "boolean", description: "Calculate SMA" },
                    period: { type: "number", description: "SMA period" },
                    name: { type: "string", description: "Custom name (e.g., 'SMA50', 'SMA200')" }
                  }
                }
              }
            ]
          },
          macd: {
            description: "MACD configuration - can be object or array of objects",
            oneOf: [
              {
                type: "object",
                properties: {
                  enabled: { type: "boolean", description: "Calculate MACD" },
                  fastPeriod: { type: "number", description: "Fast period (default: 12)" },
                  slowPeriod: { type: "number", description: "Slow period (default: 26)" },
                  signalPeriod: { type: "number", description: "Signal period (default: 9)" },
                  name: { type: "string", description: "Custom name" }
                }
              },
              {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    enabled: { type: "boolean", description: "Calculate MACD" },
                    fastPeriod: { type: "number", description: "Fast period" },
                    slowPeriod: { type: "number", description: "Slow period" },
                    signalPeriod: { type: "number", description: "Signal period" },
                    name: { type: "string", description: "Custom name" }
                  }
                }
              }
            ]
          },
          bollinger: {
            description: "Bollinger Bands configuration - can be object or array of objects",
            oneOf: [
              {
                type: "object",
                properties: {
                  enabled: { type: "boolean", description: "Calculate Bollinger Bands" },
                  period: { type: "number", description: "Moving average period (default: 20)" },
                  stddev: { type: "number", description: "Standard deviation multiplier (default: 2)" },
                  name: { type: "string", description: "Custom name" }
                }
              },
              {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    enabled: { type: "boolean", description: "Calculate Bollinger Bands" },
                    period: { type: "number", description: "Moving average period" },
                    stddev: { type: "number", description: "Standard deviation multiplier" },
                    name: { type: "string", description: "Custom name" }
                  }
                }
              }
            ]
          },
          stochastic: {
            description: "Stochastic configuration - can be object or array of objects",
            oneOf: [
              {
                type: "object",
                properties: {
                  enabled: { type: "boolean", description: "Calculate Stochastic" },
                  kPeriod: { type: "number", description: "K period (default: 14)" },
                  kSlowing: { type: "number", description: "K slowing (default: 3)" },
                  dPeriod: { type: "number", description: "D period (default: 3)" },
                  name: { type: "string", description: "Custom name" }
                }
              },
              {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    enabled: { type: "boolean", description: "Calculate Stochastic" },
                    kPeriod: { type: "number", description: "K period" },
                    kSlowing: { type: "number", description: "K slowing" },
                    dPeriod: { type: "number", description: "D period" },
                    name: { type: "string", description: "Custom name" }
                  }
                }
              }
            ]
          },
          atr: {
            description: "ATR configuration - can be object or array of objects",
            oneOf: [
              {
                type: "object",
                properties: {
                  enabled: { type: "boolean", description: "Calculate ATR" },
                  period: { type: "number", description: "ATR period (default: 14)" },
                  name: { type: "string", description: "Custom name" }
                }
              },
              {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    enabled: { type: "boolean", description: "Calculate ATR" },
                    period: { type: "number", description: "ATR period" },
                    name: { type: "string", description: "Custom name" }
                  }
                }
              }
            ]
          }
        }
      }
    },
    required: ["symbol", "ohlcv", "indicators"]
  }
};

/**
 * Helper function to create Promise with timeout and circuit breaker
 * @param {Promise} promise - Promise to wrap
 * @param {number} timeout - Timeout in ms
 * @returns {Promise} Promise with timeout
 */
const withTimeout = (promise, timeout = 3000) => {
  let timeoutId;
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeout}ms`));
    }, timeout);
  });

  return Promise.race([
    promise.then(result => {
      clearTimeout(timeoutId);
      return result;
    }).catch(error => {
      clearTimeout(timeoutId);
      throw error;
    }),
    timeoutPromise
  ]);
};

/**
 * Helper function to run tulind indicator with aggressive timeout and circuit breaker
 * @param {string} indicatorName - Tulind indicator name
 * @param {Array} inputs - Input arrays
 * @param {Array} params - Parameters
 * @param {number} timeout - Timeout in ms (reduced to 1s for trading speed)
 * @returns {Promise<Array>} Result array
 */
const runIndicatorWithTimeout = (indicatorName, inputs, params, timeout = 1000) => {
  const promise = new Promise((resolve, reject) => {
    // Add process.nextTick to ensure tulind doesn't block event loop
    process.nextTick(() => {
      try {
        tulind.indicators[indicatorName].indicator(inputs, params, (err, res) => {
          if (err) reject(err);
          else resolve(res);
        });
      } catch (syncError) {
        reject(syncError);
      }
    });
  });
  
  return withTimeout(promise, timeout);
};/**
 * Handler function for calculate_all_indicators
 * @param {object} args - Tool arguments
 * @returns {object} Calculation results or error
 */
export const calculateAllHandler = async (args) => {
  const startTime = Date.now();
  
  try {
    const { symbol, ohlcv, indicators } = args;
    const { high, low, close, volume } = ohlcv;

    // Validation with immediate structured response
    if (!high || !low || !close) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "Missing required OHLCV data (high, low, close)",
              timestamp: new Date().toISOString(),
              executionTime: Date.now() - startTime
            }, null, 2)
          }
        ],
        isError: true
      };
    }

    if (high.length !== low.length || high.length !== close.length) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "OHLCV arrays must have the same length",
              timestamp: new Date().toISOString(),
              executionTime: Date.now() - startTime
            }, null, 2)
          }
        ],
        isError: true
      };
    }

    if (high.length < 2) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "Need at least 2 data points",
              timestamp: new Date().toISOString(),
              executionTime: Date.now() - startTime
            }, null, 2)
          }
        ],
        isError: true
      };
    }    const results = {
      symbol,
      timestamp: new Date().toISOString(),
      dataPoints: close.length,
      indicators: {},
      executionTime: 0
    };

    // Helper function to normalize indicator config (object or array)
    const normalizeConfig = (config) => {
      if (!config) return [];
      return Array.isArray(config) ? config : [config];
    };

    // Collect all indicator calculations to run in parallel
    const calculations = [];

    // Calculate RSI (support multiple periods)
    const rsiConfigs = normalizeConfig(indicators.rsi);
    for (const config of rsiConfigs) {
      if (config.enabled) {
        const period = config.period || 14;
        const name = config.name || `rsi_${period}`;

        if (close.length >= period) {
          calculations.push(
            runIndicatorWithTimeout('rsi', [close], [period])
              .then(res => ({
                name,
                type: 'RSI',
                period,
                values: Array.from(res[0]),
                latest: res[0][res[0].length - 1]
              }))
              .catch(err => ({ name, error: err.message }))
          );
        }
      }
    }

    // Calculate EMA (support multiple periods)
    const emaConfigs = normalizeConfig(indicators.ema);
    for (const config of emaConfigs) {
      if (config.enabled) {
        const period = config.period || 20;
        const name = config.name || `ema_${period}`;

        if (close.length >= period) {
          calculations.push(
            runIndicatorWithTimeout('ema', [close], [period])
              .then(res => ({
                name,
                type: 'EMA',
                period,
                values: Array.from(res[0]),
                latest: res[0][res[0].length - 1]
              }))
              .catch(err => ({ name, error: err.message }))
          );
        }
      }
    }

    // Calculate SMA (support multiple periods)
    const smaConfigs = normalizeConfig(indicators.sma);
    for (const config of smaConfigs) {
      if (config.enabled) {
        const period = config.period || 20;
        const name = config.name || `sma_${period}`;

        if (close.length >= period) {
          calculations.push(
            runIndicatorWithTimeout('sma', [close], [period])
              .then(res => ({
                name,
                type: 'SMA',
                period,
                values: Array.from(res[0]),
                latest: res[0][res[0].length - 1]
              }))
              .catch(err => ({ name, error: err.message }))
          );
        }
      }
    }

    // Calculate MACD (support multiple configurations)
    const macdConfigs = normalizeConfig(indicators.macd);
    for (const config of macdConfigs) {
      if (config.enabled) {
        const fastPeriod = config.fastPeriod || 12;
        const slowPeriod = config.slowPeriod || 26;
        const signalPeriod = config.signalPeriod || 9;
        const name = config.name || `macd_${fastPeriod}_${slowPeriod}_${signalPeriod}`;

        if (close.length >= slowPeriod) {
          calculations.push(
            runIndicatorWithTimeout('macd', [close], [fastPeriod, slowPeriod, signalPeriod])
              .then(res => ({
                name,
                type: 'MACD',
                fastPeriod,
                slowPeriod,
                signalPeriod,
                macd: Array.from(res[0]),
                signal: Array.from(res[1]),
                histogram: Array.from(res[2]),
                latest: {
                  macd: res[0][res[0].length - 1],
                  signal: res[1][res[1].length - 1],
                  histogram: res[2][res[2].length - 1]
                }
              }))
              .catch(err => ({ name, error: err.message }))
          );
        }
      }
    }

    // Calculate Bollinger Bands (support multiple configurations)
    const bbConfigs = normalizeConfig(indicators.bollinger);
    for (const config of bbConfigs) {
      if (config.enabled) {
        const period = config.period || 20;
        const stddev = config.stddev || 2;
        const name = config.name || `bb_${period}_${stddev}`;

        if (close.length >= period) {
          calculations.push(
            runIndicatorWithTimeout('bbands', [close], [period, stddev])
              .then(res => ({
                name,
                type: 'Bollinger Bands',
                period,
                stddev,
                lower: Array.from(res[0]),
                middle: Array.from(res[1]),
                upper: Array.from(res[2]),
                latest: {
                  lower: res[0][res[0].length - 1],
                  middle: res[1][res[1].length - 1],
                  upper: res[2][res[2].length - 1]
                }
              }))
              .catch(err => ({ name, error: err.message }))
          );
        }
      }
    }

    // Calculate Stochastic (support multiple configurations)
    const stochConfigs = normalizeConfig(indicators.stochastic);
    for (const config of stochConfigs) {
      if (config.enabled) {
        const kPeriod = config.kPeriod || 14;
        const kSlowing = config.kSlowing || 3;
        const dPeriod = config.dPeriod || 3;
        const name = config.name || `stoch_${kPeriod}_${kSlowing}_${dPeriod}`;

        if (high.length >= kPeriod) {
          calculations.push(
            runIndicatorWithTimeout('stoch', [high, low, close], [kPeriod, kSlowing, dPeriod])
              .then(res => ({
                name,
                type: 'Stochastic',
                kPeriod,
                kSlowing,
                dPeriod,
                k: Array.from(res[0]),
                d: Array.from(res[1]),
                latest: {
                  k: res[0][res[0].length - 1],
                  d: res[1][res[1].length - 1]
                }
              }))
              .catch(err => ({ name, error: err.message }))
          );
        }
      }
    }

    // Calculate ATR (support multiple configurations)
    const atrConfigs = normalizeConfig(indicators.atr);
    for (const config of atrConfigs) {
      if (config.enabled) {
        const period = config.period || 14;
        const name = config.name || `atr_${period}`;

        if (high.length >= period) {
          calculations.push(
            runIndicatorWithTimeout('atr', [high, low, close], [period])
              .then(res => ({
                name,
                type: 'ATR',
                period,
                values: Array.from(res[0]),
                latest: res[0][res[0].length - 1]
              }))
              .catch(err => ({ name, error: err.message }))
          );
        }
      }
    }

    // Execute all calculations in parallel with aggressive timeout for trading
    let allCalculations;
    try {
      allCalculations = await withTimeout(
        Promise.allSettled(calculations),
        5000 // 5 second max for all calculations (reduced for trading speed)
      );
    } catch (timeoutError) {
      // Return partial results immediately on timeout to prevent transport blocking
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "Calculation timeout - trading system protection activated",
              partialResults: results.indicators,
              timestamp: new Date().toISOString(),
              executionTime: Date.now() - startTime
            }, null, 2)
          }
        ],
        isError: true
      };
    }

    // Process results with error isolation
    for (const result of allCalculations) {
      if (result.status === 'fulfilled' && result.value) {
        const { name, error, ...data } = result.value;
        if (error) {
          results.indicators[name] = { error };
        } else {
          results.indicators[name] = data;
        }
      } else if (result.status === 'rejected') {
        // Log rejected calculations but don't block the response
        console.log(`⚠️  Calculation rejected: ${result.reason?.message}`);
      }
    }

    results.executionTime = Date.now() - startTime;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2)
        }
      ]
    };

  } catch (error) {
    // Structured error response to prevent transport blocking
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: error.message,
            timestamp: new Date().toISOString(),
            executionTime: Date.now() - startTime
          }, null, 2)
        }
      ],
      isError: true
    };
  }
};