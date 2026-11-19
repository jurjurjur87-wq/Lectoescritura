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
  async fetchArasaac(word) {
    const r = await fetch(`https://api.arasaac.org/v1/pictograms/es/bestsearch/${encodeURIComponent(word)}`);
    if (!r.ok) throw new Error("no encontrado");
    const list = await r.json(); if (!list.length) throw new Error("no encontrado");
    const id = list[0]._id;
    let img = await fetch(`https://api.arasaac.org/v1/pictograms/${id}?resolution=300&download=false`).catch(() => null);
    if (!img || !img.ok) img = await fetch(`https://static.arasaac.org/pictograms/${id}/${id}_300.png`);
    if (!img.ok) throw new Error("sin imagen");
    await this.set(word, await img.blob());
    return id;
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
    hand: p('<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M11 10.5V4a1.5 1.5 0 0 1 3 0v6.5"/><path d="M14 10.5V5.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5a6.5 6.5 0 0 1-5-2.4L3 16.5a1.5 1.5 0 0 1 2.3-2L8 17"/>'),
  };
})();
