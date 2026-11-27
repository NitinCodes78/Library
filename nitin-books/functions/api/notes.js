// Cloudflare Pages Function: stores your highlights and notes in Workers KV.
// Cloudflare Access sits in front of the whole site and only lets OWNER in;
// this check is a second lock in case Access is ever switched off by mistake.
const OWNER = "nitingoyal8650@gmail.com";
const KEY = "notes";

export async function onRequest({ request, env }) {
  const email = (request.headers.get("Cf-Access-Authenticated-User-Email") || "").toLowerCase();
  if (email !== OWNER) return new Response("Forbidden", { status: 403 });

  if (request.method === "GET") {
    const v = await env.NOTES.get(KEY);
    return json(v || '{"at":0,"highlights":{}}');
  }
  if (request.method === "PUT") {
    const text = await request.text();
    if (text.length > 5_000_000) return new Response("Too large", { status: 413 });
    let d;
    try { d = JSON.parse(text); } catch { return new Response("Bad JSON", { status: 400 }); }
    if (typeof d.at !== "number" || typeof d.highlights !== "object") return new Response("Bad shape", { status: 400 });
    const old = JSON.parse((await env.NOTES.get(KEY)) || '{"at":0}');
    if (old.at > d.at) return json(JSON.stringify(old));            // a newer copy already exists
    await env.NOTES.put(KEY, text);
    // keep one dated backup per day, so nothing is ever lost
    await env.NOTES.put("backup-" + new Date().toISOString().slice(0, 10), text);
    return json(text);
  }
  return new Response("Method not allowed", { status: 405 });
}
const json = s => new Response(s, { headers: { "content-type": "application/json", "cache-control": "no-store" } });
