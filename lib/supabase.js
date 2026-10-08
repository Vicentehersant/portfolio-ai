/**
 * lib/supabase.js — tiny optional Supabase REST client (no SDK needed).
 * Every helper is a silent no-op unless SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY are set. Server-side only: the service role
 * key must never be shipped to the browser.
 */
function enabled() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function headers(extra = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...extra };
}

async function insert(table, row) {
  if (!enabled()) return false;
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: headers({ Prefer: 'return=minimal' }),
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`Supabase insert ${table} failed: ${res.status} ${await res.text()}`);
  return true;
}

async function select(table, query) {
  if (!enabled()) return [];
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: headers() });
  if (!res.ok) throw new Error(`Supabase select ${table} failed: ${res.status}`);
  return res.json();
}

module.exports = { enabled, insert, select };
