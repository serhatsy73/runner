// Arazi: kayalar, ağaçlar, göller, nehirler ve köprüler.
// Görüş hattı hesabı "tasarım biriminde" yapılır (x * ASPECT, y); böylece hangi kulelerin
// birbirine yol açabileceği ekran oranından bağımsızdır ve seviye tasarımı her telefonda aynı kalır.
//
// Seviye verisindeki engeller (x, y: 0..1; r, rx, ry, w: tasarım birimi ≈ oyun alanı yüksekliğinin oranı):
//   { type: 'rock' | 'tree', x, y, r }
//   { type: 'lake', x, y, rx, ry }
//   { type: 'river', pts: [[x, y], ...], w, bridges: [[x, y], ...] }
(function (KS) {
  'use strict';
  const A = KS.ASPECT;

  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const k = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(px - ax - dx * k, py - ay - dy * k);
  }

  // X, Y tasarım biriminde
  function pointBlocked(obs, X, Y, pad) {
    pad = pad || 0;
    for (const o of obs) {
      if (o.type === 'rock' || o.type === 'tree') {
        if (Math.hypot(X - o.x * A, Y - o.y) < o.r + pad) return true;
      } else if (o.type === 'lake') {
        const dx = (X - o.x * A) / (o.rx + pad), dy = (Y - o.y) / (o.ry + pad);
        if (dx * dx + dy * dy < 1) return true;
      } else if (o.type === 'river') {
        let wet = false;
        for (let i = 1; i < o.pts.length && !wet; i++) {
          const p = o.pts[i - 1], q = o.pts[i];
          wet = segDist(X, Y, p[0] * A, p[1], q[0] * A, q[1]) < o.w / 2 + pad;
        }
        if (wet && !(pad === 0 && (o.bridges || []).some(b => Math.hypot(X - b[0] * A, Y - b[1]) < o.w * .8))) return true;
      }
    }
    return false;
  }

  KS.Terrain = {
    pointBlocked,

    // a, b: { nx, ny } — aradaki düz çizgi bir engele takılıyor mu?
    blocks(obs, a, b) {
      if (!obs || !obs.length) return false;
      const ax = a.nx * A, ay = a.ny, bx = b.nx * A, by = b.ny;
      const steps = Math.ceil(Math.hypot(bx - ax, by - ay) / .006);
      for (let i = 1; i < steps; i++) {
        const k = i / steps;
        if (pointBlocked(obs, ax + (bx - ax) * k, ay + (by - ay) * k)) return true;
      }
      return false;
    },

    // Seviye tasarımı kontrolü için: kule bir engelin üstüne ya da çok yakınına mı konmuş?
    towerClear(obs, nx, ny) {
      return !pointBlocked(obs || [], nx * A, ny, .055);
    },

    // ---------- Çizim (arka plan kanvasına bir kez) ----------
    paint(b, obs, area) {
      if (!obs || !obs.length) return;
      const sx = area.w / A, sy = area.h;
      const px = (x, y) => [area.x + x * area.w, area.y + y * area.h];
      const water = obs.filter(o => o.type === 'lake' || o.type === 'river');
      const solid = obs.filter(o => o.type === 'rock' || o.type === 'tree').sort((p, q) => p.y - q.y);
      b.save();
      b.lineCap = 'round'; b.lineJoin = 'round';

      for (const o of water) {
        if (o.type === 'lake') paintLake(b, o, px, sx, sy);
        else paintRiver(b, o, px, sy);
      }
      for (const o of water) if (o.type === 'river') for (const br of o.bridges || []) paintBridge(b, o, br, px, sy);
      for (const o of solid) {
        if (o.type === 'rock') paintRock(b, o, px, sx, sy);
        else paintTree(b, o, px, sx, sy);
      }
      b.restore();
    },
  };

  const WATER = { edge: '#86c9e6', fill: '#a9def3', shine: '#cdeefa', wave: 'rgba(255,255,255,.75)' };

  function wave(b, x, y, s) {
    b.strokeStyle = WATER.wave; b.lineWidth = Math.max(1.5, s * .25);
    b.beginPath(); b.arc(x - s * .5, y, s * .5, Math.PI * .15, Math.PI * .85); b.arc(x + s * .5, y, s * .5, Math.PI * .15, Math.PI * .85); b.stroke();
  }

  function paintLake(b, o, px, sx, sy) {
    const [x, y] = px(o.x, o.y), rx = o.rx * sx, ry = o.ry * sy;
    b.fillStyle = 'rgba(60,110,60,.12)';
    b.beginPath(); b.ellipse(x, y + 4, rx + 6, ry + 6, 0, 0, Math.PI * 2); b.fill();
    b.fillStyle = WATER.edge;
    b.beginPath(); b.ellipse(x, y, rx + 5, ry + 5, 0, 0, Math.PI * 2); b.fill();
    b.fillStyle = WATER.fill;
    b.beginPath(); b.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); b.fill();
    b.fillStyle = WATER.shine;
    b.beginPath(); b.ellipse(x - rx * .25, y - ry * .3, rx * .45, ry * .3, 0, 0, Math.PI * 2); b.fill();
    const s = Math.min(rx, ry) * .18;
    wave(b, x + rx * .3, y + ry * .25, s);
    wave(b, x - rx * .35, y + ry * .45, s * .8);
    // nilüfer yaprağı
    b.fillStyle = '#8fd07a';
    b.beginPath(); b.moveTo(x + rx * .45, y - ry * .2);
    b.arc(x + rx * .45, y - ry * .2, s * 1.1, .35, Math.PI * 2 - .1); b.closePath(); b.fill();
    b.fillStyle = '#ffc2d4';
    b.beginPath(); b.arc(x + rx * .45 - s * .3, y - ry * .2 - s * .2, s * .35, 0, Math.PI * 2); b.fill();
  }

  function riverPath(b, o, px) {
    b.beginPath();
    o.pts.forEach((p, i) => { const [x, y] = px(p[0], p[1]); if (i) b.lineTo(x, y); else b.moveTo(x, y); });
  }

  function paintRiver(b, o, px, sy) {
    const w = o.w * sy;
    riverPath(b, o, px); b.strokeStyle = 'rgba(60,110,60,.12)'; b.lineWidth = w + 14; b.stroke();
    riverPath(b, o, px); b.strokeStyle = WATER.edge; b.lineWidth = w + 10; b.stroke();
    riverPath(b, o, px); b.strokeStyle = WATER.fill; b.lineWidth = w; b.stroke();
    riverPath(b, o, px); b.strokeStyle = WATER.shine; b.lineWidth = w * .3; b.setLineDash([w * .9, w * 1.6]); b.stroke();
    b.setLineDash([]);
    // dalgacıklar
    for (let i = 1; i < o.pts.length; i++) {
      const [x0, y0] = px(o.pts[i - 1][0], o.pts[i - 1][1]), [x1, y1] = px(o.pts[i][0], o.pts[i][1]);
      const len = Math.hypot(x1 - x0, y1 - y0), n = Math.floor(len / (w * 2.2));
      const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
      for (let k = 1; k <= n; k++) {
        const t = k / (n + 1), side = k % 2 ? .22 : -.22;
        wave(b, x0 + (x1 - x0) * t + nx * w * side, y0 + (y1 - y0) * t + ny * w * side, w * .13);
      }
    }
  }

  function paintBridge(b, o, br, px, sy) {
    // köprü, nehrin o noktadaki akışına dik durur
    let best = 1e9, ang = 0;
    for (let i = 1; i < o.pts.length; i++) {
      const p = o.pts[i - 1], q = o.pts[i];
      const d = segDist(br[0] * A, br[1], p[0] * A, p[1], q[0] * A, q[1]);
      if (d < best) { best = d; const [x0, y0] = px(p[0], p[1]), [x1, y1] = px(q[0], q[1]); ang = Math.atan2(y1 - y0, x1 - x0); }
    }
    const [x, y] = px(br[0], br[1]);
    const w = o.w * sy, L = w * 1.9, Wd = w * .95;
    b.save();
    b.translate(x, y); b.rotate(ang);
    b.fillStyle = 'rgba(60,70,40,.2)';
    b.fillRect(-Wd / 2 + 2, -L / 2 + 3, Wd, L);
    b.fillStyle = '#e2b07a'; b.strokeStyle = '#b07a45'; b.lineWidth = 2;
    b.beginPath(); b.rect(-Wd / 2, -L / 2, Wd, L); b.fill(); b.stroke();
    b.beginPath();
    for (let k = 1; k < 7; k++) { const yy = -L / 2 + L * k / 7; b.moveTo(-Wd / 2, yy); b.lineTo(Wd / 2, yy); }
    b.lineWidth = 1.2; b.stroke();
    b.fillStyle = '#c48a52';
    b.fillRect(-Wd / 2 - 3, -L / 2 - 2, 4, L + 4);
    b.fillRect(Wd / 2 - 1, -L / 2 - 2, 4, L + 4);
    b.restore();
  }

  function paintRock(b, o, px, sx, sy) {
    const [x, y] = px(o.x, o.y), rx = o.r * sx, ry = o.r * sy * .82;
    b.fillStyle = 'rgba(60,90,40,.2)';
    b.beginPath(); b.ellipse(x, y + ry * .75, rx * 1.05, ry * .4, 0, 0, Math.PI * 2); b.fill();
    b.fillStyle = '#c3bcb2'; b.strokeStyle = '#9d958a'; b.lineWidth = Math.max(2, rx * .1);
    b.beginPath();
    b.moveTo(x - rx, y + ry * .55);
    b.bezierCurveTo(x - rx * 1.1, y - ry * .4, x - rx * .5, y - ry * 1.05, x + rx * .05, y - ry);
    b.bezierCurveTo(x + rx * .7, y - ry * .95, x + rx * 1.1, y - ry * .2, x + rx, y + ry * .55);
    b.quadraticCurveTo(x, y + ry * .85, x - rx, y + ry * .55);
    b.closePath(); b.fill(); b.stroke();
    b.fillStyle = 'rgba(255,255,255,.45)';
    b.beginPath(); b.ellipse(x - rx * .35, y - ry * .45, rx * .28, ry * .16, -.4, 0, Math.PI * 2); b.fill();
    b.fillStyle = '#9fd487';
    b.beginPath(); b.ellipse(x + rx * .35, y - ry * .7, rx * .3, ry * .14, .3, 0, Math.PI * 2); b.fill();
    // küçük çakıl
    b.fillStyle = '#c3bcb2';
    b.beginPath(); b.ellipse(x + rx * 1.15, y + ry * .55, rx * .22, ry * .16, 0, 0, Math.PI * 2); b.fill(); b.stroke();
  }

  function paintTree(b, o, px, sx, sy) {
    const [x, y] = px(o.x, o.y), r = o.r * (sx + sy) / 2;
    b.fillStyle = 'rgba(60,90,40,.22)';
    b.beginPath(); b.ellipse(x, y + r * .95, r * .95, r * .3, 0, 0, Math.PI * 2); b.fill();
    b.fillStyle = '#b98352';
    b.fillRect(x - r * .14, y + r * .2, r * .28, r * .72);
    b.fillStyle = '#8fd07a'; b.strokeStyle = '#69ad57'; b.lineWidth = Math.max(2, r * .09);
    b.beginPath();
    b.arc(x - r * .42, y + r * .05, r * .5, 0, Math.PI * 2);
    b.arc(x + r * .42, y + r * .05, r * .5, 0, Math.PI * 2);
    b.arc(x, y - r * .32, r * .6, 0, Math.PI * 2);
    b.fill();
    b.beginPath(); b.arc(x - r * .42, y + r * .05, r * .5, Math.PI * .55, Math.PI * 1.6); b.stroke();
    b.beginPath(); b.arc(x + r * .42, y + r * .05, r * .5, -Math.PI * .6, Math.PI * .45); b.stroke();
    b.beginPath(); b.arc(x, y - r * .32, r * .6, Math.PI * 1.1, Math.PI * 1.9); b.stroke();
    b.fillStyle = 'rgba(255,255,255,.35)';
    b.beginPath(); b.ellipse(x - r * .18, y - r * .55, r * .2, r * .12, -.4, 0, Math.PI * 2); b.fill();
    b.fillStyle = '#ff9fb3';
    b.beginPath(); b.arc(x + r * .3, y - r * .1, r * .08, 0, Math.PI * 2); b.arc(x - r * .45, y + r * .15, r * .07, 0, Math.PI * 2); b.fill();
  }

})(window.KS);
