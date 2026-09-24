# Kıraathane Yol Haritası

Bugünkü durum: `index.html` içinde tek dosyalık, çevrimdışı çalışan bir prototip. Dört oyun (Okey, 101, Batak, Poker), 3 bot, sürükle-bırak, `dispatchAction` üzerinden hamle akışı.

Hedef: gerçek oyuncuların online oynadığı, kuralları eksiksiz, hilesi zor ve telefonda akıcı çalışan bir kıraathane.

## Değişmeyecek ilkeler

1. **Sunucu tek otoritedir.** İstemci yalnızca hamle önerir. Oyun durumunu sadece `applyAction()` değiştirir.
2. **Oyun motorunda DOM kullanılmaz.** Kurallar, çözücüler ve botlar tarayıcıda da Node.js'te de aynı kodla çalışır.
3. **Gizli bilgi istemciye gitmez.** Rakip taşları, kartları ve deste sırası sunucuda kalır.
4. **Her kuralın testi vardır.** Yazılı kural listesi ve ona karşılık gelen test birlikte yürür.
5. **Gerçek para yok.** Jeton satın alınabilir ama paraya çevrilemez, oyuncular arasında transfer edilemez, ödül olarak para ya da para değerinde bir şey dağıtılmaz. Bu çizgi hem hukuki hem de mağaza politikası sınırıdır (bkz. Faz 3).
6. **Önce global kural, sonra masa ayarı.** Her oyunun tek bir varsayılan kural seti vardır. Farklı varyantlar masa açarken seçilen ayarlardır, ayrı kod dalları değil.

## "Kusursuz"un ölçütleri

Her faz aşağıdaki kapılardan kendine düşenleri geçmeden kapanmaz.

| Alan | Ölçüt |
|---|---|
| Kural doğruluğu | Yazılı kural listesindeki her madde için en az bir test |
| Kararlılık | 10.000 bot-bot simülasyon elinde 0 hata, 0 reddedilen bot hamlesi |
| Bütünlük | Her an 106 taş / 52 kart korunur, masadaki toplam çip korunur |
| Performans | Orta seviye Android telefonda 60 FPS, ilk açılış 2 saniyenin altında |
| Güvenlik | İstemciye giden hiçbir mesajda rakibin gizli bilgisi yok |
| Ağ | Bağlantı kopup 30 saniye içinde dönen oyuncu masaya kaldığı yerden döner |
| Erişilebilirlik | Tüm oyunlar klavyeyle oynanabilir, metinler okunabilir kontrastta |

## Faz 0: Prototipi sağlamlaştır

Tek dosyada kalarak kural eksiklerini ve bilinen hataları kapatmak.

**Hatalar**
- [x] 101'de "Seri diz" düğmesi eli bozmadan geri döküyordu (22 taş 26 yuvaya boşluklarla sığmayınca). Yerleşim yeniden yazıldı. 1.600 rastgele elde test edildi.
- [ ] 101 için geniş ıstaka (2×15). 22 taşlık elde perlerin %22'si şu an boşluksuz diziliyor.

**Okey**
- [ ] 12-13-1 serisi
- [ ] Puanlama: 20'den geriye sayım, okey atarak bitirme ve çiftten bitirme katları
- [ ] Gösterge gösterme
- [ ] Yerel kural seçenekleri (masa açarken)

**101** (temel düzen: katlamalı, cezasız; 12-13-1 serisi yok)
- [x] Çiftten açma: en az 5 çift, okey tek taşla eşlenebilir. Çiftten açan seri açamaz, seriden açan çift açamaz
- [x] Katlama: okeyle bitme 2x, elden bitme (aynı turda açıp bitirme) 2x, ikisi birden 4x
- [x] Ceza yazımı: açmayan 202, çiftten açanın kalan taşları 2 kat, elde kalan okey 101
- [x] Deste biterse herkes kalan cezasını yazar
- [x] Dikey ekranda açılmış perler üst üste binmeden dizilir
- [ ] Masa ayarı olarak modlar: katlamalı, katlamasız, cezalı katlamalı, cezalı katlamasız (katlama kodda `rules.katlama` olarak hazır)
- [ ] Cezalı modlar için: okey atma cezası, işlek taş atma cezası
- [x] Açılmış perlere taş işleme (kendi ve rakip perleri, seri uçları ve küte eksik renk). Sadece açmış oyuncu, açtığı turdan sonra; atacak bir taş kalmalı; çiftlere işlenmez
- [x] Okeyi yerden alma: seride okeyin tuttuğu taş işlenince; kütte eksik renklerin hepsi gerçek taşla tamamlanınca (8 sarı, 8 kırmızı, okey → 8 mavi + 8 siyah)
- [x] Sürükleyerek işleme: taşı tutunca uyan perler yeşil, okeyi geri aldıranlar altın çerçeveyle yanar
- [ ] Perleri elle seçerek açma (şu an motor en iyisini seçiyor)
- [ ] Yandan alınan taşla o turda açma zorunluluğu

