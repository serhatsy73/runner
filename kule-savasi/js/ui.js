// HUD, dünya haritası ve kart ekranları: yardım, tanıtım, duraklatma, kazanma (yıldızlar), kaybetme.
(function (KS) {
  'use strict';
  const { PLAYER, NEUTRAL, RED, TEAMS } = KS;
  const G = KS.G, Save = KS.Save, Monet = KS.Monet, Levels = KS.Levels;
  const $ = id => document.getElementById(id);

  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';
  const LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0110 0v2h.5A1.5 1.5 0 0119 11.5v8a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 19.5v-8A1.5 1.5 0 016.5 10H7zm2 0h6V8a3 3 0 00-6 0v2z"/></svg>';
  const STEP = 92;   // haritada iki seviye arası dikey mesafe (px)
  let el = null;

  const UI = KS.UI = {};

  UI.init = () => {
    el = {
      lvl: $('lvl'), power: $('power'), overlay: $('overlay'), title: $('ovTitle'), body: $('ovBody'),
      btns: $('ovBtns'), art: $('ovArt'), toggles: $('ovToggles'), pause: $('pauseBtn'), restart: $('restart'),
      map: $('map'), worlds: $('worlds'), mapStars: $('mapStars'), mapToggles: $('mapToggles'), help: $('helpBtn'),
    };
    el.pause.addEventListener('click', () => { KS.Sfx.tap(); UI.pause(); });
    el.restart.addEventListener('click', () => { KS.Sfx.tap(); UI.start(G.levelNo); });
    el.help.addEventListener('click', () => { KS.Sfx.tap(); UI.showHelp(false); });
    addToggle(el.mapToggles, 'sound', 'Ses');
    if (navigator.vibrate) addToggle(el.mapToggles, 'haptics', 'Titreşim');
    G.on('win', showWin);
    G.on('lose', showLose);
    G.on('capture', () => UI.updatePower());
  };

  // ---------- Kilitler ----------
  const worldLocked = w => w.soon || Save.data.unlocked < w.from || Save.totalStars() < w.stars;
  UI.canPlay = n => {
    const w = Levels.worldOf(n);
    return !!w && n <= Save.data.unlocked && !worldLocked(w);
  };
  // haritada "sıradaki" olarak parlayan seviye
  function currentLevel() {
    for (let n = Math.min(Save.data.unlocked, Levels.count); n >= 1; n--) if (UI.canPlay(n)) return n;
    return 1;
  }

  // ---------- Akış ----------
  UI.home = () => { if (!Save.data.stats.plays) UI.showHelp(true); else UI.showMap(); };

  UI.play = n => {
    const key = Levels.get(n).intro;
    if (key && !Save.data.seen[key]) showIntro(n, key);
    else UI.start(n);
  };

  UI.start = n => {
    KS.Input.cancel();
    G.loadLevel(n);
    G.state = 'play';
    Save.recordPlay();
    el.lvl.textContent = 'Seviye ' + n;
    buildPower();
    hide();
    el.map.hidden = true;
    if (G.cfg.tip) G.showBanner(G.cfg.tip, '', 3);
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
        { label: 'Harita', ghost: true, onClick: UI.showMap },
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

  // ---------- Dünya haritası ----------
  UI.showMap = () => {
    G.state = 'menu';
    KS.Input.cancel();
    hide();
    renderMap();
    el.map.hidden = false;
    const cur = el.worlds.querySelector('.node.current');
    if (cur) cur.scrollIntoView({ block: 'center' });
  };

  function renderMap() {
    const total = Save.totalStars();
    el.mapStars.innerHTML = `${STAR} ${total} / ${Levels.count * 3}`;
    const cur = currentLevel();
    el.worlds.innerHTML = '';
    for (const w of Levels.worlds) {
      const sec = document.createElement('section');
      sec.className = 'world';
      if (w.soon) {
        sec.classList.add('soon');
        sec.innerHTML = `<div class="world-head"><h2><small>Dünya ${w.id}</small>${w.name}</h2><span class="tag">Yakında</span></div>`;
        el.worlds.appendChild(sec);
        continue;
      }
      const locked = worldLocked(w);
      const have = Save.starsIn(w.from, w.to), max = (w.to - w.from + 1) * 3;
      let note = '';
      if (locked) {
        note = Save.data.unlocked < w.from
          ? `<p class="lock-note">${LOCK} Açmak için ${w.from - 1}. seviyeyi geç</p>`
          : `<p class="lock-note">${LOCK} Açmak için ${w.stars} yıldız gerekli, sende ${total} var</p>`;
      }
      sec.innerHTML = `<div class="world-head"><h2><small>Dünya ${w.id}</small>${w.name}</h2>`
        + `<span class="tag">${STAR} ${have}/${max}</span></div>${note}`;
      if (locked) sec.classList.add('locked');

      const count = w.to - w.from + 1, height = count * STEP + 24;
      const path = document.createElement('div');
      path.className = 'path';
      path.style.height = height + 'px';
      const pts = [];
      for (let i = 0; i < count; i++) pts.push([50 + 30 * Math.sin(i * 1.05), 44 + i * STEP]);
      let d = `M ${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const my = (pts[i - 1][1] + pts[i][1]) / 2;
        d += ` C ${pts[i - 1][0]} ${my} ${pts[i][0]} ${my} ${pts[i][0]} ${pts[i][1]}`;
      }
      path.innerHTML = `<svg class="trail" viewBox="0 0 100 ${height}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>`;
      pts.forEach(([x, y], i) => {
        const n = w.from + i, stars = Save.starsFor(n), ok = UI.canPlay(n);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'node' + (!ok ? ' locked' : n === cur ? ' current' : stars ? ' done' : '') + (Levels.get(n).boss ? ' boss' : '');
        btn.style.left = x + '%';
        btn.style.top = y + 'px';
        btn.disabled = !ok;
        btn.setAttribute('aria-label', `Seviye ${n}` + (ok ? `, ${stars} yıldız` : ', kilitli'));
        btn.innerHTML = (ok ? `<span class="num">${n}</span>` : LOCK)
          + (ok ? `<span class="nstars">${[0, 1, 2].map(k => STAR.replace('<svg', `<svg class="${k < stars ? 'on' : ''}"`)).join('')}</span>` : '');
        btn.addEventListener('click', () => { KS.Sfx.tap(); UI.play(n); });
        path.appendChild(btn);
      });
      sec.appendChild(path);
      el.worlds.appendChild(sec);
    }
  }

  // ---------- Kartlar ----------
  const HELP = `
    <ul class="steps">
      <li><b>1</b><span>Mavi kulenden bir kuleye <strong>sürükle</strong>. Bıraktığında askerler yola çıkar.</span></li>
      <li><b>2</b><span>Sürüklerken diğer mavi kulelerinin <strong>üstünden geç</strong>: hepsi birden saldırır.</span></li>
      <li><b>3</b><span>Bir kulenin askerleri 0'a inince kule <strong>senin</strong> olur. 20 ve 40 askerde kule büyür, daha çok yol açar.</span></li>
      <li><b>4</b><span>Bir yolu kesmek için boş alandan çizginin üstünden <strong>kaydır</strong>.</span></li>
      <li><b>5</b><span>60 askerin üstünde kule yavaş üretir. 3 dakikadan sonra <strong>Son Hücum</strong> başlar, herkes hızlanır.</span></li>
    </ul>`;

  UI.showHelp = first => {
    show({
      title: first ? 'Kule Savaşı' : 'Nasıl oynanır?',
      body: HELP,
      art: { team: PLAYER, mood: 'happy' },
      buttons: [first ? { label: 'Oyna', onClick: () => UI.play(1) } : { label: 'Tamam', onClick: hide }],
    });
  };

  function showIntro(n, key) {
    const it = Levels.intros[key];
    show({
      title: it.title,
      eyebrow: 'Yeni!',
      body: `<p class="intro">${it.text}</p>`,
      art: { team: PLAYER, mood: 'happy' },
      buttons: [
        { label: 'Anladım, başla', onClick: () => { Save.markSeen(key); UI.start(n); } },
        { label: 'Harita', ghost: true, onClick: UI.showMap },
      ],
    });
  }

  function showWin(r) {
    const record = Save.recordWin(r.level, r.stars);
    const next = r.level + 1;
    const stars = [0, 1, 2].map(i =>
      STAR.replace('<svg', `<svg class="${i < r.stars ? 'on' : ''}" style="animation-delay:${.15 + i * .18}s"`)).join('');
    let note = '';
    const buttons = [];
    if (UI.canPlay(next)) {
      buttons.push({ label: 'Sonraki Seviye', onClick: () => Monet.afterWin(r.level).then(() => UI.play(next)) });
    } else {
      const w = Levels.worldOf(next);
      if (!w) note = '<p>Yeni dünyalar çok yakında!</p>';
      else if (Save.totalStars() < w.stars) note = `<p>${w.name} için ${w.stars} yıldız gerekli, sende ${Save.totalStars()} var. Eski seviyelerde yıldız topla!</p>`;
      buttons.push({ label: 'Haritaya dön', onClick: () => Monet.afterWin(r.level).then(UI.showMap) });
    }
    buttons.push({ label: 'Tekrar Oyna', ghost: true, onClick: () => UI.start(r.level) });
    if (buttons[0].label !== 'Haritaya dön') buttons.push({ label: 'Harita', ghost: true, onClick: UI.showMap });
    show({
      title: 'Level Clear!',
      body: `
        <div class="stars" role="img" aria-label="${r.stars} yıldız">${stars}</div>
        ${record && Save.data.stats.wins > 1 ? '<div class="badge">Yeni rekor!</div>' : ''}
        <ul class="goals">
          <li class="ok">Kazan</li>
          <li class="${r.noLoss ? 'ok' : ''}">Hiç kule kaybetme</li>
          <li class="${r.fast ? 'ok' : ''}">${KS.fmtTime(r.par)} altında bitir&nbsp;<small>(${KS.fmtTime(r.time)})</small></li>
        </ul>${note}`,
      art: { team: PLAYER, mood: 'happy' },
      buttons,
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
    buttons.push({ label: 'Harita', ghost: true, onClick: UI.showMap });
    show({
      title: 'Defeat!',
      body: '<p>Bütün kulelerin düştü. Önce zayıf gri kuleleri toplayıp güçlenmeyi dene.</p>',
      art: { team: foe ? foe.team : RED, mood: 'sad' },
      buttons,
    });
  }

  // ---------- Kart altyapısı ----------
  function show(o) {
    el.title.innerHTML = (o.eyebrow ? `<span class="eyebrow">${o.eyebrow}</span>` : '') + o.title;
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
      addToggle(el.toggles, 'sound', 'Ses');
      if (navigator.vibrate) addToggle(el.toggles, 'haptics', 'Titreşim');
    }
    el.artSpec = o.art;
    KS.Render.drawArt(el.art, o.art.team, o.art.mood);
    el.overlay.hidden = false;
  }

  function addToggle(parent, key, label) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'toggle';
    b.dataset.key = key;
    const sync = () => {
      const on = Save.data.settings[key];
      b.setAttribute('aria-pressed', String(on));
      b.textContent = `${label}: ${on ? 'Açık' : 'Kapalı'}`;
    };
    b.addEventListener('click', () => {
      Save.setSetting(key, !Save.data.settings[key]);
      document.querySelectorAll(`.toggle[data-key="${key}"]`).forEach(t => t.dispatchEvent(new Event('sync')));
      KS.Sfx.tap();
    });
    b.addEventListener('sync', sync);
    sync();
    parent.appendChild(b);
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
