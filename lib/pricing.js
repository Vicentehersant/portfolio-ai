/**
 * lib/pricing.js — USD per 1M tokens, used for cost tracking only.
 * Update when Anthropic changes prices: https://www.anthropic.com/pricing
 */
const MODEL_PRICING = {
  'claude-haiku-4-5':          { input: 1, output: 5 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5 },
  'claude-sonnet-4-5':         { input: 3, output: 15 },
};
const DEFAULT_PRICING = { input: 1, output: 5 };

// Cache writes cost 1.25x input, cache reads 0.1x input (5-minute cache).
function estimateCost(model, u = {}) {
  const p = MODEL_PRICING[model] || DEFAULT_PRICING;
  const usd =
    ((u.inputTokens || 0) * p.input +
      (u.cacheWriteTokens || 0) * p.input * 1.25 +
      (u.cacheReadTokens || 0) * p.input * 0.1 +
      (u.outputTokens || 0) * p.output) / 1e6;
  return Math.round(usd * 1e6) / 1e6;
}

module.exports = { MODEL_PRICING, DEFAULT_PRICING, estimateCost };
