// Aitxorapp · función "push-send"
// GET  -> devuelve la clave pública (la crea la primera vez)
// POST -> envía los avisos vencidos (lo llama el cron cada minuto)
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
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
