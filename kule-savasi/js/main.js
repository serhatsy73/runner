// Başlatma, ekran boyutu ve oyun döngüsü.
(function (KS) {
  'use strict';
  const G = KS.G, V = KS.V, UI = KS.UI;

  const cv = document.getElementById('game');
  const hud = document.querySelector('.hud');

  function resize() {
    V.DPR = Math.min(2, window.devicePixelRatio || 1);
    V.W = window.innerWidth; V.H = window.innerHeight;
    cv.width = Math.round(V.W * V.DPR); cv.height = Math.round(V.H * V.DPR);
    const a = V.area;
    const top = hud.getBoundingClientRect().bottom + 22;
    a.h = Math.max(200, V.H - 26 - top);
    a.w = Math.min(V.W - 32, a.h * .68);
    a.x = (V.W - a.w) / 2;
    a.y = top;
    V.baseR = Math.max(15, Math.min(42, a.w * .068, a.h * .046));
    V.speed = a.h * .15;
    G.layout();
    KS.Render.buildBackground();
  }

  let last = performance.now(), powerTimer = 0;
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    if (G.state === 'play' || G.state === 'won' || G.state === 'lost') {
      G.update(dt);
      powerTimer -= dt;
      if (powerTimer <= 0) { powerTimer = .25; UI.updatePower(); }
    } else {
      G.time += dt;
    }
    KS.Render.draw();
    requestAnimationFrame(frame);
  }

  KS.Render.init(cv);
  KS.Input.init(cv);
  UI.init();

  window.addEventListener('resize', resize);
  // telefon çalınca, bildirim açılınca ya da uygulamadan çıkınca oyun kendiliğinden durur
  document.addEventListener('visibilitychange', () => { if (document.hidden) UI.pause(); });
  window.addEventListener('pagehide', () => UI.pause());
  // ilk dokunuşta ses bağlamını aç (tarayıcı kuralı)
  window.addEventListener('pointerdown', () => KS.Sfx.unlock(), { once: true, capture: true });
  window.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      if (G.state === 'play') UI.pause(); else if (G.state === 'paused') UI.resume();
    } else if ((e.key === 'r' || e.key === 'R') && G.state !== 'menu') {
      UI.start(G.levelNo);
    }
  });

  G.loadLevel(Math.max(1, Math.min(KS.Save.data.unlocked, KS.Levels.count)));
  resize();
  UI.home();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(UI.redrawArt);
  requestAnimationFrame(frame);
})(window.KS);
