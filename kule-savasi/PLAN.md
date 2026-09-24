# Kule Savaşı — Yol Haritası

Şirin (kawaii) görünümlü, dikey ekran için yapılmış bir kule ele geçirme oyunu. **Öncelik mobil.**

## Verilen kararlar

| Konu | Karar |
|---|---|
| Kod yapısı | Birden fazla dosya, derleme adımı yok (`index.html` + `css/` + `js/`) |
| Tempo | İlk dünyalar hızlı ve refleks ağırlıklı. İleri dünyalarda oyun yavaşlar, strateji ağırlığı artar |
| Derinlik | Hem kule türleri hem yetenekler olacak |
| Gelir | Reklam + uygulama içi satın alma. Sistemler baştan buna uygun kurulur |

## Tasarım ilkeleri

1. **Tek elle, başparmakla oynanır.** Önemli butonlar ekranın altında ya da köşelerde, dokunma alanları en az 44 px.
2. **Bir seviye 1–2,5 dakika sürer.** Otobüste, sırada beklerken oynanabilmeli.
3. **Yapay zekâ hile yapmaz.** Zorluk; tepki hızı, cesaret ve harita tasarımıyla artar.
4. **Para ödeyerek güç satın alınmaz.** Satın almalar vakit kazandırır ya da görünüm verir. Kazanmayı satın almak oyunu öldürür.
5. **Her dünya tek bir yeni mekanik öğretir.** Sırası: öğret → sına → büküm → boss seviyesi.

## Seviye kurgusu

| Dünya | Tema | Yeni mekanik | Seviyeler | Tempo |
|---|---|---|---|---|
| 1 | Çayır | Temel oynanış, çoklu sürükleme | 1–10 | Hızlı |
| 2 | Göl Kıyısı | Yol uzunluğu sınırı, su engelleri, köprü | 11–20 | Hızlı |
| 3 | Karlı Dağ | Kale kulesi, buz (askerler yavaş yürür) | 21–30 | Orta |
| 4 | Şeker Diyarı | Hız kulesi + Ambar, Mor rakip | 31–40 | Yavaş, stratejik |
| 5 | Volkan | Hepsi bir arada, büyük haritalar | 41–50 | Yavaş, stratejik |
| ∞ | Günlük Harita | Her gün herkese aynı harita, skor tablosu | — | Karışık |

- Zorluk düz artmaz, testere dişi gibi artar: zor bir seviyeden sonra bir "nefes" seviyesi gelir.
- **Yıldızlar:** ⭐ Kazan · ⭐⭐ Hiç kule kaybetme · ⭐⭐⭐ Hedef süreden (par) hızlı bitir.
- Sonraki dünyanın kilidi yıldızla açılır.
- Otomatik üretilen haritalar simetriktir, yani adil başlar. Elle yapılan seviyeler `tools/denge.html` ile kontrol edilir.

### Rakip kişilikleri

| Renk | Kişilik | Davranış |
|---|---|---|
| Kırmızı | Saldırgan | Doğrudan oyuncuya gider |
| Sarı | Açgözlü | Önce gri kuleleri toplar, sonra büyük saldırı yapar |
| Mor | Temkinli | Savunur, sadece kesin kazanacağı saldırıyı yapar |

## Kule türleri ve yetenekler

**Kule türleri** (Faz 3):
- **Kışla:** Standart kule.
- **Kale:** Gelen askerlerin bir kısmını vurur, yavaş üretir.
- **Hız kulesi:** Buradan çıkan askerler 2 kat hızlı yürür.
- **Ambar:** Asker üretmez, bağlı dost kulelerin üretimini %25 artırır.

**Yetenekler** (Faz 3): Altta, başparmağın ulaşacağı yerde 1–2 buton. Bekleme süreleriyle çalışır.
- **Hücum:** Askerler 5 saniye hızlı yürür.
- **Kalkan:** Bir kule 5 saniye hasar almaz.
- **Dondur:** Bir düşman kulesi 4 saniye asker gönderemez.

Her seviyede her yetenekten 1 kullanım ücretsiz. Ek kullanım ödüllü reklamla ya da altınla alınır, seviye başına en fazla 1.

