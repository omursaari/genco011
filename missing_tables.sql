-- Genco · Eksik tablolar: haftalık KGOİ yarışması ve Genco Lig takım kayıtları
-- Bu tablolar veritabanında yoktu; KGOİ sayfası "yüklenemedi" hatası veriyor,
-- lig kaydı da kaydedilemiyordu.
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.
-- Tekrar çalıştırmak zarar vermez.

-- ─── KGOİ (haftalık bilgi yarışması) denemeleri ───
create table if not exists public.kgoi_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  week_key    text not null,
  score       integer not null default 0,
  coin_reward integer not null default 0,
  xp_reward   integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists kgoi_attempts_user_created_idx
  on public.kgoi_attempts (user_id, created_at desc);

alter table public.kgoi_attempts enable row level security;
drop policy if exists "kgoi_attempts_select_own" on public.kgoi_attempts;
create policy "kgoi_attempts_select_own" on public.kgoi_attempts for select to authenticated
  using (auth.uid() = user_id
         or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
drop policy if exists "kgoi_attempts_insert_own" on public.kgoi_attempts;
create policy "kgoi_attempts_insert_own" on public.kgoi_attempts for insert to authenticated
  with check (auth.uid() = user_id);

-- ─── GENCO LİG takım kayıtları ───
create table if not exists public.league_teams (
  id                  uuid primary key default gen_random_uuid(),
  team_name           text not null,
  phone               text,
  captain_name        text,
  players             jsonb not null default '[]'::jsonb,
  payment_description text,
  created_by          uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now()
);

alter table public.league_teams enable row level security;
-- Telefon numarası içerdiği için: sadece kaydı yapan kullanıcı ve adminler görebilir
drop policy if exists "league_teams_select_own_or_admin" on public.league_teams;
create policy "league_teams_select_own_or_admin" on public.league_teams for select to authenticated
  using (auth.uid() = created_by
         or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
drop policy if exists "league_teams_insert_own" on public.league_teams;
create policy "league_teams_insert_own" on public.league_teams for insert to authenticated
  with check (auth.uid() = created_by);
drop policy if exists "league_teams_admin_delete" on public.league_teams;
create policy "league_teams_admin_delete" on public.league_teams for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Supabase API'nin yeni tabloları hemen görmesi için şema önbelleğini yenile
notify pgrst, 'reload schema';
