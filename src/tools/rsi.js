/**
 * RSI (Relative Strength Index) Indicator
 * Measures the speed and change of price movements
 */

import tulind from 'tulind';

export const rsiDefinition = {
  name: "calculate_rsi",
  description: "Calculate RSI (Relative Strength Index) - A momentum oscillator measuring overbought/oversold conditions. Values above 70 indicate overbought, below 30 indicate oversold. Commonly used with 14-period setting.",
  inputSchema: {
    type: "object",
    properties: {
      prices: {
        type: "array",
        items: { type: "number" },
        description: "Array of closing prices. Must be numeric values in chronological order (oldest first). Minimum length: period + 1. Example: [100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 111, 110, 112, 114, 113]",
        minItems: 2
      },
      period: {
        type: "number",
        description: "RSI calculation period. Standard values: 14 (default, most common), 9 (faster), 25 (slower). Must be positive integer less than array length.",
        default: 14,
        minimum: 1,
        maximum: 100
      }
    },
    required: ["prices"]
  }
};

export const rsiHandler = async (args) => {
  const { prices, period = 14 } = args;

  // Validation
  if (!Array.isArray(prices) || prices.length === 0) {
    throw new Error("Prices must be a non-empty array");
  }

  if (prices.length < period + 1) {
    throw new Error(`Insufficient data: need at least ${period + 1} prices for RSI calculation with period ${period}`);
  }

  if (prices.some(price => typeof price !== 'number' || isNaN(price))) {
    throw new Error("All prices must be valid numbers");
  }

  try {
    // Calculate RSI using Tulind
    const result = await new Promise((resolve, reject) => {
      tulind.indicators.rsi.indicator([prices], [period], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const rsiValues = result[0];

    // Create response with analysis
    const lastRSI = rsiValues[rsiValues.length - 1];
    let signal = "neutral";
    let interpretation = "";

    if (lastRSI > 70) {
      signal = "overbought";
      interpretation = "RSI above 70 indicates potential overbought conditions - possible sell signal";
    } else if (lastRSI < 30) {
      signal = "oversold";
      interpretation = "RSI below 30 indicates potential oversold conditions - possible buy signal";
    } else {
      interpretation = "RSI in neutral range (30-70) - no clear overbought/oversold signal";
    }

    const response = {
      indicator: "RSI",
      period: period,
      dataPoints: prices.length,
      values: rsiValues,
      current: {
        value: Number(lastRSI.toFixed(2)),
        signal: signal,
        interpretation: interpretation
      },
      statistics: {
        min: Number(Math.min(...rsiValues).toFixed(2)),
        max: Number(Math.max(...rsiValues).toFixed(2)),
        average: Number((rsiValues.reduce((a, b) => a + b, 0) / rsiValues.length).toFixed(2))
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
    throw new Error(`RSI calculation failed: ${error.message}`);
  }
};