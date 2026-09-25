# Piksel Toplayıcı

HTML5 Canvas ve saf JavaScript ile yazılmış, dikey ekranlı "Pixel Art Color Collector" bulmaca oyunu. Tüm kod tek dosyada (`index.html`); harici resim, font ya da kütüphane yok.

## Çalıştırma

`index.html` dosyasını bir tarayıcıda (Chrome, Safari, Edge, Firefox) açın. Kurulum ya da derleme gerekmez. Mobilde dokunma, masaüstünde tıklama ile oynanır.

Dosya önizleme ekranları (ör. iPhone Dosyalar uygulamasındaki hızlı bakış ya da GitHub'daki dosya görünümü) JavaScript çalıştırmaz; oyun orada açılmaz. Betik bir tarayıcıda hata verirse ekranda sebebi yazılır.

## Oynanış

- En alttaki üç sütunda sıralanan renkli toplayıcılardan en öndekine dokun. Toplayıcı, tablonun solundan başlayıp altından geçerek sağına uzanan U şeklindeki banda girer.
- Bantta ilerlerken tablonun dışarıdan görünen, kendi rengindeki bloklarını içine çeker. Üzerindeki sayı kalan kapasitesidir.
- Kapasitesi 0'a inen toplayıcı hızlanıp sahneden ayrılır. Dolmadan bant sonuna varan toplayıcı 5'lik bekleme yuvasına geçer; oradan dokunarak yeniden gönderebilirsin.
- Dıştaki bloklar temizlendikçe içteki katmanlar açığa çıkar.
- Tüm bloklar toplanınca "Level Completed!" ekranı konfetiyle açılır. Bekleme yuvaları doluyken bir toplayıcı daha banttan dönerse bant tıkanır ve "Game Over" olur.
- Bantta aynı anda en fazla 5 toplayıcı bulunabilir.

İlk tema **Hayvanlar Âlemi** (15 bölüm, 12×12'den 20×20'ye). Açılışta bölüm haritası gelir; ilerleme tarayıcıda saklanır. İlk 3 bölümde öğretici ipuçları var. Ayarlardan ses, müzik ve titreşim kapatılabilir. Kaybedince bölüm başına bir kez "+1 yuva ile devam et" hakkı var.

Toplayıcı sırası her bölüm için tohumlu üretilir ve bir çözücüyle çözülebilir olduğu doğrulanır; yeniden denemede aynı bulmaca gelir. Bölümün zorluğu, çözücünün ihtiyaç duyduğu en az yuva sayısıyla ayarlanır.

## Yeni bölüm eklemek

1. `araclar/donusturucu.html` dosyasını tarayıcıda aç, resmi yükle.
2. Boyutu ve renk sayısını seç, gerekirse hücreleri elle düzelt.
3. "Oyunda dene" ile test et; başlıkta çözücünün verdiği zorluk (1–5) yazar.
4. "Kodu kopyala" ile çıkan kodu `index.html` başındaki `PT_DATA.levels` dizisine yapıştır.

## Yol haritası

Mobil yayına ve para kazanmaya kadar olan plan `ROADMAP.md` içinde. Temalar, bölüm yapısı ve her mekaniğin kuralı `TASARIM.md` içinde.
