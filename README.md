# Kıraathane

HTML5 Canvas ve saf JavaScript ile yazılmış kıraathane oyun platformu prototipi: Okey, 101, Batak ve Poker (Texas Hold'em).

## Çalıştırma

`index.html` dosyasını tarayıcıda açmanız yeterli. Kurulum, derleme ya da dış kütüphane gerekmez. Kartlar, taşlar, çipler ve çay bardağı Canvas fırça kodlarıyla çizilir.

## Neler var

- **Lobi:** Okey, 101, Batak ve Poker sekmeleri, her sekmede masa listesi. "Otur" deyince boş koltuklara 3 bot oturur.
- **Batak:** 52'lik deste, yelpaze şeklinde el, ortaya sürükle-bırak ya da iki kez dokun. Koz maça sabit. Renk verme ve yükseltme zorunlu. İhale turu henüz yok.
- **Okey:** 106 taş, gösterge ve okey, çift sıra ıstaka. Ortadan ya da soldan taş çek, sağ alttaki yığına at, göstergeye bırakarak bitir. Seri ve çift bitiş denetlenir. "Seri diz" ve "Çift diz" düğmeleri var.
- **101:** 21 taşla başlanır. Perler 101 sayıyı bulunca "El aç" (en iyi per otomatik seçilir). Açtıktan sonra son taşı atan eli bitirir.
- **Poker:** Kör 10/20, flop, turn, river, showdown. Yan pot hesabı var. Pas, kontrol/gör, artır düğmeleri. Çip yığınını pota sürükleyerek de artırabilirsin.

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
