# Süpürücü Tim

HTML Canvas ile yazılmış, koşarken ateş edilen zombi süpürme oyunu prototipi.

## Çalıştırma

`index.html` dosyasını tarayıcıda açmanız yeterli. Kurulum ya da derleme gerekmez.

## Oynanış

- Tim otomatik ateş eder. Sağa-sola sürükleyerek (veya ← →) yönlendirirsin.
- Kapıları vurdukça değerleri artar (asker, atış hızı, hasar). Geçtiğin tarafın etkisini alırsın.
- Sandıkları kırınca yeni silah alırsın. Varilleri vurunca patlar.
- Zombi öldürdükçe SÜPÜR barı dolar. Dolunca butona (veya Boşluk tuşuna) bas.
- Altınla bölüm başında yeni silah açılır: Tabanca, Tüfek, Pompalı, Minigun, Lazer, Roketatar.

`eski/suru-ustasi.html` ilk denediğimiz kalabalık koşu prototipidir.

## Kule Savaşı

`kule-savasi/`: pastel/şirin görünümlü, dikey ekran için yapılmış bir kule ele geçirme oyunu. Açmak için `kule-savasi/index.html` yeterli.

- Mavi kulenden başka bir kuleye sürükle: aralarında oklu bir yol açılır ve askerler yürümeye başlar. Sürüklerken diğer mavi kulelerinin üstünden geçersen hepsi birden saldırır.
- Dost kuleye varan asker sayıyı artırır. Düşman ya da gri kuleye varan asker sayıyı 1 azaltır; sayı 0'a inince kule senin olur.
- Kuleler saniyede asker üretir. 20 ve 40 askerde büyür, daha hızlı üretir ve daha çok yol açabilir.
- Bir yolu kesmek için boş alandan çizginin üstünden kaydır.
- Her seviyede 3 yıldız kazanılabilir: kazan, hiç kule kaybetme, hedef süreden hızlı bitir.
- 2 dünya, 20 seviye: Çayır (hızlı tempo) ve Göl Kıyısı (menzil, kayalar, göller, nehirler ve köprüler). Dünya haritasından seviye seçilir.

Yol haritası ve verilen kararlar `kule-savasi/PLAN.md` dosyasında. Seviye dengesini ölçmek için `kule-savasi/tools/denge.html` açılabilir.