**Kural altyapısı**
- [x] `RULESETS`: her oyunun global varsayılanı ve masa ayarları tek yerde tanımlı
- [x] Lobide "Masanı kur" penceresi: seçenekler tanımdan otomatik oluşuyor
- [ ] Okey ve 101 masa ayarları (yerel kural farkları, bkz. aşağıdaki maddeler)

**Batak**
- [x] Tekli / eşli (karşılıklı oturanlar ortak, eşli puanlama)
- [x] Koz maça (sabit) / ihaleli (ihaleyi alan kozu seçer)
- [x] İhale turu: teklif, pas, herkes pas derse dağıtanın en düşük ihaleyle alması, koz seçimi, batma puanı
- [x] Eşli botlar ortağının aldığı ele üst atmıyor, ortağının ihalesini geçmiyor
- [ ] Koz renginin açılışı için yerel kural seçeneği (ilk elden koz atılabilir mi)
- [ ] Oyunun kaç el ya da kaç puana kadar süreceği

**Poker**
- [x] Masa ayarı: kör seviyesi (10/20, 25/50, 50/100) ve başlangıç çipi
- [ ] Tam olmayan all-in artırması bahsi yeniden açmasın
- [ ] El sonu özeti: kazanan beş kart vurgusu, kicker
- [ ] El geçmişi

**Ortak**
- [ ] Hamle süresi sayacı, süre dolunca otomatik hamle
- [ ] Ses efektleri (kart atma, taş şıkırtısı, çip), ses ayarı
- [ ] Ayarlar: animasyon hızı, sol el düzeni
- [ ] Klavye ile oynama
- [ ] Yatay telefonda Okey taş boyutu

Çıkış ölçütü: yukarıdaki kural maddeleri tamam, dört oyun iki farklı telefon boyutunda elle baştan sona oynanmış.

## Faz 1: Motoru ayır ve teste bağla

Online'a geçmeden önce kodu sunucunun da kullanabileceği hale getirmek.

- [ ] Klasör yapısı: `engine/` (kurallar, per çözücü, poker değerlendirici, botlar), `client/` (Canvas görünüm, girdi), `server/`
- [ ] Derleme ile istemci yine tek `index.html` olarak paketlenir, çevrimdışı demo korunur
- [ ] Tohumlu rastgelelik: her el tohum + hamle listesiyle birebir yeniden oynatılabilir
- [ ] `viewFor(seat)`: her koltuğa sadece görmesi gereken durum
- [ ] Hamle şeması doğrulaması (tip, koltuk, payload)
- [ ] Birim testleri: per çözücü, çift bitiş, poker el sıralaması, yan pot, Batak renk/yükseltme kuralları
- [ ] Simülasyon testi: 10.000 bot-bot eli, bütünlük kontrolleriyle
- [ ] GitHub Actions ile her push'ta testler

Çıkış ölçütü: kararlılık ve bütünlük kapıları yeşil, motor Node.js'te DOM olmadan çalışıyor.

## Faz 2: Online sunucu (Node.js + WebSocket)

- [ ] Masa yöneticisi: masa aç, otur, kalk, boş koltuğa bot
- [ ] Protokol: istemciden `ACTION`, sunucudan filtreli `STATE`, `EVENT`, `REJECT`. Her mesajda sıra numarası
- [ ] Sunucu zamanlayıcıları: hamle süresi, dağıtım beklemeleri
- [ ] Yeniden bağlanma: oturum jetonu, kopan oyuncunun yerine geçici bot, dönünce tam durum
- [ ] Güvenlik: girdi doğrulama, hız sınırı, sunucu tarafında rastgelelik
- [ ] Düşük bütçeli başlangıç: tek küçük sanal sunucu üzerinde tek Node.js süreci + aynı sunucuda PostgreSQL (ya da başta SQLite). Redis, çoklu sunucu ve yönetilen servisler ancak ölçüm ihtiyaç gösterince
- [ ] Günlük otomatik veritabanı yedeği sunucu dışına
- [ ] Ölçek: oyuncu sayısı arttıkça masalar süreçlere, sonra sunuculara dağıtılır. Tek sunucuda kaç masa kaldırdığımız yük testiyle ölçülür
- [ ] İzleme: hata kaydı, masa başına gecikme ölçümü

