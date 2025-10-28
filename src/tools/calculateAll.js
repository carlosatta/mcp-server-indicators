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
          bollingerBands: {
            description: "Bollinger Bands configuration - can be object or array of objects",
            oneOf: [
              {
                type: "object",
                properties: {
                  enabled: { type: "boolean", description: "Calculate Bollinger Bands" },
                  period: { type: "number", description: "Period (default: 20)" },
                  stddev: { type: "number", description: "Standard deviation (default: 2)" },
                  name: { type: "string", description: "Custom name" }
                }
              },
              {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    enabled: { type: "boolean", description: "Calculate Bollinger Bands" },
                    period: { type: "number", description: "Period" },
                    stddev: { type: "number", description: "Standard deviation" },
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
                  kPeriod: { type: "number", description: "%K period (default: 14)" },
                  kSlowPeriod: { type: "number", description: "%K slowing period (default: 3)" },
                  dPeriod: { type: "number", description: "%D period (default: 3)" },
                  name: { type: "string", description: "Custom name" }
                }
              },
              {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    enabled: { type: "boolean", description: "Calculate Stochastic" },
                    kPeriod: { type: "number", description: "%K period" },
                    kSlowPeriod: { type: "number", description: "%K slowing period" },
                    dPeriod: { type: "number", description: "%D period" },
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
    required: ["ohlcv"]
  }
};

/**
 * Handler for calculate_all_indicators
 */
export const calculateAllHandler = async (args) => {
  try {
    const { symbol = "Unknown", ohlcv, indicators = {} } = args;
    const { high, low, close, volume = [] } = ohlcv;

    // Validate input arrays
    if (!Array.isArray(high) || !Array.isArray(low) || !Array.isArray(close)) {
      throw new Error("OHLCV data must contain arrays for high, low, and close prices");
    }

    if (high.length !== low.length || high.length !== close.length) {
      throw new Error("OHLCV arrays must have the same length");
    }

    if (high.length < 2) {
      throw new Error("Need at least 2 data points");
    }

    const results = {
      symbol,
      timestamp: new Date().toISOString(),
      dataPoints: close.length,
      indicators: {}
    };

    // Helper function to normalize indicator config (object or array)
    const normalizeConfig = (config) => {
      if (!config) return [];
      return Array.isArray(config) ? config : [config];
    };

    // Calculate RSI (support multiple periods)
    const rsiConfigs = normalizeConfig(indicators.rsi);
    for (const config of rsiConfigs) {
      if (config.enabled) {
        const period = config.period || 14;
        const name = config.name || `rsi_${period}`;

        if (close.length >= period) {
          const rsiResult = await new Promise((resolve, reject) => {
            tulind.indicators.rsi.indicator([close], [period], (err, res) => {
              if (err) reject(err);
              else resolve(res[0]);
            });
          });
          results.indicators[name] = {
            type: 'RSI',
            period,
            values: Array.from(rsiResult),
            latest: rsiResult[rsiResult.length - 1]
          };
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
          const emaResult = await new Promise((resolve, reject) => {
            tulind.indicators.ema.indicator([close], [period], (err, res) => {
              if (err) reject(err);
              else resolve(res[0]);
            });
          });
          results.indicators[name] = {
            type: 'EMA',
            period,
            values: Array.from(emaResult),
            latest: emaResult[emaResult.length - 1]
          };
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
          const smaResult = await new Promise((resolve, reject) => {
            tulind.indicators.sma.indicator([close], [period], (err, res) => {
              if (err) reject(err);
              else resolve(res[0]);
            });
          });
          results.indicators[name] = {
            type: 'SMA',
            period,
            values: Array.from(smaResult),
            latest: smaResult[smaResult.length - 1]
          };
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

        if (close.length >= slowPeriod + signalPeriod) {
          const macdResult = await new Promise((resolve, reject) => {
            tulind.indicators.macd.indicator(
              [close],
              [fastPeriod, slowPeriod, signalPeriod],
              (err, res) => {
                if (err) reject(err);
                else resolve(res);
              }
            );
          });

          results.indicators[name] = {
            type: 'MACD',
            fastPeriod,
            slowPeriod,
            signalPeriod,
            macd: Array.from(macdResult[0]),
            signal: Array.from(macdResult[1]),
            histogram: Array.from(macdResult[2]),
            latest: {
              macd: macdResult[0][macdResult[0].length - 1],
              signal: macdResult[1][macdResult[1].length - 1],
              histogram: macdResult[2][macdResult[2].length - 1]
            }
          };
        }
      }
    }

    // Calculate Bollinger Bands (support multiple configurations)
    const bbConfigs = normalizeConfig(indicators.bollingerBands);
    for (const config of bbConfigs) {
      if (config.enabled) {
        const period = config.period || 20;
        const stddev = config.stddev || 2;
        const name = config.name || `bb_${period}_${stddev}`;

        if (close.length >= period) {
          const bbResult = await new Promise((resolve, reject) => {
            tulind.indicators.bbands.indicator(
              [close],
              [period, stddev],
              (err, res) => {
                if (err) reject(err);
                else resolve(res);
              }
            );
          });

          results.indicators[name] = {
            type: 'BollingerBands',
            period,
            stddev,
            lower: Array.from(bbResult[0]),
            middle: Array.from(bbResult[1]),
            upper: Array.from(bbResult[2]),
            latest: {
              lower: bbResult[0][bbResult[0].length - 1],
              middle: bbResult[1][bbResult[1].length - 1],
              upper: bbResult[2][bbResult[2].length - 1]
            }
          };
        }
      }
    }

    // Calculate Stochastic (support multiple configurations)
    const stochConfigs = normalizeConfig(indicators.stochastic);
    for (const config of stochConfigs) {
      if (config.enabled) {
        const kPeriod = config.kPeriod || 14;
        const kSlowPeriod = config.kSlowPeriod || 3;
        const dPeriod = config.dPeriod || 3;
        const name = config.name || `stoch_${kPeriod}_${kSlowPeriod}_${dPeriod}`;

        if (high.length >= kPeriod + kSlowPeriod) {
          const stochResult = await new Promise((resolve, reject) => {
            tulind.indicators.stoch.indicator(
              [high, low, close],
              [kPeriod, kSlowPeriod, dPeriod],
              (err, res) => {
                if (err) reject(err);
                else resolve(res);
              }
            );
          });

          results.indicators[name] = {
            type: 'Stochastic',
            kPeriod,
            kSlowPeriod,
            dPeriod,
            k: Array.from(stochResult[0]),
            d: Array.from(stochResult[1]),
            latest: {
              k: stochResult[0][stochResult[0].length - 1],
              d: stochResult[1][stochResult[1].length - 1]
            }
          };
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
          const atrResult = await new Promise((resolve, reject) => {
            tulind.indicators.atr.indicator(
              [high, low, close],
              [period],
              (err, res) => {
                if (err) reject(err);
                else resolve(res[0]);
              }
            );
          });

          results.indicators[name] = {
            type: 'ATR',
            period,
            values: Array.from(atrResult),
            latest: atrResult[atrResult.length - 1]
          };
        }
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2)
        }
      ]
    };

  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: error.message,
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ],
      isError: true
    };
  }
};
