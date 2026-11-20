"use strict";
/* =========================================================
   ALMACÉN DE ARCHIVOS (IndexedDB): audios grabados y pictogramas
   ========================================================= */
const IDB = (() => {
  let dbp = null;
  function open() {
    if (!dbp) dbp = new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error("Sin IndexedDB"));
      const r = indexedDB.open("lectoescritura", 1);
      r.onupgradeneeded = () => { const d = r.result; d.createObjectStore("audios"); d.createObjectStore("pictos"); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  const tx = (store, mode, fn) => open().then(d => new Promise((res, rej) => {
    const t = d.transaction(store, mode), st = t.objectStore(store); const r = fn(st);
    t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error);
  }));
  return {
    get: (s, k) => tx(s, "readonly", st => st.get(k)),
    put: (s, k, v) => tx(s, "readwrite", st => st.put(v, k)),
    del: (s, k) => tx(s, "readwrite", st => st.delete(k)),
    keys: s => tx(s, "readonly", st => st.getAllKeys()),
    all: async s => { const ks = await IDB.keys(s); const out = {}; for (const k of ks) out[k] = await IDB.get(s, k); return out; },
  };
})();

/* =========================================================
   AUDIOS GRABADOS POR EL DOCENTE
   Claves: letra:m · silaba:ma · palabra:mano · frase:El pato nada. · animo:1..3 · aviso:otra
   ========================================================= */
const AUDIO = {
  keys: new Set(), urls: {},
  async init() {
    try { const ks = await IDB.keys("audios"); ks.forEach(k => this.keys.add(k)); } catch (e) { }
  },
  has(k) { return !!k && this.keys.has(k); },
  async url(k) {
    if (this.urls[k]) return this.urls[k];
    const b = await IDB.get("audios", k); if (!b) return null;
    return this.urls[k] = URL.createObjectURL(b);
  },
  current: null,
  async play(k) {
    const u = await this.url(k); if (!u) return false;
    try { if (this.current) this.current.pause(); this.current = new Audio(u); await this.current.play(); return true; } catch (e) { return false; }
  },
  // Reproduce y espera a que termine (para encadenar trozos de un enunciado)
  async playWait(k) {
    const u = await this.url(k); if (!u) return false;
    try { if (this.current) this.current.pause(); const a = this.current = new Audio(u);
      await new Promise(res => { a.onended = res; a.onerror = res; a.onpause = res; a.play().catch(res); setTimeout(res, 8000); }); return true; } catch (e) { return false; }
  },
  async save(k, blob) { await IDB.put("audios", k, blob); this.keys.add(k); if (this.urls[k]) { URL.revokeObjectURL(this.urls[k]); delete this.urls[k]; } },
  async remove(k) { await IDB.del("audios", k); this.keys.delete(k); if (this.urls[k]) { URL.revokeObjectURL(this.urls[k]); delete this.urls[k]; } },
  // Grabación (máx. 6 s)
  rec: null,
  async start(onStop) {
    if (!navigator.mediaDevices || !window.MediaRecorder) throw new Error("Este navegador no permite grabar audio");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream); const chunks = [];
    mr.ondataavailable = e => e.data.size && chunks.push(e.data);
    mr.onstop = () => { stream.getTracks().forEach(t => t.stop()); clearTimeout(this._t); this.rec = null; onStop(new Blob(chunks, { type: mr.mimeType || "audio/webm" })); };
    mr.start(); this.rec = mr; this._t = setTimeout(() => this.stop(), 6000);
  },
  stop() { if (this.rec && this.rec.state !== "inactive") this.rec.stop(); },
};

/* =========================================================
   PICTOGRAMAS (ARASAAC o imágenes propias)
   Se descargan una vez con conexión y quedan guardados en el equipo.
   Pictogramas: Sergio Palao. Origen: ARASAAC (https://arasaac.org).
   Licencia: CC BY-NC-SA. Propiedad: Gobierno de Aragón (España).
   ========================================================= */
