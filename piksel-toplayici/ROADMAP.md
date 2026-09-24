# Piksel Toplayıcı Yol Haritası

Bugünkü durum: `index.html` içinde tek dosyalık, çevrimdışı çalışan bir prototip. 3 bölüm (Mantar, Çilek, Kedi), U bant, 5'lik bekleme yuvası, konfetili bitiş, dokunma/tıklama. Bölüm sırası tohumlu üretiliyor ve bir çözücüyle çözülebilirliği doğrulanıyor.

Hedef: Google Play ve App Store'da yayında olan, reklam + uygulama içi satın alma ile para kazanan, en az birkaç yüz bölümlük bir hybrid-casual bulmaca oyunu.

## Önce bilinmesi gereken: bu mekanik boş bir alan değil

Oyunun temel döngüsü (renkli toplayıcıyı banda gönder, dıştaki kendi rengindeki pikselleri topla, dolmayan toplayıcı 5'lik yuvaya düşsün) **Pixel Flow!** oyununun döngüsüyle neredeyse aynı. Pixel Flow Ağustos 2025'te çıktı, birkaç ay içinde günde yarım milyon doların üstünde gelire ulaştı ve stüdyosu Loom Games, Scopely tarafından 1 milyar dolara satın alındı. Bu başarıdan sonra mağazalar ve web portalları benzerleriyle doldu.

Bundan çıkan sonuçlar:

1. **Mekanik serbest, kimlik değil.** Oyun kuralları telif konusu değildir, ama ad, ikon, karakter tasarımı, görseller ve bölüm resimleri Pixel Flow'a benzememeli. "Pixel Flow" kelimesi ad, açıklama ya da anahtar kelimelerde kullanılmamalı.
2. **Birebir kopya mağazadan dönebilir.** Apple'ın inceleme kurallarında taklit uygulamalara (copycat) ret gerekçesi var. Google Play de başka bir uygulamayı taklit eden ürünleri kaldırabiliyor.
3. **Aynı oyunun ikinci kopyası kullanıcı çekmez.** Reklamla kullanıcı kazanmak (UA) için oyunun reklam videosunda "bu farklı" dedirten bir şey olmalı. Bu yüzden Faz 1'in ana işi **fark yaratan kanca** bulmak.

Aday farklılaşma fikirleri (Faz 1'de prototiplenip biri seçilecek):

- **Tema:** Türk motifleri (çini, ebru, kilim, lokum, simit, kedi) ile pixel art. Hem görsel kimlik hem Türkiye pazarında yerel avantaj.
- **Bant mekaniği:** yön değiştiren makaslar, iki bant, bantta hızlanan/yavaşlayan bölgeler.
- **Blok türleri:** kilitli blok (anahtar toplayınca açılır), buz (iki kez toplanır), bomba (çevresini patlatır), gizli renk (açığa çıkınca rengi görünür).
- **Toplayıcı türleri:** iki renkli toplayıcı, birleşen toplayıcılar (iki yarım yeşil yuvada birleşip tek toplayıcı olur).
- **Resim ortaya çıkarma:** temizlenen tablonun altından ikinci bir resim (ödül resmi) çıkar ve koleksiyon albümüne eklenir.

## Değişmeyecek ilkeler

1. **Tek kod tabanı.** Oyun HTML5 + saf JavaScript kalır. Mobil sürüm aynı kodun Capacitor ile paketlenmiş hâlidir. Unity'ye geçilmez.
2. **Her bölüm çözücüden geçer.** Yayına giren her bölümün çözülebilir olduğu ve zorluk puanı otomatik doğrulanır.
3. **Zorluk satılmaz, karar anı satılır.** Güçlendiriciler bölümü "atlamak" için değil, bir hatayı telafi etmek için vardır (ek yuva, devam et).
4. **Önce veri, sonra harcama.** Tutunma (retention) ölçülmeden reklam bütçesi harcanmaz.
5. **Kişisel veri en azda tutulur.** Hesap, e-posta, konum istenmez. Toplanan veri sadece analiz ve reklam için, onayla.

## Kapı ölçütleri

Her faz kendi kapısını geçmeden kapanmaz. Tutunma ve oynama süresi değerleri sektörde yaygın kullanılan hedeflerdir, kesin eşik değildir.

| Alan | Ölçüt |
|---|---|
| Performans | Orta seviye Android telefonda 60 FPS, açılış 3 saniyenin altında |
| Kararlılık | Çökme olmayan oturum oranı %99,5 üstü |
| İçerik | Yayında en az 200 bölüm, her biri çözücüden geçmiş |
| D1 tutunma | %40 ve üstü (ilk gün geri gelen oyuncu oranı) |
| D7 tutunma | %15 ve üstü |
| Oynama süresi | İlk gün oyuncu başına 20 dakika ve üstü |
| Bölüm hunisi | İlk 10 bölümde bırakma oranı her bölümde %5'in altında |

## Faz 0: Prototipi oyuna çevir (2–3 hafta)

Tek dosyada kalarak "tamamlanmış hissi veren" bir oyun yapmak.

**Oynanış**
- [ ] Ses efektleri (emme, dolma, yuva, kazanma, kaybetme) ve müzik, Web Audio ile kodda üretilmiş
- [ ] Titreşim (Android'de `navigator.vibrate`, mobil pakette Capacitor Haptics)
- [ ] Ayarlar: ses, müzik, titreşim
- [ ] İlk 3 bölüme adım adım öğretici (tek parmak, vurgulu toplayıcı)
- [ ] Bölüm seçim haritası ve kilitli bölümler
- [ ] İlerleme kaydı (şimdilik `localStorage`)
- [ ] Kaybedince "devam et" ekranı (ileride reklamla/altınla)
- [ ] Yakın kayıp göstergesi: yuvalar dolmak üzereyken uyarı

**Bölüm üretim hattı**
- [ ] Resimden pixel art dönüştürücü: PNG yükle, 16×16 / 20×20 / 24×24'e indir, sabit paletle eşle, `art` dizisini ver
- [ ] Zorluk puanı: çözücünün kaç yuvaya ihtiyaç duyduğu ve kaç hatalı hamleye tolerans tanıdığı
- [ ] Zorluk eğrisi: kolay-kolay-orta-kolay-zor döngüsü, her 10 bölümde bir "zor bölüm"
- [ ] Bölümleri tek dosyadan ayırıp `levels.json` olarak tut

Çıkış ölçütü: 30 bölüm, ses, öğretici, harita. 5 kişi hiç açıklama almadan ilk 10 bölümü oynayabiliyor.

## Faz 1: Farklılaşma ve kimlik (2–3 hafta)

- [ ] Yukarıdaki fikirlerden 2–3'ünü hızlı prototiple, 5–10 kişiye oynat, birini ana kanca seç
- [ ] Oyunun adı. Mağazada arat, benzer ad yok mu kontrol et. Alan adı ve sosyal medya adı al
- [ ] Karakter tasarımı: toplayıcıların kendi kişiliği (şu anki gözlü kutular iyi bir başlangıç)
- [ ] İkon: 3 farklı ikon hazırla, ileride mağaza A/B testine sok
- [ ] 15–30 saniyelik oynanış videosu: ilk 3 saniyede kanca görünmeli

Çıkış ölçütü: oyunu hiç görmemiş biri videoyu izleyip "Pixel Flow'un aynısı" demiyor.

## Faz 2: Web'de ucuz test (2–4 hafta, paralel yürüyebilir)

Mobil mağazaya girmeden önce gerçek oyuncu verisi toplamanın en ucuz yolu: oyun zaten HTML5.

- [ ] Analitik ekle: bölüm başladı / kazandı / kaybetti / bıraktı, oturum süresi (GameAnalytics veya Firebase)
- [ ] CrazyGames'e gönder. Açık başvuru var, SDK entegrasyonu gerekir, reklam gelirinden pay verilir. Poki davetle çalışır, ayrıca başvurulabilir
- [ ] Oyunun kendi alan adında (ör. GitHub Pages) bir sürüm
- [ ] Bölüm hunisinden zorluk ayarı: en çok bırakılan bölümleri kolaylaştır

Not: web portalı kitlesi mobil kitleden farklıdır. Buradaki tutunma rakamı mobilin birebir tahmini değildir, ama "oyun sıkıcı mı, hangi bölüm kırıyor" sorusunu bedavaya cevaplar.

Çıkış ölçütü: en az 1.000 oyuncudan bölüm hunisi verisi, ilk 20 bölümde belirgin bir kırılma noktası kalmamış.

## Faz 3: Mobil paket (2–3 hafta)

**Teknik**
- [ ] Capacitor ile Android ve iOS projesi. Oyun dosyaları uygulamanın içinde gelir, internetsiz açılır
- [ ] Ekran: dikey kilit, çentik/güvenli alan, geri tuşu (Android) davranışı
- [ ] Kayıt `localStorage` yerine Capacitor Preferences (uygulama güncellemesinde silinmesin)
- [ ] Bulut kaydı: Google Play Games / Game Center (telefon değişince ilerleme kaybolmasın)
- [ ] Çökme raporu (Firebase Crashlytics)
- [ ] Düşük seviye 2–3 Android telefonda FPS ve pil testi

**Hesaplar**
- [ ] Google Play geliştirici hesabı (tek seferlik ücret). **Kişisel hesap** açılırsa: yayına çıkmadan önce en az 12 test kullanıcısının 14 gün kesintisiz katıldığı kapalı test zorunlu (13 Kasım 2023 sonrası açılan kişisel hesaplar). **Kurumsal hesap** bu kuraldan muaf ama şirket ve D-U-N-S numarası ister
- [ ] Apple Developer Program (yıllık ücret). iOS derlemesi için Mac gerekir (ya da bulutta Mac/CI hizmeti)
- [ ] 12 kişilik test grubu şimdiden toplanmaya başlanmalı: aile, arkadaş, oyun toplulukları

Çıkış ölçütü: Android kapalı test ve iOS TestFlight'ta çökme olmadan çalışan sürüm.

## Faz 4: Para kazanma (2–3 hafta)

Hybrid-casual modeli: reklam + uygulama içi satın alma (IAP) birlikte. Pixel Flow'da IAP geliri reklam gelirinin yaklaşık 2–3 katı; reklamlar belli bir bölümden sonra sıklaşıyor ve bu "Reklamları Kaldır" satışını besliyor.

**Oyun içi ekonomi**
- [ ] Altın: bölüm sonu ödülü, bölüm zorluğuna göre
- [ ] Güçlendiriciler: +1 bekleme yuvası, toplayıcıları karıştır, mıknatıs (bir rengin açık bloklarını toplar), devam et
- [ ] Günlük ödül ve seri (streak)

**Reklam** (AdMob ile başla, gelir büyüyünce AppLovin MAX veya Unity LevelPlay gibi bir aracıya geç)
- [ ] Ödüllü video: kaybedince devam et, bölüm sonu 2× altın, ücretsiz güçlendirici
- [ ] Geçiş reklamı (interstitial): ilk ~15–20 bölümde hiç yok, sonra bölüm aralarında, sıklık sınırıyla (ör. en az 60–90 saniye arayla)
- [ ] Banner: başlangıçta yok, test ederek karar ver
- [ ] Capacitor AdMob eklentisi (`@capacitor-community/admob` veya muadili)

**IAP**
- [ ] Reklamları Kaldır (geçiş reklamı ve banner kalkar, ödüllü video isteğe bağlı kalır)
- [ ] Altın paketleri, başlangıç paketi (ilk satın alma indirimi), güçlendirici paketleri
- [ ] Satın almayı geri yükle (iOS'ta zorunlu)
- [ ] Fiyatlar: rakiplere bakarak başla, ülke bazlı fiyatlandırmayı mağazanın otomatik dönüşümüne bırak

**Onay ve gizlilik**
- [ ] Avrupa/İngiltere için reklam onayı (Google UMP formu)
- [ ] iOS'ta izleme izni (ATT) penceresi, reddedilirse kişiselleştirilmemiş reklam
- [ ] Gizlilik politikası sayfası (KVKK ve GDPR'yi kapsayan), kendi alan adında
- [ ] Oyunu çocuklara yönelik **işaretleme**: çocuk hedefli uygulamalarda reklam SDK'ları ve veri toplama çok kısıtlıdır. Hedef kitle 13+ genel kitle olmalı

Çıkış ölçütü: test hesabıyla her reklam türü ve her IAP ürünü uçtan uca çalışıyor, reklamı kaldır satın alınınca geçiş reklamı bir daha çıkmıyor.

## Faz 5: Yumuşak çıkış (soft launch) (4–6 hafta)

Oyunu önce küçük, ucuz birkaç ülkede yayınlayıp veriye bakmak.

- [ ] Mağaza sayfası: ad, kısa/uzun açıklama, 5–8 ekran görüntüsü, tanıtım videosu. Önce İngilizce, sonra Türkçe
- [ ] Yaş derecelendirmesi (Play'de IARC anketi, App Store'da yaş anketi), Veri Güvenliği formu, App Store gizlilik etiketleri
- [ ] Soft launch ülkeleri: kullanıcı başı maliyeti düşük ama oyuncu davranışı batıya yakın ülkeler (ör. Kanada, Avustralya, Filipinler, Türkiye gibi bir karışım)
- [ ] Küçük bütçeli reklam kampanyası (ör. Google App Campaigns, TikTok, Meta) ile CPI ölç
- [ ] Haftalık ölç: D1/D7, oynama süresi, ARPDAU, kullanıcı başı gelir (LTV) tahmini
- [ ] Kural: **LTV > CPI** değilse ölçeklenmez; oyun, bölümler ve ekonomi ayarlanır

**Alternatif yol: yayıncı.** Voodoo, SayGames, Homa, CrazyLabs, Rollic gibi hybrid-casual yayıncıları kendi bütçeleriyle CPI testi yapar, tutarsa reklam bütçesini ve kullanıcı kazanımını üstlenip gelir paylaşır. Tek başına geliştirici için reklam bütçesi en büyük engel olduğundan bu yol ciddi bir seçenek. Faz 1'in videosu ve Faz 2'nin verisiyle başvurulabilir. Sözleşmede hak devri, gelir payı ve oyunun sahipliği dikkatle okunmalı.

Çıkış ölçütü: kapı ölçütlerindeki tutunma ve oynama süresi hedefleri tutuyor, LTV/CPI oranı 1'in üstünde.

## Faz 6: Tam çıkış ve canlı operasyon

- [ ] Tüm ülkelerde yayın, 10+ dil (İngilizce, Türkçe, İspanyolca, Portekizce, Almanca, Fransızca, Japonca, Korece...)
- [ ] Mağaza optimizasyonu (ASO): ikon ve ekran görüntüsü A/B testleri, anahtar kelime güncellemeleri
- [ ] Her hafta yeni bölümler (üretim hattı sayesinde)
- [ ] Etkinlikler: haftalık tema, sezonluk albüm, sınırlı süreli yarış
- [ ] Uzaktan ayar (Firebase Remote Config): reklam sıklığı, fiyatlar, zorluk, güncelleme yayınlamadan değişir
- [ ] Oyuncu yorumlarına yanıt, hata düzeltme ritmi

## Vergi ve ödeme (Türkiye)

- Bireysel mobil uygulama geliştiricileri için **GVK mükerrer 20/B** istisnası var: uygulama gelirleri bu iş için bildirilen özel bir banka hesabına gelir, banka %15 gelir vergisi keser. 2026 yılı için istisna sınırı 5.300.000 TL; aşılırsa kazancın tamamı beyan edilir. İstisna sadece gerçek kişiler içindir, şirketler yararlanamaz.
- AdMob reklam gelirinin ve yabancı yayıncıdan gelen gelir payının bu istisnaya girip girmediği, ne zaman şahıs şirketi ya da limitede geçmenin mantıklı olduğu bir **mali müşavirle** netleştirilmeli.
- Google Play ve App Store küçük geliştiriciler için yıllık ilk 1 milyon dolarlık gelirde %15 komisyon uygular (Apple'da Small Business Program'a başvurmak gerekir).

## Tahmini takvim (tam zamanlı tek geliştirici)

| Faz | Süre | Toplam |
|---|---|---|
| 0: Oyuna çevir | 2–3 hafta | 3. hafta |
| 1: Farklılaşma | 2–3 hafta | 6. hafta |
| 2: Web testi | 2–4 hafta (1 ile paralel) | 8. hafta |
| 3: Mobil paket + 14 günlük kapalı test | 2–3 hafta | 11. hafta |
| 4: Para kazanma | 2–3 hafta (3 ile kısmen paralel) | 13. hafta |
| 5: Soft launch | 4–6 hafta | 19. hafta |
| 6: Tam çıkış | sürekli | |

Yani yaklaşık **4–5 ayda** soft launch'tan geçmiş bir oyun. Faz 5'te veriler hedefi tutmazsa, döngü Faz 0/1'e dönüp oyun değiştirilir; bu normaldir.

## Açık kararlar

1. **Kendi yayınlama mı, yayıncı mı?** Öneri: Faz 2 verisi iyi gelirse yayıncılara başvur, paralelde kendi soft launch'ını hazırla.
2. **Kişisel mi, kurumsal Play hesabı mı?** Öneri: şirket kurmayı düşünmüyorsan kişisel hesabı şimdi aç ve 12 test kullanıcısını erkenden topla; 14 günlük sayaç kritik yolda.
3. **Ana farklılaşma kancası.** Faz 1 prototiplerinden sonra seçilecek.

## Kaynaklar

- [Pixel Flow: The Publisher's Dream — Deconstructor of Fun](https://www.deconstructoroffun.com/blog/2026/2/13/pixel-flow-the-publishers-dream)
- [Heroic Labs: Pixel Flow 10M+ oyuncu](https://heroiclabs.com/blog/pixel-flow-highlight-announcement/)
- [Pixel Flow: An Analysis of Its Rapid Rise — AppSamurai](https://appsamurai.com/blog/pixel-flow-an-analysis-of-its-rapid-rise/)
- [Play Console Yardım: Yeni kişisel hesaplar için test şartları](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- [CrazyGames Developer Portal](https://developer.crazygames.com/)
- [CrazyGames Documentation: FAQ](https://docs.crazygames.com/faq/)
- [@capacitor-community/admob](https://www.npmjs.com/package/@capacitor-community/admob)
- [Muhasebe News: 2026 içerik üreticisi ve mobil uygulama geliştiricisi istisnası](https://www.muhasebenews.com/sosyal-icerik-ureticileri-ve-mobil-uygulama-gelistiricileri-icin-2026-vergi-istisnasi-basvuru-sureci-ve-banka-bildirimi-uygulamasi/)
- [Verginet: GVK 20/B sirküleri](https://www.verginet.net/dtt/11/Vergi-Sirkuleri-2024-92.aspx)
