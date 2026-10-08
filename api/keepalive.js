/**
 * api/keepalive.js — Portfolio AI (optional)
 * Supabase pauses free projects after ~7 idle days. The Vercel cron in
 * vercel.json hits this daily. If CRON_SECRET is set, Vercel Cron sends
 * it as a Bearer token and anything else is rejected.
 */
const db = require('../lib/supabase');

module.exports = async function handler(req, res) {
  if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!db.enabled()) return res.status(200).json({ ok: true, skipped: 'Supabase not configured' });
  try {
    await db.select('conversations', 'select=id&limit=1');
    return res.status(200).json({ ok: true, pinged: new Date().toISOString() });
  } catch (err) {
    console.error('[keepalive error]', err.message);
    return res.status(500).json({ ok: false });
  }
};
