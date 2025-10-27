/**
 * Bollinger Bands Indicator
 * Volatility indicator with upper and lower bands around a moving average
 */

import tulind from 'tulind';

export const bollingerBandsDefinition = {
  name: "calculate_bollinger_bands",
  description: "Calculate Bollinger Bands - Volatility indicator with upper/middle/lower bands. Price touching upper band suggests overbought, lower band suggests oversold. Standard settings: 20 period, 2 std dev. Bands widen in volatile markets, narrow in calm periods.",
  inputSchema: {
    type: "object",
    properties: {
      prices: {
        type: "array",
        items: { type: "number" },
        description: "Array of closing prices in chronological order (oldest first). Minimum length: period. Example: [100, 102, 101, 103, 105, 104, 106, ...]",
        minItems: 2
      },
      period: {
        type: "number",
        description: "Moving average period for middle band. Standard: 20 (most common). Shorter periods (10) for faster signals, longer (50) for smoother trend.",
        default: 20,
        minimum: 2,
        maximum: 200
      },
      stdDev: {
        type: "number",
        description: "Standard deviation multiplier for band width. Standard: 2.0 (captures ~95% of price action). Use 2.5 for wider bands, 1.5 for tighter bands.",
        default: 2.0,
        minimum: 0.5,
        maximum: 5.0
      }
    },
    required: ["prices"]
  }
};

export const bollingerBandsHandler = async (args) => {
  const { prices, period = 20, stdDev = 2.0 } = args;

  // Validation
  if (!Array.isArray(prices) || prices.length === 0) {
    throw new Error("Prices must be a non-empty array");
  }

  if (prices.length < period) {
    throw new Error(`Insufficient data: need at least ${period} prices for Bollinger Bands calculation`);
  }

  if (prices.some(price => typeof price !== 'number' || isNaN(price))) {
    throw new Error("All prices must be valid numbers");
  }

  try {
    // Calculate Bollinger Bands using Tulind
    const result = await new Promise((resolve, reject) => {
      tulind.indicators.bbands.indicator([prices], [period, stdDev], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const [lowerBand, middleBand, upperBand] = result;

    // Analyze current position
    const currentPrice = prices[prices.length - 1];
    const currentLower = lowerBand[lowerBand.length - 1];
    const currentMiddle = middleBand[middleBand.length - 1];
    const currentUpper = upperBand[upperBand.length - 1];

    // Calculate position within bands
    const bandWidth = currentUpper - currentLower;
    const positionInBands = (currentPrice - currentLower) / bandWidth;
    const percentB = ((currentPrice - currentLower) / (currentUpper - currentLower)) * 100;

    let signal = "neutral";
    let interpretation = "";

    // Determine signal based on position
    if (currentPrice > currentUpper) {
      signal = "overbought";
      interpretation = `Price (${currentPrice.toFixed(2)}) is above upper band (${currentUpper.toFixed(2)}) - potential overbought condition`;
    } else if (currentPrice < currentLower) {
      signal = "oversold";
      interpretation = `Price (${currentPrice.toFixed(2)}) is below lower band (${currentLower.toFixed(2)}) - potential oversold condition`;
    } else if (currentPrice > currentMiddle) {
      signal = "upper_half";
      interpretation = `Price is in upper half of bands - potential resistance near upper band`;
    } else {
      signal = "lower_half";
      interpretation = `Price is in lower half of bands - potential support near lower band`;
    }

    // Calculate squeeze indicator (low volatility)
    const averageBandWidth = bandWidth / currentMiddle * 100; // As percentage
    const isSqueeze = averageBandWidth < 10; // Arbitrary threshold for squeeze

    const response = {
      indicator: "Bollinger Bands",
      parameters: {
        period: period,
        standardDeviation: stdDev
      },
      dataPoints: prices.length,
      values: {
        lower: lowerBand,
        middle: middleBand,
        upper: upperBand
      },
      current: {
        price: Number(currentPrice.toFixed(2)),
        lower: Number(currentLower.toFixed(2)),
        middle: Number(currentMiddle.toFixed(2)),
        upper: Number(currentUpper.toFixed(2)),
        signal: signal,
        interpretation: interpretation
      },
      analysis: {
        percentB: Number(percentB.toFixed(2)),
        positionInBands: Number((positionInBands * 100).toFixed(2)),
        bandWidth: Number(bandWidth.toFixed(2)),
        bandWidthPercent: Number(averageBandWidth.toFixed(2)),
        squeeze: isSqueeze,
        volatility: averageBandWidth > 20 ? "high" : averageBandWidth < 10 ? "low" : "normal"
      },
      signals: {
        bounceFromLower: currentPrice > currentLower && (currentPrice - currentLower) / bandWidth < 0.1,
        bounceFromUpper: currentPrice < currentUpper && (currentUpper - currentPrice) / bandWidth < 0.1,
        breakoutAbove: currentPrice > currentUpper,
        breakoutBelow: currentPrice < currentLower
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
    throw new Error(`Bollinger Bands calculation failed: ${error.message}`);
  }
};