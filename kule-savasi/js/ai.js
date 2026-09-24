// Rakip yapay zekâ. Hile yapmaz: oyuncuyla aynı kurallarla oynar, zorluk sadece tepki hızı ve cesaretle artar.
(function (KS) {
  'use strict';
  const { NEUTRAL, PLAYER, CAP, RATE } = KS;
  const G = KS.G, V = KS.V;

  const AI = KS.AI = {
    paramsFor: n => ({
      interval: Math.max(1.4, 4.4 - (n - 1) * .18),  // kaç saniyede bir düşünür
      margin: Math.max(1, 7 - (n - 1) * .5),          // saldırmak için ne kadar fazlası olmalı
      aggro: n <= 2 ? 0 : Math.min(8, 1.5 + n * .35), // oyuncuya saldırmayı ne kadar sever
      grace: n === 1 ? 25 : n === 2 ? 12 : 0,         // ilk saniyelerde oyuncuya dokunmaz
      firstMove: n <= 2 ? 3 : 1.5,
    }),
  };

  function incoming(t) {
    const byTeam = [0, 0, 0, 0];
    for (const s of G.soldiers) if (s.to === t) byTeam[s.team]++;
    return byTeam;
  }
  const hostile = (t, inc) => inc.reduce((sum, n, team) => team === t.team ? sum : sum + n, 0);

  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  AI.think = team => {
    const P = G.aiParams;
    const mine = G.towers.filter(t => t.team === team);
    if (!mine.length) return;
    const inc = new Map(G.towers.map(t => [t, incoming(t)]));

    // Toparlanma: gereksiz takviyeleri kes, zor durumda geri çekil
    for (const l of G.lanes.slice()) {
      if (l.team !== team) continue;
      const f = l.from, to = l.to;
      const fThreat = hostile(f, inc.get(f));
      if (to.team === team) {
        if (hostile(to, inc.get(to)) < to.count + 2) G.removeLane(l);
      } else if ((f.count < 3 && to.count > 8) || fThreat > f.count + 2) {
        G.removeLane(l);
      }
    }

    let made = 0;
    for (const f of shuffle(mine)) {
      if (made >= 2) break;
      if (G.lanesFrom(f).length >= f.lvl || f.count < 6) continue;
      let best = null, bestScore = 0;
      for (const to of G.towers) {
        if (to === f || G.findLane(f, to)) continue;
        if (to.team === PLAYER && team !== PLAYER && G.playTime < P.grace) continue;
        const d = G.dist(f, to) / V.area.h;
        const tInc = inc.get(to);
        let score;
        if (to.team === team) {
          const threat = hostile(to, tInc);
          if (threat <= to.count || f.count < 12) continue;
          score = 25 + threat - to.count - d * 10;
        } else {
          const travel = G.dist(f, to) / (V.speed * G.tempo.speed);
          const growth = to.team === NEUTRAL ? 0 : RATE[to.lvl] * travel;
          const need = to.count + growth - tInc[team];
          const full = f.count >= CAP * .8;
          if (!full && f.count < need + P.margin) continue;
          // asıl düşman: rakipler için oyuncu; (denge simülasyonunda oyuncu yerine oynarken) oyuncu için rakipler
          const foe = team === PLAYER ? to.team !== NEUTRAL : to.team === PLAYER;
          score = 1 + (f.count - need) * .5 - d * 12 - to.count * .4
            + (foe ? P.aggro : to.team === NEUTRAL ? 3 : -3);
          if (full) score = Math.max(score, .5);
        }
        if (score > bestScore) { bestScore = score; best = to; }
      }
      if (best && G.addLane(f, best, team)) made++;
    }
  };
})(window.KS);
