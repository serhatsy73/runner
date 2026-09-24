// Seviye verisi. Kule konumları oyun alanında 0..1 aralığındadır, par: 3. yıldız için hedef süre (sn).
(function (KS) {
  'use strict';
  const { NEUTRAL: N, PLAYER: P, RED: R, YELLOW: Y } = KS;
  const t = (x, y, team, count) => ({ x, y, team, count });

  const LIST = [
    { par: 55, ai: [R], towers: [
      t(.5, .86, P, 20), t(.5, .13, R, 15),
      t(.2, .62, N, 5), t(.8, .62, N, 5), t(.2, .36, N, 5), t(.8, .36, N, 5), t(.5, .5, N, 14),
    ]},
    { par: 70, ai: [R], towers: [
      t(.25, .86, P, 20), t(.75, .14, R, 25),
      t(.75, .72, N, 8), t(.25, .28, N, 8), t(.5, .5, N, 20), t(.18, .58, N, 6), t(.82, .42, N, 6),
    ]},
    { par: 90, ai: [R, Y], towers: [
      t(.5, .87, P, 30), t(.18, .13, R, 18), t(.82, .13, Y, 18),
      t(.5, .62, N, 12), t(.2, .45, N, 8), t(.8, .45, N, 8), t(.5, .33, N, 25), t(.26, .74, N, 6), t(.74, .74, N, 6),
    ]},
    { par: 95, ai: [R], towers: [
      t(.2, .86, P, 18), t(.8, .86, P, 12), t(.5, .12, R, 40),
      t(.5, .72, N, 15), t(.18, .58, N, 10), t(.82, .58, N, 10), t(.3, .36, N, 12), t(.7, .36, N, 12), t(.5, .46, N, 30),
    ]},
    { par: 110, ai: [R, Y], towers: [
      t(.5, .9, P, 30), t(.15, .1, R, 25), t(.18, .38, N, 12), t(.85, .1, Y, 25), t(.82, .38, N, 12),
      t(.5, .24, N, 30), t(.5, .56, N, 18), t(.24, .7, P, 10), t(.76, .7, N, 8),
    ]},
  ];

  // Elle yapılanlardan sonrası seviye numarasından türetilir: aynı seviye hep aynı haritayı verir.
  // Harita simetriktir (tek rakipte merkeze göre, iki rakipte sağ-sol), böylece şansa bağlı haksız başlangıç olmaz.
  // Zorluk; rakibin başlangıç askeri ve yapay zekânın hızıyla artar.
  function generate(n) {
    const rnd = KS.rng(n * 7919 + 13);
    const two = n % 2 === 0;
    const T = [t(.5, .88, P, 22)];
    const free = (x, y) => T.every(o => Math.hypot(o.x - x, (o.y - y) * 1.55) >= .23);
    const count = () => Math.min(35, 4 + Math.floor(rnd() * (6 + n * .8)));

    if (two) {
      const side = rnd() < .5 ? .2 : .8;
      T.push(t(.18, .12, R, Math.min(40, 12 + n)), t(.82, .12, Y, Math.min(40, 12 + n)), t(side, .8, P, 10));
    } else {
      T.push(t(.5, .12, R, Math.min(45, Math.floor(8 + n * 1.2))), t(.5, .5, N, Math.min(35, 10 + n)));
    }
    const pairs = 2 + Math.min(2, Math.floor((n - 5) / 3));
    for (let made = 0, tries = 0; made < pairs && tries < 3000; tries++) {
      let x, y, mx, my;
      if (two) { x = .12 + rnd() * .3; y = .26 + rnd() * .44; mx = 1 - x; my = y; }
      else { x = .12 + rnd() * .76; y = .24 + rnd() * .22; mx = 1 - x; my = 1 - y; }
      if (!free(x, y) || !free(mx, my) || Math.hypot(mx - x, (my - y) * 1.55) < .23) continue;
      const c = count();
      T.push(t(x, y, N, c), t(mx, my, N, c));
      made++;
    }
    return { par: 50 + T.length * 4, ai: two ? [R, Y] : [R], towers: T };
  }

  KS.Levels = {
    handmade: LIST.length,
    get: n => n <= LIST.length ? LIST[n - 1] : generate(n),
  };
})(window.KS);
