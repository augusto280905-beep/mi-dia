-- Aitxorapp · datos del Apple Watch (sueño, pulso en reposo, VFC)
create table if not exists public.health_tokens (
  hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.health_tokens enable row level security;   -- sin políticas: solo la función (service role) la lee

create table if not exists public.health_in (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);
alter table public.health_in enable row level security;
drop policy if exists "health_in_select_own" on public.health_in;
create policy "health_in_select_own" on public.health_in for select using (auth.uid() = user_id);