**Denge önlemleri** (Faz 2–3):
- 60 askerin üstünde üretim yavaşlar. Önde olanın hep kazanmasını engeller.
- 3 dakikadan sonra "Son Hücum" modu başlar: herkes 2 kat üretir, kilitlenmiş oyunlar biter.

## Gelir modeli

### Para birimleri
- **Altın** (oyun içinde kazanılır): Yıldızlardan ve günlük ödülden gelir. Görünüm ve ek yetenek kullanımı alınır.
- **Elmas** (çoğunlukla satın alınır): Premium görünümler, sezon paketleri. Nadiren ödül olarak da verilir.

### Reklamlar
| Tür | Nerede | Kural |
|---|---|---|
| Ödüllü | Kaybedince "devam et" | Son kaybedilen kule 15 askerle geri gelir, seviye başına 1 kez **(hazır)** |
| Ödüllü | Kazanınca "2 kat altın" | Faz 4 |
| Ödüllü | Ek yetenek kullanımı | Faz 3 |
| Ödüllü | Günlük ödül çarkı, ikinci çevirme | Faz 4 |
| Geçiş | Sadece seviye sonunda | 8. seviyeden önce hiç yok, en fazla 3 galibiyette bir, arada en az 3 dakika **(kural hazır)** |

Seviye ortasında hiçbir zaman reklam çıkmaz.

### Satın almalar
- **Reklamları kaldır** (tek sefer): Geçiş reklamlarını kapatır. Ödüllü reklamlar isteğe bağlı olarak kalır.
- **Başlangıç paketi** (indirimli, ilk 3 gün): Görünüm + altın + reklamsız.
- **Görünüm paketleri:** Kale şapkaları, bayrak desenleri, asker yüzleri, tema setleri.
- **Elmas paketleri.**
- (İleride) Sezon kartı: Görev zinciri ve görünüm ödülleri.

### Teknik
- Oyun sadece `js/monetization.js` içindeki `KS.Monet` arayüzünü çağırır.
- **Mağazalar için:** Capacitor ile paketlenir, AdMob ve RevenueCat (iOS ve Android satın almaları) bağlanır.
- **Web için:** Poki ya da CrazyGames SDK'sı aynı arayüze bağlanabilir.
- **Analitik** (Faz 4): Seviye başına başlama, kaybetme ve bitirme süreleri; reklam yerlerinin izlenme oranı. Denge ayarlarını gerçek veriye göre yaparız.

## Fazlar

### Faz 1 — Mobil his ✅
- [x] Kodu dosyalara bölmek (`config`, `storage`, `levels`, `game`, `ai`, `audio`, `monetization`, `render`, `input`, `ui`, `main`)
- [x] Sürüklerken hedefe yapışma ve parmağın üstünde etiket ("Saldır · 12")
- [x] Çoklu sürükleme: yol üstündeki mavi kulelerin hepsi birden saldırır
- [x] Aynı hedefe tekrar sürükleyince yol silinmesi kaldırıldı (yol sadece kaydırarak kesilir)
- [x] Duraklatma butonu + telefon çalınca ya da uygulamadan çıkınca otomatik duraklama
- [x] Kodla üretilen sesler + titreşim, ayarlardan kapatılabilir
- [x] 3 yıldız sistemi + kayıt (açılan seviye, yıldızlar, ayarlar)
- [x] Kalabalıkta askerlerin sade çizilmesi (zayıf telefonlar için)
- [x] Zorluk eğrisi yumuşatıldı, 1–2. seviyede rakibin ilk saniyelerde oyuncuya saldırmaması
- [x] Simetrik otomatik haritalar
- [x] Reklam ve satın alma arayüzü (`KS.Monet`), kaybedince ödüllü devam
- [x] Denge simülasyon aracı (`tools/denge.html`)

