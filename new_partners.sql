-- Genco · Mevcut işletmelerin kategorilerini güncelle (yeni kayıt eklenmez)
--   Rıhtım Giyim → Giyim
--   777 Petshop  → Petshop
--   Galactisos   → Eğlence & Oyun
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.
-- Tekrar çalıştırmak zarar vermez.
-- İsimler veritabanında farklı yazılmış olabileceği için esnek eşleşme kullanılır
-- (ör. "Rıhtım"/"RIHTIM", "777 Pet Shop", "Galactisos Alanya").

-- ─── İŞLETMELER (İşletmeler sayfası) ───
update public.partners set tag = 'Giyim'          where name ilike '%r_ht_m%';
update public.partners set tag = 'Petshop'        where name ilike '%777%';
update public.partners set tag = 'Eğlence & Oyun' where name ilike '%galact%';

-- ─── ÖDÜLLER (Ödüller sayfası, kategori çipleri) ───
update public.rewards set category = 'Giyim'          where partner_name ilike '%r_ht_m%' or name ilike '%r_ht_m%';
update public.rewards set category = 'Petshop'        where partner_name ilike '%777%'    or name ilike '%777%';
update public.rewards set category = 'Eğlence & Oyun' where partner_name ilike '%galact%' or name ilike '%galact%';

-- Eski "Eğlence" kategorisindeki ödülleri de "Eğlence & Oyun" altında topla
update public.rewards set category = 'Eğlence & Oyun' where category in ('Eğlence', 'Eglence');

-- Kontrol: güncellenen kayıtlar (boş dönen varsa isim farklı yazılmıştır, haber ver)
select 'işletme' as tur, name, tag as kategori from public.partners
where name ilike '%r_ht_m%' or name ilike '%777%' or name ilike '%galact%'
union all
select 'ödül', name, category from public.rewards
where partner_name ilike '%r_ht_m%' or partner_name ilike '%777%' or partner_name ilike '%galact%'
   or name ilike '%r_ht_m%' or name ilike '%777%' or name ilike '%galact%';
