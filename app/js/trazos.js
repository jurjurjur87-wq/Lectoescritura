"use strict";
/* =========================================================
   TRAZOS DE LAS LETRAS (imprenta y mayúsculas)
   Cada letra es una lista de trazos en el orden en que se escriben.
   Cada trazo es una lista de puntos en la dirección correcta.
   Unidades: 0 = línea superior, 50 = línea media, 100 = línea base,
   140 = línea inferior (letras con palo hacia abajo).
   ========================================================= */
const TRAZOS = (() => {
  const P = (...pts) => pts;                                     // polilínea
  const arc = (cx, cy, rx, ry, a0, a1) => {                      // ángulos en grados (0 = derecha, 90 = abajo)
    const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 5)), out = [];
    for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
    return out;
  };
  const S = (...parts) => parts.flat();                          // une partes en un trazo
  const dot = (x, y) => [[x, y]];

  const low = {
    a: { w: 50, s: [arc(25, 75, 25, 25, -40, -400), P([50, 50], [50, 100])] },
    b: { w: 50, s: [P([0, 0], [0, 100]), arc(25, 75, 25, 25, 180, 540)] },
    c: { w: 45, s: [arc(25, 75, 25, 25, -45, -315)] },
    d: { w: 50, s: [arc(25, 75, 25, 25, -40, -400), P([50, 0], [50, 100])] },
    e: { w: 50, s: [S(P([2, 75], [50, 75]), arc(25, 75, 25, 25, 0, -315))] },
    f: { w: 44, s: [S(arc(36, 16, 14, 14, -30, -180), P([22, 16], [22, 100])), P([8, 50], [38, 50])] },
    g: { w: 50, s: [arc(25, 75, 25, 25, -40, -400), S(P([50, 50], [50, 118]), arc(29, 118, 21, 21, 0, 165))] },
    h: { w: 44, s: [P([0, 0], [0, 100]), S(arc(22, 72, 22, 22, 180, 360), P([44, 72], [44, 100]))] },
    i: { w: 0, s: [P([0, 50], [0, 100]), dot(0, 28)] },
    j: { w: 36, s: [S(P([36, 50], [36, 120]), arc(18, 120, 18, 18, 0, 170)), dot(36, 28)] },
    k: { w: 42, s: [P([0, 0], [0, 100]), P([40, 50], [2, 78], [42, 100])] },
    l: { w: 0, s: [P([0, 0], [0, 100])] },
    m: { w: 64, s: [P([0, 50], [0, 100]), S(arc(16, 68, 16, 16, 180, 360), P([32, 68], [32, 100])), S(arc(48, 68, 16, 16, 180, 360), P([64, 68], [64, 100]))] },
    n: { w: 44, s: [P([0, 50], [0, 100]), S(arc(22, 70, 22, 22, 180, 360), P([44, 70], [44, 100]))] },
    o: { w: 50, s: [arc(25, 75, 25, 25, -90, -450)] },
    p: { w: 50, s: [P([0, 50], [0, 140]), arc(25, 75, 25, 25, 180, 540)] },
    q: { w: 50, s: [arc(25, 75, 25, 25, -40, -400), P([50, 50], [50, 140])] },
    r: { w: 34, s: [P([0, 50], [0, 100]), arc(20, 72, 20, 20, 180, 305)] },
    s: { w: 38, s: [S(arc(23, 62, 14, 12, -25, -270), arc(23, 87, 15, 13, -90, 155))] },
    t: { w: 32, s: [S(P([15, 18], [15, 88]), arc(27, 88, 12, 12, 180, 90)), P([2, 50], [32, 50])] },
    u: { w: 44, s: [S(P([0, 50], [0, 78]), arc(22, 78, 22, 22, 180, 0), P([44, 78], [44, 50])), P([44, 50], [44, 100])] },
    v: { w: 44, s: [P([0, 50], [22, 100], [44, 50])] },
    w: { w: 60, s: [P([0, 50], [14, 100], [30, 62], [46, 100], [60, 50])] },
    x: { w: 42, s: [P([0, 50], [42, 100]), P([42, 50], [0, 100])] },
    y: { w: 44, s: [P([0, 50], [25, 98]), P([44, 50], [12, 140])] },
    z: { w: 44, s: [P([0, 50], [42, 50], [0, 100], [44, 100])] },
  };
  low["ñ"] = { w: 44, s: [...low.n.s, P([6, 38], [12, 32], [18, 32], [26, 37], [32, 37], [38, 31])] };

  const up = {
    A: { w: 70, s: [P([35, 0], [0, 100]), P([35, 0], [70, 100]), P([13, 64], [57, 64])] },
    B: { w: 54, s: [P([0, 0], [0, 100]), S(P([0, 0], [26, 0]), arc(26, 24, 22, 24, -90, 90), P([26, 48], [0, 48])), S(P([0, 48], [30, 48]), arc(30, 74, 24, 26, -90, 90), P([30, 100], [0, 100]))] },
    C: { w: 86, s: [arc(48, 50, 48, 50, -40, -320)] },
    D: { w: 66, s: [P([0, 0], [0, 100]), S(P([0, 0], [22, 0]), arc(22, 50, 44, 50, -90, 90), P([22, 100], [0, 100]))] },
    E: { w: 54, s: [P([0, 0], [0, 100]), P([0, 0], [54, 0]), P([0, 50], [44, 50]), P([0, 100], [54, 100])] },
    F: { w: 54, s: [P([0, 0], [0, 100]), P([0, 0], [54, 0]), P([0, 50], [44, 50])] },
    G: { w: 96, s: [arc(48, 50, 48, 50, -40, -360), P([58, 50], [96, 50])] },
    H: { w: 64, s: [P([0, 0], [0, 100]), P([64, 0], [64, 100]), P([0, 50], [64, 50])] },
    I: { w: 0, s: [P([0, 0], [0, 100])] },
    J: { w: 44, s: [S(P([44, 0], [44, 74]), arc(22, 74, 22, 26, 0, 180))] },
    K: { w: 58, s: [P([0, 0], [0, 100]), P([56, 0], [2, 56]), P([20, 40], [58, 100])] },
    L: { w: 50, s: [P([0, 0], [0, 100], [50, 100])] },
    M: { w: 80, s: [P([0, 100], [0, 0], [40, 70], [80, 0], [80, 100])] },
    N: { w: 64, s: [P([0, 100], [0, 0], [64, 100], [64, 0])] },
    O: { w: 96, s: [arc(48, 50, 48, 50, -90, -450)] },
    P: { w: 52, s: [P([0, 0], [0, 100]), S(P([0, 0], [28, 0]), arc(28, 26, 24, 26, -90, 90), P([28, 52], [0, 52]))] },
    Q: { w: 96, s: [arc(48, 50, 48, 50, -90, -450), P([56, 72], [92, 104])] },
    R: { w: 58, s: [P([0, 0], [0, 100]), S(P([0, 0], [28, 0]), arc(28, 26, 24, 26, -90, 90), P([28, 52], [0, 52])), P([24, 52], [58, 100])] },
    S: { w: 60, s: [S(arc(30, 25, 26, 25, -25, -270), arc(30, 74, 30, 26, -90, 150))] },
    T: { w: 64, s: [P([0, 0], [64, 0]), P([32, 0], [32, 100])] },
    U: { w: 64, s: [S(P([0, 0], [0, 62]), arc(32, 62, 32, 38, 180, 0), P([64, 62], [64, 0]))] },
    V: { w: 70, s: [P([0, 0], [35, 100], [70, 0])] },
    W: { w: 90, s: [P([0, 0], [22, 100], [45, 30], [68, 100], [90, 0])] },
    X: { w: 62, s: [P([0, 0], [62, 100]), P([62, 0], [0, 100])] },
    Y: { w: 64, s: [P([0, 0], [32, 50]), P([64, 0], [32, 50]), P([32, 50], [32, 100])] },
    Z: { w: 64, s: [P([0, 0], [62, 0], [0, 100], [64, 100])] },
  };
  up["Ñ"] = { w: 64, s: [...up.N.s, P([8, -14], [16, -21], [26, -21], [36, -15], [46, -15], [56, -22])] };

  const ACC = { "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u", "Á": "A", "É": "E", "Í": "I", "Ó": "O", "Ú": "U" };
  function glyph(ch) {
    if (low[ch]) return low[ch];
    if (up[ch]) return up[ch];
    const base = ACC[ch];
    if (!base) return null;
    const g = glyph(base), cx = g.w / 2, isUp = base === base.toUpperCase();
    let s = g.s;
    if (base === "i") s = [s[0]];                                   // la í no lleva punto
    const tilde = isUp ? P([cx + 9, -26], [cx - 4, -8]) : P([cx + 8, 24], [cx - 3, 40]);
    return { w: g.w, s: [...s, tilde] };
  }
  function supports(text) { return [...text].every(c => glyph(c)); }

  // Coloca el texto: devuelve los trazos ya desplazados y la caja que ocupan
  function layout(text, gap = 24) {
    let x = 0; const strokes = []; let minY = 0, maxY = 140, minX = Infinity, maxX = -Infinity;
    [...text].forEach((ch, i) => {
      const g = glyph(ch); if (!g) return;
      g.s.forEach(st => {
        const pts = st.map(([px, py]) => [px + x, py]);
        pts.forEach(([px, py]) => { minY = Math.min(minY, py); maxY = Math.max(maxY, py); minX = Math.min(minX, px); maxX = Math.max(maxX, px); });
        strokes.push({ pts, letter: i });
      });
      x += g.w + gap;
    });
    return { strokes, minX, maxX, minY, maxY };
  }
  return { glyph, supports, layout };
})();

