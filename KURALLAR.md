# Kıraathane Kural Kitabı

Oyun motorunun uyguladığı kuralların yazılı hali. Bir kural değişirse önce burası, sonra kod ve test değişir.
"Varsayılan" işaretli maddeler senin açıkça belirtmediğin, en yaygın varyantla doldurduğumuz yerlerdir; istenirse değişir.

## Ortak

- Tüm hamleler `dispatchAction({ type, seat, payload })` ile gönderilir, oyun durumunu yalnızca oyun motoru değiştirir.
- **Hamle süresi:** Okey 20 sn, 101 30 sn, Batak 15 sn, Poker 20 sn. Okey ve 101'de süre bir turun tamamı içindir (çek + aç/işle + at).
- **Süre dolunca otomatik hamle:**
  - Okey / 101: ortadan çekilir, en işe yaramaz taş atılır. Oyuncu adına el açılmaz, bitirilmez. Yandan taş alınmışsa önce o taş kullanılır.
  - Batak: ihalede pas, koz seçiminde en uzun renk, oyunda kurala uyan kart.
  - Poker: görülecek bahis varsa pas, yoksa kontrol.
- **Uzakta:** Üst üste iki kez süresi dolan oyuncu "uzakta" sayılır, yerine otomatik oynanır. Kendi hamlesini yapınca ya da "Oyuna dön"e basınca geri döner.

## Okey

- 106 taş, 4 renk × 1–13 × 2 + 2 sahte okey. Göstergenin bir üstü okeydir, sahte okey okeyin yerini tutar.
- Başlayan 15, diğerleri 14 taş alır. Sırası gelen ortadan ya da solundan çeker, sağına atar.
- Bitiş: kalan 14 taşın tamamı seri/küt perlere oturmalı ya da 7 çift olmalı. Bitiren son taşı göstergenin üstüne bırakır.
- **Puanlama:** Herkes 20 puanla başlar. Düz bitişte bitiren 20'de kalır, diğerleri 2 düşer. Okeyle bitiş 2 kat (4), çiftten bitiş 2 kat (4), ikisi birden 4 kat (8). Biri 0'a inince oyun biter, en yüksek puan kazanır.
- Açık konu: 12-13-1 serisi Okey'de geçerli mi (şu an geçersiz).

## 101

**Temel**
- 21 taş, başlayan 22. 12-13-1 serisi yoktur.
- Seriden açma: perlerin toplamı en az 101. Çiftten açma: en az 5 çift, okey tek bir taşla çift yapabilir.
- Çiftten açan seri açamaz, seriden açan çift açamaz.
- Açılış sayısı: açıldığı turda açılan her şey sayılır, sonraki turlarda açılan perler sayılmaz.
- **İşleme:** Sadece açmış oyuncu, açtığı turdan sonraki turlarda kendi ve rakip perlerine taş işleyebilir. Çiftlere işlenmez. Elde atacak en az bir taş kalmalıdır. (Varsayılan: açtığı turda işleyemez, çiftten açan da serilere işleyebilir.)
- **Okeyi yerden alma:** Seride okeyin tuttuğu taş işlenince okey işleyene geçer (7-okey-9 + 8). Kütte okey, eksik renklerin hepsi gerçek taşla tamamlanınca alınır (8 sarı, 8 kırmızı, okey → 8 mavi + 8 siyah).
- **Yandan alınan taş o tur kullanılmak zorundadır** (el açarak ya da işleyerek). Bu tur kullanılamayacak taş yandan alınamaz, alınan taş kullanılmadan taş atılamaz, açılış onu içermiyorsa açılamaz.
- Bitiş: açmış oyuncu son taşını attığında el biter.

**Puanlama**
- Bitiren −101 yazar. Diğerleri elinde kalan taşların toplamını yazar. Açmayan 202 yazar.
- Çiftten açanın kalan taşları 2 kat yazılır. (Varsayılan)
- Elde kalan okey 101 sayılır. (Varsayılan)
- Okeyle bitme 2x, elden bitme (aynı turda açıp bitirme) 2x, ikisi birden 4x. Kat, bitirenin −101'ine ve diğerlerinin el puanına uygulanır. (Varsayılan: açmayanın 202'si de katlanır.)
- Deste biterse kimse bitirmemiştir: herkes kalan cezasını yazar, kat yoktur. (Varsayılan)
- Toplamda düşük puan kazanır.

**Genel cezalar (tüm modlar)**
- Okey atan 101 ceza yer.
- İşlek taş (yerdeki bir pere işlenebilecek taş) atan 101 ceza yer.
- Eli bitiren son taş bu cezalardan muaftır. Cezalar ve ödüller katlanmaz. (Varsayılan)

**Masa modları**
- **Katlamalı:** Her açan, kendinden önce açanın sayısını geçmek zorundadır (120 → en az 121; 5 çift → en az 6 çift). Seri ve çift ayrı takip edilir.
- **Katlamasız:** Açmak için 101 ya da 5 çift yeter.
- **Cezalı** (genel kurallara ek olarak):
  - Yandan alınan taş el açmada kullanılırsa, taşı atan oyuncu taşın 10 katı ceza yer (13 → 130). Sadece el açmada uygulanır.
  - Açılmış perdeki okeyi başka bir oyuncu yerden alırsa per sahibi 101 ceza yer.
  - Ödül: açılışta 151'i geçen (152 ve üstü) −101, 7 çift açan −101.

## Batak

- 52'lik deste, 13'er kart. Renk vermek zorunludur, verebiliyorsan yükseltmek zorunludur. Renk yoksa koz atmak, koz varsa yükseltmek zorunludur. Koz kırılmadan kozla başlanmaz (elde sadece koz yoksa).
- **Oyun:** Tekli ya da eşli (karşılıklı oturanlar ortak, elleri toplanır).
- **Koz:** Koz maça (sabit) ya da ihaleli.
- **İhale:** Tekli en az 5, eşli en az 7. Pas diyen bir daha teklif veremez. Herkes pas derse dağıtan en düşük ihaleyle alır. İhaleyi alan kozu seçer ve ilk kartı atar.
- **Puan:** İhalesiz her el 1 puan. İhaleli: ihaleyi alan taraf tuttuysa aldığı el kadar yazar, tutmadıysa ihale kadar düşer; diğerleri aldıkları eli yazar.
- **Oyun uzunluğu:** 3, 5 ya da 7 el (varsayılan 5). Son elden sonra toplamı en yüksek olan kazanır.

## Poker (Texas Hold'em)

- Kör: 10/20, 25/50 ya da 50/100. Başlangıç çipi: ₺1.000, ₺2.500 ya da ₺5.000.
- Flop öncesi, flop, turn, river, showdown. Yan pot hesaplanır, eşitlikte pot bölünür.
- Çipi biten oyuncuya yeni elde başlangıç çipi verilir (çevrimdışı prototipte).
