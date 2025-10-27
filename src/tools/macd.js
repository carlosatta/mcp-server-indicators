/**
 * MACD (Moving Average Convergence Divergence) Indicator
 * Shows the relationship between two moving averages of a security's price
 */

import tulind from 'tulind';

export const macdDefinition = {
  name: "calculate_macd",
  description: "Calculate MACD (Moving Average Convergence Divergence) - Popular momentum indicator showing trend and strength. Generates buy signals on bullish crossover (MACD crosses above signal), sell on bearish crossover. Standard settings: 12,26,9.",
  inputSchema: {
    type: "object",
    properties: {
      prices: {
        type: "array",
        items: { type: "number" },
        description: "Array of closing prices in chronological order (oldest first). Minimum length: slowPeriod + signalPeriod. Example: [100, 102, 101, 103, 105, 104, 106, ...]",
        minItems: 10
      },
      fastPeriod: {
        type: "number",
        description: "Fast EMA period. Standard: 12. Must be less than slowPeriod.",
        default: 12,
        minimum: 1,
        maximum: 100
      },
      slowPeriod: {
        type: "number",
        description: "Slow EMA period. Standard: 26. Must be greater than fastPeriod.",
        default: 26,
        minimum: 1,
        maximum: 100
      },
      signalPeriod: {
        type: "number",
        description: "Signal line EMA period. Standard: 9. Applied to MACD line.",
        default: 9,
        minimum: 1,
        maximum: 50
      }
    },
    required: ["prices"]
  }
};

export const macdHandler = async (args) => {
  const { prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9 } = args;

  // Validation
  if (!Array.isArray(prices) || prices.length === 0) {
    throw new Error("Prices must be a non-empty array");
  }

  if (fastPeriod >= slowPeriod) {
    throw new Error("Fast period must be less than slow period");
  }

  const minDataPoints = slowPeriod + signalPeriod;
  if (prices.length < minDataPoints) {
    throw new Error(`Insufficient data: need at least ${minDataPoints} prices for MACD calculation`);
  }

  if (prices.some(price => typeof price !== 'number' || isNaN(price))) {
    throw new Error("All prices must be valid numbers");
  }

  try {
    // Calculate MACD using Tulind
    const result = await new Promise((resolve, reject) => {
      tulind.indicators.macd.indicator([prices], [fastPeriod, slowPeriod, signalPeriod], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const [macdLine, macdSignal, macdHistogram] = result;

    // Analyze MACD signals
    const currentMACD = macdLine[macdLine.length - 1];
    const currentSignal = macdSignal[macdSignal.length - 1];
    const currentHistogram = macdHistogram[macdHistogram.length - 1];
    const previousHistogram = macdHistogram[macdHistogram.length - 2];

    let signal = "neutral";
    let interpretation = "";

    // Determine signal based on MACD analysis
    if (currentMACD > currentSignal && previousHistogram <= 0 && currentHistogram > 0) {
      signal = "bullish_crossover";
      interpretation = "MACD line crossed above signal line - bullish crossover signal";
    } else if (currentMACD < currentSignal && previousHistogram >= 0 && currentHistogram < 0) {
      signal = "bearish_crossover";
      interpretation = "MACD line crossed below signal line - bearish crossover signal";
    } else if (currentMACD > currentSignal) {
      signal = "bullish";
      interpretation = "MACD line above signal line - bullish momentum";
    } else if (currentMACD < currentSignal) {
      signal = "bearish";
      interpretation = "MACD line below signal line - bearish momentum";
    } else {
      interpretation = "MACD and signal lines are converging - neutral";
    }

    // Additional analysis
    const histogramTrend = currentHistogram > previousHistogram ? "increasing" : "decreasing";
    const zeroLineCross = currentMACD > 0 ? "above_zero" : "below_zero";

    const response = {
      indicator: "MACD",
      parameters: {
        fastPeriod: fastPeriod,
        slowPeriod: slowPeriod,
        signalPeriod: signalPeriod
      },
      dataPoints: prices.length,
      values: {
        macd: macdLine,
        signal: macdSignal,
        histogram: macdHistogram
      },
      current: {
        macd: Number(currentMACD.toFixed(6)),
        signal: Number(currentSignal.toFixed(6)),
        histogram: Number(currentHistogram.toFixed(6)),
        trend: histogramTrend,
        position: zeroLineCross,
        signal: signal,
        interpretation: interpretation
      },
      analysis: {
        convergence: Math.abs(currentMACD - currentSignal) < Math.abs(macdLine[macdLine.length - 2] - macdSignal[macdSignal.length - 2]),
        momentum: currentHistogram > 0 ? "bullish" : "bearish",
        strength: Math.abs(currentHistogram)
      }
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2)
        }
      ]
    };

  } catch (error) {
    throw new Error(`MACD calculation failed: ${error.message}`);
  }
};