-- Aitxorapp · Etapa 2: notificaciones push
-- Pégalo entero en Supabase → SQL Editor → New query → Run

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Dispositivos suscritos
create table if not exists public.push_subs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  ua         text,
  created_at timestamptz not null default now()
);
alter table public.push_subs enable row level security;
drop policy if exists "push_subs propios" on public.push_subs;
create policy "push_subs propios" on public.push_subs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Avisos programados (la app los calcula y los sube)
create table if not exists public.reminders (
  user_id uuid not null references auth.users(id) on delete cascade,
  key     text not null,
  at      timestamptz not null,
  title   text not null,
  body    text not null default '',
  sent    boolean not null default false,
  primary key (user_id, key)
);
create index if not exists reminders_due on public.reminders (at) where not sent;
alter table public.reminders enable row level security;
drop policy if exists "reminders propios" on public.reminders;
create policy "reminders propios" on public.reminders for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Claves del servidor de avisos (nadie desde la app puede leerlas: RLS activa y sin políticas)
create table if not exists public.push_config (
  id          int primary key default 1,
  public_key  text not null,
  private_key text not null,
  constraint una_fila check (id = 1)
);
alter table public.push_config enable row level security;

-- Cada minuto, el servidor envía los avisos que toquen
select cron.unschedule('aitx-push') where exists (select 1 from cron.job where jobname = 'aitx-push');
select cron.schedule('aitx-push', '* * * * *', $$
  select net.http_post(
    url     := 'https://mjbsqkchyjfqncrgtfsv.supabase.co/functions/v1/push-send',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body    := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
$$);
