# Kıraathane Yol Haritası

**Nerdeyiz:** `index.html` içinde tek dosyalık, çevrimdışı çalışan bir prototip. Okey, 101, Batak ve Poker kurallarıyla oynanıyor, boş koltuklarda botlar var, hamle süresi sayacı çalışıyor. Kuralların tamamı [KURALLAR.md](KURALLAR.md) dosyasında.

**Hedef:** Gerçek oyuncuların telefondan online oynadığı, kuralları eksiksiz, hilesi zor, masrafını reklam ve jeton satışıyla çıkaran bir kıraathane.

## Değişmeyecek ilkeler

1. **Sunucu tek otoritedir.** İstemci yalnızca hamle önerir. Oyun durumunu sadece `applyAction()` değiştirir.
2. **Oyun motorunda DOM kullanılmaz.** Kurallar, çözücüler ve botlar tarayıcıda da Node.js'te de aynı kodla çalışır.
3. **Gizli bilgi istemciye gitmez.** Rakip taşları, kartları ve deste sırası sunucuda kalır.
4. **Her kuralın yazılı hali ve testi vardır.** Kural önce KURALLAR.md'de, sonra kodda ve testte değişir.
5. **Gerçek para yok.** Jeton satın alınabilir ama paraya çevrilemez, oyuncular arasında transfer edilemez.
6. **Önce global kural, sonra masa ayarı.** Varyantlar ayrı kod dalları değil, masa açarken seçilen ayarlardır.

## "Kusursuz"un ölçütleri

| Alan | Ölçüt |
|---|---|
| Kural doğruluğu | KURALLAR.md'deki her madde için en az bir otomatik test |
| Kararlılık | 10.000 bot-bot simülasyon elinde 0 hata, 0 reddedilen bot hamlesi, 0 kilitlenen masa |
| Bütünlük | Her an 106 taş / 52 kart korunur, masadaki toplam çip korunur |
| Performans | Orta seviye Android telefonda 60 FPS, ilk açılış 2 saniyenin altında |
| Güvenlik | İstemciye giden hiçbir mesajda rakibin gizli bilgisi yok |
| Ağ | Bağlantısı kopup 30 saniye içinde dönen oyuncu kaldığı yerden devam eder |

## Tamamlanan: Faz 0 (prototip)

- Lobi, masa listesi, "Masanı kur" ile masa ayarları (Batak, 101, Poker)
- Okey: dizme, bitiş denetimi, 20'den geriye puanlama, oyun sonu
- 101: seri ve çift açma, işleme, okeyi yerden alma, yandan taş zorunluluğu, katlamalı/katlamasız, cezalı mod, genel cezalar ve ödüller
- Batak: tekli/eşli, koz maça/ihaleli, 3-5-7 el
- Poker: kör ve başlangıç çipi ayarları, yan pot
- Hamle süresi, otomatik hamle, "uzakta" durumu
- Botlar dört oyunda da kurallara uyarak oynuyor; tarayıcıda senaryo testleri ve bot simülasyonları

## Sıradaki aşamalar

Sıra, online'a en kısa ve en güvenli yolu izler. Her aşama bir öncekinin çıkış ölçütü sağlanmadan başlamaz.

### Aşama 1: Prototipi kapat
Küçük, tek dosyada kalan işler. Online'a geçmeden önce kural ve arayüz borcunu sıfırlamak.

- [ ] 101: geniş ıstaka (2×15). 22 taşlık elde perlerin bir kısmı boşluksuz diziliyor
- [ ] 101: perleri elle seçerek açma (şu an motor en iyi dizilimi kendisi seçiyor)
- [ ] Poker: tam olmayan all-in artırması bahsi yeniden açmasın; el sonunda kazanan beş kartın vurgusu
- [ ] Botlar: cezalı 101'de solundakinin açmasına yarayacak taşı atmaktan kaçınsın; katlamalı eşiğe göre açılış stratejisi
- [ ] Masa ayarı: hamle süresi (hızlı / normal / yavaş)
- [ ] Ses efektleri ve ses ayarı
- [ ] Okey: gösterge gösterme (karar bekliyor, aşağıya bak)

**Çıkış:** Dört oyun iki telefon boyutunda elle baştan sona oynanmış, açık kural sorusu kalmamış.

### Aşama 2: Motoru ayır, teste bağla
Online'ın temeli. Kurallar sunucuda çalışabilir hale gelir, her değişiklik otomatik test edilir.

- [ ] Klasörler: `engine/` (kurallar, çözücüler, botlar, saat), `client/` (Canvas görünüm, girdi), `server/`
- [ ] Derleme ile istemci yine tek `index.html` çıkar, çevrimdışı botlu oyun korunur
- [ ] Tohumlu rastgelelik: her el, tohum + hamle listesiyle birebir yeniden oynatılabilir (şikayet incelemesi için de gerekli)
- [ ] `viewFor(seat)`: her oyuncuya sadece görmesi gereken durum
- [ ] Hamle şeması doğrulaması
- [ ] KURALLAR.md'nin her maddesi için Node.js testi (bugünkü tarayıcı senaryolarının taşınması)
- [ ] 10.000 ellik bot simülasyonu, bütünlük kontrolleriyle
- [ ] GitHub Actions: her push'ta testler

**Çıkış:** Kararlılık ve bütünlük ölçütleri yeşil, motor Node.js'te DOM olmadan çalışıyor.

