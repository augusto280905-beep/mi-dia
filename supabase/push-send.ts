// Aitxorapp · función "push-send"
// GET  -> devuelve la clave pública (la crea la primera vez)
// POST -> envía los avisos vencidos (lo llama el cron cada minuto)
// POST /ical -> lee un calendario de Google (dirección secreta iCal) para el usuario con sesión iniciada
// POST /health/register -> guarda (hash) un código personal para recibir datos del Apple Watch (usuario con sesión)
// POST /health?t=CODIGO -> recibe sueño / pulso en reposo / VFC desde Atajos de iPhone o Health Auto Export
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const cors = {
  "Access-Control-Allow-Origin": "https://augusto280905-beep.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

async function config() {
  const get = async () => (await db.from("push_config").select("public_key,private_key").eq("id", 1).maybeSingle()).data;
  let c = await get();
  if (!c) {
    const k = webpush.generateVAPIDKeys();
    await db.from("push_config").upsert({ id: 1, public_key: k.publicKey, private_key: k.privateKey }, { onConflict: "id", ignoreDuplicates: true });
    c = await get();
  }
  return c!;
}

// Deja solo lo necesario de cada evento (sin descripciones ni invitados)
function trimIcs(ics: string) {
  const cutoff = new Date(Date.now() - 40 * 864e5).toISOString().slice(0, 10).replace(/-/g, "");
  const un = ics.replace(/\r?\n[ \t]/g, "");
  const parts = un.split(/BEGIN:VEVENT\r?\n/);
  parts.shift();
  const keepProp = /^(DTSTART|DTEND|SUMMARY|LOCATION|RRULE|EXDATE|RECURRENCE-ID|STATUS|UID)[;:]/;
  const out: string[] = [];
  for (const p of parts) {
    const blk = p.split(/END:VEVENT/)[0];
    const m = blk.match(/^DTSTART[^:\n]*:(\d{8})/m);
    if (!m) continue;
    if (m[1] >= cutoff || /^RRULE/m.test(blk) || /^RECURRENCE-ID/m.test(blk)) {
      const lines = blk.split(/\r?\n/).filter((l) => keepProp.test(l));
      out.push("BEGIN:VEVENT\r\n" + lines.join("\r\n") + "\r\nEND:VEVENT\r\n");
    }
  }
  return "BEGIN:VCALENDAR\r\nVERSION:2.0\r\n" + out.join("") + "END:VCALENDAR\r\n";
}

async function ical(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: u } = await db.auth.getUser(token);
  if (!u?.user) return json({ error: "Sesión no válida. Vuelve a entrar." }, 401);
  const { url } = await req.json().catch(() => ({ url: "" }));
  if (typeof url !== "string" || !/^https:\/\/calendar\.google\.com\/calendar\/ical\/[^\s]+\.ics$/i.test(url)) {
    return json({ error: "Dirección no válida (debe ser de Google Calendar)." }, 400);
  }
  const r = await fetch(url, { headers: { "User-Agent": "Aitxorapp" } });
  if (!r.ok) return json({ error: "Google respondió " + r.status + ". Revisa la dirección secreta." }, 502);
  const text = await r.text();
  if (!text.startsWith("BEGIN:VCALENDAR")) return json({ error: "La respuesta no es un calendario." }, 502);
  return new Response(trimIcs(text), { headers: { ...cors, "Content-Type": "text/calendar; charset=utf-8" } });
}


