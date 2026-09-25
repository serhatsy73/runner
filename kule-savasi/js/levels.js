// Seviyeler ve dünyalar.
// Kule konumları oyun alanında 0..1 aralığındadır. par: 3. yıldız için hedef süre (sn).
// range: menzil (tasarım birimi, yok = sınırsız) · obstacles: bkz. terrain.js
// intro: ilk kez görülen mekanik için seviye öncesi tanıtım kartı · tip: seviye başında kısa duyuru
// persona: { takım: 'aggressive' | 'greedy' | 'cautious' } varsayılan kişiliği değiştirir
(function (KS) {
  'use strict';
  const { NEUTRAL: N, PLAYER: P, RED: R, YELLOW: Y } = KS;
  const t = (x, y, team, count) => ({ x, y, team, count });
  const rock = (x, y, r) => ({ type: 'rock', x, y, r: r || .036 });
  const tree = (x, y, r) => ({ type: 'tree', x, y, r: r || .04 });
  const lake = (x, y, rx, ry) => ({ type: 'lake', x, y, rx, ry });
  const river = (pts, w, bridges) => ({ type: 'river', pts, w, bridges });

  const INTRO = {
    multi: {
      title: 'Birlikte saldır',
      text: 'Sürüklerken diğer mavi kulelerinin <strong>üstünden geç</strong>. Bıraktığında hepsi aynı hedefe akar. Ortadaki büyük kuleyi birlikte çok daha hızlı alırsın!',
    },
    yellow: {
      title: 'Yeni rakip: Sarı',
      text: 'Kırmızı <strong>saldırgandır</strong>, doğrudan sana gelir. Sarı <strong>açgözlüdür</strong>: önce gri kuleleri toplar, güçlenince büyük bir saldırı yapar. Onu erken rahatsız et!',
    },
    range: {
      title: 'Menzil',
      text: 'Bu dünyada kuleler sadece <strong>menzilindeki</strong> kulelere yol açabilir. Sürüklerken menzil halkasını görürsün. Kule büyüdükçe menzili de büyür. Uzaktaki kulelere adım adım ilerle.',
    },
    rocks: {
      title: 'Kayalar ve ağaçlar',
      text: 'Yollar kayaların ve ağaçların <strong>içinden geçemez</strong>. Önü kapalı bir kuleye sürüklersen çizgi gri görünür. Etrafından dolaş!',
    },
    river: {
      title: 'Nehir ve köprü',
      text: 'Nehrin üstünden sadece <strong>köprüden</strong> geçilir. Köprünün iki yanındaki kuleler çok değerlidir: onları tutan, geçidi tutar.',
    },
  };

  const LIST = [
    // ---------- Dünya 1: Çayır (hızlı, refleks) ----------
    { par: 40, ai: [R], towers: [   // 1: ilk adım
      t(.5, .86, P, 20), t(.5, .13, R, 15),
      t(.2, .62, N, 5), t(.8, .62, N, 5), t(.2, .36, N, 5), t(.8, .36, N, 5), t(.5, .5, N, 14),
    ]},
    { par: 45, ai: [R], towers: [   // 2
      t(.25, .86, P, 20), t(.75, .14, R, 16),
      t(.75, .72, N, 8), t(.25, .28, N, 8), t(.5, .5, N, 20), t(.18, .58, N, 6), t(.82, .42, N, 6),
    ]},
    { par: 60, ai: [R], intro: 'multi', towers: [   // 3: birlikte saldırmayı öğret
      t(.28, .86, P, 12), t(.72, .86, P, 12), t(.5, .12, R, 15),
      t(.5, .64, N, 22), t(.18, .5, N, 5), t(.82, .5, N, 5), t(.5, .36, N, 10), t(.25, .24, N, 6), t(.75, .24, N, 6),
    ]},
    { par: 75, ai: [R], towers: [   // 4: güçlü kırmızı
      t(.2, .86, P, 18), t(.8, .86, P, 12), t(.5, .12, R, 40),
      t(.5, .72, N, 15), t(.18, .58, N, 10), t(.82, .58, N, 10), t(.3, .36, N, 12), t(.7, .36, N, 12), t(.5, .46, N, 30),
    ]},
    { par: 80, ai: [R, Y], intro: 'yellow', towers: [   // 5: ilk sarı
      t(.5, .87, P, 30), t(.18, .13, R, 18), t(.82, .13, Y, 18),
      t(.5, .62, N, 12), t(.2, .45, N, 8), t(.8, .45, N, 8), t(.5, .33, N, 25), t(.26, .74, P, 10), t(.74, .74, N, 6),
    ]},
    { par: 35, ai: [R], towers: [   // 6: nefes: bol küçük gri kule
      t(.5, .86, P, 25), t(.5, .12, R, 12),
      t(.2, .7, N, 3), t(.8, .7, N, 3), t(.35, .55, N, 4), t(.65, .55, N, 4), t(.2, .4, N, 6), t(.8, .4, N, 6), t(.5, .3, N, 8),
    ]},
    { par: 60, ai: [R], tip: 'Kırmızı ortada: her yere yakın!', towers: [   // 7: düşman merkezde
      t(.2, .88, P, 20), t(.5, .5, R, 18),
      t(.8, .88, P, 8), t(.2, .14, N, 8), t(.8, .14, N, 12), t(.2, .5, N, 6), t(.8, .5, N, 6), t(.5, .2, N, 15), t(.5, .8, N, 10),
    ]},
    { par: 80, ai: [R, Y], towers: [   // 8
      t(.5, .9, P, 30), t(.15, .1, R, 25), t(.18, .38, N, 12), t(.85, .1, Y, 25), t(.82, .38, N, 12),
      t(.5, .24, N, 30), t(.5, .56, N, 18), t(.24, .7, P, 10), t(.76, .7, N, 8),
    ]},
    { par: 70, ai: [R, Y], towers: [   // 9: iki rakip, ikişer kule
      t(.3, .9, P, 20), t(.7, .9, P, 20), t(.15, .1, R, 20), t(.15, .35, N, 8), t(.85, .1, Y, 20), t(.85, .35, N, 8),
      t(.5, .12, N, 25), t(.5, .4, N, 15), t(.3, .6, N, 8), t(.7, .6, N, 8), t(.5, .72, N, 12),
    ]},
    { boss: true, par: 115, ai: [R], tip: 'Boss: Kırmızı Kale!', towers: [   // 10: boss
      t(.2, .88, P, 18), t(.5, .9, P, 18), t(.8, .88, P, 18), t(.5, .1, R, 30), t(.25, .22, R, 10), t(.75, .22, R, 10),
      t(.5, .42, N, 20), t(.2, .55, N, 10), t(.8, .55, N, 10), t(.5, .66, N, 8),
    ]},

    // ---------- Dünya 2: Göl Kıyısı (menzil, engeller, köprüler) ----------
    { par: 90, ai: [R], range: .36, intro: 'range', towers: [   // 11: menzil
      t(.5, .9, P, 20), t(.5, .1, R, 20),
      t(.5, .62, N, 8), t(.5, .38, N, 8), t(.22, .74, N, 5), t(.78, .74, N, 5), t(.22, .26, N, 5), t(.78, .26, N, 5), t(.22, .5, N, 6), t(.78, .5, N, 6),
    ]},
    { par: 85, ai: [R], range: .5, intro: 'rocks', towers: [   // 12: kayalar
      t(.5, .88, P, 22), t(.5, .12, R, 14),
      t(.5, .5, N, 15), t(.22, .7, N, 6), t(.78, .7, N, 6), t(.22, .3, N, 6), t(.78, .3, N, 6),
    ], obstacles: [tree(.1, .5), rock(.33, .5), rock(.67, .5), tree(.9, .5), rock(.5, .7, .03), rock(.5, .3, .03)] },
    { par: 170, ai: [R], range: .45, intro: 'river', towers: [   // 13: nehir ve köprü
      t(.5, .86, P, 22), t(.5, .14, R, 16),
      t(.5, .66, N, 10), t(.5, .34, N, 10), t(.2, .7, N, 6), t(.8, .7, N, 6), t(.2, .3, N, 6), t(.8, .3, N, 6),
    ], obstacles: [river([[-.05, .52], [.3, .47], [.7, .53], [1.05, .48]], .07, [[.5, .5]])] },
    { par: 155, ai: [R, Y], range: .42, towers: [   // 14: iki köprü, iki rakip
      t(.5, .88, P, 18), t(.15, .12, R, 24), t(.85, .12, Y, 24),
      t(.25, .64, N, 8), t(.75, .64, N, 8), t(.5, .66, N, 14), t(.25, .27, N, 10), t(.75, .27, N, 10), t(.5, .24, N, 20),
    ], obstacles: [river([[-.05, .44], [.5, .47], [1.05, .44]], .07, [[.25, .4564], [.75, .4564]])] },
    { par: 75, ai: [R], range: .45, towers: [   // 15: nefes: göl
      t(.5, .88, P, 25), t(.5, .12, R, 14),
      t(.15, .5, N, 8), t(.85, .5, N, 8), t(.25, .28, N, 6), t(.75, .28, N, 6), t(.25, .72, N, 6), t(.75, .72, N, 6),
    ], obstacles: [lake(.5, .5, .14, .12)] },
    { par: 115, ai: [R, Y], range: .45, tip: 'Kırmızı ve sarı köprüde çarpışıyor', towers: [   // 16: nehir iki rakibi ayırır
      t(.5, .88, P, 22), t(.2, .12, R, 32), t(.8, .12, Y, 32),
      t(.2, .4, N, 8), t(.8, .4, N, 8), t(.25, .66, P, 10), t(.75, .66, N, 6), t(.5, .72, N, 12),
    ], obstacles: [river([[.5, -.05], [.47, .3], [.53, .55]], .07, [[.4854, .12]])] },
    { par: 130, ai: [R], range: .38, towers: [   // 17: taş labirent
      t(.5, .9, P, 20), t(.5, .1, R, 24),
      t(.5, .6, N, 12), t(.2, .8, N, 6), t(.8, .8, N, 6), t(.2, .55, N, 8), t(.8, .55, N, 8), t(.3, .3, N, 10), t(.7, .3, N, 10),
    ], obstacles: [rock(.5, .75), tree(.08, .42), tree(.92, .42), rock(.5, .4, .03), rock(.12, .68, .03), rock(.88, .68, .03)] },
    { par: 170, ai: [R], range: .45, towers: [   // 18: iki göl
      t(.5, .88, P, 20), t(.5, .12, R, 20),
      t(.5, .5, N, 20), t(.2, .2, N, 8), t(.8, .2, N, 8), t(.2, .8, N, 8), t(.8, .8, N, 8), t(.5, .3, N, 6), t(.5, .7, N, 6),
    ], obstacles: [lake(.2, .5, .08, .14), lake(.8, .5, .08, .14)] },
    { par: 115, ai: [R, Y], range: .42, towers: [   // 19: nehir + kayalar + iki rakip
      t(.3, .88, P, 25), t(.7, .88, P, 25), t(.2, .1, R, 20), t(.8, .1, Y, 20),
      t(.5, .62, N, 16), t(.18, .6, N, 8), t(.82, .6, N, 8), t(.5, .18, N, 25), t(.3, .28, R, 8), t(.7, .28, Y, 8),
    ], obstacles: [river([[-.05, .42], [.5, .4], [1.05, .42]], .065, [[.2, .4109], [.8, .4109]]), rock(.5, .78, .03)] },
    { boss: true, par: 175, ai: [R], range: .42, tip: 'Boss: Nehir Kalesi!', towers: [   // 20: boss
      t(.5, .9, P, 25), t(.2, .78, P, 12), t(.8, .78, P, 12), t(.5, .1, R, 36), t(.2, .25, R, 10), t(.8, .25, R, 10),
      t(.5, .66, N, 15), t(.5, .34, N, 20), t(.2, .62, N, 6), t(.8, .62, N, 6), t(.2, .38, N, 6), t(.8, .38, N, 6),
    ], obstacles: [river([[-.05, .5], [1.05, .5]], .07, [[.3, .5], [.7, .5]])] },
  ];

  const WORLDS = [
    { id: 1, name: 'Çayır', from: 1, to: 10, stars: 0, theme: 'meadow' },
    { id: 2, name: 'Göl Kıyısı', from: 11, to: 20, stars: 12, theme: 'lake' },
    { id: 3, name: 'Karlı Dağ', soon: true },
    { id: 4, name: 'Şeker Diyarı', soon: true },
    { id: 5, name: 'Volkan', soon: true },
  ];

  // Elle yapılanlardan sonrası (şimdilik sadece denge aracında) seviye numarasından türetilir.
  // Harita simetriktir (tek rakipte merkeze göre, iki rakipte sağ-sol), böylece şansa bağlı haksız başlangıç olmaz.
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
    count: LIST.length,
    worlds: WORLDS,
    intros: INTRO,
    get: n => n <= LIST.length ? LIST[n - 1] : generate(n),
    worldOf: n => WORLDS.find(w => !w.soon && n >= w.from && n <= w.to) || null,
  };
})(window.KS);
