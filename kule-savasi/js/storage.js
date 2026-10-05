// Kayıt: açılan seviye, yıldızlar, ayarlar. Tarayıcı depolaması kapalıysa oyun yine çalışır, sadece hatırlamaz.
(function (KS) {
  'use strict';

  const KEY = 'kuleSavasi.save.v1';
  const OLD_KEY = 'kuleSavasi.level';

  const LAYOUT = 2;   // seviye numaralandırması: 2 = her dünya 25 seviye

  const fresh = () => ({
    layout: LAYOUT,
    unlocked: 1,
    stars: {},                                // { "3": 2, ... }
    settings: { sound: true, haptics: true, view3d: true },
    adsRemoved: false,
    seen: {},                                 // görülen tanıtım kartları { range: true, ... }
    stats: { plays: 0, wins: 0, losses: 0 },
  });

  function read() {
    const data = fresh();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        Object.assign(data, saved);
        data.settings = Object.assign(fresh().settings, saved.settings);
        data.stats = Object.assign(fresh().stats, saved.stats);
        migrate(data, saved.layout || 1);
      } else {
        const old = parseInt(localStorage.getItem(OLD_KEY), 10);
        if (old > 1) data.unlocked = old;
      }
    } catch (e) { /* bozuk ya da erişilemeyen kayıt: sıfırdan başla */ }
    return data;
  }

  // Eski numaralandırmadan (10'luk dünyalar: 1-10 çayır, 11-20 göl) 25'lik dünyalara taşır
  function migrate(data, layout) {
    if (layout >= LAYOUT) return;
    const level = n => n <= 9 ? n : n === 10 ? 25 : n <= 19 ? n + 15 : n === 20 ? 50 : 51;
    const next = n => n <= 10 ? n : n <= 20 ? n + 15 : 51;   // "sıradaki oynanabilir seviye"
    const stars = {};
    for (const k in data.stars) stars[level(+k)] = data.stars[k];
    data.stars = stars;
    data.unlocked = next(data.unlocked);
    data.layout = LAYOUT;
  }

  const Save = KS.Save = {
    data: read(),
    write() {
      try { localStorage.setItem(KEY, JSON.stringify(Save.data)); } catch (e) { /* depolama kapalı olabilir */ }
    },
    starsFor: n => Save.data.stars[n] || 0,
    // sadece şu an oyunda olan seviyelerin yıldızları sayılır
    starsIn: (from, to) => { let s = 0; for (let n = from; n <= to; n++) s += Save.starsFor(n); return s; },
    totalStars: () => Save.starsIn(1, KS.Levels.count),
    // yeni rekor mu döndürür
    recordWin(n, stars) {
      const prev = Save.starsFor(n);
      if (stars > prev) Save.data.stars[n] = stars;
      Save.data.unlocked = Math.max(Save.data.unlocked, n + 1);
      Save.data.stats.wins++;
      Save.write();
      return stars > prev;
    },
    recordLoss() { Save.data.stats.losses++; Save.write(); },
    recordPlay() { Save.data.stats.plays++; Save.write(); },
    markSeen(key) { Save.data.seen[key] = true; Save.write(); },
    setSetting(k, v) { Save.data.settings[k] = v; Save.write(); },
  };
})(window.KS);
