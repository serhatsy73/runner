# Kıraathane

HTML5 Canvas ve saf JavaScript ile yazılmış kıraathane oyun platformu prototipi: Okey, 101, Batak ve Poker (Texas Hold'em).

## Çalıştırma

`index.html` dosyasını tarayıcıda açmanız yeterli. Kurulum, derleme ya da dış kütüphane gerekmez. Kartlar, taşlar, çipler ve çay bardağı Canvas fırça kodlarıyla çizilir.

## Neler var

- **Lobi:** Okey, 101, Batak ve Poker sekmeleri, her sekmede masa listesi. "Otur" deyince boş koltuklara 3 bot oturur. "Masanı kur" ile global kurallar yerine masa ayarı seçilebilir (şimdilik Batak ve Poker).
- **Batak:** 52'lik deste, yelpaze şeklinde el, ortaya sürükle-bırak ya da iki kez dokun. Tekli ya da eşli, koz maça ya da ihaleli. Renk verme ve yükseltme zorunlu.
- **Okey:** 106 taş, gösterge ve okey, çift sıra ıstaka. Ortadan ya da soldan taş çek, sağ alttaki yığına at, göstergeye bırakarak bitir. Seri ve çift bitiş denetlenir. "Seri diz" ve "Çift diz" düğmeleri var.
- **101:** 21 taşla başlanır. Perler 101 sayıyı bulunca "El aç", en az 5 çift varsa "Çift aç". Açtıktan sonraki turlarda yerdeki perlere taş işlenebilir. Okeyin yerine geçen taş işlenirse okey yerden alınır (kütte eksik renklerin hepsi tamamlanınca). Son taşı atan eli bitirir. Okeyle bitme ve elden bitme 2x, ikisi birden 4x. Açmayan 202, çiftten açanın kalan taşları 2 kat yazar. 12-13-1 serisi yok.
- **Poker:** Kör 10/20, 25/50 ya da 50/100, flop, turn, river, showdown. Yan pot hesabı var. Pas, kontrol/gör, artır düğmeleri. Çip yığınını pota sürükleyerek de artırabilirsin.

## Mimari (online'a hazır)

- `BaseGame` → `BatakGame`, `OkeyGame` → `Okey101Game`, `PokerGame`.
- Her hamle `dispatchAction({ type, seat, payload })` ile gönderilir. Oyun durumunu yalnızca `applyAction()` değiştirir.
- Şu an `LocalTransport` hamleyi tarayıcıdaki `LocalServer`'a iletiyor. Online sürümde `WebSocketTransport` aynı mesajları sunucuya yollayacak. Sunucu tarafında `applyAction()` ve bot kararları aynen kullanılabilir.
- Botlar da insan oyuncu gibi `dispatchAction` üzerinden oynar.
- Görünüm durumdan türetilir: `targets()` her kart/taşın hedef konumunu verir, sprite'lar `lerp` ile oraya kayar. `requestAnimationFrame` döngüsü, kart/taş yüzleri önbellekte.
- Istakadaki taş dizilimi istemci tarafındadır, sunucuya gönderilmez.
- Masada sağ üstteki **Olaylar** düğmesi gönderilen ve reddedilen hamleleri canlı gösterir.

Plan ve açık işler için `ROADMAP.md` dosyasına bak.

## Eski prototipler

- `eski/supurucu-tim.html`: Süpürücü Tim, zombi süpürme shooter-runner.
- `eski/suru-ustasi.html`: Sürü Ustası, kalabalık koşu.
