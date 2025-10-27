/**
 * Trading Indicators Index
 * Exports all trading indicators definitions and handlers
 */

// Import all indicators
import { rsiDefinition, rsiHandler } from './rsi.js';
import { emaDefinition, emaHandler } from './ema.js';
import { smaDefinition, smaHandler } from './sma.js';
import { macdDefinition, macdHandler } from './macd.js';
import { bollingerBandsDefinition, bollingerBandsHandler } from './bollingerBands.js';
import { stochasticDefinition, stochasticHandler } from './stochastic.js';
import { atrDefinition, atrHandler } from './atr.js';

/**
 * All trading indicators definitions
 */
export const tradingIndicatorsDefinitions = [
  rsiDefinition,
  emaDefinition,
  smaDefinition,
  macdDefinition,
  bollingerBandsDefinition,
  stochasticDefinition,
  atrDefinition
];

/**
 * All trading indicators handlers
 */
export const tradingIndicatorsHandlers = {
  [rsiDefinition.name]: rsiHandler,
  [emaDefinition.name]: emaHandler,
  [smaDefinition.name]: smaHandler,
  [macdDefinition.name]: macdHandler,
  [bollingerBandsDefinition.name]: bollingerBandsHandler,
  [stochasticDefinition.name]: stochasticHandler,
  [atrDefinition.name]: atrHandler
};

/**
 * Get indicator by name
 * @param {string} name - Indicator name
 * @returns {object|null} Indicator definition and handler
 */
export function getIndicator(name) {
  const definition = tradingIndicatorsDefinitions.find(ind => ind.name === name);
  const handler = tradingIndicatorsHandlers[name];

  if (definition && handler) {
    return { definition, handler };
  }

  return null;
}

/**
 * List all available indicators
 * @returns {Array} Array of indicator names and descriptions
 */
export function listIndicators() {
  return tradingIndicatorsDefinitions.map(ind => ({
    name: ind.name,
    description: ind.description
  }));
}