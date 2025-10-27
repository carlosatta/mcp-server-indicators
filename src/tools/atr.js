/**
 * ATR (Average True Range) Indicator
 * Measures market volatility by calculating the average of true ranges
 */

import tulind from 'tulind';

export const atrDefinition = {
  name: "calculate_atr",
  description: "Calculate ATR (Average True Range) - Volatility indicator measuring market volatility regardless of direction. Higher ATR = more volatile. Used for position sizing and stop-loss placement. Standard period: 14.",
  inputSchema: {
    type: "object",
    properties: {
      high: {
        type: "array",
        items: { type: "number" },
        description: "Array of high prices in chronological order (oldest first). Must match length of 'low' and 'close'. Example: [105, 107, 106, 108, ...]",
        minItems: 2
      },
      low: {
        type: "array",
        items: { type: "number" },
        description: "Array of low prices in chronological order (oldest first). Must match length of 'high' and 'close'. Example: [95, 97, 96, 98, ...]",
        minItems: 2
      },
      close: {
        type: "array",
        items: { type: "number" },
        description: "Array of closing prices in chronological order (oldest first). Must match length of 'high' and 'low'. Example: [100, 102, 101, 103, ...]",
        minItems: 2
      },
      period: {
        type: "number",
        description: "ATR period (smoothing period). Standard: 14 (Wilder's original). Shorter (7) for day trading, longer (21) for swing trading.",
        default: 14,
        minimum: 1,
        maximum: 100
      }
    },
    required: ["high", "low", "close"]
  }
};

export const atrHandler = async (args) => {
  const { high, low, close, period = 14 } = args;

  // Validation
  if (!Array.isArray(high) || !Array.isArray(low) || !Array.isArray(close)) {
    throw new Error("High, low, and close must be arrays");
  }

  let warning = null;
  let adjustedHigh = high;
  let adjustedLow = low;
  let adjustedClose = close;

  // Auto-adjust arrays to shortest length
  if (high.length !== low.length || low.length !== close.length) {
    const minLength = Math.min(high.length, low.length, close.length);
    warning = `Array length mismatch detected (high=${high.length}, low=${low.length}, close=${close.length}). Automatically adjusted to shortest length: ${minLength}`;
    adjustedHigh = high.slice(0, minLength);
    adjustedLow = low.slice(0, minLength);
    adjustedClose = close.slice(0, minLength);
  }

  if (adjustedHigh.length === 0) {
    throw new Error("Price arrays must not be empty");
  }

  if (adjustedHigh.length < period + 1) {
    throw new Error(`Insufficient data: need at least ${period + 1} data points for ATR calculation`);
  }

  // Validate all values are numbers
  const allPrices = [...adjustedHigh, ...adjustedLow, ...adjustedClose];
  if (allPrices.some(price => typeof price !== 'number' || isNaN(price))) {
    throw new Error("All price values must be valid numbers");
  }

  try {
    // Calculate ATR using Tulind
    const result = await new Promise((resolve, reject) => {
      tulind.indicators.atr.indicator([adjustedHigh, adjustedLow, adjustedClose], [period], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const atrValues = result[0];

    // Analyze current ATR
    const currentATR = atrValues[atrValues.length - 1];
    const previousATR = atrValues[atrValues.length - 2];
    const currentPrice = adjustedClose[adjustedClose.length - 1];

    // Calculate ATR as percentage of current price
    const atrPercent = (currentATR / currentPrice) * 100;

    // Analyze volatility trend
    let volatilityTrend = "stable";
    let interpretation = "";

    const atrChange = ((currentATR - previousATR) / previousATR) * 100;

    if (atrChange > 5) {
      volatilityTrend = "increasing";
      interpretation = "Volatility is increasing - market becoming more active";
    } else if (atrChange < -5) {
      volatilityTrend = "decreasing";
      interpretation = "Volatility is decreasing - market becoming quieter";
    } else {
      interpretation = "Volatility is stable - consistent market conditions";
    }

    // Classify volatility level
    let volatilityLevel = "normal";
    if (atrPercent > 3) {
      volatilityLevel = "high";
    } else if (atrPercent < 1) {
      volatilityLevel = "low";
    }

    // Calculate potential support/resistance levels based on ATR
    const potentialSupport = currentPrice - currentATR;
    const potentialResistance = currentPrice + currentATR;

    const response = {
      indicator: "ATR",
      parameters: {
        period: period
      },
      dataPoints: high.length,
      values: atrValues,
      current: {
        atr: Number(currentATR.toFixed(4)),
        atrPercent: Number(atrPercent.toFixed(2)),
        price: Number(currentPrice.toFixed(2)),
        volatilityLevel: volatilityLevel,
        volatilityTrend: volatilityTrend,
        interpretation: interpretation
      },
      analysis: {
        changePercent: Number(atrChange.toFixed(2)),
        averageATR: Number((atrValues.reduce((a, b) => a + b, 0) / atrValues.length).toFixed(4)),
        minATR: Number(Math.min(...atrValues).toFixed(4)),
        maxATR: Number(Math.max(...atrValues).toFixed(4))
      },
      tradingLevels: {
        support: Number(potentialSupport.toFixed(2)),
        resistance: Number(potentialResistance.toFixed(2)),
        stopLossDistance: Number(currentATR.toFixed(4)),
        takeProfitDistance: Number((currentATR * 2).toFixed(4))
      },
      volatilityClassification: {
        high: atrPercent > 3,
        normal: atrPercent >= 1 && atrPercent <= 3,
        low: atrPercent < 1,
        description: `ATR is ${atrPercent.toFixed(2)}% of current price`
      }
    };

    // Add warning field if arrays were adjusted
    if (warning) {
      response.warning = warning;
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response, null, 2)
        }
      ]
    };

  } catch (error) {
    throw new Error(`ATR calculation failed: ${error.message}`);
  }
};