### Faz 2 — İçerik ✅
- [x] Dünya haritası ekranı (seviye seçimi, yıldızlar, kilitler). Dünya 2 için 10. seviyeyi geçmek ve 12 yıldız gerekiyor
- [x] Menzil (tasarım biriminde, ekran oranından bağımsız; kule seviyesiyle %12 büyür)
- [x] Kaya, ağaç, göl, nehir ve köprüler; engelli yollar gri çizgi + çarpı ile gösterilir
- [x] Sürüklerken menzil halkası, ulaşılamayan kulelerin soluklaşması, "Menzil dışında" / "Yol kapalı" etiketi
- [x] Rakip kişilikleri (Saldırgan / Açgözlü / Temkinli) + seviye bazında değiştirme
- [x] Yapay zekâya ikmal: arka kuleler cepheyi besler
- [x] 60 askerin üstünde üretim yavaşlaması, 3. dakikada "Son Hücum" (30 sn önceden uyarı)
- [x] Dünya 1–2: 20 elle tasarlanmış seviye, iki boss seviyesi
- [x] Yeni mekanikler için tanıtım kartları (ilk karşılaşmada bir kez)
- [x] Seviye doğrulama (çakışma, engel üstünde kule, ulaşılabilirlik) ve botlarla denge ölçümü

### Faz 3 — Derinlik
- [ ] Kule türleri: Kale, Hız kulesi, Ambar
- [ ] Yetenekler: Hücum, Kalkan, Dondur
- [ ] Dünya 3–5 (yavaş ve stratejik tempo)
- [ ] Mor rakip

### Faz 4 — Gelir ve uzun ömür
- [ ] Altın ve elmas, görünüm mağazası
- [ ] Capacitor paketi + AdMob + RevenueCat
- [ ] Ana ekrana eklenebilir web uygulaması (PWA) ve internetsiz oynama
- [ ] Günlük harita + günlük ödül
- [ ] Analitik
- [ ] Seviye editörü (telefonda kule yerleştirip hemen deneme)

## Seviye tasarımı kuralları (ölçümlerden çıkanlar)

- **Dar geçitlerde en az iki kule karşıya ulaşabilmeli.** Tek köprü + tek kule varsa iki taraf da köprü ortasında birbirini yok eder, oyun kilitlenir (13. seviyenin ilk hali böyleydi). Menzili ya da kule konumlarını buna göre ayarla.
- **Rakipler birbirine kolay saldırmamalı.** Aksi halde iki rakipli seviyelerde birbirlerini tüketip oyuncuya bedava zafer bırakırlar (`RIVAL` cezası).
- **Rakip küçük kuleleri** (8–10 asker) rakiplerin birbirine hemen saldırmasına yol açabilir; iki rakipli haritalarda dikkatli kullan.
- **Hedef zorluk** (iki botun kazanma oranı): tanıtım ve nefes seviyeleri %90+, normal seviyeler %60–90, zor seviyeler %40–60, boss %30–60.
- **Par** ≈ saldırgan botun medyan süresinin 1,3 katı (5 saniyeye yuvarlanmış).

### Güncel denge (12'şer deneme)

| Seviye | Kazanma (saldırgan / sabırlı) | | Seviye | Kazanma |
|---|---|---|---|---|
| 1–3, 5–7 | %100 / %83–100 | | 11 | %83 / %75 |
| 4 | %75 / %92 | | 12–15 | %83–100 |
| 8 | %50 / %42 | | 16 | %42–58 / %33–42 |
| 9 | %92 / %83 | | 17 | %58 / %42 |
| 10 (boss) | %33 / %58 | | 18 | %42 / %42 |
| | | | 19 | %56 / %81 |
| | | | 20 (boss) | %44 / %56 |

## Geliştirme notları

- Oyunu açmak için `index.html` yeterli, dosyadan açınca da çalışır. Bu yüzden ES modülleri yerine sırayla yüklenen, `window.KS` paylaşan dosyalar kullanılıyor.
- Yeni bir seviye eklerken önce `tools/denge.html` ile ölçün (engeller, menzil ve kişilikler dahil):
  - İki botun kazanma oranı **%40'ın altındaysa** seviye fazla zor.
  - Medyan süre **par'ın üstündeyse** 3. yıldız fazla zor.
- Oyun olayları (`G.on('capture' | 'win' | 'lose' | 'lane' | 'hit' | ...)`) ses, arayüz ve ileride analitik için tek bağlantı noktasıdır.