### Aşama 3: Online masa (misafir girişiyle)
İlk kez iki gerçek insan aynı masada. Hesap sistemi yok, misafir adıyla oynanır.

- [ ] Node.js + WebSocket sunucu, masa yöneticisi: masa aç, otur, kalk, boş koltuğa bot
- [ ] Protokol: istemciden `ACTION`, sunucudan filtreli `STATE` / `EVENT` / `REJECT`, sıra numaralı
- [ ] Hamle saati sunucuda (bugünkü motor saati taşınır)
- [ ] Yeniden bağlanma: oturum jetonu, kopan oyuncu için otomatik hamle, dönünce tam durum
- [ ] Güvenlik: girdi doğrulama, hız sınırı, sunucuda rastgelelik
- [ ] Yayın: tek küçük sanal sunucu, alan adı ve HTTPS, günlük yedek
- [ ] İzleme: hata kaydı, masa başına gecikme

**Çıkış:** İki gerçek cihaz + iki bot aynı masada bir akşam boyunca sorunsuz oynuyor, bağlantı kesme testleri geçiyor.

### Aşama 4: Hesaplar ve sanal jeton
- [ ] Kendi kayıt sistemimiz (e-posta + şifre, doğrulama, şifre sıfırlama), misafirden hesaba geçiş
- [ ] Facebook ile giriş (Meta uygulama incelemesi, gizlilik politikası ve veri silme adresi gerekir)
- [ ] Jeton: masalar jetonla oynanır; günlük / saatlik hediye, iflas yardımı. Satış henüz yok
- [ ] Jeton hareket kayıtları (denetim ve hile tespiti)
- [ ] Canlı lobi: gerçek doluluk, seviye filtreleri, özel masa ve davet bağlantısı
- [ ] Profil, istatistik, haftalık sıralama
- [ ] KVKK aydınlatma metni, gizlilik politikası, kullanım koşulları

**Çıkış:** Hesaplı oyuncular jetonla oynuyor, jeton kayıtları tutarlı.

### Aşama 5: Kapalı beta
- [ ] 20–50 kişilik davetli oyuncu grubu
- [ ] Analitik: 1. / 7. / 30. gün geri dönüş, masa başına süre, en çok oynanan mod
- [ ] Geri bildirim ve şikayet kanalı; tohumlu yeniden oynatma ile şikayet incelemesi
- [ ] Hata düzeltme turu

**Çıkış:** Beta süresince kilitlenen masa yok, kural şikayeti kalmadı, geri dönüş oranları ölçülüyor.

### Aşama 6: Gelir
- [ ] Ödüllü video reklam (izleyene jeton)
- [ ] Geçiş reklamı sadece el aralarında, sıklık sınırıyla; oyun sırasında reklam yok
- [ ] Jeton paketi satışı (hukuki görüş alındıktan sonra), reklamsız / VIP paket
- [ ] Gelir ölçümü: günlük aktif oyuncu başına reklam ve satış geliri, ödeme yapan oranı

**Çıkış:** Aylık gelir, sunucu ve reklam giderini karşılıyor mu, ölçülmüş.

### Aşama 7: Topluluk ve mağaza
- [ ] Masa sohbeti (hazır mesajlar + filtre), "çay ısmarla" hediyesi, arkadaş listesi, izleyici modu
- [ ] Şikayet, engelleme, moderasyon paneli
- [ ] PWA (ana ekrana ekleme); isteğe bağlı Google Play / App Store paketleri

## Riskler

| Risk | Önlem |
|---|---|
| Jeton satışının hukuki durumu | Aşama 6'dan önce hukuki görüş; jeton paraya çevrilemez, transfer edilemez |
| Mağaza "simüle kumar" politikaları | Yaş sınırı ve içerik derecelendirmesi yayından önce netleşir; ilk yayın web (PWA) üzerinden |
| Hile (istemci manipülasyonu, çoklu hesap) | Sunucu otoritesi, gizli bilgi istemciye gitmez, jeton kayıtları, tohumlu yeniden oynatma |
| Zayıf botlar oyuncuyu sıkar | Aşama 1 ve 5'te bot stratejisi iyileştirmeleri; gerçek masalarda bot oranı düşürülür |
| Düşük seviye telefonda yavaşlık | Performans ölçütü her aşamada gerçek cihazda kontrol edilir |

## Alınan kararlar

| Konu | Karar |
|---|---|
| Kural setleri | Global kurallar varsayılan; farklı kurallar masa ayarı |
| Sunucu | Düşük bütçeli tek sunucuyla başla, kullanım arttıkça bütçe ayır |
| Giriş | Facebook, e-posta ve kendi kayıt sistemimiz |
| Gelir | Reklam + jeton satışı; gelir oyuna yeniden yatırılır |
| Oyun kuralları | [KURALLAR.md](KURALLAR.md) |

## Senden gerekenler

**Kural kararları (Aşama 1)**
1. Okey'de 12-13-1 serisi geçerli mi?
2. Okey'de gösterge gösterme olsun mu, olursa kaç puan?
3. Hamle süreleri (Okey 20, 101 30, Batak 15, Poker 20 sn) uygun mu?

**Aşama 3 öncesi**
4. Oyunun adı ve alan adı
5. Sunucu için bir bulut hesabı (küçük bir sanal sunucu yeterli)

**Aşama 4 öncesi**
6. Meta (Facebook) geliştirici hesabı

**Aşama 6 öncesi**
7. Jeton satışı için hukuki görüş
8. Jeton paketleri ve fiyatları
