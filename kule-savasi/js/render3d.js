// Three.js sahnesi: Blender'da üretilen modellerle (js/models.js) 3B kaleler, askerler ve arazi.
//
// Oyun mantığı değişmez: 3B modda "mantıksal" koordinatlar doğrudan dünya birimleridir
// (t.x = dünya x, t.y = dünya z; alan 6.2 × 10 birim, kule yarıçapı 0.5). Girdi, parmağın
// zemine düştüğü noktayı (V.toLogical) oyuna verir; oyun 2B'de olduğu gibi çalışır.
// Sayılar, etiketler ve duyurular WebGL kanvasının üstündeki saydam 2B kanvasa çizilir.
(function (KS) {
  'use strict';
  const { NEUTRAL, PLAYER, TEAMS, INK, FONT } = KS;
  const G = KS.G, V = KS.V;
  const T = window.THREE;

  const BOARD = { w: 6.2, h: 10 };          // dünya birimi; oran KS.ASPECT ile aynı (menzil daireleri daire kalır)
  const PITCH = 60 * Math.PI / 180;         // kameranın eğimi (dik = tepeden)
  const MAX_SOLDIERS = 700, MAX_DOTS = 500;
  const THEMES = {
    meadow: { sky: '#cdefb5', ground: '#b9e39f', board: '#c9ecb0', petals: ['#ffffff', '#ffd3df', '#fff1a8', '#e3d7ff'] },
    lake:   { sky: '#c9eec2', ground: '#abdfb0', board: '#c3eac6', petals: ['#ffffff', '#cfe9ff', '#fff1a8', '#d9f0e0'] },
    snow:   { sky: '#e6f2fa', ground: '#d9e7f0', board: '#eef5fa', petals: ['#ffffff', '#dfe9ff', '#fff1a8', '#ffd3df'], grass: '#c4dbe8' },
  };
  const ARCHER_SCALE = [0, .95, 1.07, 1.18];

  let cv, hud, hctx, renderer, scene, camera, sun;
  let zoom = 60, ready = false, models = null, soldierGeo = null;
  const teamMats = {};
  let towerNodes = new Map();                 // tower -> { group, lvl, team }
  let decor = null, terrainGroup = null, lanePool = [], laneTex = null, dotMesh = null, ringPool = [];
  let soldierMeshes = null, selRings = [], rangeDisc = null, blockedSprites = [], hintDisc = null;
  const tmpV = new T.Vector3(), tmpM = new T.Matrix4(), tmpQ = new T.Quaternion(), tmpS = new T.Vector3(), tmpC = new T.Color();
  const ray = new T.Raycaster(), groundPlane = new T.Plane(new T.Vector3(0, 1, 0), 0), ndc = new T.Vector2();

  const R3 = KS.Render3D = {
    supported() {
      if (!T || !KS.MODEL_GLB) return false;
      try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl2') || c.getContext('webgl'));
      } catch (e) { return false; }
    },
  };

  // ---------- Kurulum ----------
  R3.init = (canvas, hudCanvas) => {
    cv = canvas; hud = hudCanvas; hctx = hud.getContext('2d');
    renderer = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFShadowMap;
    scene = new T.Scene();
    camera = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    scene.add(camera);

    scene.add(new T.HemisphereLight('#ffffff', '#8fc474', 1.15));
    sun = new T.DirectionalLight('#fff4dc', 2.0);
    sun.position.set(-4, 10, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.setScalar(window.innerWidth < 700 ? 1024 : 2048);   // telefonda daha hafif
    Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 8, bottom: -8, near: 1, far: 40 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.04;
    scene.add(sun, sun.target);

    // zemin + oyun tahtası
    const ground = new T.Mesh(new T.PlaneGeometry(60, 60), new T.MeshStandardMaterial({ color: '#b9e39f', roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.name = 'ground';
    const board = new T.Mesh(roundedRect(BOARD.w + 1, BOARD.h + 1, .8), new T.MeshStandardMaterial({ color: '#c9ecb0', roughness: 1 }));
    board.rotation.x = -Math.PI / 2; board.position.y = .005; board.receiveShadow = true; board.name = 'board';
    scene.add(ground, board);

    // mantıksal alan = dünya birimleri
    Object.assign(V.area, { x: -BOARD.w / 2, y: -BOARD.h / 2, w: BOARD.w, h: BOARD.h });
    V.baseR = .5;
    V.speed = BOARD.h * .15;
    V.toLogical = toLogical;

    for (let team = 0; team < 4; team++) {
      teamMats[team] = {
        team: new T.MeshStandardMaterial({ color: TEAMS[team].fill, roughness: .75 }),
        team_dark: new T.MeshStandardMaterial({ color: TEAMS[team].dark, roughness: .75 }),
      };
    }
    laneTex = dashTexture();
    dotMesh = new T.InstancedMesh(new T.SphereGeometry(1, 8, 6), new T.MeshStandardMaterial({ roughness: .8 }), MAX_DOTS);
    dotMesh.count = 0; dotMesh.frustumCulled = false; scene.add(dotMesh);
    rangeDisc = new T.Mesh(new T.CircleGeometry(1, 64), new T.MeshBasicMaterial({ color: TEAMS[PLAYER].fill, transparent: true, opacity: .22, depthWrite: false }));
    rangeDisc.rotation.x = -Math.PI / 2; rangeDisc.position.y = .02; rangeDisc.visible = false; rangeDisc.renderOrder = 1;
    const rangeEdge = new T.Mesh(new T.RingGeometry(.985, 1, 96), new T.MeshBasicMaterial({ color: TEAMS[PLAYER].dark, transparent: true, opacity: .8, depthWrite: false }));
    rangeDisc.add(rangeEdge); scene.add(rangeDisc);
    hintDisc = new T.Mesh(new T.CircleGeometry(V.baseR * .4, 24), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false }));
    hintDisc.rotation.x = -Math.PI / 2; hintDisc.position.y = .06; hintDisc.visible = false; hintDisc.renderOrder = 3; scene.add(hintDisc);

    loadModels();
    G.on('loaded', () => { if (ready) rebuildLevel(); });
    G.on('capture', c => retint(c.tower));
    G.on('levelup', t => retint(t));
  };

  function loadModels() {
    const bin = Uint8Array.from(atob(KS.MODEL_GLB), ch => ch.charCodeAt(0)).buffer;
    new T.GLTFLoader().parse(bin, '', gltf => {
      gltf.scene.updateMatrixWorld(true);
      models = {};
      gltf.scene.traverse(o => {
        if (o.name && !/_\d+$/.test(o.name)) models[o.name] = o;
        if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
      });
      // askerler toplu çizilir: üç parçanın geometrisi dünya matrisleriyle sabitlenir
      soldierGeo = {};
      for (const k of ['soldier_body', 'soldier_helmet', 'soldier_eyes']) {
        const m = models[k];
        soldierGeo[k] = m.geometry.clone().applyMatrix4(m.matrixWorld);
      }
      buildSoldiers();
      ready = true;
      rebuildLevel();
    }, err => { console.error('model yüklenemedi', err); });
  }

  function buildSoldiers() {
    soldierMeshes = {};
    const spec = { soldier_body: { mat: 'team' }, soldier_helmet: { mat: 'team_dark' }, soldier_eyes: { mat: 'eye' } };
    for (const k in spec) {
      const mat = new T.MeshStandardMaterial({ color: '#ffffff', roughness: .75 });
      if (spec[k].mat === 'eye') mat.color.set(INK);
      const im = new T.InstancedMesh(soldierGeo[k], mat, MAX_SOLDIERS);
      im.count = 0; im.frustumCulled = false; im.castShadow = k !== 'soldier_eyes';
      im.instanceMatrix.setUsage(T.DynamicDrawUsage);
      scene.add(im);
      soldierMeshes[k] = im;
    }
  }

  // ---------- Yardımcılar ----------
  function roundedRect(w, h, r) {
    const s = new T.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return new T.ShapeGeometry(s, 8);
  }

  function dashTexture() {
    const c = document.createElement('canvas'); c.width = 64; c.height = 32;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff';
    rr(g, 4, 9, 30, 14, 7); g.fill();
    const tex = new T.CanvasTexture(c);
    tex.wrapS = T.RepeatWrapping; tex.wrapT = T.ClampToEdgeWrapping;
    tex.colorSpace = T.SRGBColorSpace;
    return tex;
  }

  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  // modeli klonla; 'team' / 'team_dark' malzemelerini takımın ortak malzemeleriyle değiştir
  function instance(name, team) {
    const o = models[name].clone();
    o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.setScalar(1);
    o.traverse(m => {
      if (!m.isMesh) return;
      m.castShadow = true; m.receiveShadow = true;
      m.material = teamMats[team][m.material.name] || m.material;
    });
    return o;
  }

  function project(x, y, z) {
    tmpV.set(x, y, z).project(camera);
    return { x: (tmpV.x + 1) / 2 * V.W, y: (1 - tmpV.y) / 2 * V.H };
  }

  function toLogical(cx, cy) {
    ndc.set(cx / V.W * 2 - 1, 1 - cy / V.H * 2);
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(groundPlane, tmpV)) return { x: 1e9, y: 1e9 };
    return { x: tmpV.x, y: tmpV.z };
  }

  // ---------- Ekran ----------
  R3.resize = (hudBottom) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    renderer.setPixelRatio(dpr);
    renderer.setSize(V.W, V.H, false);
    hud.width = Math.round(V.W * dpr); hud.height = Math.round(V.H * dpr);
    const top = hudBottom + 8, bottom = V.H - 10;
    const bw = BOARD.w + .5, bh = (BOARD.h + .9) * Math.sin(PITCH) + 1.9 * Math.cos(PITCH);
    zoom = Math.min(V.W / bw, (bottom - top) / bh);
    V.unit = 1 / zoom;
    const halfW = V.W / 2 / zoom;
    // tahta HUD'un hemen altına yaslanır; artan boşluk altta, başparmağın dinlendiği yerde kalır
    const vTop = 1.9 * Math.cos(PITCH) + (BOARD.h / 2 + .45) * Math.sin(PITCH) + .25;
    camera.left = -halfW; camera.right = halfW;
    camera.top = vTop + top / zoom;
    camera.bottom = camera.top - V.H / zoom;
    camera.position.set(0, Math.sin(PITCH) * 30, Math.cos(PITCH) * 30);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  };

  // ---------- Seviye kurulumu ----------
  function rebuildLevel() {
    for (const n of towerNodes.values()) scene.remove(n.group);
    towerNodes = new Map();
    if (terrainGroup) scene.remove(terrainGroup);
    if (decor) scene.remove(decor);
    for (const l of lanePool) l.group.visible = false;
    for (const r of ringPool) r.visible = false;

    const world = KS.Levels.worldOf(G.levelNo);
    const th = THEMES[world && world.theme] || THEMES.meadow;
    scene.background = new T.Color(th.sky);
    scene.getObjectByName('ground').material.color.set(th.ground);
    scene.getObjectByName('board').material.color.set(th.board);

    for (const t of G.towers) {
      const group = new T.Group();
      group.position.set(t.x, 0, t.y);
      scene.add(group);
      towerNodes.set(t, { group, lvl: 0, team: -1 });
      retint(t);
    }
    buildTerrain();
    buildDecor(th);
  }

  function retint(t) {
    const n = towerNodes.get(t);
    if (!n || !ready) return;
    if (n.lvl === t.lvl && n.team === t.team && n.kind === t.kind) return;
    n.group.clear();
    if (t.kind === 'archer') {
      const m = instance('archer', t.team); m.scale.setScalar(ARCHER_SCALE[t.lvl]); n.group.add(m);
      const ring = new T.Mesh(new T.RingGeometry(.97, 1, 64), new T.MeshBasicMaterial({ color: TEAMS[t.team].dark, transparent: true, opacity: .5, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = .03; ring.scale.setScalar(KS.ARCHER.range * V.area.h); ring.renderOrder = 1; ring.visible = t.team !== NEUTRAL;
      const disc = new T.Mesh(new T.CircleGeometry(1, 48), new T.MeshBasicMaterial({ color: TEAMS[t.team].fill, transparent: true, opacity: .12, depthWrite: false }));
      disc.rotation.x = -Math.PI / 2; disc.position.y = .025; disc.scale.setScalar(KS.ARCHER.range * V.area.h); disc.visible = ring.visible;
      n.group.add(ring, disc);
      n.ringed = true;
    } else n.group.add(instance('castle_l' + t.lvl, t.team));
    n.lvl = t.lvl; n.team = t.team; n.kind = t.kind;
  }

  function buildTerrain() {
    terrainGroup = new T.Group();
    scene.add(terrainGroup);
    const obs = G.cfg.obstacles || [];
    const a = V.area, S = a.h;                         // tasarım birimi -> dünya: ×10 (alan oranı ASPECT'e eşit)
    const px = (x, y) => [a.x + x * a.w, a.y + y * a.h];
    const water = new T.MeshStandardMaterial({ color: '#a9def3', roughness: .35, metalness: .05 });
    const edge = new T.MeshStandardMaterial({ color: '#86c9e6', roughness: .6 });
    const shine = new T.MeshBasicMaterial({ color: '#dff4fc', transparent: true, opacity: .55, depthWrite: false });

    for (const o of obs) {
      if (o.type === 'lake') {
        const [x, z] = px(o.x, o.y);
        const rx = o.rx * S, rz = o.ry * S;
        const rim = new T.Mesh(new T.CircleGeometry(1, 48), edge);
        rim.rotation.x = -Math.PI / 2; rim.position.set(x, .012, z); rim.scale.set(rx + .18, rz + .18, 1); rim.receiveShadow = true;
        const body = new T.Mesh(new T.CircleGeometry(1, 48), water);
        body.rotation.x = -Math.PI / 2; body.position.set(x, .02, z); body.scale.set(rx, rz, 1);
        const gl = new T.Mesh(new T.CircleGeometry(1, 24), shine);
        gl.rotation.x = -Math.PI / 2; gl.position.set(x - rx * .25, .03, z - rz * .3); gl.scale.set(rx * .42, rz * .28, 1);
        terrainGroup.add(rim, body, gl);
        const lily = instance('flower', NEUTRAL); lily.scale.setScalar(2.2); lily.position.set(x + rx * .45, .02, z - rz * .2);
        terrainGroup.add(lily);
      } else if (o.type === 'river') {
        const pts = o.pts.map(p => { const [x, z] = px(p[0], p[1]); return new T.Vector2(x, z); });
        const w = o.w * S;
        terrainGroup.add(ribbon(pts, w + .36, edge, .012), ribbon(pts, w, water, .02), ribbon(pts, w * .28, shine, .03));
        for (const b of o.bridges || []) {
          const [x, z] = px(b[0], b[1]);
          // köprü nehrin o noktadaki akışına dik durur
          let best = 1e9, ang = 0;
          for (let i = 1; i < pts.length; i++) {
            const p = pts[i - 1], q = pts[i];
            const d = segDist(x, z, p.x, p.y, q.x, q.y);
            if (d < best) { best = d; ang = Math.atan2(q.y - p.y, q.x - p.x); }
          }
          const br = instance('bridge', NEUTRAL);
          br.scale.set(w * 1.9, 1.1, w * .95 / .5);
          br.rotation.y = -(ang + Math.PI / 2);
          br.position.set(x, .02, z);
          terrainGroup.add(br);
        }
      } else if (o.type === 'rock') {
        const [x, z] = px(o.x, o.y);
        const m = instance('rock', NEUTRAL); m.scale.setScalar(o.r * S / .42); m.rotation.y = x * 3.1; m.position.set(x, 0, z);
        terrainGroup.add(m);
      } else if (o.type === 'tree') {
        const [x, z] = px(o.x, o.y);
        const m = instance('tree', NEUTRAL); m.scale.setScalar(o.r * S / .36); m.rotation.y = z * 2.3; m.position.set(x, 0, z);
        terrainGroup.add(m);
      }
    }
  }

  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const k = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(px - ax - dx * k, py - ay - dy * k);
  }

  // çoklu çizgi boyunca düz şerit (nehir): parça dikdörtgenleri + eklem diskleri
  function ribbon(pts, w, mat, y) {
    const g = new T.Group();
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], q = pts[i];
      const len = p.distanceTo(q), ang = Math.atan2(q.y - p.y, q.x - p.x);
      const m = new T.Mesh(new T.PlaneGeometry(len, w), mat);
      m.rotation.x = -Math.PI / 2; m.rotation.z = -ang;
      m.position.set((p.x + q.x) / 2, y, (p.y + q.y) / 2);
      m.rotation.order = 'YXZ'; m.rotation.set(-Math.PI / 2, -ang, 0);
      g.add(m);
      if (i < pts.length - 1) {
        const d = new T.Mesh(new T.CircleGeometry(w / 2, 20), mat);
        d.rotation.x = -Math.PI / 2; d.position.set(q.x, y, q.y);
        g.add(d);
      }
    }
    g.traverse(m => { if (m.isMesh) m.receiveShadow = true; });
    return g;
  }

  // çimen tutamları ve çiçekler: tohumlu rastgele, kulelere ve engellere uzak
  function buildDecor(th) {
    decor = new T.Group();
    scene.add(decor);
    const rnd = KS.rng(G.levelNo * 31 + 7);
    const a = V.area, obs = G.cfg.obstacles || [];
    const spots = [];
    for (let tries = 0; spots.length < 120 && tries < 3000; tries++) {
      const x = a.x - .3 + rnd() * (a.w + .6), z = a.y - .3 + rnd() * (a.h + .6);
      if (G.towers.some(t => Math.hypot(t.x - x, t.y - z) < 1.1)) continue;
      const nx = (x - a.x) / a.w, ny = (z - a.y) / a.h;
      if (KS.Terrain.pointBlocked(obs, nx * KS.ASPECT, ny, .04)) continue;
      spots.push([x, z, rnd()]);
    }
    const grassGeo = models.grass.geometry.clone().applyMatrix4(models.grass.matrixWorld);
    const grass = new T.InstancedMesh(grassGeo, new T.MeshStandardMaterial({ color: th.grass || '#79c25e', roughness: 1 }), spots.length);
    let gi = 0;
    const flowers = [];
    for (const [x, z, k] of spots) {
      if (k < .18) { flowers.push([x, z, k]); continue; }
      tmpM.compose(tmpV.set(x, 0, z), tmpQ.setFromAxisAngle(new T.Vector3(0, 1, 0), k * 6.28), tmpS.setScalar(1.2 + k * .9));
      grass.setMatrixAt(gi++, tmpM);
    }
    grass.count = gi; grass.castShadow = false;
    decor.add(grass);
    for (const [x, z, k] of flowers) {
      const f = instance('flower', NEUTRAL);
      f.scale.setScalar(2 + k * 2.2);
      f.position.set(x, 0, z);
      f.traverse(m => { if (m.isMesh && m.material.name === 'petal') m.material = new T.MeshStandardMaterial({ color: th.petals[Math.floor(k * 40) % th.petals.length], roughness: .9 }); });
      decor.add(f);
    }
  }

  // ---------- Yollar ----------
  function getLane(i) {
    if (lanePool[i]) return lanePool[i];
    const group = new T.Group();
    const base = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ transparent: true, opacity: .75, depthWrite: false }));
    base.rotation.x = -Math.PI / 2; base.position.y = .035; base.renderOrder = 2;
    const tex = laneTex.clone(); tex.needsUpdate = true;
    const dash = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    dash.rotation.x = -Math.PI / 2; dash.position.y = .045; dash.renderOrder = 3;
    const s = V.baseR * .5;
    const tri = new T.Shape(); tri.moveTo(s * .5, 0); tri.lineTo(-s * .7, s * .65); tri.lineTo(-s * .7, -s * .65); tri.closePath();
    const arrow = new T.Mesh(new T.ShapeGeometry(tri), new T.MeshBasicMaterial({ transparent: true, depthWrite: false }));
    arrow.rotation.x = -Math.PI / 2; arrow.position.y = .05; arrow.renderOrder = 4;
    const arrowMid = arrow.clone(); arrowMid.material = arrow.material; arrowMid.scale.setScalar(.8);
    const xm = new T.Sprite(new T.SpriteMaterial({ map: xTexture(), transparent: true, depthTest: false }));
    xm.scale.setScalar(V.baseR * .9); xm.position.y = .3; xm.visible = false; xm.renderOrder = 6;
    group.add(base, dash, arrow, arrowMid, xm);
    scene.add(group);
    const l = { group, base, dash, arrow, arrowMid, xm, tex };
    lanePool[i] = l;
    return l;
  }

  let xTex = null;
  function xTexture() {
    if (xTex) return xTex;
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(32, 32, 28, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#8f96a3'; g.lineWidth = 4; g.stroke();
    g.strokeStyle = '#d9534f'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(20, 20); g.lineTo(44, 44); g.moveTo(44, 20); g.lineTo(20, 44); g.stroke();
    xTex = new T.CanvasTexture(c); xTex.colorSpace = T.SRGBColorSpace;
    return xTex;
  }

  // a -> b (ya da nokta) arası yol; style: { light, dark, alpha, blocked }
  function placeLane(l, a, b, toPoint, style) {
    const dx = b.x - a.x, dz = b.y - a.y, len = Math.hypot(dx, dz);
    const r0 = G.towerR(a) * .95, r1 = toPoint ? 0 : G.towerR(b) * 1.05;
    const seg = len - r0 - r1;
    if (seg < .2) { l.group.visible = false; return; }
    l.group.visible = true;
    const ang = Math.atan2(dz, dx), ux = dx / len, uz = dz / len;
    const x0 = a.x + ux * r0, z0 = a.y + uz * r0;
    l.group.position.set(x0 + ux * seg / 2, 0, z0 + uz * seg / 2);
    l.group.rotation.y = -ang;
    const w = V.baseR * .55;
    l.base.scale.set(seg, w, 1);
    l.base.material.color.set(style.light);
    l.base.material.opacity = (style.alpha || 1) * (style.blocked ? .35 : .75);
    l.dash.scale.set(seg, w * .33, 1);
    l.dash.material.color.set(style.dark);
    l.dash.material.opacity = style.alpha || 1;
    l.tex.repeat.set(seg / (V.baseR * .66), 1);
    l.tex.offset.x = -G.time * 1.6;
    l.arrow.position.x = seg / 2;
    l.arrow.material.color.set(style.dark);
    l.arrow.material.opacity = style.alpha || 1;
    l.arrow.visible = !style.blocked;
    l.arrowMid.visible = !style.blocked && seg > V.baseR * 5;
    l.arrowMid.position.x = 0;
    l.xm.visible = !!style.blocked;
  }

  // ---------- Kare ----------
  R3.draw = () => {
    if (!renderer) return;
    if (ready) {
      updateTowers();
      updateLanes();
      updateSoldiers();
      updateParticles();
      updateDrag();
    }
    renderer.render(scene, camera);
    drawHud();
  };

  function updateTowers() {
    for (const [t, n] of towerNodes) {
      retint(t);
      const g = n.group;
      const pop = 1 + .22 * Math.sin(Math.min(1, t.pop) * Math.PI);
      const sq = t.squish * .08;
      g.position.x = t.x + Math.sin(G.time * 70) * t.shake * .06;
      g.scale.set(pop * (1 + sq), pop * (1 - sq), pop * (1 + sq));
      if (n.ringed) for (let i = 1; i < g.children.length; i++) g.children[i].scale.setScalar(KS.ARCHER.range * V.area.h / (pop * (1 + sq)));
    }
  }

  function updateLanes() {
    let i = 0;
    for (const l of G.lanes) {
      const c = TEAMS[l.team];
      placeLane(getLane(i++), l.from, l.to, false, { light: c.light, dark: c.dark });
    }
    const d = G.drag;
    if (d && d.type === 'link') {
      const target = dragTarget(d);
      for (const s of d.sources) {
        if (s === target) continue;
        const c = TEAMS[PLAYER];
        if (!target) placeLane(getLane(i++), s, { x: d.x, y: d.y }, true, { light: c.light, dark: c.dark, alpha: .6 });
        else if (G.canLink(s, target)) placeLane(getLane(i++), s, target, false, { light: c.light, dark: c.dark, alpha: .8 });
        else placeLane(getLane(i++), s, target, false, { light: '#e4e6ea', dark: '#8f96a3', alpha: .9, blocked: true });
      }
    }
    for (; i < lanePool.length; i++) lanePool[i].group.visible = false;
  }

  function updateSoldiers() {
    const n = Math.min(MAX_SOLDIERS, G.soldiers.length);
    const sp = V.speed * G.tempo.speed;
    void sp;
    for (let i = 0; i < n; i++) {
      const s = G.soldiers[i];
      const pos = G.soldierPos(s);
      const hop = Math.abs(Math.sin(s.age * 12)) * .07;
      tmpM.compose(tmpV.set(pos.x, hop, pos.y), tmpQ.identity(), tmpS.setScalar(.95));
      for (const k in soldierMeshes) soldierMeshes[k].setMatrixAt(i, tmpM);
      soldierMeshes.soldier_body.setColorAt(i, tmpC.set(TEAMS[s.team].fill));
      soldierMeshes.soldier_helmet.setColorAt(i, tmpC.set(TEAMS[s.team].dark));
    }
    for (const k in soldierMeshes) {
      const im = soldierMeshes[k];
      im.count = n;
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
  }

  function getRing(i) {
    if (ringPool[i]) return ringPool[i];
    const m = new T.Mesh(new T.RingGeometry(.9, 1, 64), new T.MeshBasicMaterial({ transparent: true, depthWrite: false, side: T.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.y = .06; m.renderOrder = 5;
    scene.add(m);
    ringPool[i] = m;
    return m;
  }

  function updateParticles() {
    let di = 0, ri = 0;
    for (const p of G.particles) {
      const k = p.life / p.max;
      if (p.type === 'dot' || p.type === 'star') {
        if (di >= MAX_DOTS) continue;
        const size = p.size * (.5 + k * .5) * (p.type === 'star' ? .7 : 1);
        tmpM.compose(tmpV.set(p.x, .25 + (1 - k) * .4, p.y), tmpQ.identity(), tmpS.setScalar(size));
        dotMesh.setMatrixAt(di, tmpM);
        dotMesh.setColorAt(di, tmpC.set(p.color));
        di++;
      } else if (p.type === 'ring') {
        const m = getRing(ri++);
        m.visible = true;
        m.position.x = p.x; m.position.z = p.y;
        m.scale.setScalar(V.baseR * (1 + (1 - k) * 2));
        m.material.color.set(p.color);
        m.material.opacity = k;
      }
    }
    dotMesh.count = di;
    dotMesh.instanceMatrix.needsUpdate = true;
    if (dotMesh.instanceColor) dotMesh.instanceColor.needsUpdate = true;
    for (; ri < ringPool.length; ri++) ringPool[ri].visible = false;
  }

  function dragTarget(d) {
    return d.over && !(d.sources.length === 1 && d.sources[0] === d.over) ? d.over : null;
  }

  function getSelRing(i) {
    if (selRings[i]) return selRings[i];
    const m = new T.Mesh(new T.RingGeometry(.88, 1, 64), new T.MeshBasicMaterial({ transparent: true, opacity: .9, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = .055; m.renderOrder = 5;
    scene.add(m);
    selRings[i] = m;
    return m;
  }

  function updateDrag() {
    const d = G.drag;
    let i = 0;
    rangeDisc.visible = false;
    hintDisc.visible = false;
    if (d && d.type === 'link') {
      const target = dragTarget(d);
      for (const s of d.sources) {
        if (s === target) continue;
        const m = getSelRing(i++);
        m.visible = true; m.position.x = s.x; m.position.z = s.y;
        m.scale.setScalar(G.towerR(s) * 1.5);
        m.material.color.set(TEAMS[PLAYER].dark); m.material.opacity = .85;
      }
      if (target) {
        const m = getSelRing(i++);
        m.visible = true; m.position.x = target.x; m.position.z = target.y;
        m.scale.setScalar(G.towerR(target) * 1.55);
        const ok = d.sources.some(s => s !== target && G.canLink(s, target));
        m.material.color.set(ok ? '#ffffff' : '#c9ccd3'); m.material.opacity = .7 + .3 * Math.sin(G.time * 10);
      }
      if (G.cfg.range) {
        const s = d.sources[0];
        rangeDisc.visible = true;
        rangeDisc.position.x = s.x; rangeDisc.position.z = s.y;
        rangeDisc.scale.setScalar(G.rangeOf(s) * V.area.h);
      }
    } else if (G.state === 'play' && G.levelNo === 1 && !G.playerLinked) {
      const h = hintPos();
      if (h) { hintDisc.visible = true; hintDisc.position.x = h.x; hintDisc.position.z = h.y; hintDisc.material.opacity = h.alpha; }
    }
    for (; i < selRings.length; i++) selRings[i].visible = false;
  }

  function hintPos() {
    const p = G.towers.find(t => t.team === PLAYER);
    if (!p) return null;
    let best = null, bd = Infinity;
    for (const t of G.towers) if (t.team === NEUTRAL && G.dist(p, t) < bd) { bd = G.dist(p, t); best = t; }
    if (!best) return null;
    const k = (G.time * .6) % 1, e = k < .75 ? k / .75 : 1;
    return { x: p.x + (best.x - p.x) * e, y: p.y + (best.y - p.y) * e, alpha: k < .75 ? .9 : .9 * (1 - (k - .75) / .25), p, best };
  }

  // ---------- 2B üst katman: sayılar, etiketler, duyurular ----------
  function drawHud() {
    const c = hctx, dpr = hud.width / V.W;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, V.W, V.H);
    if (!ready) return;
    const pxR = V.baseR * zoom;
    const sorted = G.towers.slice().sort((a, b) => a.y - b.y);
    for (const t of sorted) drawBadge(c, t, pxR);
    drawTextParticles(c, pxR);
    drawTrail(c);
    const d = G.drag;
    if (d && d.type === 'link') drawFingerLabel(c, d, pxR);
    else if (G.state === 'play' && G.levelNo === 1 && !G.playerLinked) drawHintLabel(c, pxR);
    if (G.surge && G.state === 'play' && !G.banner) drawCountdown(c, pxR);
    drawBanner(c, pxR);
  }

  const TOP_Y = [0, 1.4, 2.6, 3.0];     // rozetin durduğu yükseklik (bayrakların üstünde kalır)
  const TOP_Y_ARCHER = [0, 2.1, 2.3, 2.5];

  function drawBadge(c, t, pxR) {
    const col = TEAMS[t.team];
    const pop = 1 + .22 * Math.sin(Math.min(1, t.pop) * Math.PI);
    const p = project(t.x, (t.kind === 'archer' ? TOP_Y_ARCHER : TOP_Y)[t.lvl] * pop, t.y);
    const n = String(Math.floor(t.count));
    const fs = Math.max(12, Math.round(pxR * .62));
    c.font = `700 ${fs}px ${FONT}`;
    const tw = c.measureText(n).width;
    const bh = fs * 1.5, bw = Math.max(bh * 1.15, tw + fs * .9);
    const x = p.x, by = p.y;
    c.fillStyle = '#ffffff'; c.strokeStyle = col.dark; c.lineWidth = Math.max(2, pxR * .08);
    rr(c, x - bw / 2, by - bh / 2, bw, bh, bh / 2); c.fill(); c.stroke();
    c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(n, x, by - fs * .1);
    if (t.team !== NEUTRAL && t.count < KS.CAP) {
      const frac = t.count - Math.floor(t.count), inset = bh * .42, len = bw - inset * 2;
      c.lineCap = 'round'; c.lineWidth = Math.max(2, bh * .13);
      c.strokeStyle = col.light;
      c.beginPath(); c.moveTo(x - len / 2, by + bh * .3); c.lineTo(x + len / 2, by + bh * .3); c.stroke();
      if (frac > .02) { c.strokeStyle = col.dark; c.beginPath(); c.moveTo(x - len / 2, by + bh * .3); c.lineTo(x - len / 2 + len * frac, by + bh * .3); c.stroke(); }
    }
    if (t.team !== NEUTRAL && G.besieged(t)) {
      const sx = x + bw / 2 + 2, sy = by - bh / 2, sr = Math.max(7, pxR * .27);
      c.fillStyle = '#ffffff'; c.strokeStyle = '#d9534f'; c.lineWidth = 2;
      c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.fill(); c.stroke();
      c.lineCap = 'round'; c.lineWidth = Math.max(1.8, sr * .22);
      c.beginPath(); c.moveTo(sx - sr * .5, sy - sr * .5); c.lineTo(sx + sr * .5, sy + sr * .5);
      c.moveTo(sx + sr * .5, sy - sr * .5); c.lineTo(sx - sr * .5, sy + sr * .5); c.stroke();
    }
    // yol kapasitesi noktaları (kulenin önünde)
    if (t.team !== NEUTRAL) {
      const q = project(t.x, 0, t.y + V.baseR * 1.45);
      const used = G.lanesFrom(t).length, pr = Math.max(2.5, pxR * .1), gap = pr * 3;
      for (let i = 0; i < t.lvl; i++) {
        c.beginPath(); c.arc(q.x + (i - (t.lvl - 1) / 2) * gap, q.y, pr, 0, Math.PI * 2);
        c.fillStyle = i < used ? col.dark : '#ffffff'; c.fill();
        c.lineWidth = 1.5; c.strokeStyle = col.dark; c.stroke();
      }
    }
  }

  function drawTextParticles(c, pxR) {
    for (const p of G.particles) {
      if (p.type === 'arrow') {
        const k = p.life / p.max, u = 1 - k;
        const a = project(p.x, 1.35, p.y), b = project(p.tx, .25, p.ty);
        const hx = a.x + (b.x - a.x) * u, hy = a.y + (b.y - a.y) * u, tx = a.x + (b.x - a.x) * Math.max(0, u - .25), ty = a.y + (b.y - a.y) * Math.max(0, u - .25);
        c.strokeStyle = p.color; c.lineWidth = Math.max(1.5, pxR * .07); c.lineCap = 'round';
        c.beginPath(); c.moveTo(tx, ty); c.lineTo(hx, hy); c.stroke();
        continue;
      }
      if (p.type !== 'text') continue;
      const k = p.life / p.max;
      const s = project(p.x, 1.2 + (1 - k) * 1.2, p.y);
      c.globalAlpha = Math.min(1, k * 1.5);
      c.font = `700 ${Math.round(pxR * .6)}px ${FONT}`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 4; c.strokeStyle = '#ffffff'; c.lineJoin = 'round';
      c.strokeText(p.text, s.x, s.y);
      c.fillStyle = p.color; c.fillText(p.text, s.x, s.y);
    }
    c.globalAlpha = 1;
  }

  function drawTrail(c) {
    const tr = G.trail;
    if (tr.length < 2) return;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#ffffff';
    for (let i = 1; i < tr.length; i++) {
      const a = project(tr[i - 1].x, 0, tr[i - 1].y), b = project(tr[i].x, 0, tr[i].y);
      const k = 1 - (G.time - tr[i].t) / .28;
      c.globalAlpha = Math.max(0, k); c.lineWidth = 2 + 5 * k;
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    }
    c.restore();
  }

  function pill(c, label, x, y, fs, color, border) {
    c.font = `700 ${fs}px ${FONT}`;
    const tw = c.measureText(label).width, w = tw + fs * 1.4, h = fs * 1.9;
    x = Math.min(V.W - w / 2 - 8, Math.max(w / 2 + 8, x));
    c.fillStyle = 'rgba(255,253,247,.96)';
    c.shadowColor = 'rgba(75,69,96,.25)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
    rr(c, x - w / 2, y - h / 2, w, h, h / 2); c.fill();
    c.shadowColor = 'transparent';
    c.strokeStyle = border; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(label, x, y + 1);
  }

  function drawFingerLabel(c, d, pxR) {
    const target = dragTarget(d);
    const srcs = d.sources.filter(s => s !== target);
    let label, color = INK;
    if (target) {
      const able = srcs.filter(s => G.canLink(s, target));
      if (able.length) {
        const verb = target.team === PLAYER ? 'Takviye' : target.team === NEUTRAL ? 'Ele geçir' : 'Saldır';
        label = verb + ' · ' + Math.floor(target.count) + (able.length > 1 ? '  (' + able.length + ' kule)' : '');
        color = TEAMS[target.team === NEUTRAL ? PLAYER : target.team].dark;
      } else {
        const why = srcs.map(s => G.linkProblem(s, target));
        label = why.includes('tower') ? 'Arada kule var' : why.includes('blocked') ? 'Yol kapalı' : 'Menzil dışında';
        color = '#8a8499';
      }
    } else {
      label = srcs.length > 1 ? srcs.length + ' kule seçili' : 'Bir kuleye sürükle';
    }
    const fs = Math.max(14, Math.round(pxR * .6));
    const sp = d.cx !== undefined ? { x: d.cx, y: d.cy } : project(d.x, 0, d.y);
    let ly = sp.y - 78;
    if (ly - fs < 8) ly = sp.y + 78;
    c.save(); pill(c, label, sp.x, ly, fs, color, color); c.restore();
  }

  function drawHintLabel(c, pxR) {
    const h = hintPos();
    if (!h) return;
    const a = project(h.p.x, 0, h.p.y), b = project(h.best.x, 0, h.best.y);
    const fs = Math.round(pxR * .62);
    c.save(); pill(c, 'Sürükle ve bırak!', (a.x + b.x) / 2, Math.max(a.y, b.y) + pxR * 2.2, fs, INK, 'rgba(255,253,247,.92)'); c.restore();
  }

  function drawCountdown(c, pxR) {
    const left = G.timeLeft(), urgent = left < 10;
    const fs = Math.max(15, Math.round(pxR * .66));
    const label = 'Son Hücum · ' + KS.fmtTime(Math.ceil(left));
    c.save();
    c.font = `700 ${fs}px ${FONT}`;
    const w = c.measureText(label).width + fs * 1.6, h = fs * 1.8;
    const cx = V.W / 2, cy = topY() + h / 2;
    const pulse = urgent ? 1 + .06 * Math.sin(G.time * 12) : 1;
    c.translate(cx, cy); c.scale(pulse, pulse);
    c.fillStyle = urgent ? '#fde2e2' : 'rgba(255,253,247,.95)';
    rr(c, -w / 2, -h / 2, w, h, h / 2); c.fill();
    c.strokeStyle = urgent ? '#d9534f' : '#f6c34a'; c.lineWidth = 3; c.stroke();
    c.fillStyle = urgent ? '#b33a36' : INK; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(label, 0, 1);
    c.restore();
  }

  // duyurular tahtanın üst kenarının hemen altına oturur
  function topY() { return project(0, 0, V.area.y - .2).y; }

  function drawBanner(c, pxR) {
    const b = G.banner;
    if (!b) return;
    const t = G.time - b.t0;
    const k = Math.max(0, Math.min(1, t / .25, (b.dur - t) / .35));
    let fs = Math.max(16, Math.round(pxR * .78)), fs2 = Math.max(12, Math.round(fs * .62));
    c.save();
    c.globalAlpha = k;
    const maxW = V.W - 24 - fs * 1.6;
    c.font = `700 ${fs}px ${FONT}`;
    let w1 = c.measureText(b.text).width;
    if (w1 > maxW) { fs = Math.floor(fs * maxW / w1); c.font = `700 ${fs}px ${FONT}`; w1 = c.measureText(b.text).width; }
    c.font = `600 ${fs2}px ${FONT}`;
    let w2 = b.sub ? c.measureText(b.sub).width : 0;
    if (w2 > maxW) { fs2 = Math.floor(fs2 * maxW / w2); c.font = `600 ${fs2}px ${FONT}`; w2 = c.measureText(b.sub).width; }
    const w = Math.min(V.W - 24, Math.max(w1, w2) + fs * 1.6), h = fs * 1.7 + (b.sub ? fs2 * 1.4 : 0);
    const cx = V.W / 2, cy = topY() + h / 2 - (1 - k) * 18;
    c.fillStyle = 'rgba(255,253,247,.97)';
    c.shadowColor = 'rgba(75,69,96,.25)'; c.shadowBlur = 10; c.shadowOffsetY = 4;
    rr(c, cx - w / 2, cy - h / 2, w, h, Math.min(h / 2, 22)); c.fill();
    c.shadowColor = 'transparent';
    c.strokeStyle = '#f6c34a'; c.lineWidth = 3; c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = INK; c.font = `700 ${fs}px ${FONT}`;
    c.fillText(b.text, cx, cy - (b.sub ? fs2 * .7 : 0));
    if (b.sub) { c.fillStyle = '#7d768e'; c.font = `600 ${fs2}px ${FONT}`; c.fillText(b.sub, cx, cy + fs * .55); }
    c.restore();
  }
})(window.KS);