/* =========================================================
   MOTOR DE TRAZADO CON ORDEN Y DIRECCIÓN
   ========================================================= */
function createStrokeEngine(o) {
  // o: {text, guide, ink, demo (canvas), tol:{k}, colors, onProgress(p,msg), onSuccess(acc,errors), say}
  const L = TRAZOS.layout(o.text);
  let W = 0, H = 0, u = 1, ox = 0, oy = 0;
  let strokes = [];          // {pts (px), samples, len}
  let cur = 0, k = 0, ink = [], doneInk = [], ignoring = false, active = null, errors = 0, devSum = 0, devN = 0;
  let finished = false, demoing = false, pulse = 0, raf = 0;
  const C = Object.assign({ ink: "#3C7DD9", done: "#2E9E5B", guide: "#E9E4F3", dots: "#8A819E", start: "#2E9E5B", future: "#CFC8DD", lines: ["#D9D2E6", "#8FB7F0", "#4E8FE8"] }, o.colors || {});
  const tk = (o.tol && o.tol.k) || 1;

  function geometry() {
    const bw = Math.max(1, L.maxX - L.minX), bh = L.maxY - L.minY;
    u = Math.min(H * .84 / bh, W * .86 / bw, H / 120 * 1.15);
    ox = (W - bw * u) / 2 - L.minX * u;
    oy = (H - bh * u) / 2 - L.minY * u;
    strokes = L.strokes.map(s => {
      const pts = s.pts.map(([x, y]) => [ox + x * u, oy + y * u]);
      const samples = resample(pts, 2.5 * u);
      return { pts, samples };
    });
    window.__se = { strokes, get cur() { return cur; } };
  }
  function resample(pts, step) {
    if (pts.length === 1) return [pts[0]];
    const out = [pts[0]]; let carry = 0;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const d = Math.hypot(x1 - x0, y1 - y0);
      let t = step - carry;
      while (t <= d) { out.push([x0 + (x1 - x0) * t / d, y0 + (y1 - y0) * t / d]); t += step; }
      carry = d - (t - step);
    }
    const last = pts[pts.length - 1], lo = out[out.length - 1];
    if (Math.hypot(last[0] - lo[0], last[1] - lo[1]) > step * .3) out.push(last);
    return out;
  }
  const R = () => 11 * u * tk, OFF = () => 20 * u * tk, START = () => 17 * u * tk;
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  function path(ctx, pts) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    if (pts.length === 1) ctx.lineTo(pts[0][0] + .1, pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }
  function drawGuide() {
    const g = o.guide.getContext("2d"); g.clearRect(0, 0, W, H);
    g.lineCap = "round"; g.lineJoin = "round";
    // pauta
    [[0, C.lines[0], [10, 10]], [50, C.lines[1], [14, 10]], [100, C.lines[2], []], [140, C.lines[0], [10, 10]]].forEach(([y, c, d]) => {
      const Y = oy + y * u; g.beginPath(); g.setLineDash(d); g.strokeStyle = c; g.lineWidth = 3; g.moveTo(W * .03, Y); g.lineTo(W * .97, Y); g.stroke();
    });
    g.setLineDash([]);
    // camino de cada trazo
    strokes.forEach((s, i) => {
      g.strokeStyle = C.guide; g.lineWidth = 15 * u; path(g, s.pts);
    });
    strokes.forEach((s, i) => {
      g.setLineDash([.1, Math.max(7, 5 * u)]); g.lineWidth = Math.max(3, 2.6 * u);
      g.strokeStyle = i === cur && !finished ? C.dots : C.future; path(g, s.pts); g.setLineDash([]);
    });
    if (!finished && !demoing && strokes[cur]) drawStart(g, strokes[cur], cur + 1);
  }
  function drawStart(g, s, n) {
    const [x, y] = s.samples[0]; const r = Math.max(10, 7 * u);
    // flecha de dirección
    if (s.samples.length > 3) {
      const j = Math.min(s.samples.length - 1, Math.max(2, Math.round(s.samples.length * .3)));
      const a = s.samples[j], b = s.samples[Math.max(0, j - 2)]; const ang = Math.atan2(a[1] - b[1], a[0] - b[0]);
      const sz = Math.max(9, 6 * u);
      g.save(); g.translate(a[0], a[1]); g.rotate(ang); g.fillStyle = C.start; g.globalAlpha = .85;
      g.beginPath(); g.moveTo(sz, 0); g.lineTo(-sz * .7, -sz * .75); g.lineTo(-sz * .7, sz * .75); g.closePath(); g.fill(); g.restore();
    }
    g.beginPath(); g.fillStyle = C.start; g.arc(x, y, r * (1 + .12 * Math.sin(pulse)), 0, Math.PI * 2); g.fill();
    g.fillStyle = "#fff"; g.font = `700 ${Math.round(r * 1.15)}px system-ui,sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(String(n), x, y + 1);
  }
  function drawInk() {
    const c = o.ink.getContext("2d"); c.clearRect(0, 0, W, H); c.lineCap = "round"; c.lineJoin = "round";
    c.lineWidth = Math.max(8, 7 * u);
    c.strokeStyle = C.done; doneInk.forEach(p => p.length && path(c, p));
    if (ink.length && !ignoring) { c.strokeStyle = C.ink; path(c, ink); }
  }
  function progress(msg) {
    const n = strokes.length || 1; const s = strokes[cur];
    const frac = finished ? 1 : (cur + (s ? Math.min(1, k / s.samples.length) : 0)) / n;
    o.onProgress && o.onProgress(frac, msg);
  }
  function pos(e) { const r = o.ink.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function down(e) {
    if (finished || demoing || active !== null) return;
    active = e.pointerId; try { o.ink.setPointerCapture(e.pointerId); } catch (_) { }
    const p = pos(e), s = strokes[cur];
    if (s.samples.length === 1) {                                     // punto (de la i, de la j)
      if (dist(p, s.samples[0]) < START() * 1.2) { doneInk.push([p]); return strokeDone(); }
      ignoring = true; return progress("Toca el punto verde");
    }
    if (dist(p, s.samples[0]) > START()) {
      ignoring = true; errors++;
      const backwards = dist(p, s.samples[s.samples.length - 1]) < START();
      progress(backwards ? "¡Al revés! Empieza en el punto verde" : "Empieza en el punto verde");
      o.say && o.say(backwards ? "Al revés. Empieza en el punto verde" : "Empieza en el punto verde");
      return;
    }
    ignoring = false; ink = [p]; k = 1; drawInk(); progress("");
  }
  function move(e) {
    if (e.pointerId !== active || ignoring || finished) return;
    const p = pos(e), s = strokes[cur], n = s.samples.length;
    const l = ink[ink.length - 1]; if (dist(p, l) < 2) return;
    ink.push(p);
    for (let j = k; j < Math.min(n, k + 14); j++) if (dist(p, s.samples[j]) < R()) k = j + 1;
    let m = Infinity; for (let j = Math.max(0, k - 8); j < Math.min(n, k + 16); j++) m = Math.min(m, dist(p, s.samples[j]));
    if (m > OFF()) {
      errors++; ignoring = true; ink = []; drawInk();
      progress("Te has salido del camino. Vuelve al punto verde"); o.say && o.say("Te has salido. Vuelve al punto verde");
      return;
    }
    devSum += Math.min(1, m / R()); devN++;
    drawInk(); progress("");
  }
  function up(e) {
    if (e.pointerId !== active) return; active = null;
    if (ignoring) { ignoring = false; drawInk(); return; }
    const s = strokes[cur]; if (!s) return;
    if (k >= s.samples.length * .9) { doneInk.push(ink); ink = []; strokeDone(); }
    else { errors++; ink = []; drawInk(); progress("Sigue la flecha hasta el final"); o.say && o.say("Sigue hasta el final"); }
  }
  function strokeDone() {
    cur++; k = 0;
    if (cur >= strokes.length) {
      finished = true; drawGuide(); drawInk(); progress("");
      const dev = devN ? devSum / devN : 0;
      const acc = Math.max(20, Math.min(100, Math.round(100 - errors * 12 - dev * 30)));
      return o.onSuccess && o.onSuccess(acc, errors);
    }
    drawGuide(); drawInk(); progress("");
  }
  function animateStart() {
    cancelAnimationFrame(raf);
    const tick = () => { pulse += .12; if (!finished && !demoing) drawGuide(); raf = requestAnimationFrame(tick); };
    if (!o.still) raf = requestAnimationFrame(tick);
  }
  // Modelo animado: un lápiz recorre cada trazo en orden
  function demo() {
    if (demoing || !strokes.length) return Promise.resolve();
    demoing = true; drawGuide();
    const d = o.demo.getContext("2d"); const speed = 0.32 * u; // px por ms
    return new Promise(res => {
      let si = 0, t0 = performance.now();
      const lens = strokes.map(s => { let L = 0; for (let i = 1; i < s.pts.length; i++) L += dist(s.pts[i], s.pts[i - 1]); return Math.max(L, 1); });
      const step = now => {
        d.clearRect(0, 0, W, H); d.lineCap = "round"; d.lineJoin = "round";
        for (let i = 0; i < si; i++) { d.strokeStyle = "rgba(108,74,182,.55)"; d.lineWidth = Math.max(8, 7 * u); path(d, strokes[i].pts); }
        if (si >= strokes.length) { demoing = false; setTimeout(() => { d.clearRect(0, 0, W, H); drawGuide(); res(); }, 600); return; }
        const s = strokes[si], len = lens[si]; const dist0 = Math.min(len, (now - t0) * speed);
        // recorte del trazo hasta dist0
        const part = [s.pts[0]]; let acc = 0, px = s.pts[0];
        for (let i = 1; i < s.pts.length; i++) { const dd = dist(s.pts[i], s.pts[i - 1]); if (acc + dd >= dist0) { const f = (dist0 - acc) / dd; px = [s.pts[i - 1][0] + (s.pts[i][0] - s.pts[i - 1][0]) * f, s.pts[i - 1][1] + (s.pts[i][1] - s.pts[i - 1][1]) * f]; part.push(px); break; } acc += dd; part.push(s.pts[i]); px = s.pts[i]; }
        d.strokeStyle = "rgba(108,74,182,.85)"; d.lineWidth = Math.max(8, 7 * u); path(d, part);
        // número del trazo y lápiz
        const r = Math.max(10, 7 * u); const st = s.pts[0];
        d.fillStyle = C.start; d.beginPath(); d.arc(st[0], st[1], r * .8, 0, Math.PI * 2); d.fill();
        d.fillStyle = "#fff"; d.font = `700 ${Math.round(r)}px system-ui,sans-serif`; d.textAlign = "center"; d.textBaseline = "middle"; d.fillText(String(si + 1), st[0], st[1] + 1);
        d.fillStyle = "#2B2340"; d.beginPath(); d.arc(px[0], px[1], Math.max(6, 4.5 * u), 0, Math.PI * 2); d.fill();
        if (dist0 >= len) { si++; t0 = now + 350; }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
  const ev = [["pointerdown", down], ["pointermove", move], ["pointerup", up], ["pointercancel", up]];
  ev.forEach(([n, f]) => o.ink.addEventListener(n, f));
  return {
    resize(w, h) {
      W = w; H = h; const dpr = window.devicePixelRatio || 1;
      [o.guide, o.ink, o.demo].forEach(c => { c.width = W * dpr; c.height = H * dpr; c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0); });
      // reescala la tinta ya hecha
      const old = strokes.length ? { u, ox, oy } : null;
      geometry();
      if (old) { const f = p => [ox + (p[0] - old.ox) / old.u * u, oy + (p[1] - old.oy) / old.u * u]; doneInk = doneInk.map(s => s.map(f)); ink = ink.map(f); }
      drawGuide(); drawInk(); progress("");
      if (!raf) animateStart();
    },
    clear() { if (finished) return; cur = 0; k = 0; ink = []; doneInk = []; ignoring = false; drawGuide(); drawInk(); progress(""); },
    demo, hasDemo: true,
    destroy() { cancelAnimationFrame(raf); ev.forEach(([n, f]) => o.ink.removeEventListener(n, f)); },
    get errors() { return errors; }, get finished() { return finished; }
  };
}

/* =========================================================
   MOTOR DE TRAZADO POR ZONAS (cursiva y cualquier fuente)
   Se comprueba que el dedo recorre toda la letra, zona a zona,
   sin salirse demasiado. No comprueba el orden de los trazos.
   ========================================================= */
function createCoverageEngine(o) {
  // o: {text, fontCss, guide, ink, demo, tol:{cover,cell,out,k}, colors, onProgress, onSuccess}
  const tol = o.tol; const text = o.text;
  const C = Object.assign({ ink: "#3C7DD9", done: "#2E9E5B", guide: "#F1ECFB", fill: "#D8D2E3", dots: "#7D7394", lines: ["#D9D2E6", "#8FB7F0", "#4E8FE8"] }, o.colors || {});
  let W = 0, H = 0, geo = null, strokes = [], cur = null, active = null, finished = false, tries = 0;
  const SC = .25; let glyphMask = null, corridorMask = null, glyphCount = 0;

  function computeGeo(ctx) {
    ctx.font = `100px ${o.fontCss}`;
    const ref = ctx.measureText("lhkbdHÁ"), refD = ctx.measureText("gjpqyñ"), m = ctx.measureText(text);
    const asc = ref.actualBoundingBoxAscent, desc = refD.actualBoundingBoxDescent;
    const width = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const fs = Math.min(H * .80 / ((asc + desc) / 100), W * .84 / (width / 100), H * 1.2);
    const kk = fs / 100;
    const xh = ctx.measureText("x").actualBoundingBoxAscent * kk;
    const base = (H - (asc + desc) * kk) / 2 + asc * kk;
    const x = (W - width * kk) / 2 + m.actualBoundingBoxLeft * kk;
    return { fs, base, x, xh, asc: asc * kk, desc: desc * kk };
  }
  function drawText(ctx, mode) {
    ctx.font = `${geo.fs}px ${o.fontCss}`; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left"; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.fillStyle = "#000"; ctx.strokeStyle = "#000";
    if (mode === "corridor") { ctx.lineWidth = geo.fs * .13 * tol.k; ctx.strokeText(text, geo.x, geo.base); }
    ctx.fillText(text, geo.x, geo.base);
  }
  function drawGuide() {
    const g = o.guide.getContext("2d"); g.clearRect(0, 0, W, H);
    [[geo.base - geo.asc, C.lines[0], [10, 10]], [geo.base - geo.xh, C.lines[1], [14, 10]], [geo.base, C.lines[2], []], [geo.base + geo.desc, C.lines[0], [10, 10]]]
      .forEach(([y, c, d]) => { g.beginPath(); g.setLineDash(d); g.strokeStyle = c; g.lineWidth = 3; g.moveTo(W * .03, y); g.lineTo(W * .97, y); g.stroke(); });
    g.setLineDash([]);
    g.save(); g.fillStyle = C.guide; g.strokeStyle = C.guide; g.font = `${geo.fs}px ${o.fontCss}`; g.lineJoin = "round"; g.lineWidth = geo.fs * .13 * tol.k; g.strokeText(text, geo.x, geo.base); g.restore();
    g.font = `${geo.fs}px ${o.fontCss}`; g.fillStyle = C.fill; g.fillText(text, geo.x, geo.base);
    g.setLineDash([2, Math.max(6, geo.fs * .035)]); g.lineCap = "round"; g.strokeStyle = C.dots; g.lineWidth = Math.max(3, geo.fs * .018); g.strokeText(text, geo.x, geo.base); g.setLineDash([]);
    const sw = Math.max(1, Math.ceil(W * SC)), sh = Math.max(1, Math.ceil(H * SC));
    const mk = mode => { const c = document.createElement("canvas"); c.width = sw; c.height = sh; const x = c.getContext("2d"); x.scale(SC, SC); drawText(x, mode); return x.getImageData(0, 0, sw, sh).data; };
    glyphMask = mk("glyph"); corridorMask = mk("corridor");
    glyphCount = 0; for (let i = 3; i < glyphMask.length; i += 4) if (glyphMask[i] > 100) glyphCount++;
  }
  const brush = () => Math.max(10, geo.fs * .07);
  function strokePath(ctx, s) {
    if (!s.length) return; ctx.beginPath(); ctx.moveTo(s[0][0], s[0][1]);
    if (s.length === 1) ctx.lineTo(s[0][0] + .1, s[0][1]);
    for (let i = 1; i < s.length - 1; i++) { const mx = (s[i][0] + s[i + 1][0]) / 2, my = (s[i][1] + s[i + 1][1]) / 2; ctx.quadraticCurveTo(s[i][0], s[i][1], mx, my); }
    if (s.length > 1) ctx.lineTo(s[s.length - 1][0], s[s.length - 1][1]);
    ctx.stroke();
  }
  function drawInk() {
    const c = o.ink.getContext("2d"); c.clearRect(0, 0, W, H); c.lineCap = "round"; c.lineJoin = "round";
    c.strokeStyle = finished ? C.done : C.ink; c.lineWidth = brush(); strokes.forEach(s => strokePath(c, s));
  }
  function evaluate() {
    const sw = Math.ceil(W * SC), sh = Math.ceil(H * SC);
    const mk = lw => { const c = document.createElement("canvas"); c.width = sw; c.height = sh; const x = c.getContext("2d"); x.scale(SC, SC); x.lineCap = "round"; x.lineJoin = "round"; x.strokeStyle = "#000"; x.lineWidth = lw; strokes.forEach(s => strokePath(x, s)); return x.getImageData(0, 0, sw, sh).data; };
    const wide = mk(geo.fs * .12 * tol.k), inkM = mk(brush());
    const cs = Math.max(2, Math.round(geo.fs * SC * .12)), cw = Math.ceil(sw / cs); const cg = {}, cc = {};
    let cov = 0, inkN = 0, out = 0;
    for (let i = 3; i < wide.length; i += 4) {
      const p = (i - 3) / 4;
      if (glyphMask[i] > 100) { const kk = Math.floor((p % sw) / cs) + cw * Math.floor(Math.floor(p / sw) / cs); cg[kk] = (cg[kk] || 0) + 1; if (wide[i] > 60) { cov++; cc[kk] = (cc[kk] || 0) + 1; } }
      if (inkM[i] > 100) { inkN++; if (corridorMask[i] < 60) out++; }
    }
    let cells = 0, ok = 0; const minPx = cs * cs * .15;
    for (const kk in cg) { if (cg[kk] < minPx) continue; cells++; if ((cc[kk] || 0) / cg[kk] >= .5) ok++; }
    const coverage = glyphCount ? cov / glyphCount : 0, outside = inkN ? out / inkN : 0, zones = cells ? ok / cells : 0;
    window.__last = { coverage, outside, zones };
    return { coverage, outside, zones, acc: Math.max(0, Math.min(100, (coverage + zones) * 50 - outside * 60)) };
  }
  function check(manual) {
    if (finished) return;
    if (!strokes.length) { if (manual) o.onProgress(0, "Primero repasa la letra con el dedo"); return; }
    const r = evaluate();
    const frac = Math.min(1, Math.min(r.coverage / tol.cover, r.zones / tol.cell));
    if (r.coverage >= tol.cover && r.zones >= tol.cell && r.outside <= tol.out) { finished = true; drawInk(); o.onProgress(1, ""); return o.onSuccess(Math.round(r.acc), tries); }
    if (manual) {
      tries++;
      if (r.outside > tol.out) { o.onProgress(frac, "Te has salido un poco. ¡Borra y prueba otra vez!"); o.say && o.say("Te has salido un poco. Prueba otra vez"); }
      else { o.onProgress(frac, "¡Casi! Te falta un trocito."); o.say && o.say("Casi. Te falta un trocito"); }
    } else o.onProgress(frac, "", r.outside > tol.out);
  }
  const pos = e => { const r = o.ink.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function down(e) { if (finished || active !== null) return; active = e.pointerId; try { o.ink.setPointerCapture(e.pointerId); } catch (_) { } cur = [pos(e)]; strokes.push(cur); drawInk(); }
  function move(e) {
    if (e.pointerId !== active || !cur) return; const p = pos(e), l = cur[cur.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) < 2) return; cur.push(p);
    const c = o.ink.getContext("2d"); c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = C.ink; c.lineWidth = brush(); c.beginPath(); c.moveTo(l[0], l[1]); c.lineTo(p[0], p[1]); c.stroke();
  }
  function up(e) { if (e.pointerId !== active) return; active = null; cur = null; drawInk(); check(false); }
  const ev = [["pointerdown", down], ["pointermove", move], ["pointerup", up], ["pointercancel", up]];
  ev.forEach(([n, f]) => o.ink.addEventListener(n, f));
  return {
    resize(w, h) {
      const sx = W ? w / W : 1, sy = H ? h / H : 1; W = w; H = h; const dpr = window.devicePixelRatio || 1;
      [o.guide, o.ink, o.demo].forEach(c => { c.width = W * dpr; c.height = H * dpr; c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0); });
      strokes = strokes.map(s => s.map(([x, y]) => [x * sx, y * sy]));
      geo = computeGeo(o.guide.getContext("2d")); window.__trace = { geo, text, font: o.fontCss, W, H };
      drawGuide(); drawInk();
    },
    clear() { if (finished) return; if (strokes.length) tries++; strokes = []; drawInk(); o.onProgress(0, ""); },
    check, hasDemo: false, demo() { return Promise.resolve(); },
    destroy() { ev.forEach(([n, f]) => o.ink.removeEventListener(n, f)); },
    get errors() { return tries; }, get finished() { return finished; }
  };
}
