// Proksi Cloudflare Worker untuk "Tanya Pakej Teknologi Tanaman".
// Kunci API Anthropic disimpan sebagai secret (ANTHROPIC_API_KEY), tidak pernah sampai ke pelayar.
// Worker ini hanya terima {messages, tools}; model, had token dan tetapan lain ditetapkan di sini
// supaya orang lain tidak boleh guna proksi ini untuk tujuan lain.

const MODEL = "claude-opus-5-5";
const MAX_TOKENS = 4000;
const MAX_BODY_BYTES = 300_000;
const MAX_MESSAGES = 30;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
    const okOrigin = allowed.includes(origin);
    const cors = {
      "Access-Control-Allow-Origin": okOrigin ? origin : allowed[0] || "",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };
    const reply = (body, status = 200) =>
      new Response(typeof body === "string" ? body : JSON.stringify(body), {
        status, headers: { ...cors, "Content-Type": "application/json" },
      });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return reply({ error: "method_not_allowed" }, 405);
    if (!okOrigin) return reply({ error: "origin_not_allowed" }, 403);

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return reply({ error: "too_large" }, 413);
    let input;
    try { input = JSON.parse(raw); } catch { return reply({ error: "bad_json" }, 400); }
    const { messages, tools } = input || {};
    if (!Array.isArray(messages) || !messages.length || messages.length > MAX_MESSAGES) return reply({ error: "bad_messages" }, 400);

    // Hanya benarkan alat carian buku.
    const safeTools = (Array.isArray(tools) ? tools : [])
      .filter(t => t && t.name === "cari_dalam_buku")
      .map(t => ({ name: t.name, description: String(t.description || "").slice(0, 500), input_schema: t.input_schema }));

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2026-10-21",
        "anthropic-beta": "server-side-fallback-2026-07-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        output_config: { effort: "low" },
        fallbacks: "default",
        messages,
        ...(safeTools.length ? { tools: safeTools } : {}),
      }),
    });
    return reply(await res.text(), res.status);
  },
};
