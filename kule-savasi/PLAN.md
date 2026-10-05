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

Her dünya **25 seviye**. Dünya 1–2'nin ilk 9 seviyesi ve 25. (boss) seviyesi elle tasarlandı; aradaki yuvalar şimdilik üreteçten geliyor ve editörle teker teker elle tasarlanmış seviyelere dönüştürülecek.

| Dünya | Tema | Yeni mekanik / binalar | Seviyeler | Tempo |
|---|---|---|---|---|
| 1 | 🌱 Çayır | Temel oynanış, çoklu sürükleme, görüş hattı | 1–25 | Hızlı |
| 2 | 🏝️ Göl Kıyısı | Menzil, kaya/ağaç, göl, nehir ve köprü | 26–50 | Hızlı |
| 3 | ❄️ Karlı Dağ | Buz (askerler yavaşlar), tepeler (menzil +%50), **Okçu Kulesi**, **Kale** | 51–75 | Orta |
| 4 | 🍭 Şeker Diyarı | Portal çifti, **Hız Kulesi**, **Ambar**, Mor rakip, yetenekler | 76–100 | Yavaş, stratejik |
| 5 | 🌋 Volkan | Lav çatlağı, kapı/anahtar kule, **Gözcü Kulesi**, **Mancınık**, hedef çeşitleri, 3 rakip | 101–125 | Yavaş, stratejik |
| ∞ | 🎲 Sonsuz / Günlük | Üreteçle sonsuz harita, her 5 seviyede zorlaşır; herkese aynı günlük tohum | 126+ | Karışık |

