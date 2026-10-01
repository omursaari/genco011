-- Genco · Mini oyun skorları (şimdilik Genco Stack; Snake/Flappy de aynı tabloyu kullanabilir)
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.
-- Tekrar çalıştırmak zarar vermez.
--
-- game_scores : kullanıcı başına, oyun başına, dönem başına EN İYİ skor.
--   game       : 'stack' | 'snake' | 'flappy' …
--   season_id  : 'all' (tüm zamanlar) ya da G-Pass ile aynı biçimde 'YYYY-MM' (aylık sezon)
--   (user_id, game, season_id) benzersiz → her dönem için tek satır, sadece rekor kırılınca güncellenir.
--
-- Sıralama:  select * from game_scores where game='stack' and season_id='2026-10' order by best_score desc limit 50;
-- Arkadaşlar: aynı sorgu + user_id in (arkadaş id listesi)

create table if not exists public.game_scores (
  user_id       uuid not null references auth.users(id) on delete cascade,
  game          text not null check (game ~ '^[a-z0-9_-]{2,24}$'),
  season_id     text not null check (season_id = 'all' or season_id ~ '^\d{4}-\d{2}$'),
  best_score    integer not null default 0 check (best_score >= 0),
  best_floor    integer not null default 0 check (best_floor >= 0),
  games_played  integer not null default 0 check (games_played >= 0),
  updated_at    timestamptz not null default now(),
  primary key (user_id, game, season_id)
);
create index if not exists game_scores_board_idx on public.game_scores (game, season_id, best_score desc);

alter table public.game_scores enable row level security;

-- Herkes sıralamayı okuyabilir (giriş yapmış kullanıcılar)
drop policy if exists "game_scores_read" on public.game_scores;
create policy "game_scores_read" on public.game_scores for select to authenticated using (true);

-- Doğrudan yazma yok: skorlar yalnızca aşağıdaki fonksiyonla gönderilir (rekor düşürülemez)
drop policy if exists "game_scores_admin_delete" on public.game_scores;
create policy "game_scores_admin_delete" on public.game_scores for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Oyun bitince çağrılır: tüm zamanlar + bu ayın sezonu için rekoru günceller, oyun sayısını artırır.
-- Makul olmayan skorları reddeder (oyun başına üst sınır).
create or replace function public.submit_game_score(p_game text, p_score integer, p_floor integer default 0)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_season text := to_char(now() at time zone 'Europe/Istanbul', 'YYYY-MM');
  v_max    integer := case p_game when 'stack' then 200000 else 100000 end;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_game !~ '^[a-z0-9_-]{2,24}$' then raise exception 'invalid game'; end if;
  if p_score is null or p_score < 0 or p_score > v_max then raise exception 'invalid score'; end if;
  p_floor := greatest(0, least(coalesce(p_floor, 0), 100000));

  insert into public.game_scores as g (user_id, game, season_id, best_score, best_floor, games_played, updated_at)
  values (v_uid, p_game, 'all', p_score, p_floor, 1, now()),
         (v_uid, p_game, v_season, p_score, p_floor, 1, now())
  on conflict (user_id, game, season_id) do update
    set games_played = g.games_played + 1,
        best_floor   = greatest(g.best_floor, excluded.best_floor),
        best_score   = greatest(g.best_score, excluded.best_score),
        updated_at   = case when excluded.best_score > g.best_score then now() else g.updated_at end;
end;
$$;

revoke all on function public.submit_game_score(text, integer, integer) from public;
grant execute on function public.submit_game_score(text, integer, integer) to authenticated;