// ---------- Apple Watch / Salud ----------
async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
async function healthRegister(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: u } = await db.auth.getUser(token);
  if (!u?.user) return json({ error: "Sesión no válida. Vuelve a entrar." }, 401);
  const { code } = await req.json().catch(() => ({ code: "" }));
  if (typeof code !== "string" || !/^[a-f0-9]{32}$/.test(code)) return json({ error: "Código no válido." }, 400);
  await db.from("health_tokens").delete().eq("user_id", u.user.id);
  const { error } = await db.from("health_tokens").insert({ hash: await sha(code), user_id: u.user.id });
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}
const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && isFinite(+v) ? +v : null);
// Acepta {date, sleep_h, rhr, hrv} sencillo o el JSON de Health Auto Export ({data:{metrics:[...]}})
function extractHealth(b: any): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  const put = (d: unknown, k: string, v: number | null) => {
    if (v === null || typeof d !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(d)) return;
    (out[d.slice(0, 10)] ||= {})[k] = Math.round(v * 100) / 100;
  };
  const today = new Date().toISOString().slice(0, 10);
  if (b && typeof b === "object") {
    const d = typeof b.date === "string" ? b.date : today;
    // Un Atajo puede dar la duración en horas, minutos o segundos: >1440 = segundos, >24 = minutos
    const sh = num(b.sleep_h);
    put(d, "sleep_h", sh === null ? null : sh > 1440 ? sh / 3600 : sh > 24 ? sh / 60 : sh);
    put(d, "rhr", num(b.rhr)); put(d, "hrv", num(b.hrv));
    const ms = b?.data?.metrics;
    if (Array.isArray(ms)) {
      for (const m of ms) {
        const name = String(m?.name ?? ""), toH = String(m?.units ?? "").startsWith("min") ? 1 / 60 : 1;
        for (const p of Array.isArray(m?.data) ? m.data : []) {
          if (name === "sleep_analysis") {
            const t = num(p.totalSleep) ?? num(p.asleep) ?? ((num(p.core) ?? 0) + (num(p.deep) ?? 0) + (num(p.rem) ?? 0) || null);
            put(p.date ?? p.sleepEnd, "sleep_h", t === null ? null : t * toH);
          } else if (name === "resting_heart_rate") put(p.date, "rhr", num(p.qty));
          else if (name === "heart_rate_variability") put(p.date, "hrv", num(p.qty));
        }
      }
    }
  }
  return out;
}
async function health(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("t") ?? req.headers.get("x-health-code") ?? "";
  if (!/^[a-f0-9]{32}$/.test(code)) return json({ error: "Falta el código." }, 401);
  const { data: t } = await db.from("health_tokens").select("user_id").eq("hash", await sha(code)).maybeSingle();
  if (!t) return json({ error: "Código desconocido." }, 401);
  const body = await req.json().catch(() => null);
  const days = extractHealth(body);
  let n = 0;
  for (const [date, vals] of Object.entries(days)) {
    const { data: old } = await db.from("health_in").select("data").eq("user_id", t.user_id).eq("date", date).maybeSingle();
    await db.from("health_in").upsert({ user_id: t.user_id, date, data: { ...(old?.data ?? {}), ...vals }, updated_at: new Date().toISOString() }, { onConflict: "user_id,date" });
    n++;
  }
  return json({ ok: true, days: n });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (req.method === "POST" && new URL(req.url).pathname.endsWith("/ical")) return await ical(req);
    if (req.method === "POST" && new URL(req.url).pathname.endsWith("/health/register")) return await healthRegister(req);
    if (req.method === "POST" && new URL(req.url).pathname.endsWith("/health")) return await health(req);
    const c = await config();
    if (req.method === "GET") return json({ publicKey: c.public_key });
    webpush.setVapidDetails("https://augusto280905-beep.github.io/mi-dia/", c.public_key, c.private_key);

    const now = new Date();
    const since = new Date(now.getTime() - 6 * 3600 * 1000).toISOString();
    // Reclamar de forma atómica los avisos vencidos (evita envíos dobles)
    const { data: due, error } = await db.from("reminders").update({ sent: true })
      .eq("sent", false).lte("at", now.toISOString()).gte("at", since).select("user_id,key,title,body");
    if (error) throw error;
    // Los muy antiguos se marcan como enviados sin mandar nada
    await db.from("reminders").update({ sent: true }).eq("sent", false).lt("at", since);

    let sent = 0, gone = 0;
    for (const r of due ?? []) {
      const { data: subs } = await db.from("push_subs").select("id,endpoint,p256dh,auth").eq("user_id", r.user_id);
      for (const s of subs ?? []) {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify({ title: r.title, body: r.body, tag: r.key, url: "./" }), { TTL: 3600 });
          sent++;
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) { await db.from("push_subs").delete().eq("id", s.id); gone++; }
        }
      }
    }
    return json({ due: due?.length ?? 0, sent, gone });
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
