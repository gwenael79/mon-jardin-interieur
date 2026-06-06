// ─────────────────────────────────────────────
// src/Entreprise/services/claude.js
// Appel Claude API via Supabase Edge Function (proxy CORS)

const SB_URL = import.meta.env.VITE_SUPABASE_URL;
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const PROXY  = `${SB_URL}/functions/v1/claude-proxy`;

export const callClaude = async (system, prompt) => {
  const res = await fetch(PROXY, {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system,
      messages:   [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Proxy error ${res.status}: ${err}`);
  }

  const data  = await res.json();
  const text  = data.content?.[0]?.text || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Réponse sans JSON valide");
  return JSON.parse(match[0]);
};

// Système de base MJI — injecté dans chaque studio
export const MJI_SYS = (role) =>
  `Tu es le service IA ${role} de Mon Jardin Intérieur, application de bien-être où l'utilisateur prend soin de sa "fleur intérieure", reflet de son état émotionnel. Philosophie : ralentir active les zones antérieures du cerveau, libère l'espace mental. Ton : personnel, poétique, jamais moralisateur. Réponds UNIQUEMENT en JSON valide, sans markdown ni explication.`;
