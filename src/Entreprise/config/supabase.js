// ─────────────────────────────────────────────
// src/Entreprise/config/supabase.js
// Client Supabase partagé entre tous les Studios
// ─────────────────────────────────────────────

const SB_URL = "https://islnwrgghdjozbhvugan.supabase.co";
const SB_KEY = "sb_publishable_JIcs9BSYEl7Mf6y9-tDEAw_0wsf-vyQ";

export const sb = async (path, opts = {}) => {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: {
      "apikey":        SB_KEY,
      "Authorization": `Bearer ${SB_KEY}`,
      "Content-Type":  "application/json",
      "Prefer":        opts.prefer || "return=representation",
      ...(opts.headers || {}),
    },
    method: opts.method || "GET",
    body:   opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
};
