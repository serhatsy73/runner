// Başlatma, ekran boyutu ve oyun döngüsü. Görünüm: 3B (Three.js) ya da 2B (Canvas) — ayarlardan seçilir.
(function (KS) {
  'use strict';
  const G = KS.G, V = KS.V, UI = KS.UI;

  const cv = document.getElementById('game');
  const hud2d = document.getElementById('hud2d');
  const hud = document.querySelector('.hud');

  let use3d = false;
  if (KS.Save.data.settings.view3d && KS.Render3D && KS.Render3D.supported()) {
    try { KS.Render3D.init(cv, hud2d); use3d = true; } catch (e) { console.error('3B başlatılamadı, 2B kullanılıyor', e); }
  }
  V.mode = use3d ? '3d' : '2d';
  if (!use3d) {
    hud2d.hidden = true;
    KS.Render.init(cv);
  }

  function resize() {
    V.DPR = Math.min(2, window.devicePixelRatio || 1);
    V.W = window.innerWidth; V.H = window.innerHeight;
    const hudBottom = hud.getBoundingClientRect().bottom;
    if (use3d) {
      KS.Render3D.resize(hudBottom);
      G.layout();
      return;
    }
    cv.width = Math.round(V.W * V.DPR); cv.height = Math.round(V.H * V.DPR);
    const a = V.area;
    const top = hudBottom + 22;
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
    if (use3d) KS.Render3D.draw(dt); else KS.Render.draw();
    requestAnimationFrame(frame);
  }

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
