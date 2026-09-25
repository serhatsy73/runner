# Piksel Toplayıcı Tasarım Dokümanı

Bu dosya temaların sırasını, her mekaniğin kuralını ve bölümlerin nasıl dizileceğini anlatır. Yol haritası (ne zaman, hangi sırayla) `ROADMAP.md` içindedir.

## Temel oyun (değişmez)

- Tablo en fazla 24×24 hücre. Daha büyüğü telefonda okunmaz.
- Bant tablonun dört kenarını dolaşır. Kapı (giriş ve çıkış) alt ortada, bekleme yuvalarının hemen üstündedir. Toplayıcı kapıdan sağa çıkar, sağ kenardan yukarı, üstten sola, sol kenardan aşağı gider ve tam turla kapıya döner.
- **Tek atış:** toplayıcı geçtiği her satır ve sütunda yalnızca en öndeki bloğa bakar. Rengi tutarsa o tek bloğu çeker, tutmazsa hiçbir şey almaz. Arkadaki bloklar öndeki gidene kadar korunur.
- **Açıkta blok:** bir satırda soldan ya da sağdan, bir sütunda alttan ya da üstten bakınca önünde başka blok olmayan blok. Bütün mekanik kuralları bu tanımı kullanır.
- Kapasitesi biten toplayıcı hızlanıp kapıdan çıkar. Tam turu bitirip dolmadan kapıya dönen toplayıcı 5'lik bekleme yuvasına iner. Yuvaların hepsi dolunca bölüm kaybedilir.
- Bir bölümdeki toplayıcıların kapasiteleri toplamı, o renkteki blok sayısına eşittir.

## Bölüm yapısı

Her 15 bölüm bir **tema** (bölüm grubu). Her temada:

| Bölüm | Rolü |
|---|---|
| 1. bölüm | Yeni mekaniği tanıtır. Küçük tablo, tek başına mekanik, öğretici ipucu |
| 2–4 | Mekanik kolay hâliyle, önceki mekaniklerle karışmaz |
| 5, 10 | "Zor bölüm" etiketi, daha az yuva payı |
| 6–14 | Yeni mekanik önceki mekaniklerle karışır |
| 15. bölüm | Tema finali: büyük tablo (20×20 ile 24×24), temanın en iyi resmi |

Tema bitince o temanın resimleri **koleksiyon albümünde** bir sayfayı tamamlar ve bir ödül sandığı açılır.

Zorluk bir tema içinde dalga gibi ilerler (kolay, kolay, orta, kolay, zor...). Yeni bir tema her zaman bir önceki temanın finalinden daha kolay başlar.

## Tema ve mekanik sırası

Yeni mekanik temanın hikâyesine uyacak şekilde seçildi. Türk motifleri (Tatlılar, Çini ve Kilim, İstanbul, Masallar) oyuna kimlik verir; diğer temalar dünya kitlesine hitap eder.

| Bölümler | Tema | Örnek resimler | Yeni mekanik |
|---|---|---|---|
| 1–15 | Hayvanlar Âlemi | kedi, köpek, tavşan, panda, baykuş, kurbağa | Temel oyun (tablo 12×12'den 16×16'ya büyür) |
| 16–30 | Meyveler | çilek, karpuz, kiraz, ananas, üzüm | Buzlu blok |
| 31–45 | Tatlılar | lokum, simit, baklava, dondurma, pamuk şeker | İpli bloklar (aynı renk) |
| 46–60 | Deniz Altı | balık, ahtapot, deniz kabuğu, balina | Gizli renk bloğu |
| 61–75 | Çini ve Kilim | lale, karanfil, nazar boncuğu, kilim deseni | Kilit ve anahtar |
| 76–90 | Uzay | roket, gezegen, astronot, uzaylı | İpli bloklar (farklı renk) |
| 91–105 | Orman | mantar, ayı, sincap, çam ağacı | Birleşen toplayıcılar |
| 106–120 | İstanbul | martı, vapur, Galata, çay bardağı, tramvay | Tur makası |
| 121–135 | Müzik | bağlama, darbuka, gitar, nota | Taş blok |
| 136–150 | Dinozorlar | T-Rex, triceratops, yumurta, volkan | İki renkli toplayıcı |
| 151–165 | Kış | kardan adam, penguen, eldiven, kar tanesi | Kaygan bant bölgesi |
| 166–180 | Masallar | Keloğlan, Nasreddin Hoca, ejderha, şato | Çift katmanlı resim |
| 181–195 | Taşıtlar | araba, tren, uçak, balon | Boya kovası |
| 196–210 | Karnaval | tüm temalardan karışık | Yeni mekanik yok, hepsinin karışımı |

