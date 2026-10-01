-- Genco · Bugünün görevlerini herkese yeniden dağıt
-- ÖNCE tasks_seed.sql çalıştırılmış olmalı (50 görev tabloda olmalı).
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.
--
-- Ne yapar:
--   1) Tüm kullanıcıların BUGÜNKÜ görev atamalarını siler (gönderilmiş kanıtlar silinmez).
--   2) Her kullanıcıya 50 görevlik havuzdan kendine özel, rastgele 10 görev atar.
-- Uygulama günü UTC tarihine göre tuttuğu için burada da UTC tarihi kullanılır.
-- Yarından itibaren uygulama her gün otomatik olarak yeni 10 görev atar.

begin;

delete from public.user_daily_tasks
where assigned_date = (now() at time zone 'utc')::date;

insert into public.user_daily_tasks (user_id, task_id, assigned_date)
select p.id, pick.id, (now() at time zone 'utc')::date
from public.profiles p
cross join lateral (
  select t.id
  from public.tasks t
  where t.is_active = true
    and t.title in (
    'Sahilden 10 parça çöp topla',
    'Ambalajları geri dönüşüme at',
    'Alışverişte bez çanta kullan',
    'Gün boyu kendi matarandan su iç',
    'Atık pilleri toplama kutusuna bırak',
    'Bugün araç yerine yürü ya da bisiklete bin',
    'Kullanmadığın bir eşyayı bağışla',
    'Alanya Kalesi''ne yürüyerek çık',
    '3 km koş',
    'Denizde ya da havuzda yüz',
    '15 dakika esneme ya da yoga yap',
    'Sahil yolunda 5 km bisiklet sür',
    'Plaj voleybolu oyna',
    'Toros yaylalarında doğa yürüyüşü yap',
    'Bugün 7.500 adım at',
    'Sağlıklı bir öğün hazırla',
    'Bugün 2 litre su iç',
    'En az 8 saat uyu',
    'Yatmadan önce 1 saat telefonsuz kal',
    'Bugün 3 porsiyon meyve ya da sebze ye',
    'Kan bağışında bulun (18 yaş ve üzeri)',
    'Bir kitabın 20 sayfasını oku',
    '15 dakika yabancı dil pratiği yap',
    'Kızılkule''yi ya da Alanya Müzesi''ni gez',
    'Damlataş Mağarası''nı gez',
    'Bir podcast bölümü dinle ve 3 not al',
    'Online bir derste 30 dakika çalış',
    '10 yeni kelime öğren ve yaz',
    'Bir satranç oyunu oyna',
    'Bir kursa ya da atölyeye katıl',
    'Bir Genco etkinliğine katıl',
    'Bir büyüğünü ziyaret et',
    'Gönüllü bir faaliyete katıl',
    'Bir arkadaşına el yazısıyla not yaz',
    'Ailenle birlikte sofra hazırla',
    'Yol soran birine ya da bir turiste yardım et',
    'Genco''da bir gönderi paylaş',
    'Genco''daki bir arkadaşınla buluş',
    'Anlaşmalı bir işletmeye yorum yaz',
    'Coinlerinle bir ödül kullan',
    'Bir konsere git',
    'Odanı topla',
    'Bugünkü harcamalarını not et',
    'Yeni bir yemek tarifi dene',
    'Yerel pazardan alışveriş yap',
    'Bir fidan dik ya da bitki sula',
    'Sokak hayvanlarına mama ve su bırak',
    'Gün doğumunu izle',
    'Kleopatra Plajı''nda gün batımını izle',
    'Parkta 30 dakika telefonsuz vakit geçir'
    )
  -- p.id'ye bağlı sıralama: her kullanıcı için ayrı rastgele seçim yapılır
  order by md5(t.id::text || p.id::text || random()::text)
  limit 10
) as pick;

commit;

-- Kontrol: kullanıcı başına bugün kaç görev atandı (hepsi 10 olmalı)
select p.username, count(u.id) as bugunku_gorev
from public.profiles p
left join public.user_daily_tasks u
  on u.user_id = p.id and u.assigned_date = (now() at time zone 'utc')::date
group by p.username
order by bugunku_gorev, p.username;