**25 seviyelik dünyanın iç ritmi** (5'erli bloklar):
- 1–5 **Öğret:** dünyanın yeni mekaniği güvenli haritalarda, tek tek
- 6–10 **Sına:** normal haritalar, önceki dünyaların mekanikleriyle karışık; 10 = ara boss
- 11–15 **Nefes + büküm:** kolay bir seviye, sonra mekaniği ters yüz eden bir harita
- 16–20 **Birleştir:** iki rakip, tam haritalar, farklı kazanma koşulları
- 21–25 **Zirve:** en zor haritalar, 25 = boss (özel davranışlı)

Zorluk testere dişi: her zor seviyeden sonra bir nefes seviyesi.

- **Yıldızlar:** ⭐ Kazan · ⭐⭐ Hiç kule kaybetme · ⭐⭐⭐ Hedef süreden (par) hızlı bitir.
- Sonraki dünyanın kilidi yıldızla açılır (Dünya 2: 30 yıldız).
- Otomatik üretilen haritalar simetriktir ve `Levels.validate` ile doğrulanır. Elle yapılan seviyeler `tools/editor.html` ile tasarlanıp `tools/denge.html` ile ölçülür.

### Rakip kişilikleri

| Renk | Kişilik | Davranış |
|---|---|---|
| Kırmızı | Saldırgan | Doğrudan oyuncuya gider |
| Sarı | Açgözlü | Önce gri kuleleri toplar, sonra büyük saldırı yapar |
| Mor | Temkinli | Savunur, sadece kesin kazanacağı saldırıyı yapar |

## Binalar, yetenekler ve hedefler

### Binalar
Binalar haritaya yerleştirilir, oyuncu inşa etmez (seviye tasarımı kontrolde kalır). Hepsi ele geçirilebilir; ele geçiren takım etkisini alır. Etki binanın seviyesiyle (asker sayısı eşikleri) büyür.

| Bina | Ne yapar | Stratejik etkisi | Dünya |
|---|---|---|---|
| 🏰 Kışla | Standart kule | — | 1 |
| 🏹 **Okçu Kulesi** | Menzilindeki düşman askerlerine ok atar: sv1 her 1,2 sn, sv2 0,8 sn, sv3 0,5 sn'de bir asker düşürür | Koridor hâkimiyeti: okçunun yanından geçen yol sahibine pahalıya mal olur; okçuyu almak öncelik olur | 3 |
| 🛡️ Kale | Gelen her 3 düşman askerinden 1'ini duvarda düşürür; yavaş üretir (×0,6) | Savunma noktası; tek kuleyle alınamaz, birlikte yüklenmeyi zorunlu kılar | 3 |
| ⚡ Hız Kulesi | Buradan çıkan askerler 2× hızlı yürür | Uzak hedeflere baskın; kuşatma kırma | 4 |
| 🌾 Ambar | Asker üretmez; ona bağlı (yol açılmış) dost kuleler %50 hızlı üretir | Arka hat ekonomisi; kaybedilince cephe zayıflar | 4 |
| 🗼 Gözcü Kulesi | Menzili 2×, görüş engellerini (kule, kaya, ağaç) aşar | Menzil dünyalarında köprü görevi | 5 |
| 🪨 Mancınık | Her 15 sn'de en yakın düşman kulesine taş atar: −5 asker (sv3: −10) | Kuşatmasız baskı; bulunduğu yer savaşın merkezi olur | 5 |

Görsel: her binanın kendi Blender modeli (okçu: mazgalda ok atan küçük figür; kale: kalın duvar; hız: kanatlı çatı; ambar: samanlık; gözcü: uzun ince kule; mancınık: tekerlekli). 2B'de aynı silüetler ikon olarak.

Yapay zekâ için her bina bir puan düzeltmesi: okçu/mancınık koridorunu puanlarken düşer, okçu/ambar ele geçirmeyi yüksek puanlar.

### Arazi mekanikleri
- **Buz** (D3): üstünden geçen askerler %40 yavaşlar. Kuşatma kurmak zorlaşır.
- **Tepe** (D3): tepedeki kulenin menzili %50 fazla; 3B'de yükselti olarak görünür.
- **Portal çifti** (D4): iki portal arasında görüş hattı aranmadan yol açılır.
- **Lav çatlağı** (D5): her 20 sn'de 3 sn püskürür, üstünden geçen askerleri yok eder.
- **Kapı / anahtar kule** (D5): anahtar kule ele geçirilince kapı açılır, haritanın öbür yarısı erişilir olur.

### Yetenekler (D4'te açılır)
Ekranın altında 2 buton, bekleme süreli. Seviye başına 1'er ücretsiz; ek kullanım ödüllü reklam ya da altın.
- **Hücum:** 6 sn bütün askerlerin 2× hızlı.
- **Kalkan:** seçtiğin kule 6 sn hasar almaz (kuşatmayı kırar).
- **Dondur:** seçtiğin düşman kulesi 5 sn asker gönderemez.
- **Takviye:** seçtiğin kuleye anında +15 asker.
Yapay zekâ da kullanır: tehdit altındayken Kalkan, hedef 10'un altındayken Hücum.

### Hedef çeşitleri (D5'ten itibaren, seçilen üçü)
- **Kral kuleyi al:** sadece işaretli kuleyi almak yeter.
- **Hayatta kal:** 90 sn boyunca hiçbir kuleni kaybetme; rakip baştan güçlü.
- **Merkezi tut:** ortadaki kuleyi toplam 45 sn elinde tut.

### Boss davranışları
- **Dalga:** her 30 sn'de komşu kulelere 20 asker püskürtür.
- **Aşama:** 60 askerin altına inince 10 sn kalkan açar, yan kuleleri güçlenir.
- Boss seviyesinde ekranın üstünde boss can çubuğu.

**Denge önlemleri (hazır):** 60 askerin üstünde üretim yavaşlar; 3. dakikada Son Hücum, 4. dakikada süre dolar.

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

### Faz 3 — İçerik ve derinlik (adımlar)

| Adım | İçerik | Durum |
|---|---|---|
| **A** | Seviye editörü (`tools/editor.html`), doğrulayıcı (`Levels.validate`), engel/menzil üreten üreteç, 25'lik dünyalar, kayıt taşıma | ✅ |
| **B** | Binalar: Okçu ✅, Kale, Hız, Ambar (oyun kuralı + yapay zekâ + 3B/2B görseller) | kısmen |
| **C** | Dünya 3: Karlı Dağ — buz, tepeler, Okçu, Kale; 25 seviye + kar teması | iskelet: kar teması + 3 okçu seviyesi, kalanı üreteçten |
| **D** | Yetenekler (2 buton) + gelir bağlantısı | |
| **E** | Dünya 4: Şeker Diyarı — portal, Hız, Ambar, Mor rakip; 25 seviye | |
| **F** | Hedef çeşitleri + boss davranışları; Dünya 1–2'deki üreteç yuvalarının elle tasarlanması | |
| **G** | Dünya 5: Volkan — lav, kapılar, Gözcü, Mancınık, 3 rakip; Sonsuz mod + günlük harita | |

Her adım kendi başına yayınlanabilir. A+B+C bittiğinde oyun "3 dünya, 75 seviye, binalar" haline gelir: ilk gerçek oyuncu testi için hedef.

### Faz 4 — Gelir ve uzun ömür
- [ ] Altın ve elmas, görünüm mağazası
- [ ] Capacitor paketi + AdMob + RevenueCat
- [ ] Ana ekrana eklenebilir web uygulaması (PWA) ve internetsiz oynama
- [ ] Analitik
- [ ] Sis (yalnızca menzildeki kuleler görünür) — oyuncu testine göre karar

## Temel kurallar (akış modeli)

- **Yol açmak kuleyi boşaltmaz.** Kule üretmeye ve büyümeye devam eder; sayısı onun canı ve gücüdür (Tower War gibi).
- **Akış gücü kulenin seviyesinden gelir** (saniyede 2 / 2,5 / 3,1 asker) ve açtığı yollar arasında **sırayla bölünür**. Tek yol tam güç, üç yol üçte birer. Birden fazla kuleyle tek hedefe yüklenmek kazandırır.
- **Kuşatma:** son 1,2 saniyede düşman vurmuşsa kuleye takviye giremez (kırmızı işaret). Arkadan beslenen kule sonsuza kadar dayanamaz.
- **Zıt yollar** ortada çarpışır; eşit akışlar birbirini sıfırlar.
- **Görüş hattı:** arada kaya, ağaç, su ya da **başka bir kule** varsa yol açılamaz ("Arada kule var"). Ortadaki kuleyi almadan arkasındakine saldıramazsın.
- **Son Hücum** (3. dakika): askerler 1,67 kat hızlı akar, geri sayım başlar. **4. dakikada süre dolar**, en güçlü taraf (üst çubuktaki güç) kazanır. Seviye hiçbir zaman 4 dakikayı geçmez.

### Okçu kulesi (uygulanan kural)
- Veri: `{ ..., kind: 'archer' }`. Sahibi tarafsız değilse menzilindeki (`KS.ARCHER.range` = 0,17) en yakın düşman askerine ok atar: sv1 1,2 sn, sv2 0,8 sn, sv3 0,5 sn'de bir. Vurulan asker yok olur.
- Okçu %70 hızla üretir; görüş hattında diğer kuleler gibi engeldir.
- Yapay zekâ: düşman okçusunun menzilinden geçen yollarda akış kaybını (atış hızı) hesaba katar; okçuyu ele geçirmeye +6 puan.
- Görsel: kapsama alanı sahibinin renginde zemin diski; oklar üst katmanda kısa çizgi.

## Seviye tasarımı kuralları (ölçümlerden çıkanlar)

- **Dar geçitlerde en az iki kule karşıya ulaşabilmeli.** Tek köprü + tek kule varsa iki taraf da köprü ortasında birbirini yok eder, oyun kilitlenir (13. seviyenin ilk hali böyleydi). Menzili ya da kule konumlarını buna göre ayarla.
- **Rakipler birbirine kolay saldırmamalı.** Aksi halde iki rakipli seviyelerde birbirlerini tüketip oyuncuya bedava zafer bırakırlar (`RIVAL` cezası).
- **Rakip küçük kuleleri** (8–10 asker) rakiplerin birbirine hemen saldırmasına yol açabilir; iki rakipli haritalarda dikkatli kullan.
- **Hedef zorluk** (iki botun kazanma oranı): tanıtım ve nefes seviyeleri %90+, normal seviyeler %60–90, zor seviyeler %40–60, boss %30–60.
- **Par** ≈ saldırgan botun medyan süresinin 1,3 katı (5 saniyeye yuvarlanmış).

### Güncel denge (12–16'şar deneme)

| Seviye | Kazanma (saldırgan / sabırlı) | | Seviye | Kazanma |
|---|---|---|---|---|
| 1–6, 8, 9 | %100 | | 11, 12, 17 | %100 |
| 7 | %83 / %83 | | 13 | %75 / %58 |
| 10 (boss) | %67 / %92 | | 14 | %92 / %83 |
| | | | 15, 16 | %67–100 |
| | | | 18 | %100 / %50 (çoğu süreyle biter) |
| | | | 19 | %38 / %38 |
| | | | 20 (boss) | %42–58 (süreyle biter) |

## Oyuncu geri bildirimleri

| Geri bildirim | Sebep | Çözüm |
|---|---|---|
| "2. seviyeyi geçemedim, kulem 0'a düşünce asker üretmiyor" | Kule üretiyordu ama açık yollar her askeri anında gönderiyordu; sayı 0'da kalıyor ve kule savunmasız görünüyordu | Kuleye dokununca yolları durur; ilk boşalmada bir kez ipucu; rozetin altında üretim çubuğu; 1–2. seviyede rakip kişiliği kapalı, 2. seviye kolaylaştı |
| "Asker çıkaran kulem üretmeye devam etmediği için tıkanıyorum" | Gönderilen her asker kuleden düşüyordu; yol açık kaldıkça kule 0'da kalıyordu | Temel kural değişti: yollar kuleyi boşaltmaz, kule büyümeye devam eder. Dengeyi korumak için akış yollar arasında bölünür, kuşatılan kuleye takviye giremez, 4. dakikada süre dolar |
| "Kaleler ulaşamayacakları yere de asker gönderebiliyor; aradaki kule yokmuş gibi çizgi çekiliyor" | Görüş hattını sadece arazi (kaya, ağaç, su) kesiyordu, kuleler hesaba katılmıyordu | Aradaki kule de görüşü keser; etiket "Arada kule var", çarpı engelleyen kulenin üstünde görünür. 13 ve 20 hafifletildi |
| "Rakibin askerleri daha hızlı gibi" | Yürüme hızı aynı (ölçüldü); ama 20'den 19'a inen kule hemen 1. seviyeye düşüp yavaş üretiyor ve seyrek gönderiyordu | Küçülme eşikleri büyümeden düşük (20'de büyür, 15'in altında küçülür; 40 / 33) |

## Geliştirme notları

- **Test modu:** `js/config.js` içindeki `KS.TEST_UNLOCK_ALL = true` bütün seviyeleri açar (haritada sarı uyarı görünür). **Yayından önce `false` yapılmalı.**

- Oyunu açmak için `index.html` yeterli, dosyadan açınca da çalışır. Bu yüzden ES modülleri yerine sırayla yüklenen, `window.KS` paylaşan dosyalar kullanılıyor.
- **Seviye yapmak:** `tools/editor.html` (ya da `tools/editor.html?n=12` ile var olan seviyeyi aç). Kule/engel koy, sürükle, seçili kuleyi ↑↓ ile büyüt; sağda doğrulama sorunları ve seçili kulenin görüş hattı görünür. "Oyna" ile dene, "Botlarla ölç" ile kazanma oranını gör, JSON'u kopyalayıp `js/levels.js` içindeki dünyanın `hand` listesine yuva numarasıyla ekle.
- Yeni bir seviye eklerken `tools/denge.html` ile de ölçün (engeller, menzil ve kişilikler dahil):
  - İki botun kazanma oranı **%40'ın altındaysa** seviye fazla zor.
  - Medyan süre **par'ın üstündeyse** 3. yıldız fazla zor.
- Oyun olayları (`G.on('capture' | 'win' | 'lose' | 'lane' | 'hit' | ...)`) ses, arayüz ve ileride analitik için tek bağlantı noktasıdır.
