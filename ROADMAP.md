# Kıraathane Yol Haritası

Bugünkü durum: `index.html` içinde tek dosyalık, çevrimdışı çalışan bir prototip. Dört oyun (Okey, 101, Batak, Poker), 3 bot, sürükle-bırak, `dispatchAction` üzerinden hamle akışı.

Hedef: gerçek oyuncuların online oynadığı, kuralları eksiksiz, hilesi zor ve telefonda akıcı çalışan bir kıraathane.

## Değişmeyecek ilkeler

1. **Sunucu tek otoritedir.** İstemci yalnızca hamle önerir. Oyun durumunu sadece `applyAction()` değiştirir.
2. **Oyun motorunda DOM kullanılmaz.** Kurallar, çözücüler ve botlar tarayıcıda da Node.js'te de aynı kodla çalışır.
3. **Gizli bilgi istemciye gitmez.** Rakip taşları, kartları ve deste sırası sunucuda kalır.
4. **Her kuralın testi vardır.** Yazılı kural listesi ve ona karşılık gelen test birlikte yürür.
5. **Gerçek para yok.** Çipler sanaldır, satın alınamaz ve paraya çevrilemez. Aksi bir karar lisans gerektirir, hukuki görüş alınmadan konuşulmaz.

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

**101**
- [ ] Açılmış perlere taş işleme (kendi ve rakip perleri)
- [ ] Perleri elle seçerek açma (şu an motor en iyisini seçiyor)
- [ ] Çiftten açma (5 çift)
- [ ] Yandan alınan taşla o turda açma zorunluluğu
- [ ] Ceza puanları (okey atma, işlek taş atma)

**Batak**
- [ ] İhale turu: teklif, koz seçimi, kontrat, batma puanı
- [ ] Eşli batak seçeneği
- [ ] Koz ve ihale kuralı masa ayarı olsun

**Poker**
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
- [ ] Ölçek: önce tek süreç, sonra masalar süreçlere dağıtılır. Yük testi hedefi 1.000 eşzamanlı masa
- [ ] İzleme: hata kaydı, masa başına gecikme ölçümü

Çıkış ölçütü: iki gerçek cihaz ve iki bot aynı masada oynuyor, bağlantı kesme testleri geçiyor, güvenlik kapısı yeşil.

## Faz 3: Hesaplar, sanal çip, canlı lobi

- [ ] Misafir girişi, sonra hesap (e-posta ya da Google)
- [ ] Sanal çip, günlük hediye çip, iflas eden oyuncuya yardım çipi
- [ ] Canlı lobi: gerçek doluluk, seviye filtreleri, özel masa ve davet bağlantısı
- [ ] Profil, istatistik, haftalık sıralama
- [ ] KVKK aydınlatma metni ve gizlilik politikası

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

## Karar bekleyen konular

1. **Kural setleri:** Okey ve 101 bölgeden bölgeye değişiyor. Varsayılan kural seti hangisi olacak, hangileri masa ayarı olacak?
2. **Batak:** tekli, eşli, ya da ikisi birden?
3. **Sunucu barındırma:** hangi bulut sağlayıcı ve bütçe?
4. **Hesap sistemi:** misafir girişi yeterli mi, telefon numarası doğrulaması istenecek mi?
