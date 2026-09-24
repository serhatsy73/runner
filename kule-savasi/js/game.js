// Oyun durumu ve kurallar: üretim, yollar, asker hareketi, çarpışma, ele geçirme, kazanma/kaybetme.
// Çizim, ses ve arayüz bu dosyayı sadece okur ya da G.on(...) ile olayları dinler.
(function (KS) {
  'use strict';
  const { NEUTRAL, PLAYER, RED, YELLOW, CAP, RATE, SEND, lvlOf, ASPECT, OVERPROD, OVERPROD_RATE, SURGE_AT, RANGE_PER_LVL } = KS;

  const V = KS.V = { W: 0, H: 0, DPR: 1, baseR: 24, speed: 70, area: { x: 0, y: 0, w: 0, h: 0 } };

  const G = KS.G = {
    state: 'menu',            // menu | play | paused | won | lost
    levelNo: 1, cfg: null, tempo: KS.tempo(1),
    towers: [], lanes: [], soldiers: [], particles: [], trail: [],
    time: 0, playTime: 0, endTimer: 0,
    ai: [], aiParams: null,
    drag: null, playerLinked: false,
    lostTower: false, lastLost: null, revived: false,
    surge: false, surgeWarned: false, banner: null,
    blocked: new Set(),       // engel yüzünden yol açılamayan kule çiftleri
  };

  // ---------- Olaylar ----------
  const handlers = {};
  G.on = (name, fn) => { (handlers[name] = handlers[name] || []).push(fn); };
  G.emit = (name, data) => { for (const fn of handlers[name] || []) fn(data); };

  // ---------- Yardımcılar ----------
  G.towerR = t => V.baseR * (1 + .14 * (t.lvl - 1)) * (1 + .22 * Math.sin(Math.min(1, t.pop) * Math.PI));
  G.dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
  G.lanesFrom = t => G.lanes.filter(l => l.from === t);
  G.findLane = (a, b) => G.lanes.find(l => l.from === a && l.to === b);
  G.removeLane = l => { const i = G.lanes.indexOf(l); if (i >= 0) G.lanes.splice(i, 1); };

  // Tasarım birimiyle mesafe: ekran oranından bağımsız (bkz. KS.ASPECT)
  G.ndist = (a, b) => Math.hypot((a.nx - b.nx) * ASPECT, a.ny - b.ny);
  G.rangeOf = t => G.cfg && G.cfg.range ? G.cfg.range * (1 + RANGE_PER_LVL * (t.lvl - 1)) : Infinity;
  const pairKey = (a, b) => a.id < b.id ? a.id * 256 + b.id : b.id * 256 + a.id;
  // null: yol açılabilir · 'blocked': arada engel var · 'range': menzil dışında
  G.linkProblem = (a, b) => {
    if (G.blocked.has(pairKey(a, b))) return 'blocked';
    if (G.ndist(a, b) > G.rangeOf(a) + 1e-9) return 'range';
    return null;
  };
  G.canLink = (a, b) => a !== b && !G.linkProblem(a, b);

  G.showBanner = (text, sub, dur) => { G.banner = { text, sub: sub || '', t0: G.time, dur: dur || 2.6 }; };

  // reach(t): kuleye ne kadar yakın dokunulursa sayılsın
  G.nearestTower = (x, y, reach, filter) => {
    let best = null, bd = Infinity;
    for (const t of G.towers) {
      if (filter && !filter(t)) continue;
      const d = Math.hypot(t.x - x, t.y - y);
      if (d < reach(t) && d < bd) { bd = d; best = t; }
    }
    return best;
  };

  G.addLane = (from, to, team) => {
    if (from === to || from.team !== team || G.findLane(from, to) || !G.canLink(from, to)) return false;
    const back = G.findLane(to, from);
    if (back && back.team === team) G.removeLane(back);
    const out = G.lanesFrom(from);
    if (out.length >= from.lvl) G.removeLane(out[0]);
    const lane = { from, to, team, timer: SEND[from.lvl] * .6 };
    G.lanes.push(lane);
    G.emit('lane', lane);
    return lane;
  };

  // ---------- Seviye ----------
  G.loadLevel = n => {
    const cfg = KS.Levels.get(n);
    G.levelNo = n; G.cfg = cfg; G.tempo = KS.tempo(n);
    G.towers = cfg.towers.map((d, i) => ({
      id: i, nx: d.x, ny: d.y, team: d.team, count: d.count, x: 0, y: 0,
      lvl: lvlOf(d.count), pop: 0, shake: 0, squish: 0,
    }));
    G.lanes = []; G.soldiers = []; G.particles = []; G.trail = [];
    G.drag = null; G.playerLinked = false;
    G.lostTower = false; G.lastLost = null; G.revived = false;
    G.surge = false; G.surgeWarned = false; G.banner = null;
    G.time = 0; G.playTime = 0; G.endTimer = 0;
    G.blocked = new Set();
    const obs = cfg.obstacles || [];
    for (const a of G.towers) for (const b of G.towers) {
      if (a.id < b.id && KS.Terrain.blocks(obs, a, b)) G.blocked.add(pairKey(a, b));
    }
    G.aiParams = KS.AI.paramsFor(n);
    G.ai = cfg.ai.map((team, i) => ({ team, timer: G.aiParams.firstMove + i * .7 }));
    G.layout();
    G.emit('loaded', cfg);
  };

  G.layout = () => {
    const a = V.area;
    for (const t of G.towers) { t.x = a.x + t.nx * a.w; t.y = a.y + t.ny * a.h; }
  };

  // Kaybedince ödüllü reklamla devam: en son kaybedilen kule 15 askerle geri gelir
  G.revive = () => {
    const t = G.lastLost;
    if (!t || G.revived) return false;
    G.revived = true;
    t.team = PLAYER; t.count = 15; t.lvl = 1; t.pop = .001;
    G.soldiers = G.soldiers.filter(s => s.to !== t);
    G.endTimer = 0;
    G.state = 'play';
    fx.ring(t, PLAYER);
    return true;
  };

  // ---------- Güncelleme ----------
  G.update = dt => {
    G.time += dt;
    const playing = G.state === 'play';
    if (playing) G.playTime += dt;

    if (playing && !G.surgeWarned && G.playTime >= SURGE_AT - 30) {
      G.surgeWarned = true;
      G.showBanner('30 sn sonra Son Hücum!', 'Sonra herkes 2 kat hızlı üretecek');
    }
    if (playing && !G.surge && G.playTime >= SURGE_AT) {
      G.surge = true;
      G.showBanner('Son Hücum!', 'Herkes 2 kat hızlı üretiyor', 3);
      G.emit('surge');
    }
    const prodMul = G.tempo.prod * (G.surge ? 2 : 1);
    for (const t of G.towers) {
      if (t.team !== NEUTRAL && t.count < CAP) {
        const rate = RATE[t.lvl] * prodMul * (t.count >= OVERPROD ? OVERPROD_RATE : 1);
        t.count = Math.min(CAP, t.count + rate * dt);
      }
      const up = lvlOf(Math.floor(t.count));
      if (up > t.lvl) { t.lvl = up; t.pop = .001; fx.sparkle(t); G.emit('levelup', t); }
      while (t.lvl > 1 && t.count < KS.LVL_DOWN[t.lvl]) t.lvl--;
      // oyuncunun kulesi yollar yüzünden boşta kalıyorsa arayüz bir kez ipucu gösterir
      if (playing && t.team === PLAYER && t.count < 2 && G.lanes.some(l => l.from === t)) {
        t.drain = (t.drain || 0) + dt;
        if (t.drain > 2) { t.drain = -1e9; G.emit('drain', t); }
      } else if (t.drain > 0) t.drain = 0;
      if (t.pop > 0) { t.pop += dt * 2.2; if (t.pop >= 1) t.pop = 0; }
      t.shake = Math.max(0, t.shake - dt * 5);
      t.squish = Math.max(0, t.squish - dt * 5);
    }

    // sahibi değişen kulenin yolları kalkar
    G.lanes = G.lanes.filter(l => l.from.team === l.team);

    for (const l of G.lanes) {
      l.timer += dt;
      const iv = SEND[l.from.lvl];
      if (l.timer < iv) continue;
      if (l.from.count >= 1) {
        l.from.count -= 1;
        l.timer -= iv;
        G.soldiers.push({
          from: l.from, to: l.to, team: l.team,
          p: Math.min(.45, G.towerR(l.from) * .8 / G.dist(l.from, l.to)),
          off: (Math.random() * 2 - 1) * .55, age: Math.random() * 3, dead: false,
        });
      } else {
        l.timer = iv;
      }
    }

    const sp = V.speed * G.tempo.speed;
    for (const s of G.soldiers) {
      s.p += sp * dt / Math.max(1, G.dist(s.from, s.to));
      s.age += dt;
    }
    collide();

    for (const s of G.soldiers) {
      if (s.dead) continue;
      if (s.p >= 1 - G.towerR(s.to) * .75 / G.dist(s.from, s.to)) { s.dead = true; arrive(s); }
    }
    G.soldiers = G.soldiers.filter(s => !s.dead);

    for (const p of G.particles) {
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      p.vx *= .98;
    }
    G.particles = G.particles.filter(p => p.life > 0);
    G.trail = G.trail.filter(p => G.time - p.t < .28);
    if (G.banner && G.time - G.banner.t0 > G.banner.dur) G.banner = null;

    if (playing) {
      for (const a of G.ai) {
        a.timer -= dt;
        if (a.timer <= 0) { a.timer = G.aiParams.interval * (.75 + Math.random() * .5); KS.AI.think(a.team); }
      }
      checkEnd(dt);
    }
  };

  // Aynı iki kule arasında zıt yönde yürüyen farklı takım askerleri buluşunca ikisi de yok olur
  function collide() {
    const groups = new Map();
    for (const s of G.soldiers) {
      const a = s.from.id, b = s.to.id;
      const key = a < b ? a * 256 + b : b * 256 + a;
      let g = groups.get(key);
      if (!g) { g = { fwd: [], back: [] }; groups.set(key, g); }
      (a < b ? g.fwd : g.back).push(s);
    }
    for (const g of groups.values()) {
      if (!g.fwd.length || !g.back.length) continue;
      g.fwd.sort((a, b) => b.p - a.p);
      g.back.sort((a, b) => b.p - a.p);
      for (const A of g.fwd) {
        const B = g.back.find(s => !s.dead && s.team !== A.team);
        if (!B) break;
        if (A.p + B.p < 1) continue;
        A.dead = B.dead = true;
        const pos = G.soldierPos(A);
        fx.burst(pos.x, pos.y, '#ffffff', 5, .6);
        if (A.team === PLAYER || B.team === PLAYER) G.emit('clash');
      }
    }
  }

  function arrive(s) {
    const t = s.to;
    if (t.team === s.team) {
      t.count += 1;
      t.squish = 1;
      return;
    }
    t.count -= 1;
    t.shake = 1;
    const pos = G.soldierPos(s);
    fx.burst(pos.x, pos.y, KS.TEAMS[s.team].fill, 3, .45);
    G.emit('hit', { tower: t, team: s.team });
    if (t.count <= 0) capture(t, s.team);
  }

  function capture(t, team) {
    const prev = t.team;
    t.team = team; t.count = 0; t.lvl = 1; t.pop = .001;
    if (prev === PLAYER) { G.lostTower = true; G.lastLost = t; }
    fx.confetti(t.x, t.y, team);
    fx.ring(t, team);
    if (team === PLAYER) fx.text(t.x, t.y - V.baseR * 1.8, 'Ele geçti!', KS.TEAMS[PLAYER].dark);
    G.emit('capture', { tower: t, team, prev });
  }

  function checkEnd(dt) {
    const hasEnemy = G.towers.some(t => t.team === RED || t.team === YELLOW);
    const hasPlayer = G.towers.some(t => t.team === PLAYER);
    if (hasEnemy && hasPlayer) { G.endTimer = 0; return; }
    G.endTimer += dt;
    if (G.endTimer < .9) return;
    if (!hasEnemy) {
      G.state = 'won';
      const fast = G.playTime <= G.cfg.par;
      const stars = 1 + (G.lostTower ? 0 : 1) + (fast ? 1 : 0);
      G.emit('win', { level: G.levelNo, stars, time: G.playTime, par: G.cfg.par, noLoss: !G.lostTower, fast });
    } else {
      G.state = 'lost';
      G.emit('lose', { level: G.levelNo, canRevive: !!G.lastLost && !G.revived });
    }
  }

  G.soldierPos = s => {
    const dx = s.to.x - s.from.x, dy = s.to.y - s.from.y;
    const len = Math.hypot(dx, dy) || 1;
    const o = s.off * V.baseR * .28;
    return { x: s.from.x + dx * s.p - dy / len * o, y: s.from.y + dy * s.p + dx / len * o };
  };

  // ---------- Parçacıklar ----------
  const fx = G.fx = {
    burst(x, y, color, n, life) {
      const r = V.baseR;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = r * (1.5 + Math.random() * 2.5);
        G.particles.push({ type: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, color, size: r * .12 });
      }
    },
    confetti(x, y, team) {
      const r = V.baseR, T = KS.TEAMS[team];
      const cols = [T.fill, T.dark, '#ffffff', '#ffd3df'];
      for (let i = 0; i < 22; i++) {
        const a = Math.random() * Math.PI * 2, v = r * (3 + Math.random() * 4);
        G.particles.push({
          type: 'dot', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - r * 3, g: r * 10,
          life: .9, max: .9, color: cols[i % cols.length], size: r * (.1 + Math.random() * .1),
        });
      }
    },
    ring(t, team) {
      G.particles.push({ type: 'ring', x: t.x, y: t.y, vx: 0, vy: 0, life: .5, max: .5, color: KS.TEAMS[team].dark });
    },
    sparkle(t) {
      const r = V.baseR;
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2;
        G.particles.push({
          type: 'star', x: t.x + Math.cos(a) * r, y: t.y + Math.sin(a) * r,
          vx: Math.cos(a) * r * 1.5, vy: Math.sin(a) * r * 1.5 - r, life: .7, max: .7, color: '#fff3a0', size: r * .22,
        });
      }
    },
    text(x, y, text, color) {
      G.particles.push({ type: 'text', x, y, vx: 0, vy: -V.baseR * 1.2, life: 1.1, max: 1.1, color, text });
    },
  };
})(window.KS);