const PICTO = {
  urls: {},
  async init() {
    try { const all = await IDB.all("pictos"); for (const k in all) this.urls[k] = URL.createObjectURL(all[k]); } catch (e) { }
  },
  has(w) { return !!this.urls[w]; },
  count() { return Object.keys(this.urls).length; },
  async set(w, blob) { await IDB.put("pictos", w, blob); if (this.urls[w]) URL.revokeObjectURL(this.urls[w]); this.urls[w] = URL.createObjectURL(blob); },
  async remove(w) { await IDB.del("pictos", w); if (this.urls[w]) URL.revokeObjectURL(this.urls[w]); delete this.urls[w]; },
  // Busca en ARASAAC (español)
  async searchArasaac(q) {
    const r = await fetch(`https://api.arasaac.org/v1/pictograms/es/search/${encodeURIComponent(q)}`);
    if (r.status === 404) return [];
    if (!r.ok) throw new Error("sin conexión");
    return await r.json();
  },
  thumb(id) { return `https://static.arasaac.org/pictograms/${id}/${id}_300.png`; },
  async saveId(word, id) {
    let img = await fetch(`https://api.arasaac.org/v1/pictograms/${id}?resolution=300&download=false`).catch(() => null);
    if (!img || !img.ok) img = await fetch(this.thumb(id));
    if (!img.ok) throw new Error("sin imagen");
    await this.set(word, await img.blob());
  },
  // Elige el pictograma cuya palabra clave coincide exactamente (no el primero que salga)
  async fetchArasaac(word) {
    const norm = t => (t || "").toLowerCase().trim();
    let list = [];
    try { list = await this.searchArasaac(word); } catch (e) { throw e; }
    const exact = list.filter(p => (p.keywords || []).some(k => norm(k.keyword) === norm(word)));
    const pref = exact.filter(p => !p.schematic && !p.violence && !p.sex);
    let best = (pref[0] || exact[0]);
    if (!best) {
      const r = await fetch(`https://api.arasaac.org/v1/pictograms/es/bestsearch/${encodeURIComponent(word)}`);
      if (r.ok) { const l = await r.json(); best = l[0]; }
    }
    if (!best) throw new Error("no encontrado");
    await this.saveId(word, best._id);
    return best._id;
  },
};

/* =========================================================
   PUENTE CON LA VERSIÓN DE ESCRITORIO (Electron)
   ========================================================= */
const DESKTOP = window.desktop || null;

/* =========================================================
   ICONOS (trazo simple, heredan el color del texto)
   ========================================================= */
