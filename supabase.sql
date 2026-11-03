-- Aitxorapp · Etapa 1: base de datos con seguridad por usuario
-- Pégalo entero en Supabase → SQL Editor → New query → Run

create table if not exists public.app_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb       not null default '{}'::jsonb,
  rev        bigint      not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "leer lo mio"     on public.app_state;
drop policy if exists "crear lo mio"    on public.app_state;
drop policy if exists "editar lo mio"   on public.app_state;
drop policy if exists "borrar lo mio"   on public.app_state;

create policy "leer lo mio"   on public.app_state for select to authenticated using ((select auth.uid()) = user_id);
create policy "crear lo mio"  on public.app_state for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "editar lo mio" on public.app_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "borrar lo mio" on public.app_state for delete to authenticated using ((select auth.uid()) = user_id);

-- La revisión sube sola en cada cambio (evita pisar datos entre dispositivos)
create or replace function public.app_state_bump() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.rev := old.rev + 1;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists app_state_bump on public.app_state;
create trigger app_state_bump before update on public.app_state
  for each row execute function public.app_state_bump();
