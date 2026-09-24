// Dokunma / fare girdisi.
// - Kendi kulenden sürükle: yol aç. Sürüklerken geçtiğin diğer mavi kuleler de kaynak olur (çoklu saldırı).
// - Parmak bir kuleye yaklaşınca hedef ona yapışır, böylece parmağın altındaki kuleyi tam tutturmak gerekmez.
// - Boş alandan kaydır: üstünden geçtiğin kendi yollarını keser.
// - Kendi kulene dokun (sürüklemeden): o kuleden çıkan bütün yollar durur.
(function (KS) {
  'use strict';
  const { PLAYER } = KS;
  const G = KS.G;

  const startReach = t => Math.max(G.towerR(t) * 1.3, 30);
  const passReach = t => Math.max(G.towerR(t) * 1.1, 24);
  const snapReach = t => Math.max(G.towerR(t) * 1.9, 46);
  const mine = t => t.team === PLAYER;

  function segCross(a, b, c, d) {
    const d1 = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    const d2 = (b.x - a.x) * (d.y - a.y) - (b.y - a.y) * (d.x - a.x);
    const d3 = (d.x - c.x) * (a.y - c.y) - (d.y - c.y) * (a.x - c.x);
    const d4 = (d.x - c.x) * (b.y - c.y) - (d.y - c.y) * (b.x - c.x);
    return (d1 > 0) !== (d2 > 0) && (d3 > 0) !== (d4 > 0);
  }

  function cutAcross(p0, p1) {
    for (const l of G.lanes.slice()) {
      if (l.team !== PLAYER || !segCross(p0, p1, l.from, l.to)) continue;
      G.removeLane(l);
      G.fx.burst((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, KS.TEAMS[PLAYER].fill, 8, .5);
      G.emit('cut');
    }
  }

  function stopTower(t) {
    const out = G.lanes.filter(l => l.from === t && l.team === PLAYER);
    if (!out.length) return;
    out.forEach(G.removeLane);
    G.fx.text(t.x, t.y - G.towerR(t) * 1.9, 'Durdu', KS.TEAMS[PLAYER].dark);
    G.emit('cut');
  }

  KS.Input = {
    init(cv) {
      cv.addEventListener('pointerdown', e => {
        if (G.state !== 'play' || G.drag) return;
        e.preventDefault();
        try { cv.setPointerCapture(e.pointerId); } catch (err) { /* bazı tarayıcılar desteklemez */ }
        const x = e.clientX, y = e.clientY;
        const t = G.nearestTower(x, y, startReach, mine);
        if (t) {
          G.drag = { type: 'link', id: e.pointerId, sources: [t], x, y, sx: x, sy: y, moved: false, over: null };
          G.emit('select', t);
        } else {
          G.drag = { type: 'cut', id: e.pointerId, last: { x, y } };
          G.trail.push({ x, y, t: G.time });
        }
      });

      cv.addEventListener('pointermove', e => {
        const d = G.drag;
        if (!d || e.pointerId !== d.id) return;
        const x = e.clientX, y = e.clientY;
        if (d.type === 'link') {
          d.x = x; d.y = y;
          if (Math.hypot(x - d.sx, y - d.sy) > 14) d.moved = true;
          const passed = G.nearestTower(x, y, passReach, mine);
          if (passed && !d.sources.includes(passed)) { d.sources.push(passed); G.emit('select', passed); }
          const over = G.nearestTower(x, y, snapReach);
          if (over !== d.over && over && !(d.sources.length === 1 && d.sources[0] === over)) G.emit('hover', over);
          d.over = over;
        } else {
          const p = { x, y };
          cutAcross(d.last, p);
          d.last = p;
          G.trail.push({ x, y, t: G.time });
        }
      });

      const end = (e, cancel) => {
        const d = G.drag;
        if (!d || e.pointerId !== d.id) return;
        G.drag = null;
        if (cancel || d.type !== 'link' || G.state !== 'play') return;
        // kendi kulene dokunmak (sürüklemeden): o kuleden çıkan bütün yollar durur
        if (!d.moved && d.sources.length === 1) { stopTower(d.sources[0]); return; }
        if (!d.over) return;
        let made = 0, tried = 0;
        for (const s of d.sources) {
          if (s === d.over) continue;
          tried++;
          if (G.addLane(s, d.over, PLAYER)) made++;
        }
        if (made) G.playerLinked = true;
        else if (tried && d.sources.some(s => s !== d.over && !G.canLink(s, d.over))) G.emit('denied', d.over);
      };
      cv.addEventListener('pointerup', e => end(e, false));
      cv.addEventListener('pointercancel', e => end(e, true));
      cv.addEventListener('contextmenu', e => e.preventDefault());
    },
    cancel() { G.drag = null; },
  };

})(window.KS);
