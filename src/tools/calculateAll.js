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
        description: "Configuration for each indicator to calculate",
        properties: {
          rsi: {
            type: "object",
            properties: {
              enabled: { type: "boolean", description: "Calculate RSI" },
              period: { type: "number", description: "RSI period (default: 14)" }
            }
          },
          ema: {
            type: "object",
            properties: {
              enabled: { type: "boolean", description: "Calculate EMA" },
              period: { type: "number", description: "EMA period (default: 20)" }
            }
          },
          sma: {
            type: "object",
            properties: {
              enabled: { type: "boolean", description: "Calculate SMA" },
              period: { type: "number", description: "SMA period (default: 20)" }
            }
          },
          macd: {
            type: "object",
            properties: {
              enabled: { type: "boolean", description: "Calculate MACD" },
              fastPeriod: { type: "number", description: "Fast period (default: 12)" },
              slowPeriod: { type: "number", description: "Slow period (default: 26)" },
              signalPeriod: { type: "number", description: "Signal period (default: 9)" }
            }
          },
          bollingerBands: {
            type: "object",
            properties: {
              enabled: { type: "boolean", description: "Calculate Bollinger Bands" },
              period: { type: "number", description: "Period (default: 20)" },
              stddev: { type: "number", description: "Standard deviation (default: 2)" }
            }
          },
          stochastic: {
            type: "object",
            properties: {
              enabled: { type: "boolean", description: "Calculate Stochastic" },
              kPeriod: { type: "number", description: "%K period (default: 14)" },
              kSlowPeriod: { type: "number", description: "%K slowing period (default: 3)" },
              dPeriod: { type: "number", description: "%D period (default: 3)" }
            }
          },
          atr: {
            type: "object",
            properties: {
              enabled: { type: "boolean", description: "Calculate ATR" },
              period: { type: "number", description: "ATR period (default: 14)" }
            }
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

    // Calculate RSI
    if (indicators.rsi?.enabled) {
      const period = indicators.rsi.period || 14;
      if (close.length >= period) {
        const rsiResult = await new Promise((resolve, reject) => {
          tulind.indicators.rsi.indicator([close], [period], (err, res) => {
            if (err) reject(err);
            else resolve(res[0]);
          });
        });
        results.indicators.rsi = {
          period,
          values: Array.from(rsiResult),
          latest: rsiResult[rsiResult.length - 1]
        };
      }
    }

    // Calculate EMA
    if (indicators.ema?.enabled) {
      const period = indicators.ema.period || 20;
      if (close.length >= period) {
        const emaResult = await new Promise((resolve, reject) => {
          tulind.indicators.ema.indicator([close], [period], (err, res) => {
            if (err) reject(err);
            else resolve(res[0]);
          });
        });
        results.indicators.ema = {
          period,
          values: Array.from(emaResult),
          latest: emaResult[emaResult.length - 1]
        };
      }
    }

    // Calculate SMA
    if (indicators.sma?.enabled) {
      const period = indicators.sma.period || 20;
      if (close.length >= period) {
        const smaResult = await new Promise((resolve, reject) => {
          tulind.indicators.sma.indicator([close], [period], (err, res) => {
            if (err) reject(err);
            else resolve(res[0]);
          });
        });
        results.indicators.sma = {
          period,
          values: Array.from(smaResult),
          latest: smaResult[smaResult.length - 1]
        };
      }
    }

    // Calculate MACD
    if (indicators.macd?.enabled) {
      const fastPeriod = indicators.macd.fastPeriod || 12;
      const slowPeriod = indicators.macd.slowPeriod || 26;
      const signalPeriod = indicators.macd.signalPeriod || 9;

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

        results.indicators.macd = {
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

    // Calculate Bollinger Bands
    if (indicators.bollingerBands?.enabled) {
      const period = indicators.bollingerBands.period || 20;
      const stddev = indicators.bollingerBands.stddev || 2;

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

        results.indicators.bollingerBands = {
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

    // Calculate Stochastic
    if (indicators.stochastic?.enabled) {
      const kPeriod = indicators.stochastic.kPeriod || 14;
      const kSlowPeriod = indicators.stochastic.kSlowPeriod || 3;
      const dPeriod = indicators.stochastic.dPeriod || 3;

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

        results.indicators.stochastic = {
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

    // Calculate ATR
    if (indicators.atr?.enabled) {
      const period = indicators.atr.period || 14;

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

        results.indicators.atr = {
          period,
          values: Array.from(atrResult),
          latest: atrResult[atrResult.length - 1]
        };
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
