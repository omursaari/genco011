-- Genco · 50 görevlik havuz (her kullanıcıya günde rastgele 10 tanesi atanır)
-- Supabase panelinde: SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.
-- Aynı başlıkta görev zaten varsa atlanır; tekrar çalıştırmak zarar vermez.

insert into public.tasks (emoji, title, description, category, difficulty, coin_reward, xp_reward, is_active)
select v.emoji, v.title, v.description, v.category, v.difficulty, v.coin_reward, v.xp_reward, true
from (values
  ('🏖️', 'Sahilden 10 parça çöp topla', 'Sahilde ya da parkta en az 10 parça çöp topla; topladıklarını fotoğrafla.', 'Çevre', 'Orta', 30, 60),
  ('♻️', 'Ambalajları geri dönüşüme at', 'Biriktirdiğin pet şişe, kutu ya da kağıtları geri dönüşüm kutusuna atarken fotoğrafla.', 'Çevre', 'Kolay', 15, 30),
  ('🛍️', 'Alışverişte bez çanta kullan', 'Poşet yerine bez çanta kullandığın alışverişinin fotoğrafını paylaş.', 'Çevre', 'Kolay', 15, 30),
  ('🧴', 'Gün boyu kendi matarandan su iç', 'Tek kullanımlık şişe yerine mataranı yanında taşı; mataranla bir fotoğraf çek.', 'Çevre', 'Kolay', 15, 30),
  ('🔋', 'Atık pilleri toplama kutusuna bırak', 'Evdeki eski pilleri bir atık pil kutusuna bırakırken fotoğrafla.', 'Çevre', 'Kolay', 15, 30),
  ('🚶', 'Bugün araç yerine yürü ya da bisiklete bin', 'Gideceğin bir yere yürüyerek ya da bisikletle git; yolun ya da rotanın fotoğrafını yükle.', 'Çevre', 'Orta', 20, 40),
  ('👕', 'Kullanmadığın bir eşyayı bağışla', 'Giymediğin kıyafeti, kitabı ya da oyuncağı ihtiyaç sahibine veya bağış kutusuna ver.', 'Çevre', 'Orta', 25, 50),
  ('🏰', 'Alanya Kalesi''ne yürüyerek çık', 'Kaleye yürüyerek çık ve zirveden manzarayla bir fotoğraf çek.', 'Spor', 'Zor', 40, 80),
  ('🏃', '3 km koş', 'Koşu uygulamandaki mesafe ve sürenin ekran görüntüsünü yükle.', 'Spor', 'Orta', 25, 50),
  ('🏊', 'Denizde ya da havuzda yüz', 'En az 20 dakika yüz; denizden ya da havuzdan bir fotoğraf paylaş.', 'Spor', 'Orta', 25, 50),
  ('🧘', '15 dakika esneme ya da yoga yap', 'Esneme ya da yoga yaparken çekilmiş bir fotoğrafını veya uygulama ekranını yükle.', 'Spor', 'Kolay', 15, 30),
  ('🚴', 'Sahil yolunda 5 km bisiklet sür', 'Sahil yolunda bisiklet sürerken fotoğraf çek ya da rotanın ekran görüntüsünü yükle.', 'Spor', 'Orta', 25, 50),
  ('🏐', 'Plaj voleybolu oyna', 'Arkadaşlarınla plaj voleybolu oynarken bir fotoğraf paylaş.', 'Spor', 'Orta', 25, 50),
  ('🥾', 'Toros yaylalarında doğa yürüyüşü yap', 'Dim Çayı ya da bir yayla rotasında yürü; parkurdan fotoğraf paylaş.', 'Spor', 'Zor', 45, 90),
  ('👣', 'Bugün 7.500 adım at', 'Adım sayarının ekran görüntüsünü yükle.', 'Sağlık', 'Orta', 20, 40),
  ('🥗', 'Sağlıklı bir öğün hazırla', 'Kendi hazırladığın sağlıklı öğünün fotoğrafını paylaş.', 'Sağlık', 'Kolay', 15, 30),
  ('💧', 'Bugün 2 litre su iç', 'İçtiğin suyun şişelerini ya da su takip uygulamanın ekranını yükle.', 'Sağlık', 'Kolay', 15, 30),
  ('😴', 'En az 8 saat uyu', 'Telefonunun ya da uyku uygulamanın uyku kaydının ekran görüntüsünü yükle.', 'Sağlık', 'Kolay', 15, 30),
  ('📵', 'Yatmadan önce 1 saat telefonsuz kal', 'Ekran süresi raporunun ekran görüntüsünü yükle.', 'Sağlık', 'Orta', 20, 40),
  ('🍎', 'Bugün 3 porsiyon meyve ya da sebze ye', 'Gün içinde yediğin meyve ve sebzelerin fotoğrafını paylaş.', 'Sağlık', 'Kolay', 15, 30),
  ('🩸', 'Kan bağışında bulun (18 yaş ve üzeri)', 'Kızılay''da ya da bir bağış noktasında kan bağışı yap; bağış belgeni ya da fotoğrafını yükle.', 'Sağlık', 'Zor', 60, 120),
  ('📖', 'Bir kitabın 20 sayfasını oku', 'Okuduğun kitabın ve kaldığın sayfanın fotoğrafını çek.', 'Eğitim', 'Kolay', 15, 30),
  ('🗣️', '15 dakika yabancı dil pratiği yap', 'Bir dil uygulamasında ya da bir turistle konuşarak pratik yap, kanıtını yükle.', 'Eğitim', 'Kolay', 15, 30),
  ('🏛️', 'Kızılkule''yi ya da Alanya Müzesi''ni gez', 'Şehrin tarihini keşfet; gezdiğin yerden bir fotoğraf yükle.', 'Eğitim', 'Orta', 30, 60),
  ('🦇', 'Damlataş Mağarası''nı gez', 'Mağarayı gez ve içeriden bir fotoğraf paylaş.', 'Eğitim', 'Orta', 25, 50),
  ('🎧', 'Bir podcast bölümü dinle ve 3 not al', 'Dinlediğin bölümün ekranını ve aldığın notların fotoğrafını yükle.', 'Eğitim', 'Kolay', 15, 30),
  ('💻', 'Online bir derste 30 dakika çalış', 'İzlediğin dersin ya da çözdüğün alıştırmaların ekran görüntüsünü yükle.', 'Eğitim', 'Kolay', 15, 30),
  ('📝', '10 yeni kelime öğren ve yaz', 'Türkçe ya da yabancı dilde öğrendiğin 10 kelimeyi deftere yaz, fotoğrafını çek.', 'Eğitim', 'Kolay', 15, 30),
  ('♟️', 'Bir satranç oyunu oyna', 'Arkadaşınla ya da bir uygulamada satranç oyna; tahtanın ya da sonucun fotoğrafını yükle.', 'Eğitim', 'Kolay', 15, 30),
  ('🎨', 'Bir kursa ya da atölyeye katıl', 'Gençlik merkezinde ya da belediyede bir kurs, atölye veya seminere katıl; oradan fotoğraf yükle.', 'Eğitim', 'Zor', 40, 80),
  ('🎟️', 'Bir Genco etkinliğine katıl', 'Etkinlikler sayfasındaki bir etkinliğe katıl ve oradan fotoğraf yükle.', 'Sosyal', 'Zor', 50, 100),
  ('🧓', 'Bir büyüğünü ziyaret et', 'Bir büyüğünü ziyaret et ya da ona bir işinde yardım et; birlikte bir kare paylaş.', 'Sosyal', 'Orta', 25, 50),
  ('🤲', 'Gönüllü bir faaliyete katıl', 'Bir STK, barınak ya da yardım kampanyasında gönüllü ol; faaliyetten fotoğraf yükle.', 'Sosyal', 'Zor', 50, 100),
  ('💌', 'Bir arkadaşına el yazısıyla not yaz', 'Sevdiğin birine el yazısıyla kısa bir not yaz ve fotoğrafını paylaş.', 'Sosyal', 'Kolay', 15, 30),
  ('🍽️', 'Ailenle birlikte sofra hazırla', 'Ailenle birlikte hazırladığınız sofranın fotoğrafını paylaş.', 'Sosyal', 'Kolay', 15, 30),
  ('🙋', 'Yol soran birine ya da bir turiste yardım et', 'Birine yol tarif et ya da yardım et; o anın ya da yerin fotoğrafını yükle.', 'Sosyal', 'Orta', 20, 40),
  ('📸', 'Genco''da bir gönderi paylaş', 'Topluluk akışında bir gönderi paylaş; gönderinin ekran görüntüsünü yükle.', 'Sosyal', 'Kolay', 15, 30),
  ('👥', 'Genco''daki bir arkadaşınla buluş', 'Genco''da arkadaş olduğun biriyle buluşun ve birlikte bir fotoğraf çekin.', 'Sosyal', 'Orta', 25, 50),
  ('⭐', 'Anlaşmalı bir işletmeye yorum yaz', 'Gittiğin anlaşmalı bir işletmeye Genco''da yorum ve puan bırak; ekran görüntüsünü yükle.', 'Yaşam', 'Kolay', 15, 30),
  ('🎁', 'Coinlerinle bir ödül kullan', 'Ödüller sayfasından bir ödülü anlaşmalı işletmede kullan; fotoğrafını paylaş.', 'Yaşam', 'Orta', 20, 40),
  ('🎸', 'Bir konsere git', 'Gündem sayfasındaki konser takviminden bir konsere git; konserden fotoğraf yükle.', 'Yaşam', 'Zor', 40, 80),
  ('🧹', 'Odanı topla', 'Odanın toplamadan önceki ve sonraki halinin fotoğraflarını yükle.', 'Yaşam', 'Kolay', 15, 30),
  ('💰', 'Bugünkü harcamalarını not et', 'Gün içindeki harcamalarını deftere ya da bir uygulamaya yaz; fotoğrafını veya ekranını yükle.', 'Yaşam', 'Kolay', 15, 30),
  ('🍳', 'Yeni bir yemek tarifi dene', 'Daha önce hiç yapmadığın bir tarifi dene; sonucun fotoğrafını paylaş.', 'Yaşam', 'Orta', 20, 40),
  ('🍊', 'Yerel pazardan alışveriş yap', 'Semt pazarından meyve ya da sebze al; tezgahın ya da aldıklarının fotoğrafını çek.', 'Yaşam', 'Kolay', 15, 30),
  ('🌱', 'Bir fidan dik ya da bitki sula', 'Diktiğin fidanın ya da suladığın bitkinin fotoğrafını çek.', 'Doğa', 'Kolay', 15, 30),
  ('🐾', 'Sokak hayvanlarına mama ve su bırak', 'Sokak hayvanları için mama ve temiz su bırak; fotoğrafını paylaş.', 'Doğa', 'Kolay', 15, 30),
  ('🌅', 'Gün doğumunu izle', 'Erken kalk ve gün doğumunu izle; o anın fotoğrafını yükle.', 'Doğa', 'Orta', 25, 50),
  ('🌇', 'Kleopatra Plajı''nda gün batımını izle', 'Gün batımını sahilden izle ve bir kare paylaş.', 'Doğa', 'Kolay', 15, 30),
  ('🌳', 'Parkta 30 dakika telefonsuz vakit geçir', 'Telefonunu kenara bırakıp parkta dinlen; vardığında ve ayrılırken birer fotoğraf çek.', 'Doğa', 'Kolay', 15, 30)
) as v(emoji, title, description, category, difficulty, coin_reward, xp_reward)
where not exists (
  select 1 from public.tasks t where lower(trim(t.title)) = lower(v.title)
);

-- Kontrol: aktif görev sayısı
select count(*) as aktif_gorev from public.tasks where is_active = true;

-- İSTEĞE BAĞLI: Yeni görevlerin BUGÜN görünmesi için herkesin bugünkü atamasını sıfırla.
-- Kullanıcılar uygulamayı açınca yeni havuzdan 10 görev alır; bugün atanmış görevleri listeden kalkar
-- (gönderdikleri kanıtlar silinmez). Çalıştırmazsan yeni görevler yarın gelir.
-- Uygulama tarihi UTC ile tuttuğu için current_date yerine UTC tarihi kullanılır.
-- delete from public.user_daily_tasks where assigned_date = (now() at time zone 'utc')::date;
