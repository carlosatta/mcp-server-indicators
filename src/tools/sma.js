/**
 * SMA (Simple Moving Average) Indicator
 * Calculates the arithmetic mean of prices over a specific period
 */

import tulind from 'tulind';

export const smaDefinition = {
  name: "calculate_sma",
  description: "Calculate SMA (Simple Moving Average) - Classic trend indicator averaging prices over a period. All prices weighted equally. Used to identify trend direction and support/resistance levels. Common periods: 20, 50, 100, 200.",
  inputSchema: {
    type: "object",
    properties: {
      prices: {
        type: "array",
        items: { type: "number" },
        description: "Array of closing prices in chronological order (oldest first). Must contain at least 'period' values. Example: [100, 102, 101, 103, 105, 104, 106]",
        minItems: 1
      },
      period: {
        type: "number",
        description: "SMA period (number of bars to average). Common values: 20 (short-term), 50 (medium-term), 100 (intermediate), 200 (long-term trend). Default: 20.",
        default: 20,
        minimum: 1,
        maximum: 500
      }
    },
    required: ["prices"]
  }
};

export const smaHandler = async (args) => {
  const { prices, period = 20 } = args;

  // Validation
  if (!Array.isArray(prices) || prices.length === 0) {
    throw new Error("Prices must be a non-empty array");
  }

  if (prices.length < period) {
    throw new Error(`Insufficient data: need at least ${period} prices for SMA calculation with period ${period}`);
  }

  if (prices.some(price => typeof price !== 'number' || isNaN(price))) {
    throw new Error("All prices must be valid numbers");
  }

  try {
    // Calculate SMA using Tulind
    const result = await new Promise((resolve, reject) => {
      tulind.indicators.sma.indicator([prices], [period], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const smaValues = result[0];

    // Analyze trend
    const currentPrice = prices[prices.length - 1];
    const currentSMA = smaValues[smaValues.length - 1];
    const previousSMA = smaValues[smaValues.length - 2];

    let trend = "neutral";
    let signal = "hold";
    let interpretation = "";

    // Determine trend direction
    if (currentSMA > previousSMA) {
      trend = "uptrend";
    } else if (currentSMA < previousSMA) {
      trend = "downtrend";
    }

    // Compare current price with SMA
    if (currentPrice > currentSMA) {
      signal = "bullish";
      interpretation = `Price (${currentPrice.toFixed(2)}) is above SMA (${currentSMA.toFixed(2)}) - bullish signal`;
    } else if (currentPrice < currentSMA) {
      signal = "bearish";
      interpretation = `Price (${currentPrice.toFixed(2)}) is below SMA (${currentSMA.toFixed(2)}) - bearish signal`;
    } else {
      interpretation = `Price is at SMA level - neutral signal`;
    }

    const response = {
      indicator: "SMA",
      period: period,
      dataPoints: prices.length,
      values: smaValues,
      current: {
        sma: Number(currentSMA.toFixed(2)),
        price: Number(currentPrice.toFixed(2)),
        trend: trend,
        signal: signal,
        interpretation: interpretation
      },
      statistics: {
        min: Number(Math.min(...smaValues).toFixed(2)),
        max: Number(Math.max(...smaValues).toFixed(2)),
        average: Number((smaValues.reduce((a, b) => a + b, 0) / smaValues.length).toFixed(2))
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
    throw new Error(`SMA calculation failed: ${error.message}`);
  }
};