Çıkış ölçütü: iki gerçek cihaz ve iki bot aynı masada oynuyor, bağlantı kesme testleri geçiyor, güvenlik kapısı yeşil.

## Faz 3: Hesaplar, jeton ekonomisi, gelir

Amaç: oyunun kendi masrafını çıkarması, kazancın oyuna geri yatırılması.

**Giriş**
- [ ] Misafir girişi (tek dokunuşla oyna, sonra hesaba bağla)
- [ ] Kendi kayıt sistemimiz: e-posta + şifre, e-posta doğrulama, şifre sıfırlama
- [ ] Facebook ile giriş. Meta uygulama incelemesi, gizlilik politikası adresi ve veri silme isteği adresi gerektirir
- [ ] Android oyuncuları için Google ile giriş eklemek düşünülmeli (en düşük sürtünme)
- [ ] Bir hesaba birden çok giriş yöntemi bağlanabilmeli

**Jeton ekonomisi**
- [ ] Tek sanal para: jeton. Masalar jetonla oynanır, seviye arttıkça giriş jetonu artar
- [ ] Ücretsiz kaynaklar: günlük hediye, saatlik hediye, iflas yardımı, ödüllü reklam
- [ ] Jeton paketleri satışı (mağaza içi satın alma / web ödemesi)
- [ ] Oyuncular arası jeton transferi **yok**. Transfer olursa jeton karaborsası oluşur ve jeton fiilen paraya dönüşür
- [ ] Jeton harcama/kazanma kayıtları (denetim ve hile tespiti için)

**Reklam**
- [ ] Ödüllü video: izleyene jeton. En yüksek gelir ve en az rahatsızlık bu formatta
- [ ] Geçiş reklamı yalnızca el aralarında ve sıklık sınırıyla (ör. en fazla 3 elde bir)
- [ ] Oyun sırasında hiçbir reklam yok
- [ ] Reklamsız paket / VIP abonelik (reklamsız + günlük ekstra jeton + profil süsleri)

**Hukuk ve mağaza (yayından önce şart)**
- [ ] Türkiye'deki şans oyunları mevzuatı açısından hukuki görüş: satın alınabilir jetonlu poker ve okey
- [ ] Google Play ve App Store'un "simüle kumar" politikaları: yaş sınırı, içerik derecelendirmesi, bölge kısıtları
- [ ] KVKK aydınlatma metni, gizlilik politikası, kullanım koşulları, ödeme ve iade koşulları

**Ölçülecekler** (yatırım kararları bunlara göre verilir)
- 1. gün / 7. gün / 30. gün geri dönen oyuncu oranı
- Günlük aktif oyuncu başına gelir (reklam + satış ayrı ayrı)
- Ödeme yapan oyuncu oranı, ödüllü reklam izlenme oranı

**Canlı lobi ve profil**
- [ ] Gerçek doluluk, seviye filtreleri, özel masa ve davet bağlantısı
- [ ] Profil, istatistik, haftalık sıralama

## Faz 4: Topluluk

- [ ] Masa sohbeti (hazır mesajlar + küfür filtresi), emoji
- [ ] "Çay ısmarla" hediyesi
- [ ] Arkadaş listesi, izleyici modu
- [ ] Şikayet ve engelleme, moderasyon paneli

## Faz 5: Yayın

- [ ] PWA: ana ekrana ekleme, internetsiz bot modu
- [ ] Performans kapısı düşük seviye Android'de doğrulanmış
- [ ] İsteğe bağlı: Google Play / App Store paketleri
- [ ] Kapalı beta, geri bildirim, genel açılış

## Alınan kararlar

| Konu | Karar |
|---|---|
| Kural setleri | Global kurallar varsayılan. Yetersiz görülen yerlerde masa ayarı ya da ayrı kurallı masa |
| Batak | Tekli, eşli, koz maça, ihaleli: hepsi masa ayarı olarak |
| Sunucu | Düşük bütçeli tek sunucuyla başla, kullanım arttıkça bütçe ayır |
| Giriş | Facebook, e-posta ve kendi kayıt sistemimiz |
| Gelir | Reklam + jeton satışı. Gelir oyuna yeniden yatırılır |
| 101 | Temel düzen, en yaygın varyant: 12-13-1 yok, çiftten açma en az 5 çift, okeyle bitme 2x, elden bitme 2x. Katlamalı/katlamasız ve cezalı modlar sonra masa ayarı olacak |

## Karar bekleyen konular

1. **Jeton fiyatları ve paketleri:** mağaza bölge fiyatlandırmasına göre sonra belirlenecek.
2. **Hukuki görüş:** jeton satışı açılmadan önce alınmalı.
