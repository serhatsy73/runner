# Kıraathane

HTML5 Canvas ve saf JavaScript ile yazılmış kıraathane oyun platformu prototipi: Okey, 101, Batak ve Poker (Texas Hold'em).

## Çalıştırma

`index.html` dosyasını tarayıcıda açmanız yeterli. Kurulum, derleme ya da dış kütüphane gerekmez. Kartlar, taşlar, çipler ve çay bardağı Canvas fırça kodlarıyla çizilir.

## Neler var

- **Lobi:** Okey, 101, Batak ve Poker sekmeleri, her sekmede masa listesi. "Otur" deyince boş koltuklara 3 bot oturur. "Masanı kur" ile global kurallar yerine masa ayarı seçilebilir (Batak, 101 ve Poker).
- **Batak:** 52'lik deste, yelpaze şeklinde el, ortaya sürükle-bırak ya da iki kez dokun. Tekli ya da eşli, koz maça ya da ihaleli, 3-5-7 el. Renk verme ve yükseltme zorunlu.
- **Okey:** 106 taş, gösterge ve okey, çift sıra ıstaka. Ortadan ya da soldan taş çek, sağ alttaki yığına at, göstergeye bırakarak bitir. Seri ve çift bitiş denetlenir, 12-13-1 geçerli. Göstergenin eşi olan ilk taşını atmadan önce gösterebilir, diğerleri 1 puan düşer. "Seri diz" ve "Çift diz" düğmeleri var. Herkes 20 puanla başlar; düz bitiş diğerlerinden 2, okeyle ya da çiftten 4, ikisi birden 8 puan düşürür. Biri 0'a inince oyun biter.
- **101:** 21 taşla başlanır, ıstaka 2×15. Perler 101 sayıyı bulunca "El aç", en az 5 çift varsa "Çift aç". Açtıktan sonraki turlarda yerdeki perlere taş işlenebilir; okeyin yerine geçen taş işlenirse okey yerden alınır (kütte eksik renklerin hepsi tamamlanınca). Yandan alınan taş o tur kullanılmak zorunda. Okeyle ve elden bitme 2x, ikisi birden 4x. Açmayan 202, çiftten açanın kalan taşları 2 kat yazar. Okey ya da işlek taş atan 101 ceza yer. 12-13-1 serisi yok. Dört masa modu: normal/cezalı × katlamalı/katlamasız. Katlamalıda her açan önceki açılışı geçmeli. Cezalıda yandan alınan taşla el açılırsa atan taşın 10 katı, okeyi yerden alınan 101 ceza yer; 151 üstü ya da 7 çift açılış −101 ödül alır.
- **Poker:** Kör 10/20, 25/50 ya da 50/100, flop, turn, river, showdown. Yan pot hesabı var. Pas, kontrol/gör, artır düğmeleri. Çip yığınını pota sürükleyerek de artırabilirsin.
- **Hamle süresi:** Sırası gelen oyuncunun avatarında geri sayım halkası. Süre dolunca otomatik hamle, üst üste iki kez dolarsa oyuncu "uzakta" sayılır ve "Oyuna dön" düğmesi çıkar.

## Mimari (online'a hazır)

- `BaseGame` → `BatakGame`, `OkeyGame` → `Okey101Game`, `PokerGame`.
- Her hamle `dispatchAction({ type, seat, payload })` ile gönderilir. Oyun durumunu yalnızca `applyAction()` değiştirir.
- Şu an `LocalTransport` hamleyi tarayıcıdaki `LocalServer`'a iletiyor. Online sürümde `WebSocketTransport` aynı mesajları sunucuya yollayacak. Sunucu tarafında `applyAction()` ve bot kararları aynen kullanılabilir.
- Botlar da insan oyuncu gibi `dispatchAction` üzerinden oynar.
- Görünüm durumdan türetilir: `targets()` her kart/taşın hedef konumunu verir, sprite'lar `lerp` ile oraya kayar. `requestAnimationFrame` döngüsü, kart/taş yüzleri önbellekte.
- Istakadaki taş dizilimi istemci tarafındadır, sunucuya gönderilmez.
- Masada sağ üstteki **Olaylar** düğmesi gönderilen ve reddedilen hamleleri canlı gösterir.

Kuralların tamamı `KURALLAR.md`, plan ve açık işler `ROADMAP.md` dosyasında.

## Eski prototipler

- `eski/supurucu-tim.html`: Süpürücü Tim, zombi süpürme shooter-runner.
- `eski/suru-ustasi.html`: Sürü Ustası, kalabalık koşu.