const ICON = (() => {
  const p = d => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  return {
    back: p('<path d="M15 18l-6-6 6-6"/>'),
    speaker: p('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>'),
    gear: p('<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    eraser: p('<path d="M20 20H9l-5-5a2 2 0 0 1 0-2.8l8.6-8.6a2 2 0 0 1 2.8 0l4.6 4.6a2 2 0 0 1 0 2.8L12 19"/><path d="M7 11l6 6"/>'),
    check: p('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    play: p('<path d="M7 5l12 7-12 7V5z"/>'),
    eye: p('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    book: p('<path d="M2 5.5C4 4.5 7.5 4 12 6c4.5-2 8-1.5 10-.5V19c-2-1-5.5-1.5-10 .5-4.5-2-8-1.5-10-.5V5.5z"/><path d="M12 6v13.5"/>'),
    pencil: p('<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z"/>'),
    mic: p('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>'),
    stop: p('<rect x="6" y="6" width="12" height="12" rx="2"/>'),
    trash: p('<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>'),
    print: p('<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>'),
    lock: p('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    next: p('<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>'),
    again: p('<path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v4h4"/>'),
    home: p('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),
    star: '<svg class="ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/></svg>',
    expand: p('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    shrink: p('<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>'),
    chevron: p('<path d="M6 9l6 6 6-6"/>'),
    ear: p('<path d="M7 9a5 5 0 0 1 10 0c0 3-2.5 4-3.5 5.5S12.5 19 10 19a3 3 0 0 1-3-3"/><path d="M10 9.5a2 2 0 0 1 4 0c0 1.2-1 1.6-1.5 2.3"/>'),
    clap: '<svg class="ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.5 21.5c-2.6-1.2-4.4-4.3-3.8-7.6l1-5.2a1.3 1.3 0 0 1 2.6.5L6.9 12l5.3-6.6a1.3 1.3 0 0 1 2 1.6l-3 3.8 4-5a1.3 1.3 0 0 1 2 1.6l-4 5 3-3.7a1.3 1.3 0 0 1 2 1.6l-3 3.7 1.9-2.3a1.3 1.3 0 0 1 2 1.6l-4 5c-2.1 2.6-5.3 3.9-7.6 2.7z"/><path d="M15 2.5l.6 1.8M18.5 3.5l-1 1.6M20.5 6.5l-1.8.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" fill="none"/></svg>',
    heart: '<svg class="ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20.5s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.9c0 5.6-7.5 10-7.5 10z"/></svg>',
    dot: '<svg class="ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="6"/></svg>',
    hand: p('<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 10.5V4a1.5 1.5 0 0 1 3 0v6.5"/><path d="M14 10.5V5.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5a6.5 6.5 0 0 1-5-2.4L3 16.5a1.5 1.5 0 0 1 2.3-2L8 17"/>'),
  };
})();

/* Logotipo y escena de la portada (dibujos propios) */
const LOGO_SVG = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="var(--primary)"/>
<rect x="11" y="15" width="42" height="34" rx="6" fill="#fff"/><path d="M18 40 L25 22 L32 40 M21 34 H29" stroke="var(--primary)" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M37 28c5-4 10 1 5 6-4 4-1 8 5 4" stroke="#3E9E68" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M15 44 H49" stroke="#6AA2E8" stroke-width="1.6" stroke-linecap="round"/></svg>`;
const SCENE_SVG = `<svg viewBox="0 0 1200 260" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE6FF"/><stop offset="1" stop-color="#FFF3DF"/></linearGradient></defs>
<rect width="1200" height="260" fill="url(#sky)"/>
<g fill="#FFD66B"><circle cx="1060" cy="70" r="38"/></g>
<g stroke="#FFD66B" stroke-width="6" stroke-linecap="round">${Array.from({length:10},(_,i)=>{const a=i*Math.PI/5;return `<line x1="${1060+Math.cos(a)*52}" y1="${70+Math.sin(a)*52}" x2="${1060+Math.cos(a)*66}" y2="${70+Math.sin(a)*66}"/>`}).join("")}</g>
<g fill="#fff" opacity=".95"><ellipse cx="220" cy="62" rx="58" ry="20"/><ellipse cx="258" cy="50" rx="36" ry="22"/><ellipse cx="640" cy="44" rx="48" ry="16"/><ellipse cx="672" cy="36" rx="28" ry="17"/></g>
<path d="M0 200 Q200 140 420 190 T840 180 T1200 170 V260 H0z" fill="#BFE3B4"/>
<path d="M0 230 Q260 180 540 222 T1200 210 V260 H0z" fill="#9ED193"/>
<g><rect x="940" y="150" width="10" height="40" rx="3" fill="#A97C50"/><circle cx="945" cy="140" r="26" fill="#7CC36E"/><circle cx="1110" cy="168" r="18" fill="#86CB78"/><rect x="1106" y="176" width="8" height="26" rx="3" fill="#A97C50"/></g>
<g font-family="Andika, sans-serif" font-weight="700" font-size="64">
<text x="470" y="150" fill="#8C78D6" transform="rotate(-10 490 130)">a</text>
<text x="590" y="112" fill="#F08AA8" transform="rotate(8 610 95)">B</text>
<text x="700" y="172" fill="#5CB6D9" transform="rotate(-6 720 150)">c</text>
<text x="800" y="118" fill="#F2B43E" transform="rotate(10 820 100)">M</text>
<text x="870" y="200" fill="#3E9E68" transform="rotate(-8 890 180)">o</text></g>
<g fill="#F08AA8"><circle cx="420" cy="80" r="5"/><circle cx="560" cy="96" r="4"/><circle cx="880" cy="60" r="5"/></g>
</svg>`;
