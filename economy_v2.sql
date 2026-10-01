-- ═══ GENCO EKONOMİ v2 · görev XP'leri 20–50 bandında ═══
-- Mevcut XP'ye göre eşleme: ≤30 → 20 · 31–50 → 30 · 51–80 → 40 · 81+ → 50
-- (Kolay görevler 20, orta görevler 30–40, zor görevler 40–50 XP olur; ortalama ~27 XP.)
-- G-Pass eğrisi ve Kademe eşikleri uygulamada bu ortalamaya göre ayarlandı.
-- Coin değerleri değişmez. Supabase → SQL Editor'de bir kez çalıştır.

update public.tasks set xp_reward = case
  when xp_reward <= 30 then 20
  when xp_reward <= 50 then 30
  when xp_reward <= 80 then 40
  else 50
end
-- Yalnızca henüz dönüştürülmemiş veride çalışır (50'nin üstünde XP varsa). İkinci kez çalıştırmak
-- zaten 20–50 olan değerleri yeniden eşleyip bozmasın diye.
where exists (select 1 from public.tasks t where t.xp_reward > 50);

-- Kontrol: zorluk başına XP dağılımı
select difficulty, xp_reward, count(*) as gorev
from public.tasks
group by difficulty, xp_reward
order by difficulty, xp_reward;
