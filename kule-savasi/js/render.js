// Bütün çizimler: arka plan, yollar, askerler, kuleler, parçacıklar ve sürükleme göstergeleri.
(function (KS) {
  'use strict';
  const { NEUTRAL, PLAYER, RED, YELLOW, TEAMS, INK, CHEEK, FONT } = KS;
  const G = KS.G, V = KS.V;

  let cv = null, mainCtx = null, ctx = null, bg = null;
  const LOD_SOLDIERS = 140;   // bundan kalabalıksa askerler sade çizilir (zayıf telefonlar için)

  const R = KS.Render = {
    init(canvas) { cv = canvas; mainCtx = ctx = canvas.getContext('2d'); },
  };

  // ---------- Arka plan ----------
  R.buildBackground = () => {
    const { W, H, DPR, area } = V;
    bg = document.createElement('canvas');
    bg.width = cv.width; bg.height = cv.height;
    const b = bg.getContext('2d');
    b.setTransform(DPR, 0, 0, DPR, 0, 0);
    const g = b.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#cdefb5'); g.addColorStop(1, '#b8e39c');
    b.fillStyle = g; b.fillRect(0, 0, W, H);

    // oyun alanı: biraz daha açık, yumuşak bir çayır
    b.fillStyle = 'rgba(236,250,222,.45)';
    roundRect(b, area.x - 12, area.y - 14, area.w + 24, area.h + 22, 36); b.fill();

    const rnd = KS.rng(Math.round(W * 7 + H));
    const n = Math.round(W * H / 2600);
    b.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x = rnd() * W, y = rnd() * H, s = 3 + rnd() * 4;
      b.strokeStyle = rnd() < .5 ? 'rgba(120,180,90,.45)' : 'rgba(150,200,110,.5)';
      b.lineWidth = 1.6;
      b.beginPath();
      b.moveTo(x - s * .6, y - s); b.lineTo(x, y);
      b.lineTo(x + s * .6, y - s);
      b.moveTo(x, y); b.lineTo(x + s * .1, y - s * 1.2);
      b.stroke();
    }
    const petals = ['#ffffff', '#ffd3df', '#fff1a8', '#e3d7ff'];
    for (let i = 0, f = Math.round(n / 7); i < f; i++) {
      const x = rnd() * W, y = rnd() * H, s = 2 + rnd() * 1.6;
      b.fillStyle = petals[Math.floor(rnd() * petals.length)];
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * Math.PI * 2;
        b.beginPath(); b.arc(x + Math.cos(a) * s, y + Math.sin(a) * s, s * .8, 0, Math.PI * 2); b.fill();
      }
      b.fillStyle = '#f6c34a';
      b.beginPath(); b.arc(x, y, s * .6, 0, Math.PI * 2); b.fill();
    }
  };

  function roundRect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  // ---------- Kare ----------
  R.draw = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (bg) ctx.drawImage(bg, 0, 0);
    else { ctx.fillStyle = '#c4ebaa'; ctx.fillRect(0, 0, cv.width, cv.height); }
    ctx.setTransform(V.DPR, 0, 0, V.DPR, 0, 0);

    for (const l of G.lanes) drawLane(l.from, l.to, l.team, 1);
    const d = G.drag;
    if (d && d.type === 'link') drawDragLines(d);
    if (G.state === 'play' && G.levelNo === 1 && !G.playerLinked && !d) drawHint();

    const lod = G.soldiers.length > LOD_SOLDIERS;
    for (const s of G.soldiers) drawSoldier(s, lod);
    const sorted = G.towers.slice().sort((a, b) => a.y - b.y);
    for (const t of sorted) drawTower(t);

    if (d && d.type === 'link') drawDragRings(d);
    drawParticles();
    drawTrail();
    if (d && d.type === 'link') drawFingerLabel(d);
  };

  function drawLane(a, b, team, alpha, toPoint) {
    const c = TEAMS[team], r = V.baseR;
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
    if (len < 1) return;
    const ux = dx / len, uy = dy / len;
    const r0 = G.towerR(a) * .95, r1 = toPoint ? 0 : G.towerR(b) * 1.05;
    if (len < r0 + r1 + 4) return;
    const x0 = a.x + ux * r0, y0 = a.y + uy * r0;
    const x1 = b.x - ux * r1, y1 = b.y - uy * r1;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = c.light;
    ctx.globalAlpha = alpha * .8;
    ctx.lineWidth = r * .55;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = c.dark;
    ctx.lineWidth = Math.max(2, r * .13);
    ctx.setLineDash([r * .34, r * .3]);
    ctx.lineDashOffset = -G.time * r * 1.6;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.setLineDash([]);

    // ok uçları: ortada ve sonda
    ctx.fillStyle = c.dark;
    arrowHead(x1, y1, ux, uy, r * .42);
    if (Math.hypot(x1 - x0, y1 - y0) > r * 5) arrowHead((x0 + x1) / 2, (y0 + y1) / 2, ux, uy, r * .34);
    ctx.restore();
  }

  function arrowHead(x, y, ux, uy, s) {
    const px = -uy, py = ux;
    ctx.beginPath();
    ctx.moveTo(x + ux * s * .5, y + uy * s * .5);
    ctx.lineTo(x - ux * s * .7 + px * s * .65, y - uy * s * .7 + py * s * .65);
    ctx.lineTo(x - ux * s * .7 - px * s * .65, y - uy * s * .7 - py * s * .65);
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.lineWidth = s * .25;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.fill(); ctx.stroke();
  }

  function dragTarget(d) {
    return d.over && !(d.sources.length === 1 && d.sources[0] === d.over) ? d.over : null;
  }

  function drawDragLines(d) {
    const target = dragTarget(d);
    for (const s of d.sources) {
      if (s === target) continue;
      if (target) drawLane(s, target, PLAYER, .75);
      else drawLane(s, { x: d.x, y: d.y }, PLAYER, .55, true);
    }
  }

  function drawDragRings(d) {
    const target = dragTarget(d);
    ctx.save();
    ctx.strokeStyle = TEAMS[PLAYER].dark;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = -G.time * 30;
    for (const s of d.sources) {
      if (s === target) continue;
      ctx.beginPath(); ctx.arc(s.x, s.y, G.towerR(s) * 1.45, 0, Math.PI * 2); ctx.stroke();
    }
    if (target) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.setLineDash([]);
      ctx.globalAlpha = .7 + .3 * Math.sin(G.time * 10);
      ctx.beginPath(); ctx.arc(target.x, target.y, G.towerR(target) * 1.45, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  // Parmak hedefin üstünü kapattığı için ne olacağını parmağın biraz yukarısında yazıyoruz
  function drawFingerLabel(d) {
    const target = dragTarget(d);
    const n = d.sources.filter(s => s !== target).length;
    let label, color = INK;
    if (target) {
      const verb = target.team === PLAYER ? 'Takviye' : target.team === NEUTRAL ? 'Ele geçir' : 'Saldır';
      label = verb + ' · ' + Math.floor(target.count) + (n > 1 ? '  (' + n + ' kule)' : '');
      color = TEAMS[target.team === NEUTRAL ? PLAYER : target.team].dark;
    } else {
      label = n > 1 ? n + ' kule seçili' : 'Bir kuleye sürükle';
    }
    const fs = Math.max(14, Math.round(V.baseR * .6));
    ctx.save();
    ctx.font = `700 ${fs}px ${FONT}`;
    const tw = ctx.measureText(label).width;
    const w = tw + fs * 1.4, h = fs * 1.9;
    let lx = Math.min(V.W - w / 2 - 8, Math.max(w / 2 + 8, d.x));
    let ly = d.y - 78;
    if (ly - h / 2 < 8) ly = d.y + 78;
    ctx.fillStyle = 'rgba(255,253,247,.96)';
    ctx.shadowColor = 'rgba(75,69,96,.25)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    roundRect(ctx, lx - w / 2, ly - h / 2, w, h, h / 2); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, lx, ly + 1);
    ctx.restore();
  }

  function drawHint() {
    const p = G.towers.find(t => t.team === PLAYER);
    if (!p) return;
    let best = null, bd = Infinity;
    for (const t of G.towers) if (t.team === NEUTRAL && G.dist(p, t) < bd) { bd = G.dist(p, t); best = t; }
    if (!best) return;
    const r = V.baseR;
    const k = (G.time * .6) % 1;
    const e = k < .75 ? k / .75 : 1;
    const hx = p.x + (best.x - p.x) * e, hy = p.y + (best.y - p.y) * e;
    ctx.save();
    drawLane(p, { x: hx, y: hy }, PLAYER, .45, true);
    ctx.globalAlpha = k < .75 ? .9 : .9 * (1 - (k - .75) / .25);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = TEAMS[PLAYER].dark;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(hx, hy, r * .45, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
    const label = 'Sürükle ve bırak!';
    ctx.font = `700 ${Math.round(r * .62)}px ${FONT}`;
    const tw = ctx.measureText(label).width;
    const lx = (p.x + best.x) / 2, ly = Math.max(p.y, best.y) + r * 1.9;
    ctx.fillStyle = 'rgba(255,253,247,.92)';
    roundRect(ctx, lx - tw / 2 - 12, ly - r * .55, tw + 24, r * 1.1, 999); ctx.fill();
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, lx, ly + 1);
    ctx.restore();
  }

  function drawSoldier(s, lod) {
    const c = TEAMS[s.team];
    const pos = G.soldierPos(s);
    const sr = Math.max(3.5, V.baseR * .2);
    if (lod) {
      ctx.fillStyle = c.dark;
      ctx.beginPath(); ctx.arc(pos.x, pos.y, sr, 0, Math.PI * 2); ctx.fill();
      return;
    }
    const hop = Math.abs(Math.sin(s.age * 12)) * sr * .55;
    ctx.fillStyle = 'rgba(60,90,40,.18)';
    ctx.beginPath(); ctx.ellipse(pos.x, pos.y + sr * .9, sr * .8, sr * .3, 0, 0, Math.PI * 2); ctx.fill();
    const y = pos.y - hop;
    ctx.fillStyle = c.fill;
    ctx.strokeStyle = c.dark;
    ctx.lineWidth = Math.max(1.2, sr * .28);
    ctx.beginPath(); ctx.arc(pos.x, y, sr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (sr >= 4) {
      const dx = Math.sign(s.to.x - s.from.x) * sr * .15;
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(pos.x - sr * .35 + dx, y - sr * .1, sr * .16, 0, Math.PI * 2);
      ctx.arc(pos.x + sr * .35 + dx, y - sr * .1, sr * .16, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawTower(t) {
    const c = TEAMS[t.team];
    const r = G.towerR(t);
    const x = t.x + Math.sin(G.time * 70) * t.shake * r * .07;
    const y = t.y;
    const sq = t.squish * .08;

    // gölge
    ctx.fillStyle = 'rgba(60,90,40,.2)';
    ctx.beginPath(); ctx.ellipse(x, y + r * .82, r * 1.02, r * .3, 0, 0, Math.PI * 2); ctx.fill();

    ctx.save();
    ctx.translate(x, y + r * .8);
    ctx.scale(1 + sq, 1 - sq);
    ctx.translate(-x, -(y + r * .8));

    const bw = r * 1.62, left = x - bw / 2, right = x + bw / 2;
    const top = y - r * .45, bot = y + r * .8;
    const cw = r * .42, ch = r * .34, rad = r * .38;

    // bayraklar (seviye 2 ve 3)
    if (t.team !== NEUTRAL && t.lvl >= 2) {
      for (const sd of t.lvl >= 3 ? [-1, 1] : [1]) {
        const px = x + sd * (bw / 2 - cw / 2);
        const wave = Math.sin(G.time * 5 + sd) * r * .05;
        ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.5, r * .07); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(px, top - ch); ctx.lineTo(px, top - ch - r * .62); ctx.stroke();
        ctx.fillStyle = c.dark;
        ctx.beginPath();
        ctx.moveTo(px, top - ch - r * .62);
        ctx.quadraticCurveTo(px + sd * r * .22, top - ch - r * .55 + wave, px + sd * r * .42, top - ch - r * .5 + wave);
        ctx.lineTo(px, top - ch - r * .36);
        ctx.closePath(); ctx.fill();
      }
    }

    // gövde + mazgallar tek parça
    ctx.beginPath();
    ctx.moveTo(left, bot - rad);
    ctx.lineTo(left, top - ch);
    ctx.lineTo(left + cw, top - ch);
    ctx.lineTo(left + cw, top);
    ctx.lineTo(x - cw / 2, top);
    ctx.lineTo(x - cw / 2, top - ch);
    ctx.lineTo(x + cw / 2, top - ch);
    ctx.lineTo(x + cw / 2, top);
    ctx.lineTo(right - cw, top);
    ctx.lineTo(right - cw, top - ch);
    ctx.lineTo(right, top - ch);
    ctx.lineTo(right, bot - rad);
    ctx.arcTo(right, bot, right - rad, bot, rad);
    ctx.lineTo(left + rad, bot);
    ctx.arcTo(left, bot, left, bot - rad, rad);
    ctx.closePath();
    ctx.fillStyle = c.fill;
    ctx.fill();
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, r * .1);
    ctx.strokeStyle = c.dark;
    ctx.stroke();

    // parlaklık
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    roundRect(ctx, left + r * .16, top + r * .08, r * .18, r * .62, r * .09); ctx.fill();

    // kapı
    const dw = r * .19;
    ctx.fillStyle = c.dark;
    ctx.beginPath();
    ctx.moveTo(x - dw, bot);
    ctx.lineTo(x - dw, bot - r * .14);
    ctx.arc(x, bot - r * .14, dw, Math.PI, 0);
    ctx.lineTo(x + dw, bot);
    ctx.closePath(); ctx.fill();

    drawFace(t, x, y + r * .08, r);
    ctx.restore();

    // seviye noktaları (yol kapasitesi)
    if (t.team !== NEUTRAL) {
      const used = G.lanesFrom(t).length;
      const pr = Math.max(2.5, r * .1), gap = pr * 3;
      for (let i = 0; i < t.lvl; i++) {
        const px = x + (i - (t.lvl - 1) / 2) * gap, py = bot + pr * 2.6;
        ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fillStyle = i < used ? c.dark : '#ffffff';
        ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = c.dark; ctx.stroke();
      }
    }

    // asker sayısı rozeti
    const n = String(Math.floor(t.count));
    const fs = Math.max(12, Math.round(V.baseR * .58));
    ctx.font = `700 ${fs}px ${FONT}`;
    const tw = ctx.measureText(n).width;
    const bh = fs * 1.3, bwid = Math.max(bh * 1.25, tw + fs * .9);
    const by = top - ch - bh * .15;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = c.dark;
    ctx.lineWidth = Math.max(2, r * .08);
    roundRect(ctx, x - bwid / 2, by - bh / 2, bwid, bh, bh / 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(n, x, by + fs * .05);
  }

  function drawFace(t, x, y, r) {
    const ex = r * .32, er = Math.max(1.6, r * .085);
    ctx.fillStyle = CHEEK;
    ctx.beginPath();
    ctx.ellipse(x - r * .52, y + r * .16, r * .14, r * .09, 0, 0, Math.PI * 2);
    ctx.ellipse(x + r * .52, y + r * .16, r * .14, r * .09, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = INK; ctx.fillStyle = INK;
    ctx.lineWidth = Math.max(1.5, r * .07); ctx.lineCap = 'round';
    const blink = Math.sin(G.time * 1.3 + t.id * 2.1) > .985;
    if (t.team === NEUTRAL || blink) {
      // uykulu gözler
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.arc(x + s * ex, y - r * .02, er * 1.1, .15 * Math.PI, .85 * Math.PI); ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.arc(x - ex, y, er, 0, Math.PI * 2);
      ctx.arc(x + ex, y, er, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x - ex + er * .35, y - er * .35, er * .38, 0, Math.PI * 2);
      ctx.arc(x + ex + er * .35, y - er * .35, er * .38, 0, Math.PI * 2);
      ctx.fill();
    }
    if (t.team === RED) {
      ctx.beginPath();
      ctx.moveTo(x - ex - er * 1.3, y - er * 2.2); ctx.lineTo(x - ex + er * 1.1, y - er * 1.4);
      ctx.moveTo(x + ex + er * 1.3, y - er * 2.2); ctx.lineTo(x + ex - er * 1.1, y - er * 1.4);
      ctx.stroke();
    } else if (t.team === YELLOW) {
      ctx.beginPath();
      ctx.moveTo(x - ex - er * 1.2, y - er * 1.5); ctx.lineTo(x - ex + er * 1.2, y - er * 2.1);
      ctx.moveTo(x + ex + er * 1.2, y - er * 1.5); ctx.lineTo(x + ex - er * 1.2, y - er * 2.1);
      ctx.stroke();
    }
    // ağız
    ctx.beginPath();
    if (t.shake > .3) ctx.arc(x, y + r * .2, r * .07, 0, Math.PI * 2);
    else if (t.team === NEUTRAL) { ctx.moveTo(x - r * .07, y + r * .2); ctx.lineTo(x + r * .07, y + r * .2); }
    else ctx.arc(x, y + r * .13, r * .1, .15 * Math.PI, .85 * Math.PI);
    if (t.shake > .3) { ctx.fillStyle = INK; ctx.fill(); } else ctx.stroke();
  }

  function drawParticles() {
    const r = V.baseR;
    for (const p of G.particles) {
      const k = p.life / p.max;
      ctx.globalAlpha = Math.min(1, k * 1.5);
      if (p.type === 'dot') {
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (.5 + k * .5), 0, Math.PI * 2); ctx.fill();
      } else if (p.type === 'star') {
        ctx.fillStyle = p.color;
        ctx.strokeStyle = '#e8b93a'; ctx.lineWidth = 1.2;
        star(p.x, p.y, p.size * (.6 + k * .4));
        ctx.fill(); ctx.stroke();
      } else if (p.type === 'ring') {
        ctx.strokeStyle = p.color; ctx.lineWidth = 4 * k;
        ctx.beginPath(); ctx.arc(p.x, p.y, r * (1 + (1 - k) * 2), 0, Math.PI * 2); ctx.stroke();
      } else if (p.type === 'text') {
        ctx.font = `700 ${Math.round(r * .6)}px ${FONT}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.lineJoin = 'round';
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y);
      }
    }
    ctx.globalAlpha = 1;
  }

  function star(x, y, s) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? s * .45 : s;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  }

  function drawTrail() {
    const tr = G.trail;
    if (tr.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ffffff';
    for (let i = 1; i < tr.length; i++) {
      const k = 1 - (G.time - tr[i].t) / .28;
      ctx.globalAlpha = Math.max(0, k);
      ctx.lineWidth = 2 + 5 * k;
      ctx.beginPath(); ctx.moveTo(tr[i - 1].x, tr[i - 1].y); ctx.lineTo(tr[i].x, tr[i].y); ctx.stroke();
    }
    ctx.restore();
  }

  // Kart üstündeki küçük kule: aynı çizim kodu, geçici olarak kartın kanvasına yönlendirilir
  R.drawArt = (canvas, team, mood) => {
    const a = canvas.getContext('2d');
    a.setTransform(1, 0, 0, 1, 0, 0);
    a.clearRect(0, 0, canvas.width, canvas.height);
    const sad = mood === 'sad';
    const fake = { id: 0, x: 96, y: 108, team, count: sad ? 0 : 42, lvl: 3, pop: 0, shake: sad ? 1 : 0, squish: 0 };
    const keep = { baseR: V.baseR, time: G.time, lanes: G.lanes };
    ctx = a; V.baseR = 40; G.time = sad ? 0 : 1; G.lanes = [];
    try { drawTower(fake); } finally {
      ctx = mainCtx; V.baseR = keep.baseR; G.time = keep.time; G.lanes = keep.lanes;
    }
  };
})(window.KS);
