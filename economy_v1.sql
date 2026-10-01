-- ⚠️ ESKİ: Bunun yerine economy_v3.sql kullan (coin 60–120 bandı). Bu dosyayı v3'ten sonra çalıştırırsan coin'leri geri bozar.
-- ═══ GENCO EKONOMİ v1 · görev coin'leri ═══
-- Görevler en emek isteyen kazanç yolu (fotoğraf + onay), ana coin kaynağı olmalı.
-- Zorluk başına coin: Kolay 40 · Orta 70 · Zor 120. XP değerleri değişmez
-- (Pass'e zaten günde en fazla 150 XP yazılıyor).
-- Supabase → SQL Editor'de bir kez çalıştır.

update public.tasks set coin_reward = 40  where difficulty = 'Kolay';
update public.tasks set coin_reward = 70  where difficulty = 'Orta';
update public.tasks set coin_reward = 120 where difficulty = 'Zor';

-- Kontrol
select difficulty, count(*) as gorev, min(coin_reward) as coin, min(xp_reward) as min_xp, max(xp_reward) as max_xp
from public.tasks
group by difficulty
order by min(coin_reward);
