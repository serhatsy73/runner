// Seviyeler ve dünyalar. Her dünya 25 seviyedir.
//
// Seviye verisi (JSON ile uyumlu; editör bu biçimi üretir):
//   { par, ai: [takımlar], range?, boss?, tip?, intro?, persona?, towers: [{x, y, team, count}], obstacles?: [...] }
// Kule konumları oyun alanında 0..1 aralığındadır. par: 3. yıldız için hedef süre (sn).
// range: menzil (tasarım birimi, yok = sınırsız) · obstacles: bkz. terrain.js
// intro: ilk kez görülen mekanik için seviye öncesi tanıtım kartı · tip: seviye başında kısa duyuru
// persona: { takım: 'aggressive' | 'greedy' | 'cautious' } varsayılan kişiliği değiştirir
//
// Elle yapılmamış yuvalar üreteçle doldurulur (dünyanın temasına göre, deterministik, doğrulanmış).
// Editörle (tools/editor.html) tasarlanan seviyeler buradaki hand listelerine JSON olarak eklenir.
(function (KS) {
  'use strict';
  const { NEUTRAL: N, PLAYER: P, RED: R, YELLOW: Y } = KS;
  const A = KS.ASPECT;
  const PER_WORLD = 25;
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

  // ---------- Dünya 1: Çayır (hızlı, refleks) ----------
  const MEADOW = {
    1: { par: 40, ai: [R], towers: [   // ilk adım
      t(.5, .86, P, 20), t(.5, .13, R, 15),
      t(.2, .62, N, 5), t(.8, .62, N, 5), t(.2, .36, N, 5), t(.8, .36, N, 5), t(.5, .5, N, 14),
    ]},
    2: { par: 45, ai: [R], towers: [
      t(.25, .86, P, 20), t(.75, .14, R, 16),
      t(.75, .72, N, 8), t(.25, .28, N, 8), t(.5, .5, N, 20), t(.18, .58, N, 6), t(.82, .42, N, 6),
    ]},
    3: { par: 60, ai: [R], intro: 'multi', towers: [   // birlikte saldırmayı öğret
      t(.28, .86, P, 12), t(.72, .86, P, 12), t(.5, .12, R, 15),
      t(.5, .64, N, 22), t(.18, .5, N, 5), t(.82, .5, N, 5), t(.5, .36, N, 10), t(.25, .24, N, 6), t(.75, .24, N, 6),
    ]},
    4: { par: 75, ai: [R], towers: [   // güçlü kırmızı
      t(.2, .86, P, 18), t(.8, .86, P, 12), t(.5, .12, R, 40),
      t(.5, .72, N, 15), t(.18, .58, N, 10), t(.82, .58, N, 10), t(.3, .36, N, 12), t(.7, .36, N, 12), t(.5, .46, N, 30),
    ]},
    5: { par: 80, ai: [R, Y], intro: 'yellow', towers: [   // ilk sarı
      t(.5, .87, P, 30), t(.18, .13, R, 18), t(.82, .13, Y, 18),
      t(.5, .62, N, 12), t(.2, .45, N, 8), t(.8, .45, N, 8), t(.5, .33, N, 25), t(.26, .74, P, 10), t(.74, .74, N, 6),
    ]},
    6: { par: 35, ai: [R], towers: [   // nefes: bol küçük gri kule
      t(.5, .86, P, 25), t(.5, .12, R, 12),
      t(.2, .7, N, 3), t(.8, .7, N, 3), t(.35, .55, N, 4), t(.65, .55, N, 4), t(.2, .4, N, 6), t(.8, .4, N, 6), t(.5, .3, N, 8),
    ]},
    7: { par: 60, ai: [R], tip: 'Kırmızı ortada: her yere yakın!', towers: [   // düşman merkezde
      t(.2, .88, P, 20), t(.5, .5, R, 18),
      t(.8, .88, P, 8), t(.2, .14, N, 8), t(.8, .14, N, 12), t(.2, .5, N, 6), t(.8, .5, N, 6), t(.5, .2, N, 15), t(.5, .8, N, 10),
    ]},
    8: { par: 80, ai: [R, Y], towers: [
      t(.5, .9, P, 30), t(.15, .1, R, 25), t(.18, .38, N, 12), t(.85, .1, Y, 25), t(.82, .38, N, 12),
      t(.5, .24, N, 30), t(.5, .56, N, 18), t(.24, .7, P, 10), t(.76, .7, N, 8),
    ]},
    9: { par: 70, ai: [R, Y], towers: [   // iki rakip, ikişer kule
      t(.3, .9, P, 20), t(.7, .9, P, 20), t(.15, .1, R, 20), t(.15, .35, N, 8), t(.85, .1, Y, 20), t(.85, .35, N, 8),
      t(.5, .12, N, 25), t(.5, .4, N, 15), t(.3, .6, N, 8), t(.7, .6, N, 8), t(.5, .72, N, 12),
    ]},
    25: { boss: true, par: 115, ai: [R], tip: 'Boss: Kırmızı Kale!', towers: [
      t(.2, .88, P, 18), t(.5, .9, P, 18), t(.8, .88, P, 18), t(.5, .1, R, 30), t(.25, .22, R, 10), t(.75, .22, R, 10),
      t(.5, .42, N, 20), t(.2, .55, N, 10), t(.8, .55, N, 10), t(.5, .66, N, 8),
    ]},
  };

  // ---------- Dünya 2: Göl Kıyısı (menzil, engeller, köprüler) ----------
  const LAKE = {
    1: { par: 90, ai: [R], range: .36, intro: 'range', towers: [   // menzil
      t(.5, .9, P, 20), t(.5, .1, R, 20),
      t(.5, .62, N, 8), t(.5, .38, N, 8), t(.22, .74, N, 5), t(.78, .74, N, 5), t(.22, .26, N, 5), t(.78, .26, N, 5), t(.22, .5, N, 6), t(.78, .5, N, 6),
    ]},
    2: { par: 85, ai: [R], range: .5, intro: 'rocks', towers: [   // kayalar
      t(.5, .88, P, 22), t(.5, .12, R, 14),
      t(.5, .5, N, 15), t(.22, .7, N, 6), t(.78, .7, N, 6), t(.22, .3, N, 6), t(.78, .3, N, 6),
    ], obstacles: [tree(.1, .5), rock(.33, .5), rock(.67, .5), tree(.9, .5), rock(.5, .7, .03), rock(.5, .3, .03)] },
    3: { par: 170, ai: [R], range: .45, intro: 'river', towers: [   // nehir ve köprü
      t(.5, .86, P, 22), t(.5, .14, R, 10),
      t(.5, .66, N, 10), t(.5, .34, N, 10), t(.2, .7, N, 6), t(.8, .7, N, 6), t(.2, .3, N, 6), t(.8, .3, N, 6),
    ], obstacles: [river([[-.05, .52], [.3, .47], [.7, .53], [1.05, .48]], .07, [[.5, .5]])] },
    4: { par: 155, ai: [R, Y], range: .42, towers: [   // iki köprü, iki rakip
      t(.5, .88, P, 18), t(.15, .12, R, 24), t(.85, .12, Y, 24),
      t(.25, .64, N, 8), t(.75, .64, N, 8), t(.5, .66, N, 14), t(.25, .27, N, 10), t(.75, .27, N, 10), t(.5, .24, N, 20),
    ], obstacles: [river([[-.05, .44], [.5, .47], [1.05, .44]], .07, [[.25, .4564], [.75, .4564]])] },
    5: { par: 75, ai: [R], range: .45, towers: [   // nefes: göl
      t(.5, .88, P, 25), t(.5, .12, R, 14),
      t(.15, .5, N, 8), t(.85, .5, N, 8), t(.25, .28, N, 6), t(.75, .28, N, 6), t(.25, .72, N, 6), t(.75, .72, N, 6),
    ], obstacles: [lake(.5, .5, .14, .12)] },
    6: { par: 115, ai: [R, Y], range: .45, tip: 'Kırmızı ve sarı köprüde çarpışıyor', towers: [   // nehir iki rakibi ayırır
      t(.5, .88, P, 22), t(.2, .12, R, 32), t(.8, .12, Y, 32),
      t(.2, .4, N, 8), t(.8, .4, N, 8), t(.25, .66, P, 10), t(.75, .66, N, 6), t(.5, .72, N, 12),
    ], obstacles: [river([[.5, -.05], [.47, .3], [.53, .55]], .07, [[.4854, .12]])] },
    7: { par: 130, ai: [R], range: .38, towers: [   // taş labirent
      t(.5, .9, P, 20), t(.5, .1, R, 24),
      t(.5, .6, N, 12), t(.2, .8, N, 6), t(.8, .8, N, 6), t(.2, .55, N, 8), t(.8, .55, N, 8), t(.3, .3, N, 10), t(.7, .3, N, 10),
    ], obstacles: [rock(.5, .75), tree(.08, .42), tree(.92, .42), rock(.5, .4, .03), rock(.12, .68, .03), rock(.88, .68, .03)] },
    8: { par: 170, ai: [R], range: .45, towers: [   // iki göl
      t(.5, .88, P, 20), t(.5, .12, R, 20),
      t(.5, .5, N, 20), t(.2, .2, N, 8), t(.8, .2, N, 8), t(.2, .8, N, 8), t(.8, .8, N, 8), t(.5, .3, N, 6), t(.5, .7, N, 6),
    ], obstacles: [lake(.2, .5, .08, .14), lake(.8, .5, .08, .14)] },
    9: { par: 115, ai: [R, Y], range: .42, towers: [   // nehir + kayalar + iki rakip
      t(.3, .88, P, 25), t(.7, .88, P, 25), t(.2, .1, R, 20), t(.8, .1, Y, 20),
      t(.5, .62, N, 16), t(.18, .6, N, 8), t(.82, .6, N, 8), t(.5, .18, N, 25), t(.3, .28, R, 8), t(.7, .28, Y, 8),
    ], obstacles: [river([[-.05, .42], [.5, .4], [1.05, .42]], .065, [[.2, .4109], [.8, .4109]]), rock(.5, .78, .03)] },
    25: { boss: true, par: 175, ai: [R], range: .42, tip: 'Boss: Nehir Kalesi!', towers: [
      t(.5, .9, P, 25), t(.2, .78, P, 12), t(.8, .78, P, 12), t(.5, .1, R, 30), t(.2, .25, R, 8), t(.8, .25, R, 8),
      t(.5, .66, N, 15), t(.5, .34, N, 20), t(.2, .62, N, 6), t(.8, .62, N, 6), t(.2, .38, N, 6), t(.8, .38, N, 6),
    ], obstacles: [river([[-.05, .5], [1.05, .5]], .07, [[.3, .5], [.7, .5]])] },
  };

  // gen: üretecin bu dünyada kullandığı özellikler
  const WORLDS = [
    { id: 1, name: 'Çayır', theme: 'meadow', stars: 0, hand: MEADOW, gen: { range: 0, obstacles: false, baseRed: 12 } },
    { id: 2, name: 'Göl Kıyısı', theme: 'lake', stars: 30, hand: LAKE, gen: { range: .5, obstacles: true, baseRed: 11 } },
    { id: 3, name: 'Karlı Dağ', soon: true },
    { id: 4, name: 'Şeker Diyarı', soon: true },
    { id: 5, name: 'Volkan', soon: true },
  ];
  WORLDS.forEach((w, i) => { w.from = i * PER_WORLD + 1; w.to = (i + 1) * PER_WORLD; });

  // ---------- Doğrulama (üreteç, editör ve testler aynı kuralları kullanır) ----------
  const ndist = (a, b) => Math.hypot((a.x - b.x) * A, a.y - b.y);
  const rangeOf = (cfg, a) => cfg.range ? cfg.range * (1 + KS.RANGE_PER_LVL * (KS.lvlOf(a.count) - 1)) : Infinity;

  // Terrain.towerBlocks kuleleri kimlikle (a, b hariç) ayırdığı için aynı eşlenmiş nesneleri kullanırız
  function canLink(cfg, T, a, b) {
    if (a === b || ndist(a, b) > rangeOf(cfg, a) + 1e-9) return false;
    const M = cfg._m || (cfg._m = new Map());
    const m = o => { let v = M.get(o); if (!v) { v = { nx: o.x, ny: o.y }; M.set(o, v); } v.nx = o.x; v.ny = o.y; return v; };
    const na = m(a), nb = m(b);
    if (KS.Terrain.towerBlocks(T.map(m), na, nb, KS.TOWER_BLOCK)) return false;
    return !KS.Terrain.blocks(cfg.obstacles || [], na, nb);
  }

  function reach(cfg, T, from) {
    const seen = new Set(from), q = [...from];
    while (q.length) { const a = q.shift(); for (const b of T) if (!seen.has(b) && canLink(cfg, T, a, b)) { seen.add(b); q.push(b); } }
    return seen;
  }

  // Sorun listesi döner; boşsa seviye oynanabilir.
  function validate(cfg) {
    const issues = [], T = cfg.towers || [], obs = cfg.obstacles || [];
    cfg._m = null;   // eşleme önbelleği (JSON'a girmesin diye silinir)
    if (!T.some(x => x.team === P)) issues.push('Oyuncu kulesi yok');
    const enemies = T.filter(x => x.team === R || x.team === Y);
    if (!enemies.length) issues.push('Rakip kulesi yok');
    for (const team of [R, Y]) {
      const has = T.some(x => x.team === team);
      if (has && !(cfg.ai || []).includes(team)) issues.push((team === R ? 'Kırmızı' : 'Sarı') + ' kule var ama ai listesinde değil');
    }
    for (let i = 0; i < T.length; i++) {
      for (let j = i + 1; j < T.length; j++) if (ndist(T[i], T[j]) < .125) issues.push(`Kuleler çok yakın: ${i + 1} ve ${j + 1}`);
      const q = T[i];
      if (q.x < .05 || q.x > .95 || q.y < .05 || q.y > .95) issues.push(`Kule ${i + 1} kenara çok yakın`);
      if (!KS.Terrain.towerClear(obs, q.x, q.y)) issues.push(`Kule ${i + 1} engelin üstünde`);
    }
    for (const o of obs) if (o.type === 'river') for (const b of o.bridges || []) {
      if (!KS.Terrain.pointBlocked([Object.assign({}, o, { bridges: [] })], b[0] * A, b[1])) issues.push('Köprü nehrin üstünde değil');
    }
    if (issues.length) return issues;
    const fromPlayer = reach(cfg, T, T.filter(x => x.team === P));
    for (const e of enemies) if (!fromPlayer.has(e)) issues.push(`Rakip kule ${T.indexOf(e) + 1} ulaşılamaz`);
    for (const team of cfg.ai || []) {
      const mine = T.filter(x => x.team === team);
      if (mine.length && !mine.some(m => T.some(o => o.team !== team && canLink(cfg, T, m, o)))) issues.push((team === R ? 'Kırmızı' : 'Sarı') + ' hiçbir yere yol açamıyor');
    }
    delete cfg._m;
    return issues;
  }

  // ---------- Üreteç ----------
  // Simetrik harita (tek rakipte merkeze göre, iki rakipte sağ-sol): şansa bağlı haksız başlangıç olmaz.
  // Zorluk dünya içindeki sıraya (slot) göre artar. Geçersiz çıkarsa tohum değiştirip yeniden dener.
  function build(seed, w, slot) {
    const rnd = KS.rng(seed);
    const d = (slot - 1) / (PER_WORLD - 1);                 // 0..1
    const g = w.gen, wi = w.id - 1;
    const two = slot >= 4 && slot % 2 === 0;
    const T = [t(.5, .88, P, 22 + wi * 2)];
    const free = (x, y) => T.every(o => ndist(o, { x, y }) >= .17);
    const ncount = () => Math.min(35, 4 + Math.floor(rnd() * (6 + d * 22)));
    const red = Math.round(g.baseRed + d * 26);

    if (two) {
      const side = rnd() < .5 ? .2 : .8;
      T.push(t(.18, .12, R, red), t(.82, .12, Y, red), t(side, .78, P, 10));
    } else {
      T.push(t(.5, .12, R, red + (g.obstacles ? 2 : 6)), t(.5, .5, N, Math.round(10 + d * 20)));
    }
    const pairs = 2 + Math.floor(d * 3);
    for (let made = 0, tries = 0; made < pairs && tries < 4000; tries++) {
      let x, y, mx, my;
      if (two) { x = .12 + rnd() * .32; y = .26 + rnd() * .44; mx = 1 - x; my = y; }
      else { x = .12 + rnd() * .76; y = .22 + rnd() * .24; mx = 1 - x; my = 1 - y; }
      if (!free(x, y) || !free(mx, my) || ndist({ x, y }, { x: mx, y: my }) < .17) continue;
      const c = ncount();
      T.push(t(x, y, N, c), t(mx, my, N, c));
      made++;
    }
    // menzilli/engelli haritalar daha uzun sürer: hedef süre ona göre
    const slow = g.range || g.obstacles ? 1.6 : 1;
    const cfg = { par: Math.round((45 + T.length * 5 + (two ? 15 : 0)) * slow), ai: two ? [R, Y] : [R], towers: T };
    if (g.range) cfg.range = g.range - d * .05;
    if (g.obstacles) cfg.obstacles = genObstacles(rnd, T, d, two);
    return cfg;
  }

  function genObstacles(rnd, T, d, two) {
    const obs = [];
    const clear = (x, y, r) => T.every(o => ndist(o, { x, y }) >= r + .075);
    const want = 1 + Math.floor(d * 2.5);
    for (let tries = 0; obs.length < want && tries < 300; tries++) {
      const kind = rnd();
      if (kind < .3) {
        const rx = .07 + rnd() * .05, ry = .07 + rnd() * .05, x = .5, y = .3 + rnd() * .4;
        if (clear(x, y, Math.max(rx / A, ry))) obs.push(lake(x, y, rx, ry));
      } else {
        const x = .12 + rnd() * .36, y = .2 + rnd() * .6, mx = 1 - x, my = two ? y : 1 - y;
        const r = kind < .65 ? .036 : .04, mk = kind < .65 ? rock : tree;
        if (clear(x, y, r) && clear(mx, my, r)) obs.push(mk(x, y, r), mk(mx, my, r));
      }
    }
    return obs;
  }

  const genCache = {};
  function generate(n) {
    if (genCache[n]) return genCache[n];
    const w = worldOf(n), slot = n - w.from + 1;
    let cfg = null;
    for (let attempt = 0; attempt < 60; attempt++) {
      cfg = build(n * 7919 + 13 + attempt * 101, w, slot);
      if (!validate(cfg).length) break;
      if (attempt === 59) { delete cfg.obstacles; if (validate(cfg).length) cfg.range = 0; }
    }
    genCache[n] = cfg;
    return cfg;
  }

  const worldOf = n => WORLDS.find(w => !w.soon && n >= w.from && n <= w.to) || null;

  KS.Levels = {
    perWorld: PER_WORLD,
    count: WORLDS.filter(w => !w.soon).length * PER_WORLD,
    worlds: WORLDS,
    intros: INTRO,
    custom: null,                 // editörün denediği seviye (n = 0)
    validate,
    isHandmade: n => { const w = worldOf(n); return !!(w && w.hand[n - w.from + 1]); },
    get: n => {
      if (n === 0 && KS.Levels.custom) return KS.Levels.custom;
      const w = worldOf(n);
      if (!w) return generate(n);
      return w.hand[n - w.from + 1] || generate(n);
    },
    worldOf,
  };
})(window.KS);
