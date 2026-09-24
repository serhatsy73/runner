// Ortak sabitler ve küçük yardımcılar. Diğer bütün dosyalar window.KS üzerinden bunları kullanır.
window.KS = window.KS || {};
(function (KS) {
  'use strict';

  KS.NEUTRAL = 0; KS.PLAYER = 1; KS.RED = 2; KS.YELLOW = 3;

  KS.TEAMS = [
    { name: 'Tarafsız', fill: '#cdd0d8', dark: '#9ba1ad', light: '#e9ebf0' },
    { name: 'Sen',      fill: '#7db9f2', dark: '#4d8fd6', light: '#d3e8fc' },
    { name: 'Kırmızı',  fill: '#f59b9b', dark: '#dd6a6a', light: '#fcdcdc' },
    { name: 'Sarı',     fill: '#f6d26b', dark: '#d5a93a', light: '#fbefc2' },
  ];

  KS.INK = '#4b4560';
  KS.CHEEK = 'rgba(255,140,165,.55)';
  KS.FONT = '"Fredoka", "Baloo 2", "Segoe UI", system-ui, sans-serif';

  KS.CAP = 99;                    // üretimin durduğu asker sayısı
  KS.RATE = [0, 1, 1.4, 1.8];     // kule seviyesine göre saniyede üretilen asker
  KS.SEND = [0, .5, .4, .32];     // kule seviyesine göre asker gönderme aralığı (sn)
  KS.lvlOf = c => c >= 40 ? 3 : c >= 20 ? 2 : 1;
  // Küçülme eşikleri büyüme eşiklerinden düşük: 20'de büyüyen kule 15'in altına inmeden küçülmez.
  // Böylece askerini gönderen kule hemen yavaşlamaz.
  KS.LVL_DOWN = [0, 0, 15, 33];
  KS.OVERPROD = 60;               // bu sayının üstünde üretim yavaşlar (önde olanın kaçmasını frenler)
  KS.OVERPROD_RATE = .35;
  KS.SURGE_AT = 180;              // bu saniyeden sonra "Son Hücum": herkes 2 kat üretir, kilitlenen oyunlar biter
  KS.RANGE_PER_LVL = .12;         // kule seviyesi başına menzil artışı

  // Tasarım birimi: x ekseni bu oranla küçültülür, böylece menzil ve engeller her ekranda aynı çalışır.
  // (Seviye verisinde x ve y 0..1 aralığında; mesafe = hypot(dx * ASPECT, dy))
  KS.ASPECT = .62;

  // Varsayılan rakip kişilikleri (seviye verisinde değiştirilebilir)
  KS.PERSONA = { 2: 'aggressive', 3: 'greedy' };

  // Oyun temposu: ilk dünyada hızlı ve refleks ağırlıklı, ilerledikçe sakinleşip stratejiye döner
  KS.tempo = n => {
    if (n <= 10) return { speed: 1.18, prod: 1.1 };
    if (n <= 20) return { speed: 1.05, prod: 1 };
    return { speed: .92, prod: .95 };
  };

  KS.rng = seed => () => {
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  KS.fmtTime = s => {
    s = Math.max(0, Math.round(s));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  };
})(window.KS);
