-- ═══ GENCO EKONOMİ v3 · görev coin'leri 60–120 bandında ═══
-- Coin, görevin XP'sine (zorluğuna) bağlı:
--   20 XP → 60 / 70 / 75   ·   30 XP → 80 / 85 / 90   ·   40 XP → 100   ·   50 XP → 120
-- Aynı XP'deki görevler bandın değerlerine görev kimliğine göre sabit dağılır (her çalıştırmada aynı sonuç).
-- Ortalama ~80 coin: günde 5 görev ≈ 400 coin, 3 görev ≈ 240 coin.
-- Supabase → SQL Editor'de bir kez çalıştır. economy_v2.sql'i çalıştırmadıysan 1. adım onu da yapar.

-- 1) XP'leri 20–50 bandına çek (economy_v2 ile aynı; zaten yapıldıysa hiçbir şey değiştirmez)
update public.tasks set xp_reward = case
  when xp_reward <= 30 then 20
  when xp_reward <= 50 then 30
  when xp_reward <= 80 then 40
  else 50
end
where exists (select 1 from public.tasks t where t.xp_reward > 50);

-- 2) Coin'leri XP'ye göre bant içinde dağıt
update public.tasks set coin_reward = case
  when xp_reward <= 20 then (array[60, 70, 75])[1 + abs(hashtext(id::text)) % 3]
  when xp_reward <= 30 then (array[80, 85, 90])[1 + abs(hashtext(id::text)) % 3]
  when xp_reward <= 40 then 100
  else 120
end;

-- Kontrol
select xp_reward, coin_reward, count(*) as gorev
from public.tasks
group by xp_reward, coin_reward
order by xp_reward, coin_reward;
