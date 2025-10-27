/**
 * Stochastic Oscillator Indicator
 * Momentum indicator comparing closing price to price range over a period
 */

import tulind from 'tulind';

export const stochasticDefinition = {
  name: "calculate_stochastic",
  description: "Calculate Stochastic Oscillator - Momentum indicator comparing closing price to price range. Values 0-100: above 80 = overbought, below 20 = oversold. %K crosses above %D = buy signal. Standard settings: 14,3,3.",
  inputSchema: {
    type: "object",
    properties: {
      high: {
        type: "array",
        items: { type: "number" },
        description: "Array of high prices in chronological order (oldest first). Must match length of 'low' and 'close' arrays. Example: [105, 107, 106, 108, ...]",
        minItems: 2
      },
      low: {
        type: "array",
        items: { type: "number" },
        description: "Array of low prices in chronological order (oldest first). Must match length of 'high' and 'close' arrays. Example: [95, 97, 96, 98, ...]",
        minItems: 2
      },
      close: {
        type: "array",
        items: { type: "number" },
        description: "Array of closing prices in chronological order (oldest first). Must match length of 'high' and 'low' arrays. Example: [100, 102, 101, 103, ...]",
        minItems: 2
      },
      kPeriod: {
        type: "number",
        description: "%K period (lookback for high/low range). Standard: 14. Shorter (5) for sensitive signals, longer (21) for smoother.",
        default: 14,
        minimum: 1,
        maximum: 100
      },
      kSmoothPeriod: {
        type: "number",
        description: "%K smoothing period (SMA applied to %K). Standard: 3. Use 1 for fast stochastic (no smoothing).",
        default: 3,
        minimum: 1,
        maximum: 50
      },
      dPeriod: {
        type: "number",
        description: "%D period (SMA of %K, signal line). Standard: 3. This is the slower moving average line.",
        default: 3,
        minimum: 1,
        maximum: 50
      }
    },
    required: ["high", "low", "close"]
  }
};

export const stochasticHandler = async (args) => {
  const { high, low, close, kPeriod = 14, kSmoothPeriod = 3, dPeriod = 3 } = args;

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

  const minDataPoints = kPeriod + kSmoothPeriod + dPeriod;
  if (adjustedHigh.length < minDataPoints) {
    throw new Error(`Insufficient data: need at least ${minDataPoints} data points for Stochastic calculation`);
  }

  // Validate all values are numbers
  const allPrices = [...adjustedHigh, ...adjustedLow, ...adjustedClose];
  if (allPrices.some(price => typeof price !== 'number' || isNaN(price))) {
    throw new Error("All price values must be valid numbers");
  }

  try {
    // Calculate Stochastic using Tulind
    const result = await new Promise((resolve, reject) => {
      tulind.indicators.stoch.indicator([adjustedHigh, adjustedLow, adjustedClose], [kPeriod, kSmoothPeriod, dPeriod], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    const [stochK, stochD] = result;

    // Analyze current values
    const currentK = stochK[stochK.length - 1];
    const currentD = stochD[stochD.length - 1];
    const previousK = stochK[stochK.length - 2];
    const previousD = stochD[stochD.length - 2];

    let signal = "neutral";
    let interpretation = "";

    // Determine signal based on Stochastic analysis
    if (currentK > 80 && currentD > 80) {
      signal = "overbought";
      interpretation = "Both %K and %D above 80 - strong overbought condition, potential sell signal";
    } else if (currentK < 20 && currentD < 20) {
      signal = "oversold";
      interpretation = "Both %K and %D below 20 - strong oversold condition, potential buy signal";
    } else if (currentK > currentD && previousK <= previousD) {
      signal = "bullish_crossover";
      interpretation = "%K crossed above %D - bullish crossover signal";
    } else if (currentK < currentD && previousK >= previousD) {
      signal = "bearish_crossover";
      interpretation = "%K crossed below %D - bearish crossover signal";
    } else if (currentK > currentD) {
      signal = "bullish";
      interpretation = "%K above %D - bullish momentum";
    } else if (currentK < currentD) {
      signal = "bearish";
      interpretation = "%K below %D - bearish momentum";
    } else {
      interpretation = "%K and %D converging - neutral signal";
    }

    // Additional analysis
    const momentum = currentK > previousK ? "increasing" : "decreasing";
    const divergence = Math.abs(currentK - currentD);

    const response = {
      indicator: "Stochastic Oscillator",
      parameters: {
        kPeriod: kPeriod,
        kSmoothPeriod: kSmoothPeriod,
        dPeriod: dPeriod
      },
      dataPoints: adjustedHigh.length,
      values: {
        k: stochK,
        d: stochD
      },
      current: {
        k: Number(currentK.toFixed(2)),
        d: Number(currentD.toFixed(2)),
        signal: signal,
        interpretation: interpretation
      },
      analysis: {
        momentum: momentum,
        divergence: Number(divergence.toFixed(2)),
        overboughtLevel: currentK > 80 || currentD > 80,
        oversoldLevel: currentK < 20 || currentD < 20,
        crossover: Math.abs(currentK - currentD) < 2 // Lines are close
      },
      zones: {
        overbought: { threshold: 80, inZone: currentK > 80 && currentD > 80 },
        oversold: { threshold: 20, inZone: currentK < 20 && currentD < 20 },
        neutral: { inZone: currentK >= 20 && currentK <= 80 && currentD >= 20 && currentD <= 80 }
      }
    };

    // Add warning if arrays were adjusted
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
    throw new Error(`Stochastic calculation failed: ${error.message}`);
  }
};