Soft launch ilk 8 temayla (120 bölüm), tam çıkış 14 temayla (210 bölüm) yapılır. Sonrasında her 2–3 haftada bir yeni tema eklenir.

## Mekanik kuralları

Her mekanik için: kural, oyuncuya nasıl görüneceği ve çözücünün neyi bilmesi gerektiği. Kurallar ilk prototipten sonra oynanışa göre ayarlanabilir; değişiklik bu dosyaya yazılır.

### Buzlu blok (16–30)

- **Kural:** Blok iki kez toplanmalı. İlk kez toplanınca buz kırılır ve toplayıcının kapasitesinden 1 düşer, blok yerinde kalır. İkinci kez toplanınca normal blok gibi gider.
- **Görünüş:** Blok rengi buzun altından soluk görünür. İlk vuruşta çatlama efekti ve buz parçaları.
- **Çözücü:** Buzlu blok o rengin kapasite toplamında 2 sayılır.

### İpli bloklar, aynı renk (31–45)

- **Kural:** 2–4 aynı renk blok bir iple bağlıdır. Bir toplayıcı gruptan bir bloğu topladığında ip diğerlerini de çeker, açıkta olmasalar bile. Hepsi kapasiteden düşer.
- **Kapasite yetmezse:** toplayıcının kalan kapasitesi grubun tamamına yetmiyorsa hiçbiri kopmaz. İp gerilir, titrer ve toplayıcı geçip gider. Oyuncu doğru kapasiteli toplayıcıyı göndermeyi planlamak zorundadır.
- **Görünüş:** Bloklar arasında kıvrımlı bir ip çizgisi. Çekilince ip gerilip bloklar sırayla uçar. Reklam videosu için en çarpıcı an bu, ilk 3 saniyede gösterilmeli.
- **Çözücü:** Grup tek bir büyük blok gibi davranır: grubun herhangi bir bloğu açıktaysa grup açıktır, ağırlığı grup boyutu kadardır.

### Gizli renk bloğu (46–60)

- **Kural:** Blok gri ve üzerinde "?" ile başlar. Açığa çıktığı an gerçek rengi görünür ve normal blok olur.
- **Görünüş:** Açığa çıkınca küçük bir dönme animasyonuyla renk ortaya çıkar.
- **Çözücü:** Çözücü gerçek rengi bilir. Zorluk puanı, gizli blokların kaç tanesinin oyuncunun planını bozabileceğine göre artar.

### Kilit ve anahtar (61–75)

- **Kural:** Kilitli bloklar gri kilitle kaplıdır ve hiçbir toplayıcı onları alamaz, önlerindeki blokları da korurlar. Tabloda aynı renkte bir anahtar bloğu vardır. Anahtar toplanınca o renkteki bütün kilitler açılır ve bloklar normal olur.
- **Görünüş:** Anahtar bloğunda anahtar simgesi. Kilitler açılırken tık sesiyle sırayla patlar.
- **Çözücü:** Anahtar alınana kadar kilitli bloklar "renksiz duvar" sayılır.

### İpli bloklar, farklı renk (76–90)

- **Kural:** Farklı renkte iki blok iple bağlıdır. İpin iki ucu da açıkta olana kadar ikisi de yerinden kopmaz. İki uç da açığa çıkınca ip kopar ve iki blok normal blok olarak kendi renklerindeki toplayıcılarla toplanır.
- **Görünüş:** İp, uçlardan biri açıktayken kırmızımsı ve gergin, ikisi de açıkken yeşil ve gevşek görünür. Kopunca ip parçaları düşer.
- **Çözücü:** Açıklık kontrolüne "eşi de açık mı" şartı eklenir.

### Birleşen toplayıcılar (91–105)

