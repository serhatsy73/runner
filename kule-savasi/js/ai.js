// Rakip yapay zekâ. Hile yapmaz: oyuncuyla aynı kurallarla (menzil, engeller) oynar.
// Zorluk seviyeyle gelen tepki hızı ve cesaretten, karakter ise kişilikten gelir.
(function (KS) {
  'use strict';
  const { NEUTRAL, PLAYER, RATE, OVERPROD } = KS;
  const G = KS.G, V = KS.V;

  // Kişilikler: seviye parametrelerinin üstüne eklenir
  //   aggro   : asıl düşmana saldırma isteği        neutral : gri kule toplama isteği
  //   margin  : saldırmak için gereken fazladan asker
  //   late    : (açgözlü) toplanacak gri kule kalmayınca eklenen saldırganlık
  //   careful : (temkinli) tehdit altındayken daha erken geri çekilir ve takviye yollar
  const PERSONAS = {
    aggressive: { aggro: 3, neutral: 1, margin: -1, late: 0, careful: false },
    greedy:     { aggro: -4, neutral: 7, margin: 0, late: 7, careful: false },
    cautious:   { aggro: 0, neutral: 3, margin: 5, late: 0, careful: true },
    balanced:   { aggro: 0, neutral: 3, margin: 0, late: 0, careful: false },
  };

  const RIVAL = -7;   // rakipler birbirine de saldırabilir ama asıl hedefleri oyuncu ve gri kulelerdir

  const AI = KS.AI = {
    PERSONAS,
    paramsFor: n => ({
      interval: Math.max(1.4, 4.4 - (n - 1) * .18),  // kaç saniyede bir düşünür
      margin: Math.max(1, 7 - (n - 1) * .5),          // saldırmak için ne kadar fazlası olmalı
      aggro: n <= 2 ? 0 : Math.min(8, 1.5 + n * .35), // asıl düşmana saldırmayı ne kadar sever
      grace: n === 1 ? 25 : n === 2 ? 20 : 0,         // ilk saniyelerde oyuncuya dokunmaz
      firstMove: n <= 2 ? 3 : 1.5,
    }),
    personaOf: team => {
      if (G.levelNo <= 2) return PERSONAS.balanced;   // ilk seviyelerde karakter yok, sadece öğrenme
      const over = G.cfg && G.cfg.persona && G.cfg.persona[team];
      return PERSONAS[over || KS.PERSONA[team]] || PERSONAS.balanced;
    },
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

  // Oyuncu yerine bot oynatırken (denge aracı) persona verilebilir
  AI.think = (team, personaOverride) => {
    const P = G.aiParams;
    const per = personaOverride || AI.personaOf(team);
    const mine = G.towers.filter(t => t.team === team);
    if (!mine.length) return;
    const inc = new Map(G.towers.map(t => [t, incoming(t)]));

    // Toparlanma: gereksiz takviyeleri kes, zor durumda geri çekil
    for (const l of G.lanes.slice()) {
      if (l.team !== team) continue;
      const f = l.from, to = l.to;
      const fThreat = hostile(f, inc.get(f));
      if (l.feed) {
        // ikmal yolu: cephe doldu ya da arka kule tehlikedeyse kes
        if (to.team !== team || to.count >= 90 || fThreat > f.count) G.removeLane(l);
      } else if (to.team === team) {
        if (hostile(to, inc.get(to)) < to.count + 2) G.removeLane(l);
      } else if (per.careful ? (f.count < 6 && to.count > 5) || fThreat > f.count : (f.count < 3 && to.count > 8) || fThreat > f.count + 2) {
        G.removeLane(l);
      }
    }

    // Açgözlü: ulaşılabilir gri kule kaldıysa önce onları toplar, kalmadıysa büyük saldırıya geçer
    let aggro = P.aggro + per.aggro;
    if (per.late) {
      const neutralsLeft = G.towers.some(n => n.team === NEUTRAL && mine.some(f => G.canLink(f, n)));
      if (!neutralsLeft) aggro = P.aggro + per.late;
    }
    let margin = Math.max(0, P.margin + per.margin);
    // Son Hücum: herkes cesaretlenir
    if (G.surge) { aggro += 4; margin = 0; }

    let made = 0;
    for (const f of shuffle(mine)) {
      if (made >= 2) break;
      if (G.lanesFrom(f).length >= f.lvl || f.count < 6) continue;
      let best = null, bestScore = 0;
      for (const to of G.towers) {
        if (to === f || G.findLane(f, to) || !G.canLink(f, to)) continue;
        if (to.team === PLAYER && team !== PLAYER && G.playTime < P.grace) continue;
        const d = G.ndist(f, to);
        const tInc = inc.get(to);
        let score;
        if (to.team === team) {
          const threat = hostile(to, tInc);
          if (threat <= to.count * (per.careful ? .7 : 1) || f.count < 12) continue;
          score = 25 + threat - to.count - d * 10;
        } else {
          const travel = G.dist(f, to) / (V.speed * G.tempo.speed);
          const growth = to.team === NEUTRAL ? 0 : RATE[to.lvl] * travel;
          const need = to.count + growth - tInc[team];
          const full = f.count >= OVERPROD;   // üstünde üretim yavaşlar, beklemek boşa
          if (!full && f.count < need + margin) continue;
          // asıl düşman: rakipler için oyuncu; (denge aracında oyuncu yerine oynarken) oyuncu için rakipler
          const foe = team === PLAYER ? to.team !== NEUTRAL : to.team === PLAYER;
          score = 1 + (f.count - need) * .5 - d * 12 - to.count * .4
            + (foe ? aggro : to.team === NEUTRAL ? per.neutral : RIVAL);
          if (full) score = Math.max(score, .5);
        }
        if (score > bestScore) { bestScore = score; best = to; }
      }
      if (best && G.addLane(f, best, team)) made++;
      else if (!best && feed(f, team, inc)) made++;
    }
  };

  // İkmal: önünde saldırılacak hedef olmayan arka kule, askerini cepheye en yakın dost kuleye taşır.
  // Menzilli haritalarda en temel strateji budur; yoksa arka kuleler boşuna dolar.
  const frontDist = (t, team) => {
    let best = Infinity;
    for (const o of G.towers) if (o.team !== team) best = Math.min(best, G.ndist(t, o));
    return best;
  };
  function feed(f, team, inc) {
    if (f.count < 15 || G.lanesFrom(f).length || hostile(f, inc.get(f)) > 0) return false;
    if (G.towers.some(o => o.team !== team && G.canLink(f, o))) return false;   // kendi cephesi var
    const mine = frontDist(f, team);
    let best = null, bd = mine - .05;
    for (const o of G.towers) {
      if (o === f || o.team !== team || o.count >= 80 || !G.canLink(f, o)) continue;
      const d = frontDist(o, team);
      if (d < bd) { bd = d; best = o; }
    }
    if (!best) return false;
    const lane = G.addLane(f, best, team);
    if (lane) lane.feed = true;
    return !!lane;
  }
})(window.KS);
