-- Genco · Admin panelinden yönetilen içerikler ve admin yetkileri
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.
-- ÖNCE partner_reviews.sql çalıştırılmış olmalı. Tekrar çalıştırmak zarar vermez.

-- Yardımcı: giriş yapan kullanıcı admin mi?
create or replace function public.is_genco_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ─── KONSERLER (Gündem › konser takvimi) ───
create table if not exists public.genco_concerts (
  id          uuid primary key default gen_random_uuid(),
  artist      text not null,
  event_date  date not null,
  event_time  text,
  venue       text,
  price       text,
  tag         text not null default 'Konser',
  image_url   text,
  ticket_url  text,
  created_at  timestamptz not null default now()
);
alter table public.genco_concerts enable row level security;
drop policy if exists "concerts_read" on public.genco_concerts;
create policy "concerts_read" on public.genco_concerts for select using (true);
drop policy if exists "concerts_admin_write" on public.genco_concerts;
create policy "concerts_admin_write" on public.genco_concerts for all to authenticated
  using (public.is_genco_admin()) with check (public.is_genco_admin());

-- ─── HABERLER (Gündem › Haberler) ───
create table if not exists public.genco_news (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  summary     text,
  tag         text,
  news_date   date not null default current_date,
  image_url   text,
  url         text,
  source      text default 'Alanya Belediyesi',
  created_at  timestamptz not null default now()
);
alter table public.genco_news enable row level security;
drop policy if exists "news_read" on public.genco_news;
create policy "news_read" on public.genco_news for select using (true);
drop policy if exists "news_admin_write" on public.genco_news;
create policy "news_admin_write" on public.genco_news for all to authenticated
  using (public.is_genco_admin()) with check (public.is_genco_admin());

-- ─── Admin: uygunsuz işletme yorumlarını silebilsin ───
drop policy if exists "partner_reviews_admin_delete" on public.partner_reviews;
create policy "partner_reviews_admin_delete" on public.partner_reviews
  for delete to authenticated using (public.is_genco_admin());

-- ─── Admin: lig takımlarını görüp silebilsin (tablo varsa) ───
do $$
begin
  if to_regclass('public.league_teams') is not null then
    execute 'drop policy if exists "league_teams_admin_read" on public.league_teams';
    execute 'create policy "league_teams_admin_read" on public.league_teams for select to authenticated using (public.is_genco_admin())';
    execute 'drop policy if exists "league_teams_admin_delete" on public.league_teams';
    execute 'create policy "league_teams_admin_delete" on public.league_teams for delete to authenticated using (public.is_genco_admin())';
  end if;
end $$;

-- ─── Kullanıcı kendi geri bildirim/destek mesajlarını görebilsin ───
do $$
begin
  if to_regclass('public.help_messages') is not null then
    execute 'drop policy if exists "help_messages_select_own" on public.help_messages';
    execute 'create policy "help_messages_select_own" on public.help_messages for select to authenticated using (auth.uid() = user_id)';
  end if;
end $$;
