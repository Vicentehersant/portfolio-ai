/**
 * api/usage-stats.js — Portfolio AI (optional)
 * ─────────────────────────────────────────────────────────────
 * Protected read-only cost/usage summary from the conversations table.
 * ROUTE : GET /api/usage-stats   header  x-admin-key: <ADMIN_DASHBOARD_KEY>
 * Fails closed: returns 404 when ADMIN_DASHBOARD_KEY is unset or wrong.
 * ─────────────────────────────────────────────────────────────
 */
const crypto = require('crypto');
const db = require('../lib/supabase');
const { estimateCost } = require('../lib/pricing');

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const adminKey = process.env.ADMIN_DASHBOARD_KEY;
  const provided = req.headers['x-admin-key'];
  if (!adminKey || !provided || !safeEqual(provided, adminKey)) return res.status(404).json({ error: 'Not found' });
  if (!db.enabled()) return res.status(503).json({ error: 'Supabase is not configured.' });

  try {
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    const rows = await db.select(
      'conversations',
      `select=session_id,model,input_tokens,output_tokens,cache_read_tokens,cache_write_tokens,created_at&created_at=gte.${since}&order=created_at.desc&limit=10000`
    );
    const sessions = new Set();
    let cost = 0, input = 0, output = 0;
    for (const r of rows) {
      sessions.add(r.session_id);
      input += r.input_tokens || 0;
      output += r.output_tokens || 0;
      cost += estimateCost(r.model, {
        inputTokens: r.input_tokens, outputTokens: r.output_tokens,
        cacheReadTokens: r.cache_read_tokens, cacheWriteTokens: r.cache_write_tokens,
      });
    }
    return res.status(200).json({
      window: 'last 30 days',
      messages: rows.length,
      conversations: sessions.size,
      inputTokens: input,
      outputTokens: output,
      estimatedCostUsd: Math.round(cost * 10000) / 10000,
      avgCostPerConversationUsd: sessions.size ? Math.round((cost / sessions.size) * 10000) / 10000 : 0,
    });
  } catch (err) {
    console.error('[usage-stats error]', err.message);
    return res.status(500).json({ error: 'Could not load stats.' });
  }
};
