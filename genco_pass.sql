-- Genco · Genco Pass (G-Pass) sezon sistemi
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.
-- Tekrar çalıştırmak zarar vermez.
--
-- genco_pass_seasons : her ayın sezon ayarı (ad, tema, seviye başına XP, 30 seviyelik ödül listesi).
--                      Kayıt yoksa uygulama o ay için varsayılan sezonu kendisi üretir.
-- genco_pass_claims  : kim hangi sezonda hangi seviyenin ödülünü aldı. (user_id, season_id, level)
--                      benzersiz olduğu için aynı ödül iki kez alınamaz.

-- ─── Sezonlar ───
create table if not exists public.genco_pass_seasons (
  id            text primary key,                 -- 'YYYY-MM' (ör. 2026-10)
  name          text not null,
  subtitle      text,
  xp_per_level  integer not null default 100 check (xp_per_level between 20 and 2000),
  rewards       jsonb not null default '[]'::jsonb, -- 30 elemanlı ödül listesi (1. seviye → 30. seviye)
  updated_by    uuid references auth.users(id) on delete set null,
  updated_at    timestamptz not null default now()
);

alter table public.genco_pass_seasons enable row level security;

drop policy if exists "gpass_seasons_read" on public.genco_pass_seasons;
create policy "gpass_seasons_read" on public.genco_pass_seasons for select to authenticated using (true);

drop policy if exists "gpass_seasons_admin_write" on public.genco_pass_seasons;
create policy "gpass_seasons_admin_write" on public.genco_pass_seasons for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- ─── Alınan ödüller ───
create table if not exists public.genco_pass_claims (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  season_id   text not null,
  level       integer not null check (level between 1 and 30),
  reward      jsonb not null default '{}'::jsonb,   -- alınan ödülün kopyası (kupon kodu dahil)
  claimed_at  timestamptz not null default now(),
  unique (user_id, season_id, level)
);
create index if not exists gpass_claims_season_idx on public.genco_pass_claims (season_id, claimed_at desc);

alter table public.genco_pass_claims enable row level security;

drop policy if exists "gpass_claims_select" on public.genco_pass_claims;
create policy "gpass_claims_select" on public.genco_pass_claims for select to authenticated
  using (auth.uid() = user_id
         or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "gpass_claims_insert_own" on public.genco_pass_claims;
create policy "gpass_claims_insert_own" on public.genco_pass_claims for insert to authenticated
  with check (auth.uid() = user_id);

-- Silme yalnızca admin: test için ödül kayıtlarını sıfırlayabilsin (üyeler ödülü tekrar almak için silemez)
drop policy if exists "gpass_claims_admin_delete" on public.genco_pass_claims;
create policy "gpass_claims_admin_delete" on public.genco_pass_claims for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
