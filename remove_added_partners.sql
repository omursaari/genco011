-- Genco · new_partners.sql'in ilk sürümünün eklediği kopya işletme/ödülleri sil
-- Sadece o dosyanın eklediği kayıtlar silinir (isim + açıklama birebir eşleşir);
-- senin önceden eklediğin Rıhtım Giyim, 777 Petshop ve Galactisos kayıtlarına dokunulmaz.
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.

-- 1) Önizleme: silinecek kayıtlar
select 'işletme' as tur, id::text, name, description from public.partners
where (name, description) in (
  ('Rıhtım Giyim', 'Rıhtım Giyim''de Genco üyelerine özel indirim.'),
  ('777 Petshop',  '777 Petshop''ta Genco üyelerine özel indirim.'),
  ('Galactisos',   'Galactisos''ta Genco üyelerine özel indirim.')
)
union all
select 'ödül', id::text, name, description from public.rewards
where (name, description) in (
  ('Rıhtım Giyim %10 İndirim', 'Rıhtım Giyim''de tüm ürünlerde %10 indirim.'),
  ('777 Petshop %10 İndirim',  '777 Petshop''ta tüm ürünlerde %10 indirim.'),
  ('Galactisos %10 İndirim',   'Galactisos''ta oyunlarda %10 indirim.')
);

-- 2) Silme
delete from public.rewards
where (name, description) in (
  ('Rıhtım Giyim %10 İndirim', 'Rıhtım Giyim''de tüm ürünlerde %10 indirim.'),
  ('777 Petshop %10 İndirim',  '777 Petshop''ta tüm ürünlerde %10 indirim.'),
  ('Galactisos %10 İndirim',   'Galactisos''ta oyunlarda %10 indirim.')
);

delete from public.partners
where (name, description) in (
  ('Rıhtım Giyim', 'Rıhtım Giyim''de Genco üyelerine özel indirim.'),
  ('777 Petshop',  '777 Petshop''ta Genco üyelerine özel indirim.'),
  ('Galactisos',   'Galactisos''ta Genco üyelerine özel indirim.')
);

-- 3) Kontrol: kalan kayıtlar (senin eklediklerin)
select 'işletme' as tur, name, tag as kategori from public.partners
where name ilike '%r_ht_m%' or name ilike '%777%' or name ilike '%galact%'
union all
select 'ödül', name, category from public.rewards
where partner_name ilike '%r_ht_m%' or partner_name ilike '%777%' or partner_name ilike '%galact%';
