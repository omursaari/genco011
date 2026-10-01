-- ═══════════════════════════════════════════════════════════════
-- omursaari@gmail.com hesabının XP'sini sıfırlar.
-- Supabase → SQL Editor → hepsini yapıştır → Run. Sonra uygulamayı kapatıp aç.
-- Coin, rozet, unvan ve çerçeveler olduğu gibi kalır.
-- ═══════════════════════════════════════════════════════════════

-- 1) XP = 0, Kademe = Bronz I
update public.user_stats
set xp = 0, level = 'Bronz I'
where id in (select id from auth.users where lower(email) = 'omursaari@gmail.com');

-- 2) Sezon başlangıç XP'si = 0 (json veya jsonb sütunla çalışır)
update public.profiles
set equipped_cosmetics = jsonb_set(
      coalesce(equipped_cosmetics::jsonb, '{}'::jsonb),
      '{season}',
      coalesce(equipped_cosmetics::jsonb -> 'season', '{}'::jsonb) || '{"startXp": 0}'::jsonb
    )
where id in (select id from auth.users where lower(email) = 'omursaari@gmail.com');

-- 3) Kontrol: bu sorgu 1 satır ve xp = 0 göstermeli
select u.email, s.xp, s.level,
       p.equipped_cosmetics::jsonb -> 'season' ->> 'startXp' as season_start_xp
from auth.users u
join public.user_stats s on s.id = u.id
join public.profiles  p on p.id = u.id
where lower(u.email) = 'omursaari@gmail.com';


-- ─── Sonuç boş geldiyse: uygulamaya başka bir e-postayla giriyorsun ───
-- Bu sorgu hesaplardaki e-postaları ve XP'leri listeler; kendi hesabını bul:
-- select u.email, s.xp from auth.users u join public.user_stats s on s.id = u.id order by s.xp desc limit 20;

-- ─── XP sıfırlanıp sonra geri geldiyse: user_stats üzerinde tetikleyici var mı? ───
-- select tgname from pg_trigger where tgrelid = 'public.user_stats'::regclass and not tgisinternal;


-- ─── İSTEĞE BAĞLI: bu sezonun G-Pass ödüllerini de sıfırla ───
-- Başlarındaki "--" işaretlerini kaldırıp çalıştır.

-- delete from public.genco_pass_claims
-- where season_id = to_char(now(), 'YYYY-MM')
--   and user_id in (select id from auth.users where lower(email) = 'omursaari@gmail.com');

-- update public.profiles
-- set equipped_cosmetics = equipped_cosmetics::jsonb #- array['gpass', 'claims', to_char(now(), 'YYYY-MM')]
-- where id in (select id from auth.users where lower(email) = 'omursaari@gmail.com');
