// Rakip yapay zekâ. Hile yapmaz: oyuncuyla aynı kurallarla (menzil, engeller) oynar.
//
// Yollar kuleyi boşaltmadığı için asıl soru "askerim yeter mi" değil, "bu hedefi akışla ne kadar
// sürede alırım"dır: hedefe akan dost askerler − hedefin kendini yenilemesi − karşı yollar.
// Zorluk seviyeyle gelen tepki hızı, sabır ve yol sayısından; karakter kişilikten gelir.
(function (KS) {
  'use strict';
  const { NEUTRAL, PLAYER, RATE, OVERPROD, OVERPROD_RATE } = KS;
  const G = KS.G;

  // Kişilikler: seviye parametrelerinin üstüne eklenir
  //   aggro    : asıl düşmana (oyuncuya) saldırma isteği   neutral : gri kule toplama isteği
  //   patience : bir hedefi almak için kaç saniye beklemeye razı (çarpan)
  //   late     : (açgözlü) toplanacak gri kule kalmayınca eklenen saldırganlık
  //   careful  : (temkinli) kendisine saldırana karşı yol açmayı (askerler ortada çarpışır) daha çok ister
  const PERSONAS = {
    aggressive: { aggro: 8, neutral: 2, patience: 1.2, late: 0, careful: false },
    greedy:     { aggro: -6, neutral: 8, patience: 1, late: 10, careful: false },
    cautious:   { aggro: 0, neutral: 4, patience: .6, late: 0, careful: true },
    balanced:   { aggro: 0, neutral: 4, patience: 1, late: 0, careful: false },
  };

  const RIVAL = -12;   // rakipler birbirine de saldırabilir ama asıl hedefleri oyuncu ve gri kulelerdir
  const MIN_LANE_AGE = 4;

  const AI = KS.AI = {
    PERSONAS,
    paramsFor: n => ({
      interval: Math.max(1.2, 4 - (n - 1) * .16),    // kaç saniyede bir düşünür
      aggro: n <= 2 ? 0 : Math.min(8, 1 + n * .4),   // oyuncuya saldırma isteği
      patience: Math.min(50, 18 + n * 1.5),          // bir hedefi almak için kabul ettiği süre (sn)
      maxLanes: n <= 2 ? 1 : n <= 6 ? 2 : 3,         // kule başına en fazla yol (kule seviyesiyle de sınırlı)
      moves: n <= 4 ? 1 : 2,                         // bir düşünmede açtığı en fazla yeni yol
      focus: 6,                                      // zaten saldırılan hedefe yüklenme isteği
      grace: n === 1 ? 25 : n === 2 ? 20 : 0,        // ilk saniyelerde oyuncuya dokunmaz
      firstMove: n <= 2 ? 3 : 1.5,
    }),
    personaOf: team => {
      if (G.levelNo <= 2) return PERSONAS.balanced;   // ilk seviyelerde karakter yok, sadece öğrenme
      const over = G.cfg && G.cfg.persona && G.cfg.persona[team];
      return PERSONAS[over || KS.PERSONA[team]] || PERSONAS.balanced;
    },
  };

  // ---------- Akış hesabı ----------
  // hedefe belirli bir takımdan akan asker (sn başına)
  const flowInto = (to, team) => G.lanes.reduce((s, l) => s + (l.to === to && l.team === team ? G.laneFlow(l) : 0), 0);
  const hostileFlow = t => G.lanes.reduce((s, l) => s + (l.to === t && l.team !== t.team ? G.laneFlow(l) : 0), 0);
  // kuşatılan kuleye takviye giremediği için sadece kendi üretimi sayılır
  const regen = t => t.team === NEUTRAL ? 0
    : RATE[t.lvl] * G.tempo.prod * (t.count >= OVERPROD ? OVERPROD_RATE : 1);

  // f'den to'ya yol açılırsa (ya da açıksa) hedefin net erime hızı
  function meltRate(f, to, team, includeSelf) {
    // f yeni bir yol açarsa akışı mevcut yollarıyla bölünür
    const share = G.flowOf(f) / (G.lanesFrom(f).length + 1);
    let eff = flowInto(to, team) + (includeSelf ? share : 0) - regen(to);
    // üçüncü tarafların saldırısı da hedefi eritir
    eff += G.lanes.reduce((s, l) => s + (l.to === to && l.team !== team && l.team !== to.team ? G.laneFlow(l) : 0), 0);
    // hedef bize doğru yol açmışsa askerler ortada çarpışır
    const back = G.findLane(to, f);
    if (back) eff -= G.laneFlow(back);
    return eff;
  }

  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const threatened = t => hostileFlow(t) > 0;

  // Oyuncu yerine bot oynatırken (denge aracı) persona verilebilir
  AI.think = (team, personaOverride) => {
    const P = G.aiParams;
    const per = personaOverride || AI.personaOf(team);
    const mine = G.towers.filter(t => t.team === team);
    if (!mine.length) return;

    // Toparlanma: işe yaramayan yolları bırak ki kule başka hedefe dönebilsin
    for (const l of G.lanes.slice()) {
      if (l.team !== team || G.time - (l.born || 0) < MIN_LANE_AGE) continue;
      const f = l.from, to = l.to;
      if (l.feed) {
        if (to.team !== team || to.count >= 90) G.removeLane(l);
      } else if (to.team === team) {
        G.removeLane(l);                                     // hedef ele geçirildi: kule yeni hedef seçsin
      } else if (meltRate(f, to, team, false) <= 0 && to.count > 5) {
        G.removeLane(l);                                     // umutsuz kuşatma
      }
    }

    // Açgözlü: ulaşılabilir gri kule kaldıysa önce onları toplar, kalmadıysa büyük saldırıya geçer
    let aggro = P.aggro + per.aggro;
    if (per.late && !G.towers.some(n => n.team === NEUTRAL && mine.some(f => G.canLink(f, n)))) aggro = P.aggro + per.late;
    if (G.surge) aggro += 4;
    const patience = P.patience * per.patience;

    let made = 0;
    for (const f of shuffle(mine)) {
      if (made >= P.moves) break;
      if (G.lanesFrom(f).length >= Math.min(f.lvl, P.maxLanes)) continue;
      let best = null, bestScore = 0;
      for (const to of G.towers) {
        if (to === f || G.findLane(f, to) || !G.canLink(f, to)) continue;
        if (to.team === PLAYER && team !== PLAYER && G.playTime < P.grace) continue;
        const d = G.ndist(f, to);
        let score;
        if (to.team !== team && G.findLane(to, f) && (per.careful || f.count < 25)) {
          // bana saldırana karşı yol: askerler ortada çarpışır, saldırı durur.
          // Sadece temkinli rakip ya da zayıf kule yapar; herkes yapsa her saldırı kilitlenir.
          score = 30 + (per.careful ? 12 : 0) - d * 5;
        } else if (to.team === team) {
          continue;   // takviye kuşatmada işe yaramaz; arka kuleler ikmal (feed) ile cepheyi besler
        } else {
          const eff = meltRate(f, to, team, true);
          if (eff <= .15) continue;
          const time = to.count / eff;
          if (time > patience) continue;
          // asıl düşman: rakipler için oyuncu; (denge aracında oyuncu yerine oynarken) oyuncu için rakipler
          const foe = team === PLAYER ? to.team !== NEUTRAL : to.team === PLAYER;
          score = 40 - time * 1.2 - d * 10
            + (foe ? aggro : to.team === NEUTRAL ? per.neutral : RIVAL)
            + (flowInto(to, team) > 0 ? P.focus : 0);
        }
        if (score > bestScore) { bestScore = score; best = to; }
      }
      if (best && G.addLane(f, best, team)) made++;
      else if (!best && feed(f, team)) made++;
    }
  };

  // İkmal: önünde saldırılacak hedef olmayan arka kule, cepheye en yakın dost kuleyi besler.
  // Beslenen kule büyür, seviye atlar ve daha hızlı akıtır.
  const frontDist = (t, team) => {
    let best = Infinity;
    for (const o of G.towers) if (o.team !== team) best = Math.min(best, G.ndist(t, o));
    return best;
  };
  function feed(f, team) {
    if (G.lanesFrom(f).length || threatened(f)) return false;
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