- **Kural:** Bekleme yuvasında aynı renkte iki toplayıcı yan yana gelirse birleşir: kapasiteleri toplanır ve bir yuva boşalır.
- **Neden:** Yuva baskısını azaltan, oyuncuya "yuvaları dizme" kararı veren olumlu bir mekanik. Önceki temaların zorluğundan sonra nefes aldırır.
- **Çözücü:** Yuva durumu sıralı tutulur, birleşme kuralı uygulanır.

### Tur makası (106–120)

- **Kural:** Bandın çıkışında bir makas düğmesi vardır. Makas açıkken bant sonuna varan ve dolmamış toplayıcı yuvaya düşmez, tekrar girişe dönüp bir tur daha atar. Makasın sınırlı kullanımı vardır (ör. bölüm başına 3).
- **Görünüş:** Çıkışın yanında dokunulabilir bir makas ve üzerinde kalan kullanım sayısı. Açıkken bant sonu yeşil bir ok ile girişe bağlanır.
- **Çözücü:** Makas kullanımı çözücünün hamle seçeneklerine eklenir.

### Taş blok (121–135)

- **Kural:** Taş renksizdir, hiçbir toplayıcı onu alamaz. Dört komşusundan biri toplandığında çatlar. İkinci çatlakta kırılıp kaybolur. Taşın arkası taş kırılana kadar kapalıdır.
- **Görünüş:** Gri taş, çatlak çizgileri, kırılınca toz ve parçalar.
- **Çözücü:** Taşın çatlak sayısı durumda tutulur.

### İki renkli toplayıcı (136–150)

- **Kural:** Toplayıcının gövdesi iki renge bölünmüştür ve iki renkten de blok toplar. Tek bir kapasitesi vardır.
- **Görünüş:** Çapraz ikiye bölünmüş gövde, iki renkli göz bebekleri.
- **Çözücü:** Kapasite dağılımı sabit değildir. Bölüm üretici, iki rengin toplam blok sayısı ile iki renge ait bütün toplayıcıların kapasite toplamını eşitler.

### Kaygan bant bölgesi (151–165)

- **Kural:** Bandın bazı kısımları buzludur. Toplayıcı buradan hızla kayar ve bu kısımda **hiç blok toplamaz**.
- **Görünüş:** Bandın o kısmı buz mavisi ve parlak. Kayarken toplayıcının gözleri kocaman açılır.
- **Çözücü:** Kaygan bölgedeki şeritler tur sırasından çıkarılır.

### Çift katmanlı resim (166–180)

- **Kural:** Tablonun arkasında ikinci bir resim vardır. Ön resim tamamen temizlenince arka resim açılır ve bölüm aynı yuva durumuyla devam eder.
- **Neden:** Uzun ve heyecanlı final bölümleri, "resmin altından resim çıktı" sürprizi.
- **Çözücü:** İki katman tek bölüm gibi sırayla çözülür, toplayıcı kuyruğu ikisini birlikte kapsar.

### Boya kovası (181–195)

- **Kural:** Bandın üzerinde renkli bir boya kovası durur. Kovanın üzerinden geçen toplayıcının rengi kovanın rengine döner, kapasitesi aynı kalır. Kova her bölümde sınırlı sayıda boyar.
- **Görünüş:** Toplayıcı kovadan geçince boya sıçrar ve yeni rengi yukarıdan aşağı akar.
- **Çözücü:** Kova konumu tur sırasına bir "renk değişimi" noktası olarak eklenir.

## Mekanik tasarlarken kurallar

1. **Her mekanik bir karar yaratmalı.** Sadece süs olan mekanik eklenmez.
2. **Tek cümleyle anlatılabilmeli.** Tanıtım bölümünde bir cümlelik ipucu yeterli olmalı.
3. **Çözücü desteklemeden bölüme girmez.** Yeni mekanik önce çözücüye ve bölüm üreticiye eklenir, sonra bölümlere.
4. **Pixel Flow'da olan ek mekaniklerden kaçın.** Dönen tepsi gibi onların imzası olan mekanikler kullanılmaz.
5. **Reklam videosunda gösterilebilir olmalı.** Özellikle ipli bloklar, kilit açılması ve çift katmanlı resim videonun ana malzemesidir.
