/**
 * EMA (Exponential Moving Average) Indicator
 * Gives more weight to recent prices than older prices
 */

import tulind from 'tulind';

export const emaDefinition = {
  name: "calculate_ema",
  description: "Calculate EMA (Exponential Moving Average) - A trend-following indicator that gives more weight to recent prices. Reacts faster than SMA to price changes. Common periods: 9, 12, 20, 26, 50, 200.",
  inputSchema: {
    type: "object",
    properties: {
      prices: {
        type: "array",
        items: { type: "number" },
        description: "Array of closing prices in chronological order (oldest first). Must contain at least 'period' number of values. Example: [100, 102, 101, 103, 105, 104, 106]",
        minItems: 1
      },
      period: {
        type: "number",
        description: "EMA period. Common values: 9 (short-term), 12 (MACD fast), 20 (medium-term), 26 (MACD slow), 50 (intermediate), 200 (long-term). Default: 20.",
        default: 20,
        minimum: 1,
        maximum: 500
      }
    },
    required: ["prices"]
  }
};

export const emaHandler = async (args) => {
  const { prices, period = 20 } = args;

  // Validation
  if (!Array.isArray(prices) || prices.length === 0) {
    throw new Error("Prices must be a non-empty array");
  }

  if (prices.length < period) {
    throw new Error(`Insufficient data: need at least ${period} prices for EMA calculation with period ${period}`);
  }

  if (prices.some(price => typeof price !== 'number' || isNaN(price))) {
    throw new Error("All prices must be valid numbers");
  }

  try {
    // Calculate EMA using Tulind
    const result = await new Promise((resolve, reject) => {
      tulind.indicators.ema.indicator([prices], [period], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const emaValues = result[0];

    // Analyze trend
    const currentPrice = prices[prices.length - 1];
    const currentEMA = emaValues[emaValues.length - 1];
    const previousEMA = emaValues[emaValues.length - 2];

    let trend = "neutral";
    let signal = "hold";
    let interpretation = "";

    // Determine trend direction
    if (currentEMA > previousEMA) {
      trend = "uptrend";
    } else if (currentEMA < previousEMA) {
      trend = "downtrend";
    }

    // Compare current price with EMA
    if (currentPrice > currentEMA) {
      signal = "bullish";
      interpretation = `Price (${currentPrice.toFixed(2)}) is above EMA (${currentEMA.toFixed(2)}) - bullish signal`;
    } else if (currentPrice < currentEMA) {
      signal = "bearish";
      interpretation = `Price (${currentPrice.toFixed(2)}) is below EMA (${currentEMA.toFixed(2)}) - bearish signal`;
    } else {
      interpretation = `Price is at EMA level - neutral signal`;
    }

    const response = {
      indicator: "EMA",
      period: period,
      dataPoints: prices.length,
      values: emaValues,
      current: {
        ema: Number(currentEMA.toFixed(2)),
        price: Number(currentPrice.toFixed(2)),
        trend: trend,
        signal: signal,
        interpretation: interpretation
      },
      statistics: {
        min: Number(Math.min(...emaValues).toFixed(2)),
        max: Number(Math.max(...emaValues).toFixed(2)),
        average: Number((emaValues.reduce((a, b) => a + b, 0) / emaValues.length).toFixed(2))
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
    throw new Error(`EMA calculation failed: ${error.message}`);
  }
};