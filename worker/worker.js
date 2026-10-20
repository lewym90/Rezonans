// Rezonans: generator obrazów (Cloudflare Workers AI, FLUX schnell)
const ALLOWED = ['https://lewym90.github.io', 'http://localhost:8765'];

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const ok = ALLOWED.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': ok ? origin : ALLOWED[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin'
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST' || !ok) return new Response('Brak dostępu', { status: 403, headers: cors });
    try {
      const { prompt, steps } = await req.json();
      if (!prompt || prompt.length > 1500) return new Response('Zły prompt', { status: 400, headers: cors });
      const out = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', { prompt, steps: Math.min(Math.max(steps || 4, 1), 8) });
      const bin = Uint8Array.from(atob(out.image), (c) => c.charCodeAt(0));
      return new Response(bin, { headers: Object.assign({ 'Content-Type': 'image/jpeg' }, cors) });
    } catch (e) {
      return new Response('Błąd generowania: ' + e.message, { status: 500, headers: cors });
    }
  }
};
