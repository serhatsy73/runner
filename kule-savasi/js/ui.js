// HUD ve kart ekranları: ana menü, duraklatma, kazanma (yıldızlar), kaybetme.
(function (KS) {
  'use strict';
  const { PLAYER, NEUTRAL, RED, TEAMS } = KS;
  const G = KS.G, Save = KS.Save, Monet = KS.Monet;
  const $ = id => document.getElementById(id);

  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';
  let el = null;

  const UI = KS.UI = {};

  UI.init = () => {
    el = {
      lvl: $('lvl'), power: $('power'), overlay: $('overlay'), title: $('ovTitle'), body: $('ovBody'),
      btns: $('ovBtns'), art: $('ovArt'), toggles: $('ovToggles'), pause: $('pauseBtn'), restart: $('restart'),
    };
    el.pause.addEventListener('click', () => { KS.Sfx.tap(); UI.pause(); });
    el.restart.addEventListener('click', () => { KS.Sfx.tap(); UI.start(G.levelNo); });
    G.on('win', showWin);
    G.on('lose', showLose);
    G.on('capture', () => UI.updatePower());
  };

  UI.start = n => {
    KS.Input.cancel();
    G.loadLevel(n);
    G.state = 'play';
    Save.recordPlay();
    el.lvl.textContent = 'Seviye ' + n;
    buildPower();
    hide();
  };

  UI.pause = () => {
    if (G.state !== 'play') return;
    G.state = 'paused';
    KS.Input.cancel();
    show({
      title: 'Duraklatıldı',
      body: `<p>Seviye ${G.levelNo} · ${KS.fmtTime(G.playTime)}</p>`,
      art: { team: PLAYER, mood: 'happy' },
      buttons: [
        { label: 'Devam', onClick: UI.resume },
        { label: 'Yeniden Başlat', ghost: true, onClick: () => UI.start(G.levelNo) },
        { label: 'Ana Menü', ghost: true, onClick: UI.showMenu },
      ],
      toggles: true,
    });
  };

  UI.resume = () => {
    if (G.state !== 'paused') return;
    G.state = 'play';
    hide();
  };

  UI.isOpen = () => !el.overlay.hidden;

  // ---------- Ekranlar ----------
  UI.showMenu = () => {
    G.state = 'menu';
    const next = Save.data.unlocked;
    const total = Save.totalStars();
    const buttons = [{ label: next > 1 ? `Seviye ${next}'den devam` : 'Oyna', onClick: () => UI.start(next) }];
    if (next > 1) buttons.push({ label: 'Baştan başla', ghost: true, onClick: () => UI.start(1) });
    if (G.levelNo !== next || !G.cfg) G.loadLevel(next);
    el.lvl.textContent = 'Seviye ' + G.levelNo;
    buildPower();
    show({
      title: 'Kule Savaşı',
      body: `
        ${total ? `<div class="total">${STAR} ${total} yıldız</div>` : ''}
        <ul class="steps">
          <li><b>1</b><span>Mavi kulenden bir kuleye <strong>sürükle</strong>. Bıraktığında askerler yola çıkar.</span></li>
          <li><b>2</b><span>Sürüklerken diğer mavi kulelerinin <strong>üstünden geç</strong>: hepsi birden saldırır.</span></li>
          <li><b>3</b><span>Bir kulenin askerleri 0'a inince kule <strong>senin</strong> olur. 20 ve 40 askerde kule büyür.</span></li>
          <li><b>4</b><span>Bir yolu kesmek için boş alandan çizginin üstünden <strong>kaydır</strong>.</span></li>
        </ul>`,
      art: { team: PLAYER, mood: 'happy' },
      buttons,
      toggles: true,
    });
  };

  function showWin(r) {
    const record = Save.recordWin(r.level, r.stars);
    const stars = [0, 1, 2].map(i =>
      STAR.replace('<svg', `<svg class="${i < r.stars ? 'on' : ''}" style="animation-delay:${.15 + i * .18}s"`)).join('');
    show({
      title: 'Level Clear!',
      body: `
        <div class="stars" role="img" aria-label="${r.stars} yıldız">${stars}</div>
        ${record && Save.data.stats.wins > 1 ? '<div class="badge">Yeni rekor!</div>' : ''}
        <ul class="goals">
          <li class="ok">Kazan</li>
          <li class="${r.noLoss ? 'ok' : ''}">Hiç kule kaybetme</li>
          <li class="${r.fast ? 'ok' : ''}">${KS.fmtTime(r.par)} altında bitir&nbsp;<small>(${KS.fmtTime(r.time)})</small></li>
        </ul>`,
      art: { team: PLAYER, mood: 'happy' },
      buttons: [
        { label: 'Sonraki Seviye', onClick: () => Monet.afterWin(r.level).then(() => UI.start(r.level + 1)) },
        { label: 'Tekrar Oyna', ghost: true, onClick: () => UI.start(r.level) },
      ],
    });
  }

  function showLose(r) {
    Save.recordLoss();
    const foe = G.towers.find(t => t.team !== PLAYER && t.team !== NEUTRAL);
    const buttons = [];
    if (r.canRevive && Monet.canShowRewarded()) {
      buttons.push({
        label: 'Reklam izle, devam et', gold: true,
        onClick: () => Monet.showRewarded('revive').then(ok => { if (ok && G.revive()) hide(); }),
      });
    }
    buttons.push({ label: 'Tekrar Dene', onClick: () => UI.start(r.level) });
    show({
      title: 'Defeat!',
      body: '<p>Bütün kulelerin düştü. Önce zayıf gri kuleleri toplayıp güçlenmeyi dene.</p>',
      art: { team: foe ? foe.team : RED, mood: 'sad' },
      buttons,
    });
  }

  // ---------- Kart altyapısı ----------
  function show(o) {
    el.title.textContent = o.title;
    el.body.innerHTML = o.body || '';
    el.btns.innerHTML = '';
    for (const b of o.buttons) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn' + (b.ghost ? ' ghost' : '') + (b.gold ? ' gold' : '');
      btn.textContent = b.label;
      btn.addEventListener('click', () => { KS.Sfx.tap(); b.onClick(); });
      el.btns.appendChild(btn);
    }
    el.toggles.innerHTML = '';
    el.toggles.hidden = !o.toggles;
    if (o.toggles) {
      addToggle('sound', 'Ses');
      if (navigator.vibrate) addToggle('haptics', 'Titreşim');
    }
    el.artSpec = o.art;
    KS.Render.drawArt(el.art, o.art.team, o.art.mood);
    el.overlay.hidden = false;
  }

  function addToggle(key, label) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'toggle';
    const sync = () => {
      const on = Save.data.settings[key];
      b.setAttribute('aria-pressed', String(on));
      b.textContent = `${label}: ${on ? 'Açık' : 'Kapalı'}`;
    };
    b.addEventListener('click', () => { Save.setSetting(key, !Save.data.settings[key]); sync(); KS.Sfx.tap(); });
    sync();
    el.toggles.appendChild(b);
  }

  function hide() { el.overlay.hidden = true; }

  UI.redrawArt = () => { if (UI.isOpen() && el.artSpec) KS.Render.drawArt(el.art, el.artSpec.team, el.artSpec.mood); };

  // ---------- Güç çubuğu ----------
  function buildPower() {
    el.power.innerHTML = '';
    for (const team of [PLAYER, NEUTRAL, ...G.cfg.ai]) {
      const i = document.createElement('i');
      i.style.background = TEAMS[team].fill;
      i.dataset.team = team;
      el.power.appendChild(i);
    }
    UI.updatePower();
  }

  UI.updatePower = () => {
    const sum = [0, 0, 0, 0];
    for (const t of G.towers) sum[t.team] += t.count + 2;
    for (const s of G.soldiers) sum[s.team] += 1;
    const label = [];
    for (const i of el.power.children) {
      const team = +i.dataset.team;
      i.style.flexGrow = sum[team].toFixed(1);
      label.push(TEAMS[team].name + ' ' + Math.round(sum[team]));
    }
    el.power.setAttribute('aria-label', 'Güç dengesi: ' + label.join(', '));
  };
})(window.KS);
