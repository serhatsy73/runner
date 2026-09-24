// Ses ve titreşim. Ses dosyası yok: minik "pop"lar Web Audio ile anında üretilir.
// Tarayıcılar ilk dokunuştan önce ses çalmaya izin vermediği için bağlam ilk dokunuşta açılır.
(function (KS) {
  'use strict';
  const { PLAYER, NEUTRAL } = KS;
  const G = KS.G, Save = KS.Save;

  let ac = null, master = null;
  const last = {};

  function ensure() {
    if (!ac) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ac = new C();
      master = ac.createGain();
      master.gain.value = .55;
      master.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  // Aynı sesin art arda çok sık çalmasını engeller (örn. 50 asker aynı anda vurunca)
  function throttle(key, ms) {
    const now = performance.now();
    if (now - (last[key] || 0) < ms) return false;
    last[key] = now;
    return true;
  }

  function tone(freq, dur, opt = {}) {
    if (!Save.data.settings.sound) return;
    const a = ensure();
    if (!a) return;
    const t0 = a.currentTime + (opt.delay || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = opt.type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (opt.to) o.frequency.exponentialRampToValueAtTime(opt.to, t0 + dur);
    const vol = opt.vol || .15;
    g.gain.setValueAtTime(.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + .012);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + .03);
  }

  const notes = (list, step, opt) => list.forEach((f, i) => tone(f, opt.dur || .16, Object.assign({}, opt, { delay: i * step })));

  function buzz(pattern) {
    if (!Save.data.settings.haptics || !navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch (e) { /* bazı cihazlar desteklemez */ }
  }

  KS.Sfx = {
    unlock: ensure,
    tap() { tone(700, .07, { type: 'triangle', vol: .1, to: 900 }); },
  };

  G.on('select', () => { tone(620, .06, { type: 'triangle', vol: .1, to: 820 }); buzz(8); });
  G.on('hover', () => { if (throttle('hover', 60)) tone(880, .04, { vol: .05 }); });
  G.on('lane', l => { if (l.team === PLAYER) { tone(520, .09, { type: 'triangle', vol: .14, to: 860 }); buzz(12); } });
  G.on('cut', () => { if (throttle('cut', 80)) { tone(1100, .14, { vol: .09, to: 300 }); buzz(10); } });
  G.on('levelup', t => { if (t.team === PLAYER) notes([988, 1319], .07, { type: 'sine', vol: .1, dur: .14 }); });
  G.on('clash', () => { if (throttle('clash', 70)) tone(1400 + Math.random() * 300, .03, { type: 'square', vol: .025 }); });
  G.on('hit', h => {
    if (h.tower.team === PLAYER) { if (throttle('ouch', 90)) tone(180, .07, { type: 'triangle', vol: .09, to: 120 }); }
    else if (h.team === PLAYER && throttle('hit', 60)) tone(420 + Math.random() * 120, .04, { type: 'triangle', vol: .05 });
  });
  G.on('capture', c => {
    if (c.team === PLAYER) { notes([660, 880, 1175], .06, { type: 'triangle', vol: .13 }); buzz(25); }
    else if (c.prev === PLAYER) { notes([392, 294], .12, { type: 'sawtooth', vol: .06, dur: .22 }); buzz([30, 40, 30]); }
    else if (c.prev === NEUTRAL && throttle('aicap', 300)) tone(330, .12, { type: 'triangle', vol: .05 });
  });
  G.on('denied', () => { tone(220, .12, { type: 'square', vol: .05, to: 170 }); buzz([15, 30, 15]); });
  G.on('surge', () => { notes([392, 523, 659, 784], .09, { type: 'sawtooth', vol: .06, dur: .18 }); buzz([40, 30, 40]); });
  G.on('win', () => { notes([523, 659, 784, 1046, 1319], .1, { type: 'triangle', vol: .14, dur: .22 }); buzz([30, 50, 30, 50, 90]); });
  G.on('lose', () => { notes([440, 370, 311, 262], .18, { type: 'sine', vol: .12, dur: .3 }); buzz([60, 60, 120]); });

})(window.KS);
