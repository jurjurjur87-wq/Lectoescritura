"use strict";
/* =========================================================
   DATOS (se guardan en este equipo)
   ========================================================= */
const LS_KEY = "lectoescritura.v1";
const DEFAULT_SETTINGS = {celebration:"confeti", praise:true, look:"plus", pictos:"auto", ownImages:[], lock:false, fixedGroup:null, lastBackup:null, lastAutoBackup:null};
function blankDB(){ return {version:1,teachers:[],groups:[],students:[],records:[],custom:{words:[],phrases:[]},settings:Object.assign({},DEFAULT_SETTINGS)}; }
function loadDB(){
  try{ const s=localStorage.getItem(LS_KEY); if(s){ const d=JSON.parse(s); const r=Object.assign(blankDB(),d); r.settings=Object.assign({},DEFAULT_SETTINGS,d.settings||{}); if(d.settings&&d.settings.sensible&&!d.settings.look) r.settings.look="sensible"; delete r.settings.sensible;
      if(!r.settings.pv){ r.settings.pictos="auto"; r.settings.pv=2; }   // los pictogramas pasan a usarse solos si están descargados
      return r; } }catch(e){}
  return blankDB();
}
let DB = loadDB();
DB.custom = Object.assign({words:[],phrases:[]}, DB.custom||{});
const lvlOf = (st,area)=> (st.cfg&&st.cfg[area]) || 1;
// Un alumno tiene su clase principal (group) y puede estar también en otras (extra), por ejemplo en PT.
// Es el mismo alumno: comparte niveles, ayudas y progreso en todas sus clases.
const inGroup=(s,gid)=>s.group===gid||(s.extra||[]).includes(gid);
const classesOf=s=>[s.group,...(s.extra||[])].map(id=>byId(DB.groups,id)).filter(Boolean);
/* Palabras y frases propias del docente: se añaden a las listas comunes */
function applyCustom(){
  for(let i=WORDS.length-1;i>=0;i--) if(WORDS[i].c) WORDS.splice(i,1);
  for(let i=PHRASES.length-1;i>=0;i--) if(PHRASES[i].c) PHRASES.splice(i,1);
  DB.custom.words.filter(w=>w.on!==false).forEach(w=>WORDS.push({w:w.w,s:w.s,e:w.e||"🖼️",c:true}));
  DB.custom.phrases.filter(f=>f.on!==false).forEach(f=>PHRASES.push({t:f.t,e:f.e||"🖼️",k:f.k,c:true}));
}
applyCustom();
let storageOK = true;
/* Los registros de progreso van a IndexedDB (sin el límite de ~5 MB de localStorage) y se guardan de uno en uno.
   El resto (docentes, clases, alumnado, ajustes) sigue en localStorage. Si IndexedDB falla, todo sigue en localStorage. */
const REC={ok:false, persisted:new Set()};
async function initRecords(){
  try{
    const rows=await IDB.values("records");
    const fromLS=DB.records||[];
    if(fromLS.length){                                    // paso único: lo que había en localStorage se traslada
      const have=new Set(rows.map(r=>r.id)); const add=fromLS.filter(r=>r&&r.id&&!have.has(r.id));
      if(add.length) await IDB.putMany("records",add.map(r=>[r.id,r]));
      rows.push(...add);
    }
    rows.sort((a,b)=>a.t-b.t);
    const home={}; DB.students.forEach(st=>home[st.id]=st.group); const fix=rows.filter(r=>!r.g&&home[r.st]);
    if(fix.length){ fix.forEach(r=>r.g=home[r.st]); await IDB.putMany("records",fix.map(r=>[r.id,r])); }
    DB.records=rows; REC.persisted=new Set(rows.map(r=>r.id)); REC.ok=true;
    save();                                               // localStorage queda solo con lo ligero
  }catch(e){ REC.ok=false; }
}
function syncRecords(){
  const recs=DB.records; const fresh=[];
  for(let i=recs.length-1;i>=0&&!REC.persisted.has(recs[i].id);i--) fresh.push(recs[i]);
  if(recs.length-fresh.length!==REC.persisted.size){       // se han borrado registros (alumno, clase o todo): se reescribe
    REC.persisted=new Set(recs.map(r=>r.id));
    IDB.replaceAll("records",recs.map(r=>[r.id,r])).catch(()=>toast("No se ha podido guardar el progreso"));
    return;
  }
  if(!fresh.length) return;
  fresh.forEach(r=>REC.persisted.add(r.id));
  IDB.putMany("records",fresh.map(r=>[r.id,r])).catch(()=>{ fresh.forEach(r=>REC.persisted.delete(r.id)); toast("No se ha podido guardar el progreso"); });
}
function save(){
  try{ localStorage.setItem(LS_KEY,JSON.stringify(REC.ok?Object.assign({},DB,{records:[]}):DB)); storageOK=true; }
  catch(e){ if(storageOK) toast("No se ha podido guardar en este equipo"); storageOK=false; }
  if(REC.ok) syncRecords();
}
const uid = ()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const byId = (arr,id)=>arr.find(x=>x.id===id);
const shuffle = a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const pick = a=>a[Math.floor(Math.random()*a.length)];
const esc = s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const stripAcc = s=>s.toLowerCase().replace(/[áàä]/g,"a").replace(/[éèë]/g,"e").replace(/[íìï]/g,"i").replace(/[óòö]/g,"o").replace(/[úùü]/g,"u");
const wordOf = w=>WORDS.find(x=>x.w===w);

function defaultCfg(){ return {lectura:1,escritura:1,escucha:1,font:(DB&&DB.settings&&DB.settings.font)||"cursiva"}; }   // letra general: escolar por defecto
function defaultHelps(){ return {grande:false,tol:"media",lenta:false,calma:false,picto:true,pista:true,ronda:6}; }

/* Estado de la sesión */
const S = {groupId:null, studentId:null, demo:false, demoLevels:null, teacherId:null, tTab:"grupos", tGroup:null, tStudent:null};
function student(){
  if(S.demo){
    const g=byId(DB.groups,S.groupId);
    const d={id:"demo",name:"Toda la clase",avatar:"👩‍🏫",cfg:Object.assign(defaultCfg(),g?g.defaults:{}),helps:defaultHelps(),letters:null};
    if(S.demoLevels) Object.assign(d.cfg,S.demoLevels);
    return d;
  }
  return byId(DB.students,S.studentId);
}
const inStudent = ()=>!!(S.studentId||S.demo);
function enabledLetters(st){ return (st.letters && st.letters.length) ? st.letters : LETTERS; }
function fontOf(st){ return FONTS[st.cfg.font]||FONTS[DB.settings.font||"cursiva"]; }
function show(st,text){ return fontOf(st).transform(text); }
// Texto para mostrar: en letra escolar se dibuja con los mismos trazos que se enseñan
function txt(st,text){ const t=show(st,text); return st.cfg.font==="cursiva" ? ESCOLAR.html(t) : esc(t); }
function sensible(){ return DB.settings.look==="sensible" || !!(inStudent() && student() && student().helps.calma); }
function plus(){ return DB.settings.look==="plus" && !sensible(); }

/* Ejercicio en curso: si se abandona sin terminarlo bien, se guarda como fallo */
function startPending(info){ flushPending(); S.pending=Object.assign({tries:0,touched:false,t0:performance.now()},info); }
function flushPending(){
  const p=S.pending; S.pending=null;
  if(!p||S.demo||!S.studentId) return;
  const tries=p.getTries?p.getTries():p.tries;
  if(!(tries>0||p.touched)) return;
  const item=p.ref?p.ref.key:p.item; if(!item) return;
  // el abandono cuenta como un intento más, además de los avisos recibidos
  DB.records.push({id:uid(),st:S.studentId,g:S.groupId,t:Date.now(),area:p.area,lvl:p.lvl,act:p.act,item,tries:tries+1,acc:0,ms:Math.round(performance.now()-p.t0),fail:true});
  save();
}
window.addEventListener("pagehide",flushPending);
function record(area,lvl,item,tries,acc,ms,act){
  S.pending=null;
  if(S.demo) return;
  DB.records.push({id:uid(),st:S.studentId,g:S.groupId,t:Date.now(),area,lvl,act,item,tries,acc:Math.round(acc),ms:Math.round(ms)});
  save();
}

/* =========================================================
   VOZ: primero el audio grabado por el docente, si existe
   ========================================================= */
let VOICE=null;
function pickVoice(){
  if(!("speechSynthesis" in window)) return;
  const vs=speechSynthesis.getVoices();
  VOICE = vs.find(v=>/^es[-_]ES/i.test(v.lang)) || vs.find(v=>/^es/i.test(v.lang)) || null;
}
if("speechSynthesis" in window){ pickVoice(); speechSynthesis.onvoiceschanged=pickVoice; }
function tts(text){
  SPK++;
  try{
    if(!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text); u.lang="es-ES"; if(VOICE) u.voice=VOICE;
    const st=inStudent()?student():null;
    u.rate = st && st.helps && st.helps.lenta ? .65 : .9;
    // En algunos Android se pierde lo que se pide justo tras cancelar: pequeña espera
    setTimeout(()=>{ try{ speechSynthesis.resume(); speechSynthesis.speak(u); }catch(e){} },60);
  }catch(e){}
}
function say(text,key){
  SPK++;
  if(key && AUDIO.has(key)){ try{speechSynthesis.cancel();}catch(e){} AUDIO.play(key); return; }
  tts(text);
}
/* Enunciados: el docente puede grabarlos por trozos. Si no hay ninguno grabado, se dicen enteros con la voz del equipo */
let SPK=0;
const INSTR={
  "palmadas":"¿Cuántas palmadas tiene?","mas":"¿Cuál tiene más palmadas?","menos":"¿Cuál tiene menos palmadas?",
  "empieza":"¿Qué palabra empieza por…","tiene":"¿Qué palabra tiene…","termina":"¿Qué palabra termina en…",
  "intrusa":"Tres palabras empiezan igual. ¿Cuál es la diferente?","rima":"¿Qué palabra rima con…",
  "si-a":"Si a…","quitas":"…le quitas…","queda":"…¿qué queda?","pones":"…le pones delante…","sale":"…¿qué palabra sale?",
  "di":"Di…","reves":"…al revés","igual":"¿Empiezan igual?","cadena":"¿Qué palabra empieza como termina…",
  "cuantas-pal":"¿Cuántas palabras tiene la frase?","trocitos":"Escucha los trocitos y toca el dibujo","escena":"Escucha y toca el dibujo",
  "verdad":"¿Es verdad o es mentira?","une":"Une cada palabra con su dibujo","equivocada":"¿Qué tarjeta tiene mal la palabra?",
  "copia":"Copia lo que ves","completa":"¿Qué letra falta? Escríbela","completa-silaba":"¿Qué sílaba falta? Escríbela",
  "escribe-ves":"¿Qué es? Escribe su nombre","ordena":"Ordena las letras","escribe-oyes":"Escribe lo que oyes",
  "empieza-letra":"¿Con qué letra empieza? Escríbela","pre":"Repasa el camino sin salirte","completa-frase":"¿Qué palabra falta? Escríbela",
  "dictado-frase":"Escucha y forma la frase",
  "toca":"Toca una de las respuestas","huecos":"Primero completa todos los huecos","ayuda":"Te ayudo: he quitado una"
};
const I=id=>({k:"ins:"+id,t:INSTR[id].replace(/…/g,"").trim()});
const Wd=w=>({k:"palabra:"+w,t:w});
const Sy=x=>({k:"silaba:"+x,t:x});
function ttsWait(text){
  return new Promise(res=>{ let done=false; const fin=()=>{ if(!done){done=true;res();} };
    try{ if(!("speechSynthesis" in window)) return fin();
      const u=new SpeechSynthesisUtterance(text); u.lang="es-ES"; if(VOICE) u.voice=VOICE;
      const st=inStudent()?student():null; u.rate=st&&st.helps&&st.helps.lenta?.65:.9;
      u.onend=fin; u.onerror=fin; speechSynthesis.resume(); speechSynthesis.speak(u); }catch(e){ fin(); }
    setTimeout(fin,900+text.length*110); });
}
function speak(parts,gap=0){
  parts=parts.filter(p=>p&&p.t);
  if(!gap && !parts.some(p=>p.k&&AUDIO.has(p.k))) return tts(parts.map(p=>p.t).join(" "));
  const my=++SPK; try{speechSynthesis.cancel();}catch(e){}
  (async()=>{ for(const p of parts){ if(my!==SPK) return;
    if(p.k&&AUDIO.has(p.k)) await AUDIO.playWait(p.k); else await ttsWait(p.t);
    if(gap&&my===SPK) await new Promise(r=>setTimeout(r,gap)); } })();
}
function praise(name){
  if(DB.settings.praise===false) return;
  const rec=["animo:1","animo:2","animo:3"].filter(k=>AUDIO.has(k));
  if(rec.length) return AUDIO.play(pick(rec));
  tts(name?`¡Muy bien, ${name}!`:pick(["¡Muy bien!","¡Genial!","¡Eso es!","¡Fenomenal!"]));
}
function tryAgain(){ if(S.pending) S.pending.tries++; say("Prueba otra vez","aviso:otra"); }

/* =========================================================
   UTILIDADES DE INTERFAZ
   ========================================================= */
const app=document.getElementById("app");
function h(html){ app.innerHTML=html; }
function toast(msg){
  document.querySelectorAll(".toast").forEach(x=>x.remove());     // un aviso cada vez, sin amontonarse
  const t=document.createElement("div"); t.className="toast"; t.textContent=msg; document.body.appendChild(t);
  setTimeout(()=>t.remove(),2800);
}
function modal(html,onMount,cls=""){
  const bg=document.createElement("div"); bg.className="modal-bg";
  bg.innerHTML=`<div class="modal ${cls}">${html}</div>`;
  document.body.appendChild(bg);
  const close=()=>bg.remove();
  bg.addEventListener("click",e=>{ if(e.target===bg) close(); });
  if(onMount) onMount(bg.firstElementChild,close);
  return close;
}
function confirmBox(text,okLabel,onOk){
  modal(`<h3>${esc(text)}</h3><div class="row end"><button class="btn" data-x>Cancelar</button><button class="btn danger" data-ok>${esc(okLabel)}</button></div>`,
    (m,close)=>{ m.querySelector("[data-x]").onclick=close; m.querySelector("[data-ok]").onclick=()=>{close();onOk();}; });
}
function celebrate(){
  const mode=DB.settings.celebration||"confeti";
  if(mode==="nada" || sensible()) return;
  const reduced=window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(mode==="check" || reduced){
    const d=document.createElement("div"); d.className="bigcheck"; d.innerHTML=`<div>${ICON.check}</div>`; document.body.appendChild(d);
    setTimeout(()=>d.remove(),1300); return;
  }
  const c=document.createElement("div"); c.className="celebrate";
  const colors=["#F6C945","#8E6DE0","#5CC48A","#F08AA8","#6AB0F5"];
  const fancy=plus(); const n=fancy?32:18;
  for(let i=0;i<n;i++){
    const s=document.createElement("span"); s.innerHTML=fancy&&i%3===1?ICON.heart:fancy&&i%3===2?ICON.dot:ICON.star; s.style.color=pick(colors);
    s.style.left=Math.random()*100+"vw"; s.style.animationDelay=(Math.random()*.5)+"s";
    s.style.fontSize=(1.2+Math.random()*1.6)+"em"; c.appendChild(s);
  }
  document.body.appendChild(c); setTimeout(()=>c.remove(),2400);
}
function applyLook(){
  const st=inStudent()?student():null;
  document.body.classList.toggle("grande", !!(st && st.helps && st.helps.grande));
  document.body.classList.toggle("sensible", !!sensible());
  document.body.classList.toggle("plus", plus());
}
function topBar(title,back,right=""){
  const st=inStudent()?student():null;
  return `<div class="top">
    ${back?`<button class="iconbtn" data-back aria-label="Volver">${ICON.back}</button>`:""}
    <h1>${title}</h1>
    ${st?`<div class="who"><span class="av">${st.avatar}</span><span class="nm">${esc(st.name)}</span></div>`:""}
    ${right}
  </div>`;
}
function bindBack(fn){ const b=app.querySelector("[data-back]"); if(b) b.onclick=fn; }
// Dibujo de una palabra: pictograma si está activado y descargado; si no, emoji
function hasImg(word){ return PICTO.has(word) && (DB.settings.pictos!=="emoji" || (DB.settings.ownImages||[]).includes(word)); }
function pic(word,emoji,cls="emoji"){
  if(hasImg(word)) return `<img class="${cls.replace(/\bemoji\b/,"picto")}" src="${PICTO.urls[word]}" alt="${esc(word)}" draggable="false">`;
  return `<span class="${cls}" role="img" aria-label="${esc(word)}">${emoji||""}</span>`;
}
function dots(i,n){ return `<div class="progress-dots">${Array.from({length:n},(_,k)=>`<span class="${k<i?"on":""}"></span>`).join("")}</div>`; }

function toggleFullscreen(){
  try{
    if(document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen({navigationUI:"hide"}).catch(()=>toast("Este navegador no permite pantalla completa aquí"));
  }catch(e){}
}
document.addEventListener("fullscreenchange",()=>{ const b=document.querySelector("[data-fs]"); if(b) b.innerHTML=document.fullscreenElement?ICON.shrink:ICON.expand; });

/* Desplegables propios: los nativos sacan de pantalla completa en algunos navegadores */
function enhanceSelect(sel){
  if(sel.dataset.enh) return; sel.dataset.enh="1";
  const b=document.createElement("button"); b.type="button"; b.className="cselect "+(sel.className||"");
  const paint=()=>{ const o=sel.options[sel.selectedIndex]; b.innerHTML=`<span>${esc(o?o.text:"")}</span>${ICON.chevron}`; };
  paint(); sel.style.display="none"; sel.after(b);
  b.onclick=e=>{
    e.preventDefault();
    const opts=[...sel.options];
    const bg=document.createElement("div"); bg.className="cs-bg";
    bg.innerHTML=`<div class="cs-list" role="listbox">${opts.map((o,i)=>`<button type="button" data-i="${i}" class="${i===sel.selectedIndex?"on":""}">${esc(o.text)}</button>`).join("")}</div>`;
    document.body.appendChild(bg);
    const list=bg.firstElementChild; const r=b.getBoundingClientRect();
    const below=window.innerHeight-r.bottom; list.style.minWidth=r.width+"px";
    list.style.left=Math.min(r.left,window.innerWidth-list.offsetWidth-8)+"px";
    if(below>list.offsetHeight+8||below>window.innerHeight/2) list.style.top=(r.bottom+4)+"px"; else list.style.bottom=(window.innerHeight-r.top+4)+"px";
    bg.onclick=ev=>{ const t=ev.target.closest("[data-i]"); if(t){ sel.selectedIndex=+t.dataset.i; paint(); sel.dispatchEvent(new Event("change",{bubbles:true})); } bg.remove(); };
  };
  new MutationObserver(paint).observe(sel,{attributes:true,childList:true});
}
new MutationObserver(()=>document.querySelectorAll("select:not([data-enh])").forEach(enhanceSelect)).observe(document.body,{childList:true,subtree:true});

/* Puerta con PIN (cualquier docente) */
function pinGate(title,onOk){
  if(!DB.teachers.length) return onOk();
  let pin="";
  modal(`<h3 style="text-align:center">${esc(title)}</h3><div class="pin-dots">${"<span></span>".repeat(4)}</div>
    <div class="keypad">${[1,2,3,4,5,6,7,8,9,"⌫",0,"✕"].map(k=>`<button data-k="${k}">${k}</button>`).join("")}</div>`,(m,close)=>{
    const dd=m.querySelectorAll(".pin-dots span"); const paint=()=>dd.forEach((d,i)=>d.classList.toggle("on",i<pin.length));
    m.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{
      const k=b.dataset.k; if(k==="✕") return close(); if(k==="⌫"){pin=pin.slice(0,-1);paint();return;}
      pin+=k; paint();
      if(pin.length===4){ const t=DB.teachers.find(x=>x.pin===pin); if(t){close();onOk(t);} else {toast("PIN incorrecto");pin="";setTimeout(paint,200);} }
    });
  });
}

/* =========================================================
   PANTALLAS DEL ALUMNADO
   ========================================================= */
function greeting(){ const hr=new Date().getHours(); return hr<14?"¡Buenos días!":hr<21?"¡Buenas tardes!":"¡Buenas noches!"; }
function letterOfDay(){ const d=new Date(); const doy=Math.floor((d-new Date(d.getFullYear(),0,0))/DAY); return LETTERS[doy%LETTERS.length]; }
function homeHero(){
  const l=letterOfDay(), w=wordOf(LETTER_WORD[l]);
  const date=new Date().toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"});
  return `<div class="home-hero">
    <div class="home-scene" aria-hidden="true">${SCENE_SVG}</div>
    <div class="home-head">
      <div class="home-logo">${LOGO_SVG}</div>
      <div class="home-greet"><div class="greet">${greeting()}</div><div class="date">${date}</div></div>
      <button class="lotd" data-lotd aria-label="Letra del día">
        <span class="lotd-t">Letra del día</span>
        <span class="lotd-body"><span class="lotd-l">${l.toLocaleUpperCase("es")}${l}</span>${w?pic(w.w,w.e,"emoji lotd-pic"):""}</span>
        <span class="lotd-w">${w?esc(w.w):""}</span>
      </button>
    </div>
  </div>`;
}
function screenGroups(force){
  flushPending(); S.screenSeq=(S.screenSeq||0)+1;
  S.studentId=null; S.demo=false;
  const fixed=DB.settings.lock && byId(DB.groups,DB.settings.fixedGroup);
  if(fixed && !force){ S.groupId=fixed.id; return screenStudents(); }
  S.groupId=null; applyLook();
  const groups=DB.groups;
  const fsOk=document.fullscreenEnabled && !matchMedia("(display-mode: fullscreen), (display-mode: standalone)").matches;
  h(`${topBar("",false,`${fsOk?`<button class="iconbtn" data-fs aria-label="Pantalla completa">${document.fullscreenElement?ICON.shrink:ICON.expand}</button>`:""}<button class="iconbtn" data-teacher aria-label="Docentes">${ICON.gear}</button>`)}
  <div class="main home">
    ${homeHero()}
    <h2 class="home-q">¿Cuál es tu clase?</h2>
    ${groups.length?`<div class="grid">${groups.map(g=>`
      <button class="tile group-tile" data-g="${g.id}" style="--gc:${g.color}">
        <span class="big deco">${g.icon||"🏫"}</span><span>${esc(g.name)}</span>
        <small>${DB.students.filter(s=>inGroup(s,g.id)).length} alumnos</small>
      </button>`).join("")}</div>`
    :`<div class="empty start-box"><p style="font-size:1.3em">Todavía no hay clases.</p>
      ${DB.teachers.length?`<button class="btn primary big-btn" data-start>👩‍🏫 Entrar como docente y crear la primera clase</button>`
        :`<p>Para empezar, crea tu cuenta de docente. Después podrás crear la clase y añadir al alumnado.</p><button class="btn primary big-btn" data-start>👩‍🏫 Empezar: crear mi cuenta</button>`}</div>`}
  </div>`);
  app.querySelector("[data-teacher]").onclick=teacherLogin;
  const sb0=app.querySelector("[data-start]"); if(sb0) sb0.onclick=teacherLogin;
  const fb=app.querySelector("[data-fs]"); if(fb) fb.onclick=toggleFullscreen;
  app.querySelector("[data-lotd]").onclick=()=>{ const l=letterOfDay(); const w=LETTER_WORD[l]; say(`La letra de hoy es la ${LETTER_NAMES[l]}, de ${w}`,"letra:"+l); };
  app.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{S.groupId=b.dataset.g; screenStudents();});
}
function screenStudents(){
  flushPending(); S.screenSeq=(S.screenSeq||0)+1;
  const g=byId(DB.groups,S.groupId); if(!g) return screenGroups(true);
  S.studentId=null; S.demo=false; applyLook();
  const locked=DB.settings.lock && DB.settings.fixedGroup===g.id;
  const sts=DB.students.filter(s=>inGroup(s,g.id)).sort((a,b)=>a.name.localeCompare(b.name,"es"));
  h(`${topBar(esc(g.name),!locked,locked?`<button class="iconbtn" data-teacher aria-label="Docentes">${ICON.lock}</button>`:"")}
  <div class="main">
    <div class="hero"><h2>¿Quién eres?</h2></div>
    <div class="grid">
      ${sts.map(s=>`<button class="tile" data-s="${s.id}"><span class="big">${s.avatar}</span>${esc(s.name)}</button>`).join("")}
      <button class="tile demo-tile" data-demo><span class="big">👩‍🏫</span>Toda la clase<small>Proyectar · no guarda progreso</small></button>
    </div>
    ${sts.length?"":`<p class="empty">Esta clase aún no tiene alumnos. Añádelos desde el panel docente.</p>`}
  </div>`);
  bindBack(()=>screenGroups(true));
  const tb=app.querySelector("[data-teacher]"); if(tb) tb.onclick=teacherLogin;
  app.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{S.studentId=b.dataset.s; screenStudentHome();});
  app.querySelector("[data-demo]").onclick=()=>pinGate("Proyectar para toda la clase: PIN de docente",()=>{S.demo=true; S.demoLevels=null; screenStudentHome();});
}
function screenStudentHome(){
  flushPending(); S.screenSeq=(S.screenSeq||0)+1;
  const st=student(); applyLook();
  const cnt=a=>`${CATALOG[a].length} actividades`;
  h(`${topBar("¡Hola!",true)}
  <div class="main center">
    <div class="menu three">
      <button class="tile menu-tile listen" data-listen><span class="badge">${cnt("escucha")}</span><span class="ico-circle">${ICON.ear}</span>Escuchar</button>
      <button class="tile menu-tile read" data-read><span class="badge">${cnt("lectura")}</span><span class="ico-circle">${ICON.book}</span>Leer</button>
      <button class="tile menu-tile write" data-write><span class="badge">${cnt("escritura")}</span><span class="ico-circle">${ICON.pencil}</span>Escribir</button>
    </div>
    ${S.demo?`<div class="panel demo-bar">
      <b>Toda la clase</b>
      <label>Leer <select data-dl>${LEVELS.lectura.slice(1).map((n,i)=>`<option value="${i+1}" ${st.cfg.lectura==i+1?"selected":""}>${n}</option>`).join("")}</select></label>
      <label>Escuchar <select data-du>${LEVELS.escucha.slice(1).map((n,i)=>`<option value="${i+1}" ${lvlOf(st,"escucha")==i+1?"selected":""}>${n}</option>`).join("")}</select></label>
      <label>Escribir <select data-de>${LEVELS.escritura.slice(1).map((n,i)=>`<option value="${i+1}" ${st.cfg.escritura==i+1?"selected":""}>${n}</option>`).join("")}</select></label>
      <label>Letra <select data-df>${Object.entries(FONTS).map(([k,f])=>`<option value="${k}" ${st.cfg.font==k?"selected":""}>${f.label}</option>`).join("")}</select></label>
    </div>`:""}
  </div>`);
  bindBack(screenStudents);
  app.querySelector("[data-read]").onclick=()=>screenArea("lectura");
  app.querySelector("[data-listen]").onclick=()=>screenArea("escucha");
  app.querySelector("[data-write]").onclick=()=>screenArea("escritura");
  if(S.demo){
    const upd=()=>{ S.demoLevels={lectura:+app.querySelector("[data-dl]").value,escritura:+app.querySelector("[data-de]").value,escucha:+app.querySelector("[data-du]").value,font:app.querySelector("[data-df]").value}; screenStudentHome(); };
    ["[data-dl]","[data-de]","[data-du]","[data-df]"].forEach(q=>app.querySelector(q).onchange=upd);
  }
}

/* ---------- Catálogo de actividades de un área ---------- */
const AREA_TITLE={escucha:"Escuchar",lectura:"Leer",escritura:"Escribir"};
function screenArea(area){
  flushPending(); S.screenSeq=(S.screenSeq||0)+1; S.area=area;
  const st=student(); applyLook();
  const my=lvlOf(st,area);
  h(`${topBar(AREA_TITLE[area],true)}
  <div class="main">
    <div class="acts">${CATALOG[area].map((e,i)=>`
      <button class="tile act-tile lvl${e.lvl} ${e.lvl===my?"rec":""}" data-a="${i}">
        <span class="act-tab">${esc(LEVELS[area][e.lvl])}</span>
        ${e.lvl===my?`<span class="act-rec" title="Su nivel">${ICON.star}</span>`:""}
        <span class="act-ico emoji">${e.icon}</span>
        <span class="act-name">${esc(e.name)}</span>
      </button>`).join("")}</div>
  </div>`);
  bindBack(screenStudentHome);
  app.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>startActivity(area,CATALOG[area][+b.dataset.a]));
}
function startActivity(area,e){
  if(!DB.settings.tried){ DB.settings.tried=true; save(); }
  const st=student(); S.area=area;
  if(area==="escritura"&&e.lvl===1&&e.act==="trazo") return screenAlphabet();
  runRound(area,e.lvl,buildItems(area,e.lvl,st,roundLen(st),e.act),()=>startActivity(area,e),e.name);
}
function backToArea(){ if(S.area) screenArea(S.area); else screenStudentHome(); }

/* ---------- Banco de ejercicios según las letras activas ---------- */
function pools(st){
  const en=new Set(enabledLetters(st));
  const ok=w=>[...stripAcc(w)].filter(c=>/[a-zñ]/.test(c)).every(c=>en.has(c));
  let syl=SYLLABLES.filter(ok); if(syl.length<4) syl=SYLLABLES;
  let words=WORDS.filter(x=>ok(x.w)); if(words.length<4) words=WORDS;
  let phr=PHRASES.filter(x=>ok(x.t.replace(/[.,]/g,""))); if(phr.length<3) phr=PHRASES;
  let short=SHORT_PHRASES.filter(x=>ok(x.t.replace(/[.,]/g,""))); if(short.length<8) short=SHORT_PHRASES;
  return {letters:enabledLetters(st), syl, words, phr, short, multi:words.filter(w=>w.s.length>1)};
}
// Lo que ha salido hace poco a cada alumno, para no repetírselo enseguida. Se guarda entre sesiones.
let RECENT_ALL={};
async function initRecent(){ try{ localStorage.removeItem("lectoescritura.recent"); RECENT_ALL=(await IDB.get("meta","recent"))||{}; }catch(e){ RECENT_ALL={}; } }
const recentList=()=>{ const k=S.studentId||(S.demo?"clase:"+S.groupId:"docente"); return RECENT_ALL[k]||(RECENT_ALL[k]=[]); };
const keyOf=x=>typeof x==="string"?x:(x.w||x.t||x.key||JSON.stringify(x));
let _recT=null;
function remember(k){ const R=recentList(); R.push(k); while(R.length>250) R.shift();
  clearTimeout(_recT); _recT=setTimeout(()=>{ const ids=new Set(DB.students.map(s=>s.id));
    Object.keys(RECENT_ALL).forEach(k=>{ if(!ids.has(k)&&!k.startsWith("clase:")&&k!=="docente") delete RECENT_ALL[k]; });
    IDB.put("meta","recent",RECENT_ALL).catch(()=>{}); },800); }
function pickFresh(arr,m=1,kf=keyOf){
  if(!arr.length) return [];
  const R=recentList(); const fresh=arr.filter(x=>!R.includes(kf(x))); const src=fresh.length>=Math.max(m,3)?fresh:arr;
  const out=[]; const bag=shuffle(src);
  while(out.length<m){ const it=bag.length?bag.pop():pick(src); if(out.includes(it)&&src.length>out.length) continue; out.push(it); remember(kf(it)); }
  return out;
}
const roundLen=st=>+((st&&st.helps&&st.helps.ronda)||ROUND);
function buildItems(area,lvl,st,n=ROUND,only){
  const P=pools(st); const acts=only?[only]:ACTIVITIES[area][lvl]; const items=[];
  const pickN=(arr,m)=>pickFresh(arr,m);
  for(let i=0;i<n;i++){
    const act=acts[i%acts.length];
    let it;
    if(act==="toca-letra") it={act,key:pickN(P.letters,1)[0]};
    else if(act==="toca-silaba") it={act,key:pickN(P.syl,1)[0]};
    else if(act==="falta-silaba"||act==="forma-palabra"){ it={act,word:pickN(P.multi.length?P.multi:WORDS.filter(w=>w.s.length>1),1)[0]}; it.key=it.word.w; }
    else if(act==="elige-palabra"||act==="falta-letra"){ it={act,word:pickN(P.words,1)[0]}; it.key=it.word.w; }
    else if(act==="elige-dibujo"||act==="ordena-frase"||act==="tijeras"){ it={act,phrase:pickN(P.phr,1)[0]}; it.key=it.phrase.t; }
    else if(act==="contar-silabas"||act==="une-silabas"){ it={act,word:pickN(WORDS.filter(w=>w.s.length<=4&&(act==="contar-silabas"||w.s.length>=2)),1)[0]}; it.key=it.word.w; }
    else if(act==="cuenta-palabras"){ it={act,phrase:pickN(PHRASES.filter(p=>p.t.split(" ").length<=6),1)[0]}; it.key=it.phrase.t; }
    else if(act==="quita-silaba"){ it={act,word:pickN(WORDS.filter(w=>w.s.length>=3&&new Set(w.s).size===w.s.length),1)[0]}; it.key=it.word.w; }
    else if(act==="da-la-vuelta"){ it={act,word:pickN(WORDS.filter(w=>w.s.length===2&&w.s[0]!==w.s[1]),1)[0]}; it.key=it.word.w; }
    else if(act==="mas-larga"||act==="termina-en"||act==="intrusa"||act==="rima"){ it={act}; }
    else if(act==="sonido-en"||act==="empieza-por"){ it={act}; }
    else if(act==="elige-escena"||act==="monta-escena"){ it={act,scene:randomScene()}; it.key=sceneText(it.scene); }
    else if(["mas-corta","suena-igual","encadenadas","anade-silaba","une-dibujo","intrusa-lee"].includes(act)){ it={act}; }
    else if(act==="verdad-mentira"){ const P2=VERDAD.filter(v=>stripAcc(v.t.toLowerCase()).replace(/[^a-zñ]/g,"").split("").every(c=>enabledLetters(st).includes(c)));
      const src=(P2.length>=10?P2:VERDAD); const want=Math.random()<.5; it={act,item:pickN(src.filter(v=>v.ok===want),1)[0]}; it.key=it.item.t; }
    else if(area==="escritura"&&lvl===4&&["trazo","copia","dictado","completa-frase"].includes(act)){
      const ph=pickN(P.short||SHORT_PHRASES,1)[0]; it={act,phrase:ph,key:ph.t};
      if(act==="completa-frase"){ const ws=ph.t.replace(/[.,]/g,"").split(" "); let i=ws.findIndex(x=>x.toLowerCase()===ph.k); if(i<0) i=ws.map((x,j)=>[x.length,j]).filter(([,j])=>j>0).sort((a,b)=>b[0]-a[0])[0][1]; it.idx=i; }
    }
    else if(act==="preescritura"){ it={act,key:pickN(PRE.list,1)[0]}; }
    else if(act==="copia"||act==="dictado-mano"){
      if(lvl===1) it={act,key:pickN(P.letters,1)[0]};
      else if(lvl===2) it={act,key:pickN(P.syl,1)[0]};
      else { const w=pickN(P.words.filter(x=>x.w.length<=(act==="copia"?7:6)),1)[0]||pickN(WORDS,1)[0]; it={act,key:w.w,word:w}; }
    }
    else if(act==="empieza-letra"){ const en=enabledLetters(st); const src=P.words.filter(w=>en.includes(w.w[0])); const w=pickN(src.length>=4?src:WORDS.filter(x=>/^[a-zñ]/.test(x.w)),1)[0]; it={act,key:w.w,word:w}; }
    else if(act==="escribe-dibujo"||act==="ordena-letras"){ const w=pickN(P.words.filter(x=>x.w.length>=3&&x.w.length<=7&&new Set(x.w).size>1),1)[0]||pickN(WORDS,1)[0]; it={act,key:w.w,word:w}; }
    else if(act==="completa"&&lvl===2){ const w=pickN(P.multi.length?P.multi:WORDS.filter(x=>x.s.length>1),1)[0]; it={act,key:w.w,word:w,idx:Math.floor(Math.random()*w.s.length)}; }
    else if(act==="completa"){ const w=pickN(P.words.filter(x=>x.w.length>=3&&x.w.length<=8),1)[0]||pickN(WORDS.filter(x=>x.w.length>=3),1)[0];
      const idx=pick([...w.w].map((c,i)=>/[a-zñ]/.test(c)?i:-1).filter(i=>i>=0)); it={act,key:w.w,word:w,idx}; }
    else if(act==="trazo"||act==="dictado"){
      if(lvl===2) it={act,key:pickN(P.syl,1)[0]};
      else { const w=pickN(P.words.filter(x=>x.w.length<=7),1)[0]||pickN(WORDS,1)[0]; it={act,key:w.w,word:w}; }
    }
    items.push(it);
  }
  // evita repetir el mismo elemento seguido
  return items;
}

const TRACE_ACTS=["trazo","copia","completa","preescritura","dictado-mano","empieza-letra"];
function runRound(area,lvl,items,again,title){
  let idx=0, good=0; const token=S.screenSeq;
  const next=()=>{
    if(idx>=items.length) return roundEnd(area,good,items.length,again,title);
    const it=items[idx];
    const done=firstTry=>{ if(S.screenSeq!==token || !student()) return; if(firstTry) good++; idx++; next(); };
    const ctx={area,lvl,idx,n:items.length,done};
    const A={
      "toca-letra":actChooseSound,"toca-silaba":actChooseSound,"falta-silaba":actMissing,"falta-letra":actMissing,
      "elige-palabra":actChooseWord,"elige-dibujo":actChoosePicture,"forma-palabra":actBuild,"ordena-frase":actBuild,
      "dictado":actBuild,"trazo":actTrace,"tijeras":actScissors,
      "contar-silabas":actCountSyl,"mas-larga":actLonger,"une-silabas":actBlend,"cuenta-palabras":actCountWords,"termina-en":actEnds,
      "intrusa":actOddOne,"rima":actRhyme,"quita-silaba":actDelete,"da-la-vuelta":actReverse,"sonido-en":actSound,"empieza-por":actSound,"elige-escena":actChooseScene,"monta-escena":actBuildScene,
      "mas-corta":actLonger,"suena-igual":actSameStart,"encadenadas":actChain,"anade-silaba":actAdd,
      "une-dibujo":actMatch,"intrusa-lee":actWrongCard,"verdad-mentira":actTrueFalse,"copia":actCopy,"completa":actComplete,
      "preescritura":actPre,"dictado-mano":actDictHand,"empieza-letra":actFirstLetter,"escribe-dibujo":actBuild,"ordena-letras":actBuild,"completa-frase":actBuild
    }[it.act];
    if(!TRACE_ACTS.includes(it.act)) startPending({area,lvl,act:it.act,ref:it});
    A(it,ctx);
  };
  next();
}
function roundEnd(area,good,total,again,title){
  const st=student(); applyLook();
  const stars=good===total?3:good>=total*.6?2:1;
  celebrate(); praise(st.name);
  h(`${topBar(AREA_TITLE[area]+(title?" · "+esc(title):""),true)}
  <div class="main center">
    <div class="hero">
      <div class="stars">${[0,1,2].map(i=>`<span class="${i<stars?"on":""}">${ICON.star}</span>`).join("")}</div>
      <h2>¡Muy bien, ${esc(st.name)}!</h2><p>${good} de ${total} a la primera</p></div>
    <div class="row" style="justify-content:center;gap:1.2em">
      <button class="btn primary big-btn" data-again>${ICON.again} Otra vez</button>
      <button class="btn big-btn" data-home>${ICON.home} Actividades</button>
    </div>
  </div>`);
  bindBack(backToArea);
  app.querySelector("[data-again]").onclick=again;
  app.querySelector("[data-home]").onclick=backToArea;
}
// Tras dos fallos: se apagan las opciones incorrectas menos una
function giveHint(btns,isOk){
  const st=student(); if(st&&st.helps&&st.helps.pista===false) return false;
  const live=btns.filter(b=>!b.disabled); if(live.length<=2) return false;
  const wrong=shuffle(live.filter(b=>!isOk(+b.dataset.i))); wrong.slice(0,wrong.length-1).forEach(b=>{ b.disabled=true; b.classList.add("off"); b.classList.remove("picked","sel"); });
  if(S.pending) S.pending.tries++;
  setTimeout(()=>speak([I("ayuda")]),900); return true;
}
const okBar=(label="Comprobar")=>`<div class="row okbar"><button class="btn ok big-btn" data-ok>${ICON.check} ${label}</button></div>`;
function actHeader(ctx,title){
  return `${topBar(AREA_TITLE[ctx.area]+" · "+esc(title),true)}`;
}
/* Elección entre 3 opciones (base de varias actividades) */
function choiceScreen(ctx,{title,prompt,options,correct,fontCss,emo,onSay,sayKey,four,wide,two,record:rec}){
  const st=student(); applyLook();
  h(`${actHeader(ctx,title)}
  <div class="main act-main">
    ${dots(ctx.idx,ctx.n)}
    <div class="prompt">${prompt}</div>
    <div class="options ${four?"four":""} ${wide?"wide":""} ${two?"two-opt":""}">${options.map((o,i)=>`<button class="opt ${emo?"emo":""}" data-i="${i}" style="${fontCss?`font-family:${fontCss}`:""}">${o.html}</button>`).join("")}</div>
    ${okBar()}
  </div>`);
  bindBack(backToArea);
  let tries=0, locked=false, sel=-1, hinted=false; const t0=performance.now();
  const sb=app.querySelector("[data-say]"); if(sb) sb.onclick=onSay;
  if(onSay) setTimeout(onSay,350);
  const btns=[...app.querySelectorAll(".opt")];
  // Tocar elige (y, si es un dibujo, lo dice); la respuesta se da con Comprobar
  btns.forEach(b=>b.onclick=()=>{ if(locked) return; sel=+b.dataset.i; btns.forEach(x=>x.classList.toggle("picked",x===b));
    const w=b.querySelector("[data-word]")?.dataset.word; if(w) say(w,"palabra:"+w); });
  app.querySelector("[data-ok]").onclick=()=>{ if(locked) return; if(sel<0){ speak([I("toca")]); return; } check(btns[sel]); };
  function check(b){
    if(locked) return; const o=options[+b.dataset.i]; tries++;
    if(o.ok){
      locked=true; b.classList.add("ok");
      rec(tries,performance.now()-t0);
      celebrate(); praise();
      setTimeout(()=>ctx.done(tries===1),1400);
    }else{
      b.classList.remove("bad","picked"); void b.offsetWidth; b.classList.add("bad"); sel=-1;
      tryAgain();
      if(!hinted && tries>=2 && giveHint(btns,i=>options[i].ok)){ hinted=true; tries++; }   // la ayuda cuenta como un intento
      else if(onSay) setTimeout(onSay,1100);
    }
  }
}
function actChooseSound(it,ctx){
  const st=student(); const isL=it.act==="toca-letra"; const P=pools(st);
  const pool=isL?P.letters:P.syl;
  const opts=shuffle([it.key,...shuffle(pool.filter(x=>x!==it.key)).slice(0,2)]);
  const w=isL?wordOf(LETTER_WORD[it.key]):null;
  choiceScreen(ctx,{title:actName(ctx.area,ctx.lvl,it.act),
    prompt:`<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask">${isL?"Escucha y toca la letra":"Escucha y toca la sílaba"}</span>${isL&&st.helps.picto&&w?pic(w.w,w.e):""}`,
    options:opts.map(x=>({html:txt(st,x),ok:x===it.key})), fontCss:fontOf(st).css,
    onSay:()=>isL?say(`¿Dónde está la ${LETTER_NAMES[it.key]}?`,"letra:"+it.key):say(it.key,"silaba:"+it.key),
    record:(tries,ms)=>record("lectura",ctx.lvl,it.key,tries,tries===1?100:Math.max(0,100-50*(tries-1)),ms,it.act)});
}
function actChooseWord(it,ctx){
  const st=student(); const P=pools(st);
  const opts=shuffle([it.word,...shuffle(P.words.filter(x=>x.w!==it.word.w)).slice(0,2)]);
  choiceScreen(ctx,{title:actName(ctx.area,ctx.lvl,it.act),
    prompt:`${pic(it.word.w,it.word.e)}<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button>`,
    options:opts.map(x=>({html:txt(st,x.w),ok:x===it.word})), fontCss:fontOf(st).css,
    onSay:()=>say(it.word.w,"palabra:"+it.word.w),
    record:(tries,ms)=>record("lectura",ctx.lvl,it.key,tries,tries===1?100:Math.max(0,100-50*(tries-1)),ms,it.act)});
}
function actChoosePicture(it,ctx){
  const st=student(); const P=pools(st);
  const opts=shuffle([it.phrase,...shuffle(P.phr.filter(x=>x.k!==it.phrase.k)).slice(0,2)]);
  choiceScreen(ctx,{title:actName(ctx.area,ctx.lvl,it.act),
    prompt:`<span class="phrase" style="font-family:${fontOf(st).css}">${txt(st,it.phrase.t)}</span><button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button>`,
    options:opts.map(x=>({html:pic(x.k,x.e,"emoji in-opt"),ok:x===it.phrase})), emo:true,
    onSay:null,
    record:(tries,ms)=>record("lectura",ctx.lvl,it.key,tries,tries===1?100:Math.max(0,100-50*(tries-1)),ms,it.act)});
  const sb=app.querySelector("[data-say]"); if(sb) sb.onclick=()=>say(it.phrase.t,"frase:"+it.phrase.t);
}
function actMissing(it,ctx){
  const st=student(); const w=it.word; const P=pools(st);
  let parts,hole,answer,pool;
  if(it.act==="falta-silaba"){ parts=[...w.s]; hole=Math.floor(Math.random()*parts.length); answer=parts[hole]; pool=P.syl; }
  else { parts=[...w.w]; const cand=parts.map((c,i)=>i).filter(i=>/[a-zñ]/.test(parts[i])); hole=pick(cand); answer=parts[hole]; pool=P.letters; }
  const opts=shuffle([answer,...shuffle(pool.filter(x=>x!==answer&&stripAcc(x)!==stripAcc(answer))).slice(0,2)]);
  const shown=parts.map((p,i)=>i===hole?`<span class="hole">${"&nbsp;".repeat(Math.max(2,p.length*2))}</span>`:txt(st,p)).join("");
  choiceScreen(ctx,{title:actName(ctx.area,ctx.lvl,it.act),
    prompt:`${pic(w.w,w.e)}<span class="phrase" style="font-family:${fontOf(st).css}">${shown}</span><button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button>`,
    options:opts.map(x=>({html:txt(st,x),ok:x===answer})), fontCss:fontOf(st).css,
    onSay:()=>say(w.w,"palabra:"+w.w),
    record:(tries,ms)=>record("lectura",ctx.lvl,it.key,tries,tries===1?100:Math.max(0,100-50*(tries-1)),ms,it.act)});
}
/* Construir tocando piezas en orden: sílabas → palabra, palabras → frase, letras → dictado */
function actBuild(it,ctx){
  const st=student(); applyLook(); const fcss=fontOf(st).css; const P=pools(st);
  let target,extra,promptHTML,sayFn,title=actName(ctx.area,ctx.lvl,it.act),joiner="";
  if(it.act==="forma-palabra"){
    target=[...it.word.s]; extra=shuffle(P.syl.filter(x=>!target.includes(x))).slice(0,1);
    promptHTML=`${pic(it.word.w,it.word.e)}<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button>`;
    sayFn=()=>say(it.word.w,"palabra:"+it.word.w);
  }else if(it.act==="ordena-frase"){
    target=it.phrase.t.replace(/\.$/,"").split(" "); extra=[]; joiner=" ";
    promptHTML=`${pic(it.phrase.k,it.phrase.e)}<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button>`;
    sayFn=()=>say(it.phrase.t,"frase:"+it.phrase.t);
  }else if(it.act==="escribe-dibujo"||it.act==="ordena-letras"){
    const w=it.word; target=[...w.w];
    extra=it.act==="ordena-letras"?[]:shuffle(enabledLetters(st).filter(l=>!stripAcc(w.w).includes(l))).slice(0,2);
    promptHTML=`${pic(w.w,w.e)}<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask">${it.act==="ordena-letras"?"Ordena las letras":"¿Qué es? Escribe su nombre"}</span>`;
    sayFn=it.act==="ordena-letras"?()=>speak([I("ordena"),Wd(w.w)]):()=>speak([I("escribe-ves")]);
  }else if(it.act==="dictado"&&it.phrase){   // dictado de frases: palabras móviles con alguna de sobra
    target=it.phrase.t.replace(/\.$/,"").split(" "); joiner=" ";
    const lowT=target.map(x=>x.toLowerCase());
    extra=shuffle([...new Set(PHRASES.flatMap(p=>p.t.replace(/[.,]/g,"").split(" ")))].filter(x=>x.length>2&&!lowT.includes(x.toLowerCase())&&x[0]===x[0].toLowerCase())).slice(0,2);
    promptHTML=`<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask">Escucha y forma la frase</span>`;
    sayFn=()=>sayItem(it,4);
  }else if(it.act==="completa-frase"){        // falta una palabra: se forma con letras
    const ws=it.phrase.t.replace(/\.$/,"").split(" "); const miss=ws[it.idx]; target=[...miss];
    extra=shuffle(enabledLetters(st).filter(l=>!stripAcc(miss.toLowerCase()).includes(l))).slice(0,2);
    const shown=ws.map((x,i)=>i===it.idx?`<span class="gap gap-long">?</span>`:txt(st,x)).join(" ");
    promptHTML=`${pic(it.phrase.k,it.phrase.e)}<span class="phrase" style="font-family:${fcss}">${shown}</span><button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button>`;
    sayFn=()=>sayItem(it,4);
  }else{ // dictado con letras móviles
    const txt=it.key; target=[...txt]; const w=it.word;
    const pool=enabledLetters(st).filter(l=>!txt.includes(l)&&!stripAcc(txt).includes(l));
    extra=shuffle(pool.length>=2?pool:LETTERS.filter(l=>!stripAcc(txt).includes(l))).slice(0,2);
    promptHTML=`${w&&st.helps.picto?pic(w.w,w.e):""}<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask">Escucha y escribe</span>`;
    sayFn=()=>say(txt,(w?"palabra:":"silaba:")+txt);
  }
  const tiles=shuffle([...target.map((t,i)=>({t,i})),...extra.map((t,j)=>({t,i:-1-j}))]);
  const slots=target.map(()=>null); let tries=0, locked=false; const t0=performance.now();
  h(`${actHeader(ctx,title)}
  <div class="main act-main">
    ${dots(ctx.idx,ctx.n)}
    <div class="prompt">${promptHTML}</div>
    <div class="slots ${joiner?"words":""}" style="font-family:${fcss}" data-slots></div>
    <div class="tiles" style="font-family:${fcss}" data-tiles></div>
    ${okBar()}
  </div>`);
  bindBack(backToArea);
  app.querySelector("[data-say]").onclick=sayFn; setTimeout(sayFn,350);
  const sEl=app.querySelector("[data-slots]"), tEl=app.querySelector("[data-tiles]");
  function paint(){
    sEl.innerHTML=slots.map((s,i)=>`<button class="slot ${s?"full":""}" data-si="${i}" aria-label="${s?esc(s.t):"Hueco "+(i+1)}">${s?txt(st,s.t):""}</button>`).join(joiner?"":"");
    tEl.innerHTML=tiles.map((t,i)=>`<button class="piece ${slots.includes(t)?"used":""}" data-ti="${i}" aria-label="${esc(t.t)}">${txt(st,t.t)}</button>`).join("");
    sEl.querySelectorAll("[data-si]").forEach(b=>b.onclick=()=>{ if(locked) return; const i=+b.dataset.si; if(slots[i]){slots[i]=null;paint();} });
    tEl.querySelectorAll("[data-ti]").forEach(b=>b.onclick=()=>{
      if(locked) return; const t=tiles[+b.dataset.ti]; if(slots.includes(t)) return;
      const free=slots.indexOf(null); if(free<0) return; slots[free]=t; paint();
    });
    okBtn.classList.toggle("ready",!slots.includes(null));
  }
  const okBtn=app.querySelector("[data-ok]");
  okBtn.onclick=()=>{ if(locked) return; if(slots.includes(null)){ speak([I("huecos")]); return; } check(); };
  function check(){
    tries++;
    const ok=slots.every((s,i)=>s.t===target[i]);
    if(ok){
      locked=true; sEl.classList.add("ok");
      record(ctx.area,ctx.lvl,it.key,tries,tries===1?100:Math.max(0,100-34*(tries-1)),performance.now()-t0,it.act);
      celebrate(); praise(); setTimeout(()=>ctx.done(tries===1),1500);
    }else{
      locked=true;
      sEl.querySelectorAll(".slot").forEach((b,i)=>{ if(slots[i].t!==target[i]) b.classList.add("bad"); });
      tryAgain();
      setTimeout(()=>{ slots.forEach((s,i)=>{ if(s.t!==target[i]) slots[i]=null; }); locked=false; paint(); },1100);
    }
  }
  paint();
}

/* ---------- LEER: une, tarjeta equivocada, verdad o mentira ---------- */
const distinctPics=(arr,n)=>{ const out=[], seen=new Set(); for(const w of arr){ if(seen.has(w.e)) continue; seen.add(w.e); out.push(w); if(out.length===n) break; } return out; };
// Une palabra y dibujo: tres parejas
function actMatch(it,ctx){
  const st=student(); applyLook(); const P=pools(st); const fcss=fontOf(st).css;
  const words=distinctPics(pickFresh(P.words.length>=6?P.words:WORDS,6),3); it.key="une:"+words.map(w=>w.w).join(",");
  const left=shuffle([...words]), right=shuffle([...words]);
  const pairs=new Map(); let selL=null, tries=0, locked=false; const t0=performance.now();
  const COL=["#6A55B5","#E0618A","#2E9E8F"];
  h(`${actHeader(ctx,actName(ctx.area,ctx.lvl,it.act))}
  <div class="main act-main">
    ${dots(ctx.idx,ctx.n)}
    <div class="prompt"><button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask">Toca una palabra y después su dibujo</span></div>
    <div class="match"><div class="m-col" data-l></div><div class="m-col" data-r></div></div>
    ${okBar()}
  </div>`);
  bindBack(backToArea);
  const sayIt=()=>speak([I("une")]); app.querySelector("[data-say]").onclick=sayIt; setTimeout(sayIt,350);
  const L=app.querySelector("[data-l]"), R=app.querySelector("[data-r]");
  const colorOf=w=>{ const i=[...pairs.keys()].indexOf(w); return i<0?null:COL[i%3]; };
  function paint(){
    L.innerHTML=left.map((w,i)=>{ const c=colorOf(w); return `<button class="m-item m-word ${selL===w?"picked":""} ${c?"paired":""}" data-i="${i}" style="font-family:${fcss};${c?`--pc:${c}`:""}">${txt(st,w.w)}</button>`; }).join("");
    R.innerHTML=right.map((w,i)=>{ const k=[...pairs.entries()].find(e=>e[1]===w); const c=k?colorOf(k[0]):null; return `<button class="m-item m-pic ${c?"paired":""}" data-i="${i}" style="${c?`--pc:${c}`:""}">${pic(w.w,w.e,"emoji in-opt")}</button>`; }).join("");
    L.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{ if(locked) return; const w=left[+b.dataset.i]; if(pairs.has(w)){ pairs.delete(w); selL=null; } else selL=selL===w?null:w; paint(); });
    R.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{ if(locked) return; const w=right[+b.dataset.i];
      const owner=[...pairs.entries()].find(e=>e[1]===w); if(owner){ pairs.delete(owner[0]); paint(); return; }
      if(!selL){ speak([{t:"Primero toca una palabra"}]); return; } pairs.set(selL,w); selL=null; paint(); });
  }
  app.querySelector("[data-ok]").onclick=()=>{
    if(locked) return; if(pairs.size<3){ speak([I("huecos")]); return; }
    tries++; const wrong=[...pairs.entries()].filter(([a,b])=>a!==b);
    if(!wrong.length){ locked=true; app.querySelector(".match").classList.add("ok");
      record(ctx.area,ctx.lvl,it.key,tries,tries===1?100:Math.max(0,100-34*(tries-1)),performance.now()-t0,it.act);
      celebrate(); praise(); setTimeout(()=>ctx.done(tries===1),1400); return; }
    locked=true; wrong.forEach(([a])=>{ const i=left.indexOf(a); L.children[i].classList.add("bad"); }); tryAgain();
    setTimeout(()=>{ wrong.forEach(([a])=>pairs.delete(a)); locked=false; paint(); },1100);
  };
  paint();
}
// La tarjeta equivocada: una tarjeta tiene la palabra de otro dibujo
function actWrongCard(it,ctx){
  const st=student(); const P=pools(st); const fcss=fontOf(st).css;
  const src=P.words.length>=8?P.words:WORDS;
  const cards=distinctPics(pickFresh(src,6),3); const odd=pick(cards);
  const first=w=>stripAcc(w.s[0]);
  const lie=pick(src.filter(w=>w.e!==odd.e&&!cards.includes(w)&&first(w)===first(odd)))||pick(src.filter(w=>w.e!==odd.e&&!cards.includes(w)));
  it.key="equivocada:"+odd.w;
  choiceScreen(ctx,{title:actName(ctx.area,ctx.lvl,it.act),
    prompt:`<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask big-ask">¿Qué tarjeta tiene mal la palabra?</span>`,
    options:cards.map(w=>({html:`${pic(w.w,w.e,"emoji in-opt")}<span class="card-w" style="font-family:${fcss}">${txt(st,w===odd?lie.w:w.w)}</span>`,ok:w===odd})), emo:true,
    onSay:()=>speak([I("equivocada")]), record:recFirst(ctx,it)});
  app.querySelectorAll(".opt").forEach(b=>b.classList.add("picword"));
}
// ¿Verdad o mentira?
function actTrueFalse(it,ctx){
  const st=student(); const v=it.item; const w=wordOf(v.k)||{w:v.k,e:"❓"};
  choiceScreen(ctx,{title:actName(ctx.area,ctx.lvl,it.act),
    prompt:`${pic(w.w,w.e)}<span class="phrase" style="font-family:${fontOf(st).css}">${txt(st,v.t)}</span><button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button>`,
    options:[{html:`<span class="yn">✅</span><b>Verdad</b>`,ok:v.ok},{html:`<span class="yn">❌</span><b>Mentira</b>`,ok:!v.ok}], two:true,
    onSay:()=>speak([I("verdad")]), record:recFirst(ctx,it)});
}

/* ---------- ESCUCHAR: conciencia fonológica y comprensión oral ---------- */
const recFirst=(ctx,it)=>(tries,ms)=>record(ctx.area,ctx.lvl,it.key,tries,tries===1?100:Math.max(0,100-50*(tries-1)),ms,it.act);
function actCountSyl(it,ctx){
  const w=it.word, n=w.s.length;
  const clap=k=>`<span class="claps">${Array.from({length:k},()=>`<i>${ICON.clap}</i>`).join("")}</span><b>${k}</b>`;
  choiceScreen(ctx,{title:actName(ctx.area,ctx.lvl,it.act),
    prompt:`${pic(w.w,w.e)}<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask">¿Cuántas palmadas tiene?</span>`,
    options:[1,2,3,4].map(k=>({html:clap(k),ok:k===n})), four:true,
    onSay:()=>say(w.w,"palabra:"+w.w), record:recFirst(ctx,it)});
}
function actSound(it,ctx){
  const start=it.act==="empieza-por";
  let target,good,bad;
  for(let tries=0;tries<40;tries++){
    good=tries<3?pickFresh(WORDS.filter(w=>w.s.length>1||!start),1)[0]:pick(WORDS.filter(w=>w.s.length>1||!start));
    target=start?stripAcc(good.s[0]):stripAcc(pick(good.s));
    const t=target;
    const cand=WORDS.filter(w=>w!==good && (start ? stripAcc(w.s[0])!==t && stripAcc(w.w)[0]!==t[0] : !stripAcc(w.w).includes(t)));
    if(cand.length>=2){ bad=shuffle(cand).slice(0,2); break; }
  }
  it.key=(start?"empieza:":"suena:")+target;
  const opts=shuffle([good,...bad]);
  const q=start?`¿Qué palabra empieza por ${target}?`:`¿Qué palabra tiene ${target}?`;
  choiceScreen(ctx,{title:actName(ctx.area,ctx.lvl,it.act),
    prompt:`<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask big-ask">${start?"¿Cuál empieza por":"¿Cuál tiene"} <b class="snd">«${esc(target)}»</b>?</span>`,
    options:opts.map(w=>({html:`${pic(w.w,w.e,"emoji in-opt")}<i class="opt-w" data-word="${esc(w.w)}" hidden></i>`,ok:w===good})), emo:true,
    onSay:()=>speak([I(start?"empieza":"tiene"),Sy(target)]), record:recFirst(ctx,it)});
}
/* Lee una lista de trozos con pausas (sílabas separadas) */
function ttsSeq(parts,gap=450){ speak(parts.map(t=>Sy(t)),gap); }
const clapsHTML=k=>`<span class="claps">${Array.from({length:k},()=>`<i>${ICON.clap}</i>`).join("")}</span><b>${k}</b>`;
const picOpt=w=>`${pic(w.w,w.e,"emoji in-opt")}<i class="opt-w" data-word="${esc(w.w)}" hidden></i>`;
// Palabra más larga: dos dibujos con distinto número de sílabas
function actLonger(it,ctx){
  const short=it.act==="mas-corta";
  let a,b; for(let i=0;i<80;i++){ a=pickFresh(WORDS,1)[0]; b=pick(WORDS); if(a!==b&&a.s.length!==b.s.length) break; }
  const good=short?(a.s.length<b.s.length?a:b):(a.s.length>b.s.length?a:b); it.key=(short?"corta:":"larga:")+good.w;
  const q=short?"¿Cuál tiene menos palmadas?":"¿Cuál tiene más palmadas?";
  choiceScreen(ctx,{title:actName(ctx.area,ctx.lvl,it.act),
    prompt:`<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask big-ask">${q}</span>`,
    options:shuffle([a,b]).map(w=>({html:picOpt(w),ok:w===good})), emo:true, two:true,
    onSay:()=>speak([I(short?"menos":"mas")]), record:recFirst(ctx,it)});
}
// Une las sílabas: se oyen separadas y se elige el dibujo
function actBlend(it,ctx){
  const w=it.word; const others=shuffle(WORDS.filter(x=>x!==w&&x.s[0]!==w.s[0])).slice(0,2);
  choiceScreen(ctx,{title:actName(ctx.area,ctx.lvl,it.act),
    prompt:`<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask big-ask">Escucha los trocitos y toca el dibujo</span>`,
    options:shuffle([w,...others]).map(x=>({html:pic(x.w,x.e,"emoji in-opt"),ok:x===w})), emo:true,
    onSay:()=>ttsSeq(w.s), record:recFirst(ctx,it)});
}
// ¿Suena igual? Dos palabras: ¿empiezan por la misma sílaba?
function actSameStart(it,ctx){
  const first=w=>stripAcc(w.s[0]);
  const a=pickFresh(WORDS.filter(w=>w.s.length>1),1)[0]; const same=Math.random()<.5;
  let b=same?pick(WORDS.filter(w=>w!==a&&first(w)===first(a))):null;
  if(!b) b=pick(WORDS.filter(w=>first(w)!==first(a)&&stripAcc(w.w)[0]!==stripAcc(a.w)[0]));
  const yes=first(a)===first(b); it.key="igual:"+a.w+"/"+b.w;
  choiceScreen(ctx,{title:actName(ctx.area,ctx.lvl,it.act),
    prompt:`<span class="pair">${pic(a.w,a.e,"emoji pair-p")}${pic(b.w,b.e,"emoji pair-p")}</span><button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask big-ask">¿Empiezan igual?</span>`,
    options:[{html:`<span class="yn">👍</span><b>Sí</b>`,ok:yes},{html:`<span class="yn">👎</span><b>No</b>`,ok:!yes}], two:true,
    onSay:()=>speak([Wd(a.w),Wd(b.w),I("igual")],350), record:recFirst(ctx,it)});
}
// Encadenadas: la palabra que empieza por la sílaba con la que acaba otra
function actChain(it,ctx){
  const last=w=>stripAcc(w.s[w.s.length-1]), first=w=>stripAcc(w.s[0]);
  const bases=WORDS.filter(a=>WORDS.some(b=>b!==a&&first(b)===last(a)));
  const a=pickFresh(bases,1)[0]; const good=pick(WORDS.filter(b=>b!==a&&first(b)===last(a)));
  const bad=shuffle(WORDS.filter(b=>b!==a&&first(b)!==last(a)&&stripAcc(b.w)[0]!==last(a)[0])).slice(0,2);
  it.key="cadena:"+a.w;
  choiceScreen(ctx,{title:actName(ctx.area,ctx.lvl,it.act),
    prompt:`${pic(a.w,a.e)}<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask big-ask">¿Qué palabra empieza como termina <b class="snd">${esc(a.w)}</b>?</span>`,
    options:shuffle([good,...bad]).map(w=>({html:picOpt(w),ok:w===good})), emo:true,
    onSay:()=>speak([I("cadena"),Wd(a.w)]), record:recFirst(ctx,it)});
}
// Añade una sílaba delante: «to» + «pa» → pato
function actAdd(it,ctx){
  const w=pickFresh(WORDS.filter(x=>x.s.length>=2&&x.s.length<=3&&x.s.slice(1).join("").length>=2),1)[0];
  const frag=w.s.slice(1).join(""), syl=w.s[0];
  const sameEnd=WORDS.filter(x=>x!==w&&stripAcc(x.w).endsWith(stripAcc(frag))&&stripAcc(x.s[0])!==stripAcc(syl));
  const bad=shuffle(sameEnd).slice(0,1).concat(shuffle(WORDS.filter(x=>x!==w&&!sameEnd.includes(x)&&stripAcc(x.s[0])!==stripAcc(syl)))).slice(0,2);
  it.key="anade:"+w.w;
  choiceScreen(ctx,{title:actName(ctx.area,ctx.lvl,it.act),
    prompt:`<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask big-ask">Si a <b class="snd">«${esc(frag)}»</b> le pones delante <b class="snd">«${esc(syl)}»</b>, ¿qué palabra sale?</span>`,
    options:shuffle([w,...bad]).map(x=>({html:picOpt(x),ok:x===w})), emo:true,
    onSay:()=>speak([I("si-a"),Sy(frag),I("pones"),Sy(syl),I("sale")]), record:recFirst(ctx,it)});
}
// Cuenta las palabras de una frase
function actCountWords(it,ctx){
  const t=it.phrase.t, n=t.replace(/[.,]/g,"").split(" ").length;
  const opts=[...new Set([n,n-1,n+1,n+2].filter(x=>x>=1))].slice(0,4).sort((a,b)=>a-b);
  choiceScreen(ctx,{title:actName(ctx.area,ctx.lvl,it.act),
    prompt:`${pic(it.phrase.k,it.phrase.e)}<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask">¿Cuántas palabras tiene la frase?</span>`,
    options:opts.map(k=>({html:clapsHTML(k),ok:k===n})), four:opts.length===4,
    onSay:()=>speak(t.replace(/[.,]/g,"").split(" ").map(x=>({t:x})),250), record:recFirst(ctx,it)});
}
// ¿Cómo termina? (última sílaba)
function actEnds(it,ctx){
  let good,bad,target;
  for(let i=0;i<60;i++){ good=i<3?pickFresh(WORDS.filter(w=>w.s.length>1),1)[0]:pick(WORDS.filter(w=>w.s.length>1)); target=stripAcc(good.s[good.s.length-1]);
    const cand=WORDS.filter(w=>w!==good&&stripAcc(w.s[w.s.length-1])!==target&&!stripAcc(w.w).endsWith(target));
    if(cand.length>=2){ bad=shuffle(cand).slice(0,2); break; } }
  it.key="termina:"+target;
  choiceScreen(ctx,{title:actName(ctx.area,ctx.lvl,it.act),
    prompt:`<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask big-ask">¿Cuál termina en <b class="snd">«${esc(target)}»</b>?</span>`,
    options:shuffle([good,...bad]).map(w=>({html:picOpt(w),ok:w===good})), emo:true,
    onSay:()=>speak([I("termina"),Sy(target)]), record:recFirst(ctx,it)});
}
// La intrusa: tres empiezan igual y una no
function actOddOne(it,ctx){
  const groups={}; WORDS.forEach(w=>{ const k=stripAcc(w.s[0]); (groups[k]=groups[k]||[]).push(w); });
  const keys=Object.keys(groups).filter(k=>groups[k].length>=3);
  const k=pickFresh(keys,1,x=>"intrusa:"+x)[0]; const three=shuffle(groups[k]).slice(0,3);
  const odd=pick(WORDS.filter(w=>stripAcc(w.s[0])!==k&&stripAcc(w.w)[0]!==k[0]));
  it.key="intrusa:"+k;
  choiceScreen(ctx,{title:actName(ctx.area,ctx.lvl,it.act),
    prompt:`<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask big-ask">Tres empiezan igual. ¿Cuál es la diferente?</span>`,
    options:shuffle([...three,odd]).map(w=>({html:picOpt(w),ok:w===odd})), emo:true, four:true,
    onSay:()=>speak([I("intrusa")]), record:recFirst(ctx,it)});
}
// Rimas
function actRhyme(it,ctx){
  const groups={}; WORDS.forEach(w=>{ const k=rimaKey(w.w); if(k.length>=2) (groups[k]=groups[k]||[]).push(w); });
  const keys=Object.keys(groups).filter(k=>groups[k].length>=2);
  const k=pickFresh(keys,1,x=>"rima:"+x)[0]; const [base,good]=shuffle(groups[k]).slice(0,2);
  const end2=x=>stripAcc(x).slice(-2);
  const bad=shuffle(WORDS.filter(w=>rimaKey(w.w)!==k&&end2(w.w)!==end2(base.w))).slice(0,2);
  it.key="rima:"+base.w;
  choiceScreen(ctx,{title:actName(ctx.area,ctx.lvl,it.act),
    prompt:`${pic(base.w,base.e)}<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask big-ask">¿Qué palabra rima con <b class="snd">${esc(base.w)}</b>?</span>`,
    options:shuffle([good,...bad]).map(w=>({html:picOpt(w),ok:w===good})), emo:true,
    onSay:()=>speak([I("rima"),Wd(base.w)]), record:recFirst(ctx,it)});
}
/* Opciones que se escuchan: tocar suena y marca; «Comprobar» responde */
function oralChoice(ctx,it,{prompt,onSay,options}){
  const st=student(); applyLook();
  h(`${actHeader(ctx,actName(ctx.area,ctx.lvl,it.act))}
  <div class="main act-main">
    ${dots(ctx.idx,ctx.n)}
    <div class="prompt">${prompt}</div>
    <div class="options">${options.map((o,i)=>`<button class="opt oral" data-i="${i}"><span class="oral-n">${["A","B","C","D"][i]}</span><span class="oral-t">${txt(st,o.label)}</span></button>`).join("")}</div>
    ${okBar()}
  </div>`);
  bindBack(backToArea);
  let sel=-1, tries=0, locked=false, hinted=false; const t0=performance.now();
  app.querySelector("[data-say]").onclick=onSay; setTimeout(onSay,350);
  const btns=[...app.querySelectorAll(".opt.oral")];
  btns.forEach(b=>b.onclick=()=>{ if(locked) return; sel=+b.dataset.i; btns.forEach(x=>x.classList.toggle("sel",x===b)); tts(options[sel].say); });
  app.querySelector("[data-ok]").onclick=()=>{
    if(locked) return; if(sel<0){ speak([I("toca")]); return; }
    tries++; const b=btns[sel];
    if(options[sel].ok){ locked=true; b.classList.add("ok"); record(ctx.area,ctx.lvl,it.key,tries,tries===1?100:Math.max(0,100-50*(tries-1)),performance.now()-t0,it.act);
      celebrate(); praise(); setTimeout(()=>ctx.done(tries===1),1400); }
    else { b.classList.remove("bad","sel"); void b.offsetWidth; b.classList.add("bad"); sel=-1; tryAgain();
      if(!hinted && tries>=2 && giveHint(btns,i=>options[i].ok)){ hinted=true; tries++; } }
  };
}
// Quita una sílaba (la primera)
function actDelete(it,ctx){
  const w=it.word, s=w.s;
  const right=s.slice(1).join(""), wrong1=s.slice(0,-1).join(""), wrong2=[s[0],...s.slice(2)].join("");
  const opts=shuffle([{label:right,say:right,ok:true},{label:wrong1,say:wrong1},{label:wrong2,say:wrong2}].filter((o,i,a)=>a.findIndex(x=>x.label===o.label)===i));
  oralChoice(ctx,it,{prompt:`${pic(w.w,w.e)}<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask big-ask">Si a <b class="snd">${esc(w.w)}</b> le quitas <b class="snd">«${esc(s[0])}»</b>, ¿qué queda?</span>`,
    onSay:()=>speak([I("si-a"),Wd(w.w),I("quitas"),Sy(s[0]),I("queda")]), options:opts});
}
// Da la vuelta (palabras de dos sílabas)
function actReverse(it,ctx){
  const w=it.word, [a,b]=w.s;
  const right=b+a, wrong1=a+b, wrong2=(b+b!==right&&b+b!==wrong1)?b+b:a+a;
  const opts=shuffle([{label:right,say:right,ok:true},{label:wrong1,say:wrong1},{label:wrong2,say:wrong2}]);
  oralChoice(ctx,it,{prompt:`${pic(w.w,w.e)}<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask big-ask">Di <b class="snd">${esc(w.w)}</b> al revés: <b class="snd">${esc(a)}-${esc(b)}</b> → ?</span>`,
    onSay:()=>speak([I("di"),Wd(w.w),I("reves")]), options:opts});
}
function randomScene(){
  let sc;
  for(let i=0;i<25;i++){ const a=pick(SCENE_ACT); const s=pick(SCENE_SUBJ.filter(x=>a.who.includes(x.k))); const o=pick(a.objs);
    sc={s,a,o}; if(!recentList().includes(sceneText(sc))) break; }
  remember(sceneText(sc)); return sc;
}
function sceneText(sc){ return `${sc.s.t} ${sc.a.t} ${sc.o.t}.`; }
function sceneHTML(sc,cls=""){ return `<span class="scene ${cls}">${pic(sc.s.k,sc.s.e,"emoji sc-s")}<span class="sc-a">${pic(sc.a.k,sc.a.e,"emoji sc-v")}</span>${pic(sc.o.k,sc.o.e,"emoji sc-o")}</span>`; }
function actChooseScene(it,ctx){
  const sc=it.scene; const txt=sceneText(sc);
  const altS=pick(SCENE_SUBJ.filter(x=>x.k!==sc.s.k&&sc.a.who.includes(x.k)));
  const altO=pick(sc.a.objs.filter(x=>x.k!==sc.o.k));
  const opts=shuffle([{sc,ok:true},{sc:{s:altS,a:sc.a,o:sc.o}},{sc:{s:sc.s,a:sc.a,o:altO}}]);
  choiceScreen(ctx,{title:actName(ctx.area,ctx.lvl,it.act),
    prompt:`<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask">Escucha y toca el dibujo</span>`,
    options:opts.map(o=>({html:sceneHTML(o.sc),ok:!!o.ok})), emo:true, wide:true,
    onSay:()=>say(txt,"frase:"+txt), record:recFirst(ctx,it)});
}
function actBuildScene(it,ctx){
  const sc=it.scene; const txt=sceneText(sc); applyLook();
  const altS=pick(SCENE_SUBJ.filter(x=>x.k!==sc.s.k&&sc.a.who.includes(x.k)));
  const altO=pick(sc.a.objs.filter(x=>x.k!==sc.o.k));
  const target=[{k:sc.s.k,e:sc.s.e},{k:sc.a.k,e:sc.a.e},{k:sc.o.k,e:sc.o.e}];
  const tiles=shuffle([...target,{k:altS.k,e:altS.e},{k:altO.k,e:altO.e}]);
  const slots=[null,null,null]; let tries=0, locked=false; const t0=performance.now();
  h(`${actHeader(ctx,actName(ctx.area,ctx.lvl,it.act))}
  <div class="main act-main">
    ${dots(ctx.idx,ctx.n)}
    <div class="prompt"><button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask">Escucha y pon los dibujos en orden</span></div>
    <div class="slots scene-slots" data-slots></div>
    <div class="tiles scene-tiles" data-tiles></div>
    ${okBar()}
  </div>`);
  bindBack(backToArea);
  const sayIt=()=>say(txt,"frase:"+txt); app.querySelector("[data-say]").onclick=sayIt; setTimeout(sayIt,350);
  const sEl=app.querySelector("[data-slots]"), tEl=app.querySelector("[data-tiles]");
  function paint(){
    sEl.innerHTML=slots.map((t,i)=>`<button class="slot pic-slot ${t?"full":""}" data-si="${i}" aria-label="${t?esc(t.k):"Hueco "+(i+1)}">${t?pic(t.k,t.e,"emoji in-slot"):`<span class="slot-n">${i+1}</span>`}</button>`).join("");
    tEl.innerHTML=tiles.map((t,i)=>`<button class="piece pic-piece ${slots.includes(t)?"used":""}" data-ti="${i}">${pic(t.k,t.e,"emoji in-slot")}</button>`).join("");
    sEl.querySelectorAll("[data-si]").forEach(b=>b.onclick=()=>{ if(locked) return; const i=+b.dataset.si; if(slots[i]){slots[i]=null;paint();} });
    tEl.querySelectorAll("[data-ti]").forEach(b=>b.onclick=()=>{ if(locked) return; const t=tiles[+b.dataset.ti]; if(slots.includes(t)) return;
      const f=slots.indexOf(null); if(f<0) return; slots[f]=t; paint(); });
    okBtn.classList.toggle("ready",!slots.includes(null));
  }
  const okBtn=app.querySelector("[data-ok]");
  okBtn.onclick=()=>{ if(locked) return; if(slots.includes(null)){ speak([I("huecos")]); return; } check(); };
  function check(){
    tries++; const ok=slots.every((s,i)=>s.k===target[i].k);
    if(ok){ locked=true; sEl.classList.add("ok"); record(ctx.area,ctx.lvl,it.key,tries,tries===1?100:Math.max(0,100-34*(tries-1)),performance.now()-t0,it.act);
      celebrate(); praise(); setTimeout(()=>ctx.done(tries===1),1500); }
    else{ locked=true; sEl.querySelectorAll(".slot").forEach((b,i)=>{ if(slots[i].k!==target[i].k) b.classList.add("bad"); }); tryAgain();
      setTimeout(()=>{ slots.forEach((s,i)=>{ if(s.k!==target[i].k) slots[i]=null; }); locked=false; paint(); sayIt(); },1200); }
  }
  paint();
}
/* ---------- LAS TIJERAS: separar las palabras de una frase ---------- */
function actScissors(it,ctx){
  const st=student(); applyLook(); const fcss=fontOf(st).css;
  const words=it.phrase.t.replace(/[.,]/g,"").split(" ").map(w=>show(st,w));
  const letters=[]; const bounds=new Set(); let pos=0;
  words.forEach((w,i)=>{ [...w].forEach(c=>letters.push(c)); pos+=[...w].length; if(i<words.length-1) bounds.add(pos); });
  const cuts=new Set(); let tries=0, locked=false; const t0=performance.now();
  h(`${actHeader(ctx,actName(ctx.area,ctx.lvl,it.act))}
  <div class="main act-main">
    ${dots(ctx.idx,ctx.n)}
    <div class="prompt">${pic(it.phrase.k,it.phrase.e)}<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask">Toca entre las letras para separar las palabras</span></div>
    <div class="scissors" style="font-family:${fcss}" data-sc></div>
    <div class="row" style="justify-content:center;margin-top:1.2em"><button class="btn ok big-btn" data-ok>${ICON.check} Ya está</button></div>
  </div>`);
  bindBack(backToArea);
  const sayIt=()=>say(it.phrase.t,"frase:"+it.phrase.t); app.querySelector("[data-say]").onclick=sayIt;
  const el=app.querySelector("[data-sc]");
  function paint(bad){
    el.innerHTML=letters.map((c,i)=>`${i>0?`<button class="cut ${cuts.has(i)?"on":""} ${bad&&bad.has(i)?"bad":""}" data-c="${i}" aria-label="Cortar aquí"><i></i></button>`:""}<span class="lt">${st.cfg.font==="cursiva"&&/[a-zñáéíóúü]/.test(c)?ESCOLAR.svgWord(c):esc(c)}</span>`).join("");
    el.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{ if(locked) return; const i=+b.dataset.c; cuts.has(i)?cuts.delete(i):cuts.add(i); paint(); });
  }
  app.querySelector("[data-ok]").onclick=()=>{
    if(locked) return; tries++;
    const wrong=new Set([...cuts].filter(i=>!bounds.has(i))); const missing=[...bounds].filter(i=>!cuts.has(i));
    if(!wrong.size && !missing.length){
      locked=true; el.classList.add("ok"); record(ctx.area,ctx.lvl,it.key,tries,tries===1?100:Math.max(0,100-34*(tries-1)),performance.now()-t0,it.act);
      celebrate(); praise(); setTimeout(()=>ctx.done(tries===1),1500);
    }else{
      paint(wrong); tryAgain();
      setTimeout(()=>{ wrong.forEach(i=>cuts.delete(i)); paint(); },1200);
    }
  };
  paint();
}

/* ---------- ESCRIBIR ---------- */
function letterStats(stId){
  const done={};
  DB.records.filter(r=>r.st===stId&&r.area==="escritura"&&r.lvl===1&&!r.fail).forEach(r=>{done[r.item]=Math.max(done[r.item]||0,r.acc)});
  return done;
}
function screenAlphabet(){
  flushPending(); S.screenSeq=(S.screenSeq||0)+1;
  const st=student(); applyLook(); const en=new Set(enabledLetters(st));
  const done=S.demo?{}:letterStats(st.id); const fcss=fontOf(st).css;
  h(`${topBar("Elige una letra",true)}
  <div class="main">
    <div class="abc">${LETTERS.map(l=>`
      <button class="tile ${done[l]!=null?"done":""} ${en.has(l)?"":"off"}" data-l="${l}">
        ${done[l]!=null?`<span class="star">${ICON.star}</span>`:""}
        <span class="big" style="font-family:${fcss}">${txt(st,l)}</span>
      </button>`).join("")}</div>
    <p class="hint" style="margin-top:1em">${Object.keys(done).filter(l=>en.has(l)).length} de ${en.size} letras practicadas</p>
  </div>`);
  bindBack(backToArea);
  app.querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>traceLetter(b.dataset.l));
}
function traceLetter(l){
  const st=student(); const en=enabledLetters(st);
  const w=wordOf(LETTER_WORD[l]);
  traceScreen({text:l,title:`La letra ${show(st,l)}`,word:w,speak:()=>say(`${LETTER_NAMES[l]}, de ${w.w}`,"letra:"+l),
    lvl:1,act:"trazo",autoDemo:true,onBack:screenAlphabet,nextLabel:"Siguiente letra",
    onDone:()=>{ const i=en.indexOf(l); traceLetter(en[(i+1)%en.length]); }});
}
const cleanPhrase=t=>t.replace(/[.,¿?¡!]/g,"").trim();
const sayItem=(it,lvl)=>it.phrase?say(it.phrase.t,"frase:"+it.phrase.t):lvl===1?say(LETTER_NAMES[it.key]||it.key,"letra:"+it.key):lvl===2?say(it.key,"silaba:"+it.key):say(it.key,"palabra:"+it.key);
// Tarjeta lateral con el modelo grande (sin dibujo): letras, sílabas y frases
const modelCard=(st,text,ph)=>`<div class="side-card word-card big-model">${ph?pic(ph.k,ph.e):""}<div class="word model-${text.length>8?"long":"short"}" style="font-family:${fontOf(st).css}">${txt(st,text)}</div></div>`;
const earCard=()=>`<div class="side-card word-card ear-card"><span class="ear-big">${ICON.ear}</span><div class="muted">Escucha y escribe</div></div>`;
function actTrace(it,ctx){
  const isWord=ctx.lvl===3;
  if(it.phrase){
    return traceScreen({text:cleanPhrase(it.phrase.t),item:it.phrase.t,title:actName("escritura",ctx.lvl,"trazo"),lvl:ctx.lvl,act:"trazo",progress:[ctx.idx,ctx.n],
      side:`<div class="side-card word-card">${pic(it.phrase.k,it.phrase.e)}</div>`,speak:()=>sayItem(it,4),onBack:backToArea,onDone:firstTry=>ctx.done(firstTry)}); }
  traceScreen({text:it.key,title:actName("escritura",ctx.lvl,"trazo"),word:it.word||null,lvl:ctx.lvl,act:"trazo",progress:[ctx.idx,ctx.n],
    speak:()=>say(it.key,(isWord?"palabra:":"silaba:")+it.key),
    onBack:backToArea,onDone:firstTry=>ctx.done(firstTry)});
}
// Copia (letra, sílaba, palabra o frase): se ve escrita y se escribe en la pauta sin modelo punteado
function actCopy(it,ctx){
  const st=student(); const lvl=ctx.lvl; const text=it.phrase?cleanPhrase(it.phrase.t):it.key;
  traceScreen({text,item:it.phrase?it.phrase.t:it.key,title:actName("escritura",lvl,"copia"),word:lvl===3?it.word:null,lvl,act:"copia",progress:[ctx.idx,ctx.n],
    blank:true,bigModel:true,side:lvl===3?undefined:modelCard(st,it.phrase?it.phrase.t:it.key,it.phrase),
    speak:()=>{ speak([I("copia")]); setTimeout(()=>sayItem(it,lvl),1600); },onBack:backToArea,onDone:firstTry=>ctx.done(firstTry)});
}
// Escribe lo que oyes: a mano y sin verlo
function actDictHand(it,ctx){
  const lvl=ctx.lvl;
  traceScreen({text:it.key,title:actName("escritura",lvl,"dictado-mano"),lvl,act:"dictado-mano",progress:[ctx.idx,ctx.n],
    blank:true,side:earCard(),speak:()=>sayItem(it,lvl),onBack:backToArea,onDone:firstTry=>ctx.done(firstTry)});
}
// ¿Con qué letra empieza?: se ve el dibujo y se escribe la primera letra
function actFirstLetter(it,ctx){
  const w=it.word;
  traceScreen({text:w.w[0],item:w.w,title:actName("escritura",1,"empieza-letra"),lvl:1,act:"empieza-letra",progress:[ctx.idx,ctx.n],
    blank:true,side:`<div class="side-card word-card">${pic(w.w,w.e)}</div>`,
    speak:()=>speak([Wd(w.w),I("empieza-letra")]),onBack:backToArea,onDone:firstTry=>ctx.done(firstTry)});
}
// Preescritura: caminos para repasar
function actPre(it,ctx){
  const p=PRE.info(it.key);
  traceScreen({text:it.key,item:"trazo:"+it.key,title:actName("escritura",1,"preescritura")+" · "+p.name,lvl:1,act:"preescritura",progress:[ctx.idx,ctx.n],
    layoutFn:PRE.layout,side:`<div class="side-card word-card pre-card"><span class="pre-ico">${p.icon}</span><div class="word">${esc(p.name)}</div></div>`,
    speak:()=>speak([I("pre")]),autoDemo:true,onBack:backToArea,onDone:firstTry=>ctx.done(firstTry)});
}
// Completa: falta una letra (nivel 3) o una sílaba (nivel 2) y se escribe a mano
function actComplete(it,ctx){
  const st=student(); const w=it.word.w;
  let miss,pre,post;
  if(ctx.lvl===2){ const sy=it.word.s; miss=sy[it.idx]; pre=sy.slice(0,it.idx).join(""); post=sy.slice(it.idx+1).join(""); }
  else { miss=w[it.idx]; pre=w.slice(0,it.idx); post=w.slice(it.idx+1); }
  const gap=`<span class="gap-word">${pre?txt(st,pre):""}<span class="gap">?</span>${post?txt(st,post):""}</span>`;
  traceScreen({text:miss,item:w,title:actName("escritura",ctx.lvl,"completa"),word:it.word,lvl:ctx.lvl,act:"completa",progress:[ctx.idx,ctx.n],
    blank:true,wordHTML:gap,speak:()=>speak([Wd(w),I(ctx.lvl===2?"completa-silaba":"completa")]),onBack:backToArea,onDone:firstTry=>ctx.done(firstTry)});
}
function traceScreen(o){
  const st=student(); applyLook();
  const tol=TOLERANCE[st.helps.tol]||TOLERANCE.media;
  const font=fontOf(st); const text=o.layoutFn?o.text:font.transform(o.text);
  const escolar=st.cfg.font==="cursiva";
  const ordered=o.layoutFn ? true : escolar ? ESCOLAR.supports(text) : TRAZOS.supports(text);
  const showWord=o.word && (st.helps.picto || o.lvl>1 || o.blank);
  h(`${topBar((o.progress?"Escribir · ":"")+esc(o.title),true)}
  <div class="main trace-main">
    ${o.progress?dots(o.progress[0],o.progress[1]):""}
    <div class="trace-wrap">
      <div class="trace-side">
        ${o.side!==undefined?o.side:showWord?`<div class="side-card word-card ${o.bigModel?"big-model":""}">${pic(o.word.w,o.word.e)}<div class="word" style="font-family:${font.css}">${o.wordHTML||txt(st,o.word.w)}</div></div>`:""}
        <div class="tools">
          <button class="btn primary" data-say>${ICON.speaker}<span>Escuchar</span></button>
          ${ordered&&!o.blank?`<button class="btn" data-demo>${ICON.play}<span>Ver cómo se hace</span></button>`:""}
          <button class="btn" data-clear>${ICON.eraser}<span>Borrar</span></button>
          ${ordered?"":`<button class="btn ok" data-check>${ICON.check}<span>He terminado</span></button>`}
          <div class="side-card status"><div class="meter"><i data-meter></i></div><div class="hint" data-msg>${o.blank?"Empieza en el punto verde":ordered?"Empieza en el punto verde y sigue la flecha":"Repasa la letra con el dedo"}</div></div>
        </div>
      </div>
      <div class="trace-board">${text.replace(/ /g,"").length>3&&!o.layoutFn?`<div class="rotate-hint">📱↻ Gira el móvil para escribir más grande</div>`:""}<canvas data-guide></canvas><canvas data-demo-c></canvas><canvas data-ink></canvas></div>
    </div>
  </div>`);
  const board=app.querySelector(".trace-board"), meter=app.querySelector("[data-meter]"), msg=app.querySelector("[data-msg]");
  const sens=sensible();
  const colors=sens?{ink:"#4A5568",done:"#3F7D5C",guide:"#EEF0F3",start:"#3F7D5C",dots:"#7A8394",future:"#D5D9E0",fill:"#E2E5EA",lines:["#E1E4E9","#B9C6D6","#8EA3BD"]}:{};
  const t0=performance.now(); let finished=false;
  const onProgress=(p,m,warn)=>{ meter.style.width=Math.round(p*100)+"%"; meter.style.background=warn?"var(--warn)":"var(--ok)"; if(m!=null&&m!=="") msg.textContent=m; else if(m==="" && p<1 && !finished) {} };
  const onSuccess=(acc,errors)=>{
    finished=true;
    record("escritura",o.lvl,o.item||o.text,errors+1,acc,performance.now()-t0,o.act);
    celebrate(); praise(); msg.textContent="¡Conseguido!";
    const tools=app.querySelector(".tools");
    const nb=document.createElement("button"); nb.className="btn primary next-btn"; nb.innerHTML=`${ICON.next}<span>${o.nextLabel||"Siguiente"}</span>`;
    const tok=S.screenSeq; nb.onclick=()=>{cleanup(); if(S.screenSeq===tok) o.onDone(errors===0);}; tools.prepend(nb);
    if(!o.nextLabel) setTimeout(()=>{ if(document.body.contains(nb)) nb.click(); },1800);
  };
  const opts={text,guide:app.querySelector("[data-guide]"),ink:app.querySelector("[data-ink]"),demo:app.querySelector("[data-demo-c]"),
    tol,colors,onProgress,onSuccess,say:m=>tts(m),still:sens,fontCss:font.css,layout:o.layoutFn||(escolar?ESCOLAR.layout:null),blank:!!o.blank};
  const eng=ordered?createStrokeEngine(opts):createCoverageEngine(opts);
  startPending({area:"escritura",lvl:o.lvl,act:o.act,item:o.item||o.text,getTries:()=>eng.errors});
  let touched=false;
  app.querySelector("[data-ink]").addEventListener("pointerdown",()=>{ touched=true; if(S.pending) S.pending.touched=true; });
  bindBack(()=>{ cleanup(); o.onBack(); });
  app.querySelector("[data-say]").onclick=o.speak;
  app.querySelector("[data-clear]").onclick=()=>{ eng.clear(); msg.textContent=ordered?"Empieza en el punto verde y sigue la flecha":"Repasa la letra con el dedo"; };
  const ch=app.querySelector("[data-check]"); if(ch) ch.onclick=()=>eng.check(true);
  const dm=app.querySelector("[data-demo]"); if(dm) dm.onclick=()=>eng.demo();
  let first=true;
  const ro=new ResizeObserver(()=>{ const r=board.getBoundingClientRect(); if(r.width<10||r.height<10) return; eng.resize(r.width,r.height);
    if(first){ first=false; setTimeout(()=>{ o.speak(); if(ordered&&o.autoDemo) setTimeout(()=>{ if(!touched) eng.demo(); },900); },300); } });
  function cleanup(){ ro.disconnect(); eng.destroy(); }
  const _back=app.querySelector("[data-back]"); if(_back) _back.addEventListener("click",flushPending,true);
  document.fonts.load(`100px ${font.css}`).then(()=>ro.observe(board));
}

/* =========================================================
   DOCENTES
   ========================================================= */
function teacherLogin(){
  if(!DB.teachers.length) return teacherSetup();
  modal(`<h3>Entrar como docente</h3><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(9em,1fr))">
    ${DB.teachers.map(t=>`<button class="tile" data-t="${t.id}" style="min-height:5em"><span style="font-size:2em">👩‍🏫</span>${esc(t.name)}</button>`).join("")}
  </div><div class="row end"><button class="btn" data-x>Cancelar</button></div>`,(m,close)=>{
    m.querySelector("[data-x]").onclick=close;
    m.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{close(); pinPad(byId(DB.teachers,b.dataset.t));});
  });
}
function pinPad(t){
  let pin="";
  modal(`<h3 style="text-align:center">${esc(t.name)}: escribe tu PIN</h3><div class="pin-dots">${"<span></span>".repeat(4)}</div>
    <div class="keypad">${[1,2,3,4,5,6,7,8,9,"⌫",0,"✕"].map(k=>`<button data-k="${k}">${k}</button>`).join("")}</div>`,(m,close)=>{
    const dd=m.querySelectorAll(".pin-dots span"); const paint=()=>dd.forEach((d,i)=>d.classList.toggle("on",i<pin.length));
    m.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>{
      const k=b.dataset.k; if(k==="✕") return close(); if(k==="⌫"){pin=pin.slice(0,-1);paint();return;}
      pin+=k; paint();
      if(pin.length===4){ if(pin===t.pin){ close(); S.teacherId=t.id; S.tTab="grupos"; teacherPanel(); } else { toast("PIN incorrecto"); pin=""; setTimeout(paint,200); } }
    });
  });
}
function teacherSetup(){
  modal(`<h3>Bienvenida</h3><p class="muted">Crea la primera cuenta docente. Será la de administración: podrá ver todas las clases y dar de alta a otros docentes.</p>
  <div class="form"><label>Nombre<input type="text" data-n placeholder="Ej.: Seño Marta"></label>
  <label>Elige un PIN de 4 cifras<input type="password" inputmode="numeric" maxlength="4" data-p></label>
  <label>Repite el PIN<input type="password" inputmode="numeric" maxlength="4" data-p2></label>
  <p class="muted small-t" style="margin:0">Apúntalo en un sitio seguro: lo necesitarás para entrar en el panel. Si lo olvidas, otra cuenta de administración puede cambiarlo.</p></div>
  <div class="row end"><button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>Crear</button></div>`,(m,close)=>{
    m.querySelector("[data-x]").onclick=close;
    m.querySelector("[data-ok]").onclick=()=>{
      const n=m.querySelector("[data-n]").value.trim(), p=m.querySelector("[data-p]").value.trim();
      if(!n||!/^\d{4}$/.test(p)) return toast("Escribe un nombre y un PIN de 4 cifras");
      if(p!==m.querySelector("[data-p2]").value.trim()) return toast("Los dos PIN no coinciden");
      const t={id:uid(),name:n,pin:p,admin:true}; DB.teachers.push(t); save(); close();
      S.teacherId=t.id; S.tTab="grupos"; teacherPanel();
    };
  });
}
function me(){ return byId(DB.teachers,S.teacherId); }
// El progreso hecho en una clase solo lo ve quien da clase en ella, también si es de administración
const teachesIn=gid=>{ const t=me(), g=byId(DB.groups,gid); return !!(t&&g&&(g.teachers||[]).includes(t.id)); };
function visibleRecs(s){ return DB.records.filter(r=>r.st===s.id&&teachesIn(r.g||s.group)); }
function myGroups(){ const t=me(); return DB.groups.filter(g=>t.admin||(g.teachers||[]).includes(t.id)); }
const DAY=864e5;
function backupBanner(){
  const last=Math.max(DB.settings.lastBackup||0,DB.settings.lastAutoBackup||0);
  if(!DB.records.length) return "";
  const days=last?Math.floor((Date.now()-last)/DAY):null;
  if(days!==null && days<14) return "";
  return `<div class="banner">${ICON.lock}<span>${days===null?"Todavía no has hecho ninguna copia de seguridad.":`Hace ${days} días de la última copia de seguridad.`}</span><button class="btn small" data-gobackup>Hacer copia</button></div>`;
}
// Primeros pasos: se ve hasta que está todo hecho (o se oculta)
function firstSteps(){
  if(DB.settings.stepsHidden) return "";
  const gs=myGroups(); const gids=new Set(gs.map(g=>g.id));
  const hasSt=DB.students.some(s=>classesOf(s).some(g=>gids.has(g.id))); const tried=DB.records.length>0||DB.settings.tried;
  if(gs.length&&hasSt&&tried) return "";
  const step=(n,done,label,k,enabled)=>`<li class="${done?"done":""}"><span class="st-n">${done?"✓":n}</span><span class="grow">${label}</span>${done?"":`<button class="btn small ${enabled?"primary":""}" data-step="${k}" ${enabled?"":"disabled"}>${n===1?"Crear clase":n===2?"Añadir alumnos":"Probar"}</button>`}</li>`;
  return `<div class="panel steps"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Primeros pasos</h3><button class="btn small" data-step="ocultar">Ocultar</button></div>
    <ol>${step(1,gs.length>0,"Crea una clase (por ejemplo, «Infantil 5 años A»)","clase",true)}
    ${step(2,hasSt,"Añade al alumnado: pega la lista de nombres","alumnos",gs.length>0)}
    ${step(3,tried,"Pruébalo: elige un alumno o «Toda la clase» y haz una actividad","probar",hasSt)}</ol></div>`;
}
function teacherPanel(){
  flushPending(); S.screenSeq=(S.screenSeq||0)+1;
  const t=me(); if(!t) return screenGroups(true);
  const oldMain=app.querySelector(".teacher .main"); const keep=oldMain && S.tTabPrev===S.tTab+"|"+(S.tStudent||"") ? oldMain.scrollTop : 0;
  S.tTabPrev=S.tTab+"|"+(S.tStudent||"");
  document.body.classList.remove("grande");
  document.body.classList.toggle("sensible",DB.settings.look==="sensible"); document.body.classList.remove("plus");
  const tabs=[["grupos","Clases"],["alumnos","Alumnado"],["progreso","Progreso"],["palabras","Palabras"],["audios","Audios"],["copias","Copias"],["ajustes","Ajustes"]];
  if(t.admin) tabs.push(["docentes","Docentes"]);
  h(`<div class="teacher">
    <div class="top"><h1>Panel docente</h1><div class="who">👩‍🏫 <span class="nm">${esc(t.name)}</span></div><button class="btn small primary" data-proj>${ICON.expand} Proyectar</button><button class="btn small" data-out>Salir</button></div>
    <div class="tabs">${tabs.map(([k,l])=>`<button data-tab="${k}" class="${S.tTab===k?"on":""}">${l}</button>`).join("")}</div>
    <div class="main" style="padding-top:1em">${backupBanner()}${firstSteps()}<div data-body></div></div></div>`);
  app.querySelector("[data-out]").onclick=()=>{S.teacherId=null;screenGroups(true);};
  app.querySelector("[data-proj]").onclick=startProjection;
  app.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{S.tTab=b.dataset.tab; S.tStudent=null; teacherPanel();});
  app.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>{ const k=b.dataset.step;
    if(k==="clase"){ S.tTab="grupos"; teacherPanel(); groupForm(null); }
    else if(k==="alumnos"){ const g=myGroups()[0]; S.tGroup=g.id; S.tTab="alumnos"; teacherPanel(); bulkAdd(g); }
    else if(k==="probar"){ const g=myGroups().find(x=>DB.students.some(st=>inGroup(st,x.id)))||myGroups()[0]; S.teacherId=null; S.groupId=g.id; screenStudents(); }
    else if(k==="ocultar"){ DB.settings.stepsHidden=true; save(); teacherPanel(); } });
  const gb=app.querySelector("[data-gobackup]"); if(gb) gb.onclick=()=>{S.tTab="copias";teacherPanel();};
  const body=app.querySelector("[data-body]");
  ({grupos:tabGroups,alumnos:tabStudents,progreso:tabProgress,palabras:tabWords,audios:tabAudios,copias:tabBackup,ajustes:tabSettings,docentes:tabTeachers})[S.tTab](body);
  if(keep) app.querySelector(".teacher .main").scrollTop=keep;
}

/* ---- Modo proyección: actividades para toda la clase, sin guardar progreso ---- */
function startProjection(){
  const gs=myGroups(); if(!gs.length) return toast("Primero crea una clase");
  modal(`<h3>Proyectar en la pizarra</h3><p class="muted">Las actividades se hacen con toda la clase. No se guarda el progreso de nadie.</p>
    <div class="form"><label>Clase (para el nivel y el tipo de letra)<select data-pg>${gs.map(g=>`<option value="${g.id}" ${g.id===S.tGroup?"selected":""}>${esc(g.name)}</option>`).join("")}</select></label></div>
    <div class="row end"><button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>${ICON.expand} Empezar</button></div>`,(m,close)=>{
    m.querySelector("[data-x]").onclick=close;
    m.querySelector("[data-ok]").onclick=()=>{ const g=m.querySelector("[data-pg]").value; close();
      S.teacherId=null; S.groupId=g; S.studentId=null; S.demo=true; S.demoLevels=null;
      if(!document.fullscreenElement) toggleFullscreen(); screenStudentHome(); };
  });
}

/* Registro de quién se añade o se quita como docente de una clase (por transparencia: da acceso al progreso) */
function logTeachers(g,before){
  const after=g.teachers||[]; const add=after.filter(x=>!before.includes(x)), rm=before.filter(x=>!after.includes(x));
  if(!add.length&&!rm.length) return;
  g.log=[...(g.log||[]),{t:Date.now(),by:S.teacherId,add,rm}].slice(-40);
}
const tName=id=>{ const t=byId(DB.teachers,id); return t?t.name:"(docente borrado)"; };
const logLine=e=>{ const who=(ids,verb,self)=>{ const me_=ids.includes(e.by), others=ids.filter(x=>x!==e.by).map(id=>esc(tName(id)));
    return [me_?self:"",others.length?`${verb} a ${others.join(", ")}`:""].filter(Boolean).join(" y "); };
  const parts=[e.add.length?who(e.add,"añadió","se añadió como docente"):"",e.rm.length?who(e.rm,"quitó","se quitó como docente"):""].filter(Boolean);
  return `<li><span class="muted">${fmtDate(e.t)}</span> · <b>${esc(tName(e.by))}</b> ${parts.join(" y ")}</li>`; };

/* ---- Clases ---- */
function cfgFields(cfg){
  return `<div class="two">
    <label>Escuchar<select data-cu>${LEVELS.escucha.slice(1).map((n,i)=>`<option value="${i+1}" ${(cfg.escucha||1)==i+1?"selected":""}>${i+1}. ${n}</option>`).join("")}</select></label>
    <label>Leer<select data-cl>${LEVELS.lectura.slice(1).map((n,i)=>`<option value="${i+1}" ${cfg.lectura==i+1?"selected":""}>${i+1}. ${n}</option>`).join("")}</select></label>
    <label>Escribir<select data-ce>${LEVELS.escritura.slice(1).map((n,i)=>`<option value="${i+1}" ${cfg.escritura==i+1?"selected":""}>${i+1}. ${n}</option>`).join("")}</select></label>
    <label>Tipo de letra<select data-cf>${Object.entries(FONTS).map(([k,f])=>`<option value="${k}" ${cfg.font==k?"selected":""}>${f.label}</option>`).join("")}</select></label>
  </div>
  <p class="muted small-t" style="margin:.6em 0 0">El nivel indica por dónde empezar: el alumno puede abrir todas las actividades, pero las de su nivel aparecen marcadas con una estrella ⭐.</p>`;
}
const readCfg=m=>({lectura:+m.querySelector("[data-cl]").value,escritura:+m.querySelector("[data-ce]").value,escucha:+m.querySelector("[data-cu]").value,font:m.querySelector("[data-cf]").value});
function tabGroups(body){
  const gs=myGroups();
  body.innerHTML=`<div class="panel"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Mis clases</h3><button class="btn primary" data-new>Nueva clase</button></div></div>
  ${gs.length?gs.map(g=>{const n=DB.students.filter(s=>inGroup(s,g.id)).length;
    const tn=(g.teachers||[]).map(id=>byId(DB.teachers,id)).filter(Boolean).map(x=>`<span class="chip">${esc(x.name)}</span>`).join("");
    return `<div class="panel"><div class="list-item"><span class="av gicon" style="--gc:${g.color}">${g.icon||"🏫"}</span>
    <div class="grow"><b>${esc(g.name)}</b>${DB.settings.lock&&DB.settings.fixedGroup===g.id?` <span class="chip">Clase fija en este equipo</span>`:""}<div class="muted small-t">${n} alumnos · Empieza en: Escuchar ${LEVELS.escucha[g.defaults.escucha||1]} · Leer ${LEVELS.lectura[g.defaults.lectura]} · Escribir ${LEVELS.escritura[g.defaults.escritura]} · ${FONTS[g.defaults.font].label}</div><div>${tn}</div>${(g.log||[]).length&&(g.teachers||[]).includes(me().id)?`<ul class="t-log small-t">${logLine(g.log[g.log.length-1])}</ul>`:""}</div>
    <button class="btn small" data-edit="${g.id}">Editar</button><button class="btn small" data-st="${g.id}">Alumnado</button></div></div>`;}).join("")
  :`<div class="panel empty">Aún no tienes clases. Crea la primera con «Nueva clase».</div>`}`;
  body.querySelector("[data-new]").onclick=()=>groupForm(null);
  body.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>groupForm(byId(DB.groups,b.dataset.edit)));
  body.querySelectorAll("[data-st]").forEach(b=>b.onclick=()=>{S.tGroup=b.dataset.st;S.tTab="alumnos";teacherPanel();});
}
function groupForm(g){
  const isNew=!g; const t=me();
  g=g||{id:uid(),name:"",color:GROUP_COLORS[DB.groups.length%GROUP_COLORS.length],icon:"🏫",defaults:defaultCfg(),teachers:[t.id]};
  let color=g.color, icon=g.icon;
  const icons=["🏫","🌈","🐞","🦋","🌻","🚀","🐠","🦁","🍎","⭐","🌳","🎨"];
  modal(`<h3>${isNew?"Nueva clase":"Editar clase"}</h3><div class="form">
    <label>Nombre<input type="text" data-n value="${esc(g.name)}" placeholder="Ej.: Infantil 5 años A, Aula PT…"></label>
    <div><b class="small-t">Color</b><div class="row" style="margin-top:.3em">${GROUP_COLORS.map(c=>`<span class="swatch ${c===color?"on":""}" data-c="${c}" style="background:${c}"></span>`).join("")}</div></div>
    <div><b class="small-t">Dibujo</b><div class="avpick" style="margin-top:.3em">${icons.map(i=>`<button data-i="${i}" class="${i===icon?"on":""}">${i}</button>`).join("")}</div></div>
    <fieldset><legend>¿Por dónde empieza esta clase?</legend>${cfgFields(g.defaults)}
      <p class="muted small-t" style="margin:.3em 0 0">Los alumnos que añadas tendrán estos niveles. Después puedes ajustar a cada uno por separado.</p>
      ${isNew?"":`<button class="btn small" data-apply style="margin-top:.8em">Aplicar a todo el alumnado de la clase</button>`}</fieldset>
    <fieldset><legend>Docentes que comparten esta clase</legend>${DB.teachers.map(x=>`<label class="check"><input type="checkbox" data-tt="${x.id}" ${(g.teachers||[]).includes(x.id)?"checked":""}> ${esc(x.name)}</label>`).join("")}
      <p class="muted small-t" style="margin:.4em 0 0">Solo quien da clase aquí ve el progreso de esta clase. Los cambios de docentes quedan anotados y los ven todos los docentes de la clase.</p>
      ${(g.log||[]).length?`<details style="margin-top:.5em"><summary class="small-t"><b>Historial de docentes</b></summary><ul class="t-log">${g.log.slice().reverse().map(logLine).join("")}</ul></details>`:""}</fieldset>
  </div><div class="row end">${isNew?"":`<button class="btn danger" data-del>Eliminar</button>`}<span style="flex:1"></span><button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>Guardar</button></div>`,(m,close)=>{
    m.querySelectorAll("[data-c]").forEach(s=>s.onclick=()=>{color=s.dataset.c;m.querySelectorAll("[data-c]").forEach(x=>x.classList.toggle("on",x===s));});
    m.querySelectorAll("[data-i]").forEach(s=>s.onclick=()=>{icon=s.dataset.i;m.querySelectorAll("[data-i]").forEach(x=>x.classList.toggle("on",x===s));});
    m.querySelector("[data-x]").onclick=close;
    const before=[...(g.teachers||[])];
    const collect=()=>{
      const n=m.querySelector("[data-n]").value.trim(); if(!n){toast("Pon un nombre a la clase");return false;}
      g.name=n; g.color=color; g.icon=icon; g.defaults=readCfg(m);
      g.teachers=[...m.querySelectorAll("[data-tt]")].filter(x=>x.checked).map(x=>x.dataset.tt);
      if(!g.teachers.includes(t.id)&&!t.admin) g.teachers.push(t.id);
      return true;
    };
    m.querySelector("[data-ok]").onclick=()=>{ if(!collect())return; logTeachers(g,isNew?[]:before); if(isNew)DB.groups.push(g); save(); close();
      if(isNew){ S.tGroup=g.id; S.tTab="alumnos"; teacherPanel(); toast("Clase creada. Ahora añade al alumnado"); bulkAdd(g); } else teacherPanel(); };
    const ap=m.querySelector("[data-apply]"); if(ap) ap.onclick=()=>{ if(!collect())return;
      confirmBox("¿Aplicar estos niveles y tipo de letra a todo el alumnado de la clase?","Aplicar",()=>{
        DB.students.filter(s=>inGroup(s,g.id)).forEach(s=>s.cfg=Object.assign({},g.defaults)); save(); close(); toast("Aplicado"); teacherPanel(); }); };
    const del=m.querySelector("[data-del]"); if(del) del.onclick=()=>confirmBox(`¿Eliminar la clase «${g.name}»? El alumnado que solo está en esta clase se borra con su progreso; quien esté también en otra clase se queda en ella.`,"Eliminar",()=>{
      DB.students.forEach(s=>{ if(s.extra&&s.extra.includes(g.id)) s.extra=s.extra.filter(x=>x!==g.id);
        if(s.group===g.id&&s.extra&&s.extra.length){ s.group=s.extra.shift(); } });   // si está en otra clase, se queda allí
      const ids=new Set(DB.students.filter(s=>s.group===g.id).map(s=>s.id));
      DB.records=DB.records.filter(r=>!ids.has(r.st)); DB.students=DB.students.filter(s=>s.group!==g.id);
      DB.groups=DB.groups.filter(x=>x.id!==g.id); if(DB.settings.fixedGroup===g.id) DB.settings.fixedGroup=null; save(); close(); teacherPanel(); });
  });
}

/* ---- Alumnado ---- */
function groupSelect(extra,list){
  const gs=list||myGroups();
  if(!gs.length) return `<div class="panel empty">Primero crea una clase.</div>`;
  if(!gs.find(g=>g.id===S.tGroup)) S.tGroup=gs[0].id;
  return `<div class="panel row"><b>Clase:</b><select data-gsel class="sel">${gs.map(g=>`<option value="${g.id}" ${g.id===S.tGroup?"selected":""}>${esc(g.name)}</option>`).join("")}</select>${extra||""}</div>`;
}
function bindGroupSelect(body){ const s=body.querySelector("[data-gsel]"); if(s) s.onchange=()=>{S.tGroup=s.value;S.tStudent=null;teacherPanel();}; }
function helpChips(hp){
  const c=[]; if(hp.grande)c.push("Botones grandes"); if(hp.tol!=="media")c.push("Trazo: "+TOLERANCE[hp.tol].label);
  if(hp.lenta)c.push("Voz lenta"); if(hp.calma)c.push("Modo sensible"); if(!hp.picto)c.push("Sin dibujos");
  return c.length?c.map(x=>`<span class="chip">${x}</span>`).join(""):`<span class="muted">—</span>`;
}
function tabStudents(body){
  body.innerHTML=groupSelect(`<span style="flex:1"></span><button class="btn" data-all>Cambiar a toda la clase</button><button class="btn" data-from>${ICON.copy||"⧉"} Añadir desde otra clase</button><button class="btn primary" data-add>＋ Nuevo alumno</button>`);
  bindGroupSelect(body); if(!myGroups().length) return;
  const g=byId(DB.groups,S.tGroup);
  const sts=DB.students.filter(s=>inGroup(s,g.id)).sort((a,b)=>a.name.localeCompare(b.name,"es"));
  body.insertAdjacentHTML("beforeend",`<div class="panel">${sts.length?`<div class="tw"><table class="st-table"><thead><tr><th></th><th>Nombre</th><th>Escuchar</th><th>Leer</th><th>Escribir</th><th>Letra</th><th>Ayudas</th><th>Letras trabajadas</th><th></th></tr></thead><tbody>
    ${sts.map(s=>{ const others=classesOf(s).filter(x=>x.id!==g.id); return `<tr class="click" data-s="${s.id}"><td style="font-size:1.6em">${s.avatar}</td><td><b>${esc(s.name)}</b>${others.length?`<div class="small-t muted">También en: ${others.map(x=>esc(x.name)).join(", ")}</div>`:""}</td>
    <td data-lab="Escuchar">${LEVELS.escucha[lvlOf(s,"escucha")]}</td><td data-lab="Leer">${LEVELS.lectura[s.cfg.lectura]}</td><td data-lab="Escribir">${LEVELS.escritura[s.cfg.escritura]}</td><td data-lab="Letra">${FONTS[s.cfg.font].label}</td>
    <td data-lab="Ayudas">${helpChips(s.helps)}</td><td data-lab="Letras">${s.letters&&s.letters.length<27?`<span class="chip">${s.letters.length} de 27</span>`:"Todo el abecedario"}</td><td class="row-acts"><button class="btn small">${ICON.pencil} Editar</button><button class="btn small" data-move="${s.id}">⇄ Clases</button></td></tr>`; }).join("")}
  </tbody></table></div>`:`<div class="empty">No hay alumnado en esta clase.</div>`}</div>`);
  body.querySelector("[data-add]").onclick=()=>bulkAdd(g);
  body.querySelector("[data-all]").onclick=()=>sts.length?classChange(g,sts):toast("Primero añade alumnado");
  body.querySelectorAll("[data-s]").forEach(r=>r.onclick=()=>studentForm(byId(DB.students,r.dataset.s)));
  body.querySelectorAll("[data-move]").forEach(b=>b.onclick=e=>{ e.stopPropagation(); moveStudent(byId(DB.students,b.dataset.move),g); });
  body.querySelector("[data-from]").onclick=()=>addFromOther(g);
}
// Mover, añadir a otra clase o quitar de esta clase a un alumno
function moveStudent(s,g){
  const others=DB.groups.filter(x=>!inGroup(s,x.id));
  const multi=classesOf(s).length>1;
  const sel=`<select data-tg class="sel">${others.map(x=>`<option value="${x.id}">${esc(x.icon||"🏫")} ${esc(x.name)}</option>`).join("")}</select>`;
  modal(`<h3>${s.avatar} ${esc(s.name)}: clases</h3>
    <p class="muted" style="margin-top:0">Está en: <b>${classesOf(s).map(x=>esc(x.name)).join(", ")}</b>. Es el mismo alumno en todas sus clases (mismos niveles y ayudas). Cada docente solo ve el progreso hecho en sus clases.</p>
    ${others.length?`<div class="form"><label>Otra clase${sel}</label></div>
    <div class="move-opts">
      <button class="btn primary" data-dup>＋ Añadir también a esa clase<small>Seguirá en «${esc(g.name)}» y aparecerá en las dos (por ejemplo, su clase y PT)</small></button>
      <button class="btn" data-mv>➜ Trasladar a esa clase<small>Deja «${esc(g.name)}» y pasa a la otra; lo que hizo en «${esc(g.name)}» se va con él</small></button>
    </div>`:`<p class="muted">No hay otras clases a las que añadirlo.</p>`}
    ${multi?`<div class="move-opts"><button class="btn" data-rm>✕ Quitar de «${esc(g.name)}»<small>Sigue en sus otras clases; no se borra nada</small></button></div>`:""}
    <div class="row end"><button class="btn" data-x>Cerrar</button></div>`,(m,close)=>{
    m.querySelector("[data-x]").onclick=close;
    const target=()=>m.querySelector("[data-tg]").value;
    const dup=m.querySelector("[data-dup]"); if(dup) dup.onclick=()=>{ const t=target(); s.extra=[...new Set([...(s.extra||[]),t])]; save(); close(); toast(`${s.name} está ahora también en «${byId(DB.groups,t).name}»`); teacherPanel(); };
    const mv=m.querySelector("[data-mv]"); if(mv) mv.onclick=()=>{ const t=target();
      DB.records.forEach(r=>{ if(r.st===s.id&&(r.g||s.group)===g.id) r.g=t; }); if(REC.ok) IDB.replaceAll("records",DB.records.map(r=>[r.id,r])).catch(()=>{});
      if(s.group===g.id) s.group=t; else s.extra=(s.extra||[]).map(x=>x===g.id?t:x);
      s.extra=[...new Set((s.extra||[]).filter(x=>x!==s.group))]; save(); close(); toast(`${s.name} se ha trasladado a «${byId(DB.groups,t).name}»`); teacherPanel(); };
    const rm=m.querySelector("[data-rm]"); if(rm) rm.onclick=()=>{
      if(s.group===g.id){ s.group=s.extra[0]; s.extra=s.extra.slice(1); } else s.extra=s.extra.filter(x=>x!==g.id);
      save(); close(); toast(`${s.name} ya no está en «${g.name}»`); teacherPanel(); };
  });
}
// Añadir a esta clase alumnos de otras clases: solo se añaden (siguen en su clase), no se quitan de la suya
function addFromOther(g){
  const groups=DB.groups.filter(x=>x.id!==g.id).map(x=>({g:x,sts:DB.students.filter(s=>inGroup(s,x.id)&&!inGroup(s,g.id)).sort((a,b)=>a.name.localeCompare(b.name,"es"))})).filter(x=>x.sts.length);
  if(!groups.length) return toast("No hay alumnado en otras clases para añadir");
  const picked=new Set();
  modal(`<h3>Añadir a «${esc(g.name)}» desde otras clases</h3>
    <p class="muted" style="margin-top:0">El alumno sigue en su clase y aparece también en esta. Lo que haga aquí solo lo verán los docentes de esta clase, y lo de su otra clase no se ve aquí. Para cambiarlo de clase usa «⇄ Clases» en su clase.</p>
    <div class="from-list">${groups.map(x=>`<div class="from-g"><b>${esc(x.g.icon||"🏫")} ${esc(x.g.name)}</b><div class="from-sts">${x.sts.map(s=>`<button class="from-st" data-p="${s.id}"><span>${s.avatar}</span>${esc(s.name)}</button>`).join("")}</div></div>`).join("")}</div>
    <div class="row end"><button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>Añadir</button></div>`,(m,close)=>{
    m.querySelector("[data-x]").onclick=close;
    m.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{ const id=b.dataset.p; picked.has(id)?picked.delete(id):picked.add(id);
      m.querySelectorAll(`[data-p="${id}"]`).forEach(x=>x.classList.toggle("on",picked.has(id))); m.querySelector("[data-ok]").textContent=picked.size?`Añadir (${picked.size})`:"Añadir"; });
    m.querySelector("[data-ok]").onclick=()=>{ if(!picked.size) return toast("Toca los alumnos que quieres añadir");
      picked.forEach(id=>{ const s=byId(DB.students,id); s.extra=[...new Set([...(s.extra||[]),g.id])]; });
      save(); close(); toast(picked.size===1?"1 alumno añadido a la clase":`${picked.size} alumnos añadidos a la clase`); teacherPanel(); };
  });
}
// Cambiar algo a todo el alumnado de una clase a la vez
function classChange(g,sts){
  const keep=`<option value="">— Sin cambiar —</option>`;
  const lv=(a,k)=>`<label>${a}<select data-k="${k}">${keep}${LEVELS[k].slice(1).map((n,i)=>`<option value="${i+1}">${i+1}. ${n}</option>`).join("")}</select></label>`;
  const yn=(a,k)=>`<label>${a}<select data-k="${k}">${keep}<option value="1">Sí</option><option value="0">No</option></select></label>`;
  modal(`<h3>Cambiar a toda la clase «${esc(g.name)}»</h3><p class="muted" style="margin-top:0">Se aplica a los ${sts.length} alumnos. Lo que dejes en «Sin cambiar» se queda como está en cada uno.</p><div class="form"><div class="two">
    ${lv("Escuchar","escucha")}${lv("Leer","lectura")}${lv("Escribir","escritura")}
    <label>Tipo de letra<select data-k="font">${keep}${Object.entries(FONTS).map(([k,f])=>`<option value="${k}">${f.label}</option>`).join("")}</select></label>
    <label>Ejercicios por ronda<select data-k="ronda">${keep}${[4,6,8].map(n=>`<option value="${n}">${n}</option>`).join("")}</select></label>
    ${yn("Modo sensible","calma")}${yn("Botones grandes","grande")}${yn("Voz más lenta","lenta")}${yn("Apoyo con dibujos","picto")}${yn("Ayuda tras dos fallos","pista")}
  </div></div><div class="row end"><button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>Aplicar</button></div>`,(m,close)=>{
    m.querySelector("[data-x]").onclick=close;
    m.querySelector("[data-ok]").onclick=()=>{
      const v={}; m.querySelectorAll("[data-k]").forEach(x=>{ if(x.value!=="") v[x.dataset.k]=x.value; });
      if(!Object.keys(v).length) return toast("No has cambiado nada");
      sts.forEach(s=>{ s.helps=Object.assign(defaultHelps(),s.helps);
        ["escucha","lectura","escritura"].forEach(k=>{ if(v[k]) s.cfg[k]=+v[k]; }); if(v.font) s.cfg.font=v.font;
        if(v.ronda) s.helps.ronda=+v.ronda; ["calma","grande","lenta","picto","pista"].forEach(k=>{ if(v[k]!=null) s.helps[k]=v[k]==="1"; }); });
      save(); close(); toast(`Cambiado en ${sts.length} ${sts.length===1?"alumno":"alumnos"}`); teacherPanel();
    };
  });
}
function bulkAdd(g){
  modal(`<h3>Añadir alumnado a «${esc(g.name)}»</h3><div class="form">
    <label>Escribe o pega los nombres, uno por línea<textarea data-names placeholder="Lucía&#10;Mateo&#10;Aitana"></textarea></label>
    <p class="muted" style="margin:0">Empezarán con los niveles de la clase (Escuchar: ${LEVELS.escucha[g.defaults.escucha||1]} · Leer: ${LEVELS.lectura[g.defaults.lectura]} · Escribir: ${LEVELS.escritura[g.defaults.escritura]} · ${FONTS[g.defaults.font].label}) y un animal distinto para cada uno. Después puedes ajustar a cada alumno por separado.</p>
  </div><div class="row end"><button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>Añadir</button></div>`,(m,close)=>{
    m.querySelector("[data-x]").onclick=close;
    m.querySelector("[data-ok]").onclick=()=>{
      const names=m.querySelector("[data-names]").value.split(/\n|,/).map(s=>s.trim()).filter(Boolean);
      if(!names.length) return toast("Escribe al menos un nombre");
      const used=new Set(DB.students.filter(s=>inGroup(s,g.id)).map(s=>s.avatar));
      const free=shuffle(AVATARS.filter(a=>!used.has(a)));
      names.forEach((n,i)=>DB.students.push({id:uid(),group:g.id,name:n,avatar:free[i]||pick(AVATARS),cfg:Object.assign({},g.defaults),helps:defaultHelps(),letters:null,notes:""}));
      save(); close(); toast(names.length===1?"1 alumno añadido":`${names.length} alumnos añadidos`); teacherPanel();
    };
  });
}
function studentForm(s){
  let av=s.avatar; let letters=new Set(s.letters&&s.letters.length?s.letters:LETTERS);
  const hp=Object.assign(defaultHelps(),s.helps);
  modal(`<h3>${s.avatar} ${esc(s.name)}</h3><div class="form">
    <label>Nombre<input type="text" data-n value="${esc(s.name)}"></label>
    <div><b class="small-t">Animal</b><div class="avpick" style="margin-top:.3em">${AVATARS.map(a=>`<button data-a="${a}" class="${a===av?"on":""}">${a}</button>`).join("")}</div></div>
    <fieldset><legend>Nivel por áreas y tipo de letra</legend>${cfgFields(s.cfg)}</fieldset>
    <fieldset><legend>Ayudas</legend>
      <label class="check"><input type="checkbox" data-hc ${hp.calma?"checked":""}> <span><b>Modo sensible</b>: aspecto sobrio, sin animaciones ni adornos</span></label>
      <label class="check"><input type="checkbox" data-hg ${hp.grande?"checked":""}> Botones y textos más grandes</label>
      <label class="check"><input type="checkbox" data-hl ${hp.lenta?"checked":""}> Voz más lenta</label>
      <label class="check"><input type="checkbox" data-hp ${hp.picto?"checked":""}> Apoyo con dibujos</label>
      <label class="check"><input type="checkbox" data-hpi ${hp.pista!==false?"checked":""}> <span><b>Ayuda tras dos fallos</b>: se quitan opciones incorrectas (cuenta como un intento)</span></label>
      <label>Ejercicios por ronda<select data-hr>${[4,6,8].map(n=>`<option value="${n}" ${+hp.ronda===n?"selected":""}>${n}</option>`).join("")}</select></label>
      <label>Exigencia del trazado<select data-ht>${Object.entries(TOLERANCE).map(([k,v])=>`<option value="${k}" ${hp.tol===k?"selected":""}>${v.label}</option>`).join("")}</select></label>
    </fieldset>
    <fieldset><legend>Letras trabajadas</legend>
      <div class="row" style="margin-bottom:.5em"><button class="btn small" data-all>Todas</button><button class="btn small" data-vow>Solo vocales</button><button class="btn small" data-none>Ninguna</button></div>
      <div class="letters">${LETTERS.map(l=>`<button data-l="${l}" class="${letters.has(l)?"on":""}">${l}</button>`).join("")}</div>
      <p class="muted small-t" style="margin:.5em 0 0">Las sílabas, palabras y frases solo usarán estas letras (si hay suficientes).</p>
    </fieldset>
  </div><div class="row end"><button class="btn danger" data-del>Eliminar</button><span style="flex:1"></span><button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>Guardar</button></div>`,(m,close)=>{
    m.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{av=b.dataset.a;m.querySelectorAll("[data-a]").forEach(x=>x.classList.toggle("on",x===b));});
    const paintL=()=>m.querySelectorAll("[data-l]").forEach(b=>b.classList.toggle("on",letters.has(b.dataset.l)));
    m.querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>{const l=b.dataset.l; letters.has(l)?letters.delete(l):letters.add(l); paintL();});
    m.querySelector("[data-all]").onclick=()=>{letters=new Set(LETTERS);paintL();};
    m.querySelector("[data-vow]").onclick=()=>{letters=new Set(VOWELS);paintL();};
    m.querySelector("[data-none]").onclick=()=>{letters=new Set();paintL();};
    m.querySelector("[data-x]").onclick=close;
    m.querySelector("[data-ok]").onclick=()=>{
      const n=m.querySelector("[data-n]").value.trim(); if(!n) return toast("Escribe el nombre");
      if(!letters.size) return toast("Elige al menos una letra");
      s.name=n; s.avatar=av; s.cfg=readCfg(m);
      s.helps={grande:m.querySelector("[data-hg]").checked,lenta:m.querySelector("[data-hl]").checked,calma:m.querySelector("[data-hc]").checked,picto:m.querySelector("[data-hp]").checked,tol:m.querySelector("[data-ht]").value,pista:m.querySelector("[data-hpi]").checked,ronda:+m.querySelector("[data-hr]").value};
      s.letters=letters.size===27?null:LETTERS.filter(l=>letters.has(l));
      save(); close(); teacherPanel();
    };
    m.querySelector("[data-del]").onclick=()=>confirmBox(classesOf(s).length>1?`${s.name} está en ${classesOf(s).length} clases. ¿Eliminarlo de todas con todo su progreso? (Para quitarlo solo de una clase, usa «⇄ Clases»)`:`¿Eliminar a ${s.name} y todo su progreso?`,"Eliminar",()=>{
      DB.students=DB.students.filter(x=>x.id!==s.id); DB.records=DB.records.filter(r=>r.st!==s.id); save(); close(); teacherPanel(); });
  });
}

/* ---- Progreso ---- */
function weekStart(t){ const d=new Date(t); d.setHours(0,0,0,0); const wd=(d.getDay()+6)%7; return d.getTime()-wd*DAY; }
function summarize(recs){
  const Lr=recs.filter(r=>r.area==="lectura"), E=recs.filter(r=>r.area==="escritura"), U=recs.filter(r=>r.area==="escucha");
  return {
    escu:U.length?Math.round(U.filter(r=>r.tries===1&&!r.fail).length/U.length*100):null, nU:U.length,
    days:new Set(recs.map(r=>new Date(r.t).toDateString())).size,
    lect:Lr.length?Math.round(Lr.filter(r=>r.tries===1&&!r.fail).length/Lr.length*100):null, nL:Lr.length,
    fails:recs.filter(r=>r.fail).length,
    escr:E.length?Math.round(E.reduce((a,r)=>a+r.acc,0)/E.length):null, nE:E.length,
    last:recs.length?Math.max(...recs.map(r=>r.t)):null
  };
}
const pctColor=v=>v==null?"#EEEAF4":v>=80?"#CDEFD9":v>=50?"#FBE7C2":"#F8D3D1";
const fmtDate=t=>t?new Date(t).toLocaleDateString("es-ES",{day:"numeric",month:"short"}):"—";
function weekly(recs,n){
  const now=weekStart(Date.now()); const out=[];
  for(let i=n-1;i>=0;i--){ const ws=now-i*7*DAY; const rs=recs.filter(r=>r.t>=ws&&r.t<ws+7*DAY); const sm=summarize(rs); out.push({ws,lect:sm.lect,escr:sm.escr,escu:sm.escu,n:rs.length}); }
  return out;
}
function spark(recs){
  const w=weekly(recs,4); const mx=Math.max(1,...w.map(x=>x.n));
  return `<svg width="84" height="26" viewBox="0 0 84 26" aria-label="Actividad semanal">${w.map((x,i)=>{const v=x.n?Math.max(3,x.n/mx*24):2;return `<rect x="${i*21+2}" y="${26-v}" width="16" height="${v}" rx="3" fill="${x.n?"#8E6DE0":"#E6DFF2"}"><title>${x.n} ejercicios</title></rect>`;}).join("")}</svg>`;
}
function tabProgress(body){
  const mine=myGroups().filter(g=>teachesIn(g.id));     // el progreso solo de las clases en las que das clase
  if(!mine.length){ body.innerHTML=`<div class="panel empty">🔒 Solo puedes ver el progreso de las clases en las que das clase. Para ver el de una clase, añádete como docente en «Clases → Editar».</div>`; return; }
  body.innerHTML=groupSelect("",mine); bindGroupSelect(body);
  if(S.tStudent) return studentProgress(body,byId(DB.students,S.tStudent));
  const g=byId(DB.groups,S.tGroup);
  const sts=DB.students.filter(s=>inGroup(s,g.id)).sort((a,b)=>a.name.localeCompare(b.name,"es"));
  body.insertAdjacentHTML("beforeend",`<div class="panel"><h3>Resumen de la clase</h3>
  ${sts.length?`<div class="tw"><table><thead><tr><th></th><th>Nombre</th><th>Días de uso</th><th>Escuchar<br><small>aciertos a la primera</small></th><th>Lectura<br><small>aciertos a la primera</small></th><th>Escritura<br><small>precisión del trazo</small></th><th>Últimas 4 semanas</th><th>Último uso</th></tr></thead><tbody>
  ${sts.map(s=>{const recs=visibleRecs(s); const sm=summarize(recs);
    return `<tr class="click" data-s="${s.id}"><td style="font-size:1.6em">${s.avatar}</td><td><b>${esc(s.name)}</b></td><td>${sm.days}</td>
    <td><span class="chip pct" style="background:${pctColor(sm.escu)}">${sm.escu==null?"—":sm.escu+" %"}</span> <small class="muted">${sm.nU} ej.</small></td>
    <td><span class="chip pct" style="background:${pctColor(sm.lect)}">${sm.lect==null?"—":sm.lect+" %"}</span> <small class="muted">${sm.nL} ej.</small></td>
    <td><span class="chip pct" style="background:${pctColor(sm.escr)}">${sm.escr==null?"—":sm.escr+" %"}</span> <small class="muted">${sm.nE} ej.</small></td>
    <td>${spark(recs)}</td><td>${fmtDate(sm.last)}</td></tr>`;}).join("")}
  </tbody></table></div><p class="muted small-t">Toca un alumno para ver su evolución, el detalle por letras y el informe imprimible.</p>`:`<div class="empty">No hay alumnado en esta clase.</div>`}</div>`);
  body.querySelectorAll("[data-s]").forEach(r=>r.onclick=()=>{S.tStudent=r.dataset.s;teacherPanel();});
}
function studentAnalysis(s){
  const recs=visibleRecs(s); const sm=summarize(recs); const wk=weekly(recs,8);
  const per=area=>{const m={}; recs.filter(r=>r.area===area&&r.lvl===1).forEach(r=>{(m[r.item]=m[r.item]||[]).push(r)}); return m;};
  const pl1=per("lectura"), pe1=per("escritura");
  const cellL=l=>{const a=pl1[l]; if(!a) return null; return Math.round(a.filter(r=>r.tries===1&&!r.fail).length/a.length*100);};
  const cellE=l=>{const a=pe1[l]; if(!a) return null; return Math.round(a.reduce((x,r)=>x+r.acc,0)/a.length);};
  const items=[...new Set(recs.filter(r=>r.lvl>1&&r.item&&!/^[a-zá-ú-]+:/.test(r.item)).map(r=>r.area+"|"+r.item))].map(k=>{const [area,item]=k.split("|");const rs=recs.filter(r=>r.area===area&&r.item===item);
    const v=area==="escritura"?rs.reduce((a,r)=>a+r.acc,0)/rs.length:rs.filter(r=>r.tries===1&&!r.fail).length/rs.length*100; return {area,item,v:Math.round(v),n:rs.length};});
  const hardest=items.filter(x=>x.v<70).sort((a,b)=>a.v-b.v).slice(0,10);
  const mastered=LETTERS.filter(l=>(cellL(l)??-1)>=80&&(cellE(l)??-1)>=80);
  const pending=LETTERS.filter(l=>{const a=cellL(l),b=cellE(l); return (a!=null&&a<50)||(b!=null&&b<50);});
  // resumen por actividad: veces, resultado y última vez
  const AREAS=["escucha","lectura","escritura"]; const byAct={};
  recs.forEach(r=>{ if(!r.act) return; const k=r.area+"|"+r.lvl+"|"+r.act; (byAct[k]=byAct[k]||[]).push(r); });
  const acts=Object.entries(byAct).map(([k,rs])=>{ const [area,lvl,act]=k.split("|");
    const v=area==="escritura"?rs.reduce((a,r)=>a+r.acc,0)/rs.length:rs.filter(r=>r.tries===1&&!r.fail).length/rs.length*100;
    const pos=(CATALOG[area]||[]).findIndex(e=>e.act===act&&e.lvl===+lvl);
    return {area,lvl:+lvl,act,name:actName(area,+lvl,act),n:rs.length,v:Math.round(v),fails:rs.filter(r=>r.fail).length,last:Math.max(...rs.map(r=>r.t)),ord:AREAS.indexOf(area)*1000+(pos<0?999:pos)}; })
    .sort((a,b)=>a.ord-b.ord);
  return {recs,sm,wk,cellL,cellE,hardest,mastered,pending,acts};
}
function weeklyChart(wk){
  const Wd=640,Hd=220,pl=36,pb=28,bw=(Wd-pl-10)/wk.length;
  const y=v=>Hd-pb-(v/100)*(Hd-pb-12);
  const bars=wk.map((x,i)=>{
    const X=pl+i*bw; let r="";
    const bw3=bw*.24;
    if(x.escu!=null) r+=`<rect x="${X+bw*.12}" y="${y(x.escu)}" width="${bw3}" height="${Hd-pb-y(x.escu)}" rx="4" fill="#E8873D"><title>Escuchar ${x.escu} %</title></rect>`;
    if(x.lect!=null) r+=`<rect x="${X+bw*.38}" y="${y(x.lect)}" width="${bw3}" height="${Hd-pb-y(x.lect)}" rx="4" fill="#6C4AB6"><title>Lectura ${x.lect} %</title></rect>`;
    if(x.escr!=null) r+=`<rect x="${X+bw*.64}" y="${y(x.escr)}" width="${bw3}" height="${Hd-pb-y(x.escr)}" rx="4" fill="#2E9E8F"><title>Escritura ${x.escr} %</title></rect>`;
    r+=`<text x="${X+bw/2}" y="${Hd-8}" text-anchor="middle" font-size="12" fill="#6B6380">${new Date(x.ws).toLocaleDateString("es-ES",{day:"numeric",month:"numeric"})}</text>`;
    return r;}).join("");
  const grid=[0,50,100].map(v=>`<line x1="${pl}" x2="${Wd-6}" y1="${y(v)}" y2="${y(v)}" stroke="#ECE7F4"/><text x="${pl-6}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="#6B6380">${v}%</text>`).join("");
  return `<div class="legend"><span><i style="background:#E8873D"></i>Escuchar (aciertos a la primera)</span><span><i style="background:#6C4AB6"></i>Lectura (aciertos a la primera)</span><span><i style="background:#2E9E8F"></i>Escritura (precisión)</span></div>
    <svg viewBox="0 0 ${Wd} ${Hd}" class="wchart">${grid}${bars}</svg>`;
}
function heat(fn,lab){ return `<h3 style="margin-top:1em">${lab}</h3><div class="heat">${LETTERS.map(l=>{const v=fn(l);return `<div style="background:${pctColor(v)}">${l}<small>${v==null?"—":v+"%"}</small></div>`;}).join("")}</div>`; }
const heatLegend=`<div class="legend"><span><i style="background:#CDEFD9"></i>80 % o más</span><span><i style="background:#FBE7C2"></i>50–79 %</span><span><i style="background:#F8D3D1"></i>menos de 50 %</span><span><i style="background:#EEEAF4"></i>sin datos</span></div>`;
function studentProgress(body,s){
  const A=studentAnalysis(s); const {recs,sm}=A;
  body.insertAdjacentHTML("beforeend",`<div class="panel">
    <div class="row"><button class="btn small" data-backp>${ICON.back} Clase</button><span style="font-size:2em">${s.avatar}</span><h3 style="margin:0">${esc(s.name)}</h3>
    <span class="chip">Escuchar: ${LEVELS.escucha[lvlOf(s,"escucha")]}</span><span class="chip">Lectura: ${LEVELS.lectura[s.cfg.lectura]}</span><span class="chip">Escritura: ${LEVELS.escritura[s.cfg.escritura]}</span><span class="chip">${FONTS[s.cfg.font].label}</span>
    <span style="flex:1"></span><button class="btn small" data-sheet>${ICON.pencil} Ficha de repaso</button><button class="btn primary small" data-report>${ICON.print} Informe</button></div>
    ${DB.records.some(r=>r.st===s.id)&&recs.length<DB.records.filter(r=>r.st===s.id).length?`<p class="muted small-t" style="margin:.4em 0 0">🔒 Solo ves lo que ha hecho en tus clases. Lo que hace en otras clases lo ve quien da clase allí.</p>`:""}
    <div class="stats">
      <div><div class="muted">Días de uso</div><b>${sm.days}</b><small class="muted">${sm.fails} ejercicios sin terminar bien</small></div>
      <div><div class="muted">Escuchar · aciertos a la primera</div><b>${sm.escu==null?"—":sm.escu+" %"}</b><small class="muted">${sm.nU} ejercicios</small></div>
      <div><div class="muted">Lectura · aciertos a la primera</div><b>${sm.lect==null?"—":sm.lect+" %"}</b><small class="muted">${sm.nL} ejercicios</small></div>
      <div><div class="muted">Escritura · precisión media</div><b>${sm.escr==null?"—":sm.escr+" %"}</b><small class="muted">${sm.nE} ejercicios</small></div>
    </div></div>
  <div class="panel"><h3>Evolución semanal</h3>${weeklyChart(A.wk)}${recs.length?"":`<p class="empty">Todavía no hay actividad registrada.</p>`}</div>
  <div class="panel">${heat(A.cellL,"Reconocimiento de letras (lectura)")}${heat(A.cellE,"Trazado de letras (escritura)")}${heatLegend}</div>
  ${A.hardest.length?`<div class="panel"><h3>Lo que más le cuesta (sílabas, palabras y frases)</h3>${A.hardest.map(x=>`<span class="chip pct" style="background:${pctColor(x.v)}">${{lectura:"Lectura",escritura:"Escritura",escucha:"Escuchar"}[x.area]} · ${esc(x.item)} · ${x.v} %</span>`).join(" ")}</div>`:""}
  ${A.acts.length?`<div class="panel"><h3>Por actividad</h3><p class="muted small-t" style="margin-top:0">Escuchar y Leer: aciertos a la primera. Escribir: precisión del trazado.</p><div class="tw"><table><thead><tr><th>Área</th><th>Nivel</th><th>Actividad</th><th>Veces</th><th>Resultado</th><th>Sin terminar</th><th>Última vez</th></tr></thead><tbody>
    ${A.acts.map(x=>`<tr><td>${AREA_TITLE[x.area]}</td><td>${esc(LEVELS[x.area][x.lvl]||"")}</td><td><b>${esc(x.name)}</b></td><td>${x.n}</td><td><span class="chip pct" style="background:${pctColor(x.v)}">${x.v} %</span></td><td>${x.fails||"—"}</td><td>${fmtDate(x.last)}</td></tr>`).join("")}
  </tbody></table></div></div>`:""}
  <div class="panel"><h3>Actividad reciente</h3>${recs.length?`<div class="tw"><table><thead><tr><th>Fecha</th><th>Área</th><th>Actividad</th><th>Ejercicio</th><th>Intentos</th><th>Resultado</th></tr></thead><tbody>
    ${recs.slice(-15).reverse().map(r=>`<tr><td>${new Date(r.t).toLocaleString("es-ES",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</td><td>${{lectura:"Lectura",escritura:"Escritura",escucha:"Escuchar"}[r.area]}</td><td>${actName(r.area,r.lvl,r.act)}</td><td><b>${esc(r.item)}</b></td><td>${r.tries}</td><td>${r.fail?`<span class="chip pct" style="background:#F8D3D1">Sin terminar</span>`:r.acc+" %"}</td></tr>`).join("")}
  </tbody></table></div>`:`<div class="empty">Sin actividad.</div>`}</div>`);
  body.querySelector("[data-backp]").onclick=()=>{S.tStudent=null;teacherPanel();};
  body.querySelector("[data-report]").onclick=()=>openReport(s);
  body.querySelector("[data-sheet]").onclick=()=>sheetDialog(s);
}

/* ---- Informe imprimible ---- */
function openReport(s){
  const A=studentAnalysis(s); const g={name:classesOf(s).map(x=>x.name).join(" · ")}; const t=me();
  const hp=Object.assign(defaultHelps(),s.helps);
  const first=A.recs.length?Math.min(...A.recs.map(r=>r.t)):null;
  const el=document.createElement("div"); el.id="report";
  el.innerHTML=`<div class="report-bar no-print"><button class="btn" data-close>${ICON.back} Volver</button><span style="flex:1"></span><button class="btn primary" data-print>${ICON.print} Imprimir o guardar PDF</button></div>
  <article class="report">
    <header><div><h1>Informe de lectoescritura</h1><div class="muted">${esc(g?g.name:"")} · ${new Date().toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"})}</div></div><div class="r-name">${s.avatar} ${esc(s.name)}</div></header>
    <section class="r-grid">
      <div><h2>Configuración</h2><table class="r-t">
        <tr><td>Nivel de escuchar</td><td>${lvlOf(s,"escucha")}. ${LEVELS.escucha[lvlOf(s,"escucha")]}</td></tr>
        <tr><td>Nivel de lectura</td><td>${s.cfg.lectura}. ${LEVELS.lectura[s.cfg.lectura]}</td></tr>
        <tr><td>Nivel de escritura</td><td>${s.cfg.escritura}. ${LEVELS.escritura[s.cfg.escritura]}</td></tr>
        <tr><td>Tipo de letra</td><td>${FONTS[s.cfg.font].label}</td></tr>
        <tr><td>Ayudas</td><td>${[hp.calma&&"Modo sensible",hp.grande&&"Botones grandes",hp.lenta&&"Voz lenta",!hp.picto&&"Sin dibujos","Trazado: "+TOLERANCE[hp.tol].label].filter(Boolean).join(", ")}</td></tr>
        <tr><td>Letras trabajadas</td><td>${s.letters&&s.letters.length<27?s.letters.join(" "):"Todas"}</td></tr>
      </table></div>
      <div><h2>Resumen</h2><table class="r-t">
        <tr><td>Periodo</td><td>${first?fmtDate(first)+" – "+fmtDate(Date.now()):"Sin actividad"}</td></tr>
        <tr><td>Días de uso</td><td>${A.sm.days}</td></tr>
        <tr><td>Ejercicios sin terminar bien</td><td>${A.sm.fails}</td></tr>
        <tr><td>Escuchar: aciertos a la primera</td><td>${A.sm.escu==null?"—":A.sm.escu+" %"} (${A.sm.nU} ejercicios)</td></tr>
        <tr><td>Lectura: aciertos a la primera</td><td>${A.sm.lect==null?"—":A.sm.lect+" %"} (${A.sm.nL} ejercicios)</td></tr>
        <tr><td>Escritura: precisión media</td><td>${A.sm.escr==null?"—":A.sm.escr+" %"} (${A.sm.nE} ejercicios)</td></tr>
      </table></div>
    </section>
    <section><h2>Evolución de las últimas 8 semanas</h2>${weeklyChart(A.wk)}</section>
    <section>${heat(A.cellL,"Reconocimiento de letras")}${heat(A.cellE,"Trazado de letras")}${heatLegend}</section>
    <section class="r-grid">
      <div><h2>Letras consolidadas</h2><p>${A.mastered.length?A.mastered.join(" "):"Ninguna todavía (80 % o más en lectura y escritura)."}</p></div>
      <div><h2>Letras a reforzar</h2><p>${A.pending.length?A.pending.join(" "):"Ninguna por debajo del 50 %."}</p></div>
    </section>
    ${A.hardest.length?`<section><h2>Sílabas, palabras y frases que más le cuestan</h2><p>${A.hardest.map(x=>`${esc(x.item)} (${{lectura:"lectura",escritura:"escritura",escucha:"escuchar"}[x.area]}, ${x.v} %)`).join(" · ")}</p></section>`:""}
    ${A.acts.length?`<section><h2>Resultados por actividad</h2><table class="r-t r-acts"><tr><td><b>Actividad</b></td><td><b>Veces</b></td><td><b>Resultado</b></td></tr>${A.acts.map(x=>`<tr><td>${AREA_TITLE[x.area]} · ${esc(x.name)}</td><td>${x.n}</td><td>${x.v} %</td></tr>`).join("")}</table><p class="muted small-t">Escuchar y Leer: aciertos a la primera. Escribir: precisión del trazado.</p></section>`:""}
    <section><h2>Observaciones</h2><textarea data-notes class="r-notes" placeholder="Escribe aquí tus observaciones. Se guardan en la ficha del alumno.">${esc(s.notes||"")}</textarea><div class="r-notes-print">${esc(s.notes||"")}</div></section>
    <footer><span>Docente: ${esc(t?t.name:"")}</span><span>Lectoescritura</span></footer>
  </article>`;
  document.body.appendChild(el); document.body.classList.add("reporting");
  const close=()=>{ el.remove(); document.body.classList.remove("reporting"); };
  el.querySelector("[data-close]").onclick=close;
  const ta=el.querySelector("[data-notes]"), np=el.querySelector(".r-notes-print");
  ta.oninput=()=>{ s.notes=ta.value; np.textContent=ta.value; save(); };
  el.querySelector("[data-print]").onclick=()=>{ try{ window.print(); }catch(e){ toast("Este navegador no permite imprimir desde aquí"); } };
}

/* ---- Ficha de repaso para imprimir: modelo, dos líneas punteadas y una libre ---- */
function sheetDialog(s){
  modal(`<h3>Ficha de repaso de ${esc(s.name)}</h3><div class="form">
    <label>Qué repasar<select data-sk><option value="palabras">Palabras</option><option value="silabas">Sílabas</option><option value="letras">Letras</option><option value="flojas">Lo que más le cuesta</option></select></label>
    <label>Cuántas<select data-sn>${[4,6,8].map(n=>`<option ${n===6?"selected":""}>${n}</option>`).join("")}</select></label>
    <label>Tipo de letra<select data-sf>${Object.entries(FONTS).map(([k,f])=>`<option value="${k}" ${s.cfg.font===k?"selected":""}>${f.label}</option>`).join("")}</select></label>
    <label class="check"><input type="checkbox" data-sp checked> Con dibujo</label>
    <p class="muted small-t" style="margin:0">Se eligen al azar entre las letras que trabaja. Puedes generarla otra vez para que salga distinta.</p>
  </div><div class="row end"><button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>${ICON.print} Crear ficha</button></div>`,(m,close)=>{
    m.querySelector("[data-x]").onclick=close;
    m.querySelector("[data-ok]").onclick=()=>{ const o={kind:m.querySelector("[data-sk]").value,n:+m.querySelector("[data-sn]").value,font:m.querySelector("[data-sf]").value,pics:m.querySelector("[data-sp]").checked}; close(); openSheet(s,o); };
  });
}
function sheetItems(s,o){
  const P=pools(s); const n=o.n;
  if(o.kind==="letras") return pickFresh(P.letters,n).map(l=>({t:l}));
  if(o.kind==="silabas") return pickFresh(P.syl,n).map(x=>({t:x}));
  if(o.kind==="flojas"){
    const recs=visibleRecs(s).filter(r=>r.area==="escritura"&&r.item);
    const by={}; recs.forEach(r=>{ (by[r.item]=by[r.item]||[]).push(r.acc); });
    const weak=Object.entries(by).map(([k,v])=>({k,v:v.reduce((a,b)=>a+b,0)/v.length})).sort((a,b)=>a.v-b.v).slice(0,n).map(x=>x.k);
    const items=weak.map(k=>wordOf(k)?{t:k,w:wordOf(k)}:{t:k});
    if(items.length<n) items.push(...pickFresh(P.words.filter(w=>w.w.length<=7&&!weak.includes(w.w)),n-items.length).map(w=>({t:w.w,w})));
    return items;
  }
  return pickFresh(P.words.filter(w=>w.w.length<=7),n).map(w=>({t:w.w,w}));
}
// Una línea de pauta a lo ancho: el modelo y copias punteadas hasta llenarla (o la pauta vacía)
function sheetLine(text,font,blank){
  const VW=1250, H=165;
  const lines=[[0,"#c9c3d6","4 4"],[50,"#9bbbe8","6 4"],[100,"#4E8FE8",""],[140,"#c9c3d6","4 4"]].map(([y,c,d])=>`<line x1="0" x2="${VW}" y1="${y}" y2="${y}" stroke="${c}" stroke-width="1.6" ${d?`stroke-dasharray="${d}"`:""}/>`).join("");
  let ink="";
  if(!blank){
    const t=FONTS[font].transform(text); const escolar=font==="cursiva";
    const ok=escolar?ESCOLAR.supports(t):TRAZOS.supports(t);
    if(ok){
      const L=escolar?ESCOLAR.layout(t):TRAZOS.layout(t);
      const d=L.strokes.map(s=>s.pts.length===1?`M${s.pts[0][0]} ${s.pts[0][1]}l.1 0`:"M"+s.pts.map(p=>p[0].toFixed(1)+" "+p[1].toFixed(1)).join("L")).join("");
      const ww=L.maxX-L.minX, step=ww+Math.max(40,ww*.18); let x=12;
      for(let i=0;x+ww<=VW-8;i++,x+=step){
        const tr=`transform="translate(${(x-L.minX).toFixed(1)} 0)"`;
        ink+=i===0?`<path ${tr} d="${d}" fill="none" stroke="#222" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`
          :`<path ${tr} d="${d}" fill="none" stroke="#9a93ab" stroke-width="3.2" stroke-dasharray="0.1 7" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
    } else ink=`<text x="12" y="100" font-size="100" fill="#222">${esc(t)}</text>`;
  }
  return `<svg viewBox="0 -10 ${VW} ${H}" class="sh-svg" preserveAspectRatio="xMinYMid meet" aria-hidden="true">${lines}${ink}</svg>`;
}
function openSheet(s,o){
  const items=sheetItems(s,o); const t=me();
  const el=document.createElement("div"); el.id="report";
  el.innerHTML=`<div class="report-bar no-print"><button class="btn" data-close>${ICON.back} Volver</button><button class="btn" data-again>${ICON.again} Otra ficha</button><span style="flex:1"></span><button class="btn primary" data-print>${ICON.print} Imprimir o guardar PDF</button></div>
  <article class="report sheet">
    <header><div><h1>Ficha de repaso</h1><div class="muted">${new Date().toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"})}</div></div><div class="r-name">Nombre: ${esc(s.name)}</div></header>
    ${items.map(it=>`<div class="sh-row">
      ${o.pics&&it.w?`<div class="sh-pic">${pic(it.w.w,it.w.e,"emoji")}</div>`:`<div class="sh-pic"></div>`}
      <div class="sh-lines">${sheetLine(it.t,o.font)}${sheetLine(it.t,o.font,true)}</div>
    </div>`).join("")}
    <footer><span>Docente: ${esc(t?t.name:"")}</span><span>Lectoescritura</span></footer>
  </article>`;
  document.body.appendChild(el); document.body.classList.add("reporting");
  const close=()=>{ el.remove(); document.body.classList.remove("reporting"); };
  el.querySelector("[data-close]").onclick=close;
  el.querySelector("[data-again]").onclick=()=>{ close(); openSheet(s,o); };
  el.querySelector("[data-print]").onclick=()=>{ try{ window.print(); }catch(e){ toast("Este navegador no permite imprimir desde aquí"); } };
}

/* ---- Palabras y frases propias ---- */
function tabWords(body){
  const C=DB.custom;
  body.innerHTML=`<div class="panel"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Mis palabras</h3><button class="btn primary" data-nw>Nueva palabra</button></div>
    <p class="muted small-t">Se usan en todas las actividades de palabras (leer, escribir, escuchar), en el dictado y en la grabación de audios. Pueden ser nombres del alumnado, el vocabulario del tema que estéis trabajando…</p>
    ${C.words.length?`<div class="tw"><table><thead><tr><th>Dibujo</th><th>Palabra</th><th>Sílabas</th><th>Activa</th><th></th></tr></thead><tbody>${C.words.map(w=>`<tr>
      <td class="wpic">${pic(w.w,w.e||"🖼️","emoji")}</td><td><b>${esc(w.w)}</b></td><td>${w.s.map(esc).join(" - ")}</td>
      <td><input type="checkbox" data-won="${w.id}" ${w.on!==false?"checked":""}></td><td><button class="btn small" data-we="${w.id}">Editar</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">Todavía no has añadido palabras.</div>`}</div>
  <div class="panel"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Mis frases</h3><button class="btn primary" data-nf>Nueva frase</button></div>
    <p class="muted small-t">Se usan en «Lee y toca el dibujo», «Ordena la frase» y «Las tijeras».</p>
    ${C.phrases.length?`<div class="tw"><table><thead><tr><th>Dibujo</th><th>Frase</th><th>Activa</th><th></th></tr></thead><tbody>${C.phrases.map(f=>`<tr>
      <td class="wpic">${pic(f.k,f.e||"🖼️","emoji")}</td><td><b>${esc(f.t)}</b></td>
      <td><input type="checkbox" data-fon="${f.id}" ${f.on!==false?"checked":""}></td><td><button class="btn small" data-fe="${f.id}">Editar</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">Todavía no has añadido frases.</div>`}</div>`;
  body.querySelector("[data-nw]").onclick=()=>wordForm(null);
  body.querySelector("[data-nf]").onclick=()=>phraseForm(null);
  body.querySelectorAll("[data-we]").forEach(b=>b.onclick=()=>wordForm(C.words.find(x=>x.id===b.dataset.we)));
  body.querySelectorAll("[data-fe]").forEach(b=>b.onclick=()=>phraseForm(C.phrases.find(x=>x.id===b.dataset.fe)));
  body.querySelectorAll("[data-won]").forEach(c=>c.onchange=()=>{ C.words.find(x=>x.id===c.dataset.won).on=c.checked; save(); applyCustom(); });
  body.querySelectorAll("[data-fon]").forEach(c=>c.onchange=()=>{ C.phrases.find(x=>x.id===c.dataset.fon).on=c.checked; save(); applyCustom(); });
}
function imageField(){ return `<label>Foto o dibujo (opcional)<input type="file" accept="image/*" data-img></label><p class="muted small-t" style="margin:0">Si no pones imagen, se usa el emoji. Puedes hacer una foto con la tablet.</p>`; }
function wordForm(w){
  const isNew=!w; w=w||{id:uid(),w:"",s:[],e:"",on:true};
  modal(`<h3>${isNew?"Nueva palabra":"Editar palabra"}</h3><div class="form">
    <label>Palabra (en minúscula)<input type="text" data-w value="${esc(w.w)}" placeholder="Ej.: lápiz"></label>
    <label>Sílabas, separadas por guiones<input type="text" data-s value="${esc(w.s.join("-"))}" placeholder="Se rellena sola: lá-piz"></label>
    <label>Emoji (opcional)<input type="text" data-e value="${esc(w.e)}" placeholder="✏️" maxlength="8"></label>
    ${imageField()}
  </div><div class="row end">${isNew?"":`<button class="btn danger" data-del>Eliminar</button>`}<span style="flex:1"></span><button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>Guardar</button></div>`,(m,close)=>{
    const iw=m.querySelector("[data-w]"), is=m.querySelector("[data-s]"); let touched=!!w.s.length;
    iw.oninput=()=>{ if(!touched) is.value=silabear(iw.value.trim()).join("-"); };
    is.oninput=()=>{ touched=true; };
    m.querySelector("[data-x]").onclick=close;
    m.querySelector("[data-ok]").onclick=async()=>{
      const word=iw.value.trim().toLowerCase(); if(!/^[a-záéíóúüñ]+$/.test(word)) return toast("Escribe una sola palabra, solo con letras");
      const syl=(is.value.trim()||silabear(word).join("-")).split("-").map(x=>x.trim()).filter(Boolean);
      if(syl.join("")!==word) return toast("Las sílabas tienen que formar la palabra");
      if(isNew && WORDS.some(x=>x.w===word)) return toast("Esa palabra ya existe");
      const old=w.w; w.w=word; w.s=syl; w.e=m.querySelector("[data-e]").value.trim();
      const f=m.querySelector("[data-img]").files[0];
      if(f){ await PICTO.set(word,f); DB.settings.ownImages=[...new Set([...(DB.settings.ownImages||[]),word])]; }
      else if(old && old!==word && PICTO.has(old)){ const b=await IDB.get("pictos",old); if(b){ await PICTO.set(word,b); DB.settings.ownImages=[...new Set([...(DB.settings.ownImages||[]),word])]; } }
      if(isNew) DB.custom.words.push(w); save(); applyCustom(); close(); teacherPanel();
    };
    const d=m.querySelector("[data-del]"); if(d) d.onclick=()=>confirmBox(`¿Eliminar la palabra «${w.w}»?`,"Eliminar",()=>{ DB.custom.words=DB.custom.words.filter(x=>x.id!==w.id); save(); applyCustom(); close(); teacherPanel(); });
  });
}
function phraseForm(f){
  const isNew=!f; f=f||{id:uid(),t:"",k:"",e:"",on:true};
  const opts=[...new Set(WORDS.map(w=>w.w))].sort((a,b)=>a.localeCompare(b,"es"));
  modal(`<h3>${isNew?"Nueva frase":"Editar frase"}</h3><div class="form">
    <label>Frase (corta, con punto final)<input type="text" data-t value="${esc(f.t)}" placeholder="Ej.: Lucía pinta una flor."></label>
    <label>Dibujo de una palabra existente<select data-k><option value="">— Ninguno: usar emoji o foto —</option>${opts.map(o=>`<option value="${esc(o)}" ${f.k===o?"selected":""}>${esc(o)}</option>`).join("")}</select></label>
    <label>Emoji (opcional)<input type="text" data-e value="${esc(f.e)}" maxlength="8"></label>
    ${imageField()}
  </div><div class="row end">${isNew?"":`<button class="btn danger" data-del>Eliminar</button>`}<span style="flex:1"></span><button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>Guardar</button></div>`,(m,close)=>{
    m.querySelector("[data-x]").onclick=close;
    m.querySelector("[data-ok]").onclick=async()=>{
      let t=m.querySelector("[data-t]").value.trim().replace(/\s+/g," "); if(t.split(" ").length<2) return toast("Escribe una frase de al menos dos palabras");
      if(!/[.!?]$/.test(t)) t+=".";
      f.t=t; f.e=m.querySelector("[data-e]").value.trim();
      const file=m.querySelector("[data-img]").files[0]; const k=m.querySelector("[data-k]").value;
      if(file){ f.k="frase:"+f.id; await PICTO.set(f.k,file); DB.settings.ownImages=[...new Set([...(DB.settings.ownImages||[]),f.k])]; }
      else if(k) { f.k=k; const w=WORDS.find(x=>x.w===k); if(!f.e&&w) f.e=w.e; }
      else if(!f.k||!f.k.startsWith("frase:")) f.k="";
      if(isNew) DB.custom.phrases.push(f); save(); applyCustom(); close(); teacherPanel();
    };
    const d=m.querySelector("[data-del]"); if(d) d.onclick=()=>confirmBox("¿Eliminar esta frase?","Eliminar",()=>{ DB.custom.phrases=DB.custom.phrases.filter(x=>x.id!==f.id); save(); applyCustom(); close(); teacherPanel(); });
  });
}

/* ---- Audios ---- */
function tabAudios(body){
  const cats={
    letras:{label:"Letras",items:LETTERS.map(l=>({k:"letra:"+l,txt:l,tts:`¿Dónde está la ${LETTER_NAMES[l]}?`,hint:`Ej.: «${LETTER_NAMES[l]}» o «¿dónde está la ${LETTER_NAMES[l]}?»`}))},
    silabas:{label:"Sílabas",items:SYLLABLES.map(x=>({k:"silaba:"+x,txt:x,tts:x}))},
    palabras:{label:"Palabras",items:WORDS.map(w=>({k:"palabra:"+w.w,txt:w.w,tts:w.w}))},
    frases:{label:"Frases",items:PHRASES.map(p=>({k:"frase:"+p.t,txt:p.t,tts:p.t}))},
    enunciados:{label:"Enunciados",items:Object.entries(INSTR).map(([k,v])=>({k:"ins:"+k,txt:v,tts:v.replace(/…/g,"").trim(),hint:v.includes("…")?"Graba solo este trozo: la palabra o sílaba la pone la app":""}))},
    animos:{label:"Ánimos y avisos",items:[{k:"animo:1",txt:"Ánimo 1",tts:"¡Muy bien!",hint:"Ej.: «¡Muy bien!»"},{k:"animo:2",txt:"Ánimo 2",tts:"¡Genial!",hint:"Ej.: «¡Genial!»"},{k:"animo:3",txt:"Ánimo 3",tts:"¡Eso es!",hint:"Ej.: «¡Eso es!»"},{k:"aviso:otra",txt:"Prueba otra vez",tts:"Prueba otra vez"}]}
  };
  S.aCat=S.aCat||"letras"; const cat=cats[S.aCat];
  const n=Object.values(cats).reduce((a,c)=>a+c.items.filter(i=>AUDIO.has(i.k)).length,0);
  body.innerHTML=`<div class="panel"><h3>Audios grabados</h3>
    <p class="muted" style="margin-top:0">Graba tu voz para que el alumnado la escuche en lugar de la voz del equipo. Pulsa grabar, habla, y pulsa parar (máximo 6 segundos). Llevas ${n} audios grabados.</p>
    <div class="row">${Object.entries(cats).map(([k,c])=>`<button class="btn small ${k===S.aCat?"primary":""}" data-cat="${k}">${c.label} <span class="chip">${c.items.filter(i=>AUDIO.has(i.k)).length}/${c.items.length}</span></button>`).join("")}</div></div>
  <div class="panel"><div class="tw"><table class="audio-t"><tbody>${cat.items.map((it,i)=>`<tr data-r="${i}">
    <td><b style="font-size:1.1em">${esc(it.txt)}</b>${it.hint?`<div class="muted small-t">${esc(it.hint)}</div>`:""}</td>
    <td>${AUDIO.has(it.k)?`<span class="chip">Tu voz</span>`:`<span class="muted small-t">Voz del equipo</span>`}</td>
    <td class="acts"><button class="btn small" data-play aria-label="Escuchar">${ICON.play}</button><button class="btn small rec" data-rec>${ICON.mic} Grabar</button>${AUDIO.has(it.k)?`<button class="btn small" data-del>${ICON.trash}</button>`:""}</td></tr>`).join("")}</tbody></table></div></div>`;
  body.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{S.aCat=b.dataset.cat;teacherPanel();});
  body.querySelectorAll("tr[data-r]").forEach(tr=>{
    const it=cat.items[+tr.dataset.r];
    tr.querySelector("[data-play]").onclick=()=>AUDIO.has(it.k)?AUDIO.play(it.k):tts(it.tts);
    const rb=tr.querySelector("[data-rec]");
    rb.onclick=async()=>{
      if(AUDIO.rec){ AUDIO.stop(); return; }
      try{
        await AUDIO.start(async blob=>{ await AUDIO.save(it.k,blob); toast("Audio guardado"); teacherPanel(); });
        rb.classList.add("danger"); rb.innerHTML=`${ICON.stop} Parar`;
      }catch(e){ toast("No se puede usar el micrófono: "+(e.message||e.name)); }
    };
    const db=tr.querySelector("[data-del]"); if(db) db.onclick=async()=>{ await AUDIO.remove(it.k); teacherPanel(); };
  });
}

/* ---- Copias de seguridad ---- */
async function exportData(groupIds,withAudio){
  const gs=DB.groups.filter(g=>groupIds.includes(g.id)); const gids=new Set(gs.map(g=>g.id));
  const students=DB.students.filter(s=>[s.group,...(s.extra||[])].some(id=>gids.has(id))); const sids=new Set(students.map(s=>s.id));
  const tids=new Set(gs.flatMap(g=>g.teachers||[]));
  const data={app:"lectoescritura",version:3,exported:new Date().toISOString(),teachers:DB.teachers.filter(t=>tids.has(t.id)),groups:gs,students,records:DB.records.filter(r=>sids.has(r.st)&&gids.has(r.g||(byId(DB.students,r.st)||{}).group)),custom:DB.custom};
  if(withAudio){
    data.audios={};
    for(const k of AUDIO.keys){ const b=await IDB.get("audios",k); if(b) data.audios[k]=await new Promise(r=>{const fr=new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(b);}); }
  }
  return data;
}
function tabBackup(body){
  const gs=myGroups();
  body.innerHTML=`<div class="panel"><h3>Hacer copia de seguridad</h3>
    <p class="muted">Guarda un archivo con las clases, el alumnado y el progreso. Sirve para no perder datos y para pasar el progreso a otro equipo (por ejemplo, de la pizarra a una tablet).</p>
    <div class="row"><select data-bg class="sel"><option value="">${me().admin?"Todas las clases":"Todas mis clases"}</option>${gs.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join("")}</select>
    <label class="check"><input type="checkbox" data-wa ${AUDIO.keys.size?"":"disabled"}> Incluir audios grabados (${AUDIO.keys.size})</label>
    <button class="btn primary" data-exp>Descargar copia</button></div>
    <p class="muted small-t" data-persist></p>
    ${DB.settings.lastBackup?`<p class="muted small-t">Última copia descargada: ${new Date(DB.settings.lastBackup).toLocaleString("es-ES")}</p>`:""}
    ${DESKTOP?`<p class="muted small-t">Versión de escritorio: cada día se guarda también una copia automática (sin audios) en <b data-bdir>Documentos/Lectoescritura</b>. Se conservan las 15 más recientes.${DB.settings.lastAutoBackup?` Última: ${new Date(DB.settings.lastAutoBackup).toLocaleString("es-ES")}.`:""}</p>`:""}
  </div>
  <div class="panel"><h3>Recuperar o juntar una copia</h3>
    <p class="muted">Se añaden las clases, alumnos y registros del archivo. Lo que ya existe se actualiza y no se duplica.</p>
    <input type="file" accept=".json,application/json" data-imp></div>
  ${me().admin?`<div class="panel"><h3>Zona peligrosa</h3><button class="btn danger" data-wipe>Borrar todos los datos de este equipo</button></div>`:""}`;
  const pe=body.querySelector("[data-persist]");
  if(pe&&navigator.storage&&navigator.storage.persisted) navigator.storage.persisted().then(p=>{ pe.textContent=p?"Datos protegidos: el navegador no los borrará aunque falte espacio.":"El navegador aún no ha concedido la protección de los datos. Suele concederla al instalar la app en la pantalla de inicio o al usarla a menudo. Haz copias de vez en cuando."; });
  if(DESKTOP&&DESKTOP.backupDir) DESKTOP.backupDir().then(d=>{ const e=body.querySelector("[data-bdir]"); if(e&&d) e.textContent=d; }).catch(()=>{});
  body.querySelector("[data-exp]").onclick=async()=>{
    const gid=body.querySelector("[data-bg]").value; const ids=gid?[gid]:gs.map(g=>g.id);
    const data=await exportData(ids,body.querySelector("[data-wa]").checked);
    const json=JSON.stringify(data);
    const g=gid&&byId(DB.groups,gid);
    const name=`lectoescritura-${g?g.name.replace(/[^\wáéíóúñ]+/gi,"_"):"todo"}-${new Date().toISOString().slice(0,10)}.json`;
    try{
      const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([json],{type:"application/json"})); a.download=name;
      document.body.appendChild(a); a.click(); a.remove(); DB.settings.lastBackup=Date.now(); save(); toast("Copia descargada: "+name); teacherPanel();
    }catch(e){ toast("No se pudo descargar"); }
  };
  body.querySelector("[data-imp]").onchange=e=>{
    const f=e.target.files[0]; if(!f) return;
    const rd=new FileReader(); rd.onload=async()=>{
      try{
        const d=JSON.parse(rd.result); if(d.app!=="lectoescritura") throw 0;
        const up=(arr,items)=>items.forEach(it=>{const i=arr.findIndex(x=>x.id===it.id); if(i>=0) arr[i]=Object.assign(arr[i],it); else arr.push(it);});
        (d.teachers||[]).forEach(t=>{ if(!byId(DB.teachers,t.id)) DB.teachers.push(Object.assign({},t,{admin:DB.teachers.length?false:t.admin})); });
        up(DB.groups,d.groups||[]); up(DB.students,d.students||[]);
        const have=new Set(DB.records.map(r=>r.id)); (d.records||[]).forEach(r=>{ if(!have.has(r.id)) DB.records.push(r); });
        if(d.custom){ ["words","phrases"].forEach(k=>(d.custom[k]||[]).forEach(it=>{ const i=DB.custom[k].findIndex(x=>x.id===it.id); if(i>=0) DB.custom[k][i]=it; else DB.custom[k].push(it); })); applyCustom(); }
        if(d.audios) for(const k in d.audios){ const b=await (await fetch(d.audios[k])).blob(); await AUDIO.save(k,b); }
        save(); toast(`Copia recuperada: ${(d.students||[]).length} alumnos, ${(d.records||[]).length} registros`); teacherPanel();
      }catch(err){ toast("El archivo no es una copia válida"); }
    }; rd.readAsText(f);
  };
  const w=body.querySelector("[data-wipe]"); if(w) w.onclick=()=>confirmBox("¿Borrar TODOS los datos de este equipo? Haz antes una copia.","Borrar todo",()=>{DB=blankDB();save();S.teacherId=null;screenGroups(true);});
}
// Copia automática diaria (solo versión de escritorio)
async function autoBackup(){
  if(!DESKTOP||!DESKTOP.writeBackup||!DB.records.length) return;
  if(DB.settings.lastAutoBackup && Date.now()-DB.settings.lastAutoBackup<DAY) return;
  try{
    const data=await exportData(DB.groups.map(g=>g.id),false);
    const r=await DESKTOP.writeBackup(`lectoescritura-auto-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(data));
    if(r&&r.ok){ DB.settings.lastAutoBackup=Date.now(); save(); }
  }catch(e){}
}

/* Elegir a mano entre los pictogramas de ARASAAC para una palabra */
function chooseArasaac(word,done){
  modal(`<h3>Pictograma para «${esc(word)}»</h3><p class="muted small-t" data-st>Buscando en ARASAAC…</p><div class="picto-grid" data-g></div>
    <div class="row end"><input type="text" class="sel" data-q value="${esc(word)}" style="flex:1"><button class="btn small" data-s>Buscar</button><button class="btn" data-x>Cerrar</button></div>`,(m,close)=>{
    const g=m.querySelector("[data-g]"), stEl=m.querySelector("[data-st]");
    const search=async q=>{
      g.innerHTML=""; stEl.textContent="Buscando en ARASAAC…";
      try{
        const list=await PICTO.searchArasaac(q);
        if(!list.length){ stEl.textContent="No hay resultados. Prueba con otra palabra."; return; }
        stEl.textContent="Toca el que mejor encaje:";
        g.innerHTML=list.slice(0,18).map(p=>`<button class="pg" data-id="${p._id}"><div class="pg-img"><img src="${PICTO.thumb(p._id)}" alt=""></div><div class="small-t">${esc((p.keywords&&p.keywords[0]&&p.keywords[0].keyword)||"")}</div></button>`).join("");
        g.querySelectorAll("[data-id]").forEach(b=>b.onclick=async()=>{ stEl.textContent="Guardando…";
          try{ await PICTO.saveId(word,+b.dataset.id); DB.settings.pickedPictos=Object.assign({},DB.settings.pickedPictos,{[word]:+b.dataset.id});
            DB.settings.ownImages=(DB.settings.ownImages||[]).filter(x=>x!==word); save(); close(); toast("Pictograma elegido"); done&&done(); }
          catch(e){ stEl.textContent="No se ha podido descargar. Comprueba la conexión."; } });
      }catch(e){ stEl.textContent="No se ha podido conectar con ARASAAC. Comprueba la conexión a internet."; }
    };
    m.querySelector("[data-s]").onclick=()=>search(m.querySelector("[data-q]").value.trim()||word);
    m.querySelector("[data-x]").onclick=close; search(word);
  });
}

/* ---- Ajustes del equipo ---- */
function pictoItems(){
  const m=new Map(); WORDS.forEach(w=>m.set(w.w,w.e));
  SCENE_SUBJ.forEach(x=>m.set(x.k,x.e)); SCENE_ACT.forEach(a=>{ m.set(a.k,a.e); a.objs.forEach(o=>m.set(o.k,o.e)); });
  return [...m].map(([k,e])=>({k,e}));
}
function pictoList(){ return pictoItems().map(x=>x.k); }
function tabSettings(body){
  const st=DB.settings; const cur=st.celebration||"confeti";
  const opt=(name,val,cur,title,desc,type="radio")=>`<label class="settings-opt ${cur?"on":""}"><input type="${type}" name="${name}" value="${val}" ${cur?"checked":""}><span><b>${title}</b><span class="muted">${desc}</span></span></label>`;
  const gs=DB.groups;
  body.innerHTML=`
  <div class="panel"><h3>Estilo visual</h3>
    <div class="looks">
      ${[["plus","Plus","Más colorido y adornado: ilustración en la portada, degradados y celebraciones más festivas."],
         ["basico","Básico","Colores suaves, iconos sencillos y pequeñas celebraciones."],
         ["sensible","Sensible","Sobrio: colores apagados, sin sombras, sin adornos y sin animaciones."]].map(([k,t,d])=>`
        <label class="look-card ${(st.look||"basico")===k?"on":""}"><input type="radio" name="look" value="${k}" ${(st.look||"basico")===k?"checked":""}>
          <span class="look-prev look-${k}"><i></i><i></i><i></i></span><b>${t}</b><span class="muted small-t">${d}</span></label>`).join("")}
    </div>
    <p class="muted small-t" style="margin:.6em 0 0">El modo sensible también se puede activar solo para un alumno desde su ficha, sea cual sea el aspecto elegido aquí.</p>
  </div>
  <div class="panel"><h3>Tipo de letra general</h3>
    <p class="muted" style="margin-top:0">Es la letra con la que empiezan las clases nuevas (y su alumnado). Cada clase y cada alumno se puede cambiar después.</p>
    ${Object.entries(FONTS).map(([k,f])=>opt("font",k,(st.font||"cursiva")===k,f.label,{cursiva:"Minúsculas enlazadas, con rabito de entrada. Trazo a trazo.",imprenta:"Letra de imprenta en minúscula.",mayusculas:"Todo en mayúsculas de palo."}[k]||"")).join("")}
    <div class="row" style="margin-top:.4em"><button class="btn small" data-fontall>Aplicar a todas las clases y a todo el alumnado</button></div></div>
  <div class="panel"><h3>Celebración al acertar</h3>
    <p class="muted" style="margin-top:0">En modo sensible no hay animaciones, elijas lo que elijas aquí.</p>
    ${opt("cel","confeti",cur==="confeti","Estrellas","Caen unas estrellas por la pantalla.")}
    ${opt("cel","check",cur==="check","Solo una marca ✓","Aparece un ✓ verde y desaparece.")}
    ${opt("cel","nada",cur==="nada","Sin animaciones","Solo cambia de color la respuesta o el trazo.")}
    <div class="row" style="margin-top:.4em"><button class="btn small" data-test>${ICON.eye} Probar</button></div></div>
  <div class="panel"><h3>Voz de ánimo</h3>
    ${opt("praise","1",st.praise!==false,"Decir «¡Muy bien!» al acertar","Si lo desactivas, la voz solo lee los enunciados. Puedes grabar tus propios ánimos en la pestaña Audios.","checkbox")}</div>
  <div class="panel"><h3>Dibujos</h3>
    ${opt("pic","auto",st.pictos!=="emoji","Pictogramas ARASAAC cuando estén descargados","Se usan solos en todas las actividades. Si falta alguno, se usa el emoji. Se descargan una vez con internet y quedan guardados en este equipo.")}
    ${opt("pic","emoji",st.pictos==="emoji","Solo emojis","No se usan pictogramas aunque estén descargados (las fotos propias sí se usan).")}
    <div class="row"><button class="btn small" data-dl>Descargar pictogramas</button><span class="muted small-t" data-dlst>${pictoList().filter(w=>PICTO.has(w)).length} de ${pictoList().length} descargados</span></div>
    <details style="margin-top:.8em" ${S.openPictos?"open":""} data-pdet><summary class="small-t"><b>Ver y cambiar dibujos</b></summary><div class="picto-grid">${pictoItems().map(w=>`<div class="pg"><div class="pg-img">${PICTO.has(w.k)?`<img src="${PICTO.urls[w.k]}" alt="">`:`<span>${w.e}</span>`}</div><div class="small-t">${esc(w.k)}</div>
      <div class="row" style="justify-content:center;gap:.3em"><button class="btn small" data-choose="${esc(w.k)}">ARASAAC</button><label class="btn small">Foto<input type="file" accept="image/*" data-pw="${esc(w.k)}" hidden></label></div></div>`).join("")}</div></details>
    <p class="muted small-t">Pictogramas: Sergio Palao. Origen: ARASAAC (arasaac.org). Licencia: CC BY-NC-SA. Propiedad: Gobierno de Aragón (España).</p></div>
  <div class="panel"><h3>Bloqueo del aula</h3>
    ${opt("lock","1",!!st.lock,"Bloquear la salida","El alumnado no puede cambiar de clase ni cerrar la aplicación (versión de escritorio) sin el PIN de un docente. El modo proyección («Toda la clase») también pide PIN.","checkbox")}
    <label class="form" style="margin-top:.5em"><span class="small-t"><b>Clase fija en este equipo</b> (se abre directamente)</span>
      <select data-fixed class="sel"><option value="">Ninguna: el alumnado elige su clase</option>${gs.map(g=>`<option value="${g.id}" ${st.fixedGroup===g.id?"selected":""}>${esc(g.name)}</option>`).join("")}</select></label></div>
  <div class="panel"><h3>Acerca de</h3><p class="muted small-t" style="margin:0">Lectoescritura · Licencia CC BY-NC-ND 4.0. Fuentes Andika y Playwrite España (SIL OFL). Los datos se guardan solo en este equipo.</p></div>`;
  const rerender=()=>{ teacherPanel(); };  // conserva la posición
  body.querySelectorAll("input[name=look]").forEach(r=>r.onchange=()=>{st.look=r.value; save(); rerender(); toast("Guardado");});
  body.querySelectorAll("input[name=font]").forEach(r=>r.onchange=()=>{st.font=r.value; save(); rerender(); toast("Guardado");});
  body.querySelector("[data-fontall]").onclick=()=>{ const f=st.font||"cursiva";
    confirmBox(`¿Poner «${FONTS[f].label}» en todas las clases y en todo el alumnado de este equipo?`,"Aplicar",()=>{
      DB.groups.forEach(g=>g.defaults.font=f); DB.students.forEach(x=>x.cfg.font=f); save(); rerender(); toast("Aplicado a todos"); }); };
  body.querySelectorAll("input[name=cel]").forEach(r=>r.onchange=()=>{st.celebration=r.value; save(); rerender(); toast("Guardado");});
  body.querySelector("input[name=praise]").onchange=e=>{st.praise=e.target.checked; save(); rerender(); toast("Guardado");};
  body.querySelectorAll("input[name=pic]").forEach(r=>r.onchange=()=>{st.pictos=r.value; save(); rerender(); toast("Guardado");});
  body.querySelector("input[name=lock]").onchange=e=>{st.lock=e.target.checked; save(); rerender(); toast("Guardado");};
  body.querySelector("[data-fixed]").onchange=e=>{st.fixedGroup=e.target.value||null; save(); toast("Guardado");};
  body.querySelector("[data-test]").onclick=()=>{ celebrate(); praise(); };
  const det=body.querySelector("[data-pdet]"); if(det) det.ontoggle=()=>{S.openPictos=det.open;};
  body.querySelectorAll("[data-choose]").forEach(b=>b.onclick=()=>chooseArasaac(b.dataset.choose,rerender));
  body.querySelectorAll("[data-pw]").forEach(inp=>inp.onchange=async()=>{ const f=inp.files[0]; if(!f) return; await PICTO.set(inp.dataset.pw,f);
    st.ownImages=[...new Set([...(st.ownImages||[]),inp.dataset.pw])]; save(); toast("Dibujo cambiado"); rerender(); });
  body.querySelector("[data-dl]").onclick=async()=>{
    const stEl=body.querySelector("[data-dlst]"); let ok=0, fail=0;
    const list=pictoList().filter(w=>!(st.ownImages||[]).includes(w)&&!(st.pickedPictos||{})[w]);
    let i=0, stop=false;
    const worker=async()=>{ while(i<list.length && !stop){ const w=list[i++];
      try{ await PICTO.fetchArasaac(w); ok++; }catch(e){ fail++; if(fail>=4&&ok===0){ stop=true; } }
      stEl.textContent=`Descargando… ${ok+fail} de ${list.length}`; } };
    await Promise.all([worker(),worker(),worker(),worker()]);
    if(stop){ stEl.textContent="No se ha podido conectar con ARASAAC. Comprueba la conexión a internet."; return; }
    st.pictos="arasaac"; save(); toast(`Pictogramas descargados: ${ok}${fail?` (${fail} sin encontrar)`:""}`); rerender();
  };
}

/* ---- Docentes ---- */
function tabTeachers(body){
  const admins=DB.teachers.filter(t=>t.admin);
  body.innerHTML=`<div class="panel"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Docentes</h3><button class="btn primary" data-new>Nuevo docente</button></div>
  ${DB.teachers.map(t=>`<div class="list-item"><span class="av">👩‍🏫</span><div class="grow"><b>${esc(t.name)}</b> ${t.admin?`<span class="chip">Administración</span>`:""} ${t.id===S.teacherId?`<span class="chip">Tú</span>`:""}
    <div class="muted small-t">${DB.groups.filter(g=>(g.teachers||[]).includes(t.id)).map(g=>esc(g.name)).join(", ")||"Sin clases asignadas"}</div></div>
    <button class="btn small" data-edit="${t.id}">Editar</button>
    ${t.id===S.teacherId&&t.admin?`<button class="btn small" data-transfer>Transferir administración</button>`:""}
    ${!t.admin&&t.id!==S.teacherId?`<button class="btn small" data-del="${t.id}">Eliminar</button>`:""}</div>`).join("")}</div>
  <p class="muted" style="padding:0 .5em">Puede haber varios docentes con administración (se da o se quita en «Editar»), pero siempre tiene que quedar al menos uno. Para borrar a alguien con administración, primero quítasela o transfiérela. Las clases se comparten desde «Clases → Editar» (por ejemplo, tutora + PT + AL).</p>`;
  const form=t=>modal(`<h3>${t?"Editar docente":"Nuevo docente"}</h3><div class="form">
    <label>Nombre<input type="text" data-n value="${t?esc(t.name):""}"></label>
    <label class="check"><input type="checkbox" data-adm ${t&&t.admin?"checked":""}> Administración (ve todas las clases y gestiona docentes)</label>
    <label>${t?"Nuevo PIN (déjalo vacío para no cambiarlo)":"PIN de 4 cifras"}<input type="password" inputmode="numeric" maxlength="4" data-p></label>
    <label>Repite el PIN<input type="password" inputmode="numeric" maxlength="4" data-p2></label></div>
    <div class="row end"><button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>Guardar</button></div>`,(m,close)=>{
      m.querySelector("[data-x]").onclick=close;
      m.querySelector("[data-ok]").onclick=()=>{
        const n=m.querySelector("[data-n]").value.trim(), p=m.querySelector("[data-p]").value.trim();
        if(!n) return toast("Escribe el nombre");
        if((p||!t) && !/^\d{4}$/.test(p)) return toast("El PIN debe tener 4 cifras");
        if(p && p!==m.querySelector("[data-p2]").value.trim()) return toast("Los dos PIN no coinciden");
        if(p && DB.teachers.some(x=>x.pin===p&&x!==t)) return toast("Ese PIN ya lo usa otro docente");
        const adm=m.querySelector("[data-adm]").checked;
        if(t && t.admin && !adm && DB.teachers.filter(x=>x.admin).length<=1) return toast("Tiene que haber al menos un administrador");
        if(t){ t.name=n; if(p) t.pin=p; t.admin=adm; } else DB.teachers.push({id:uid(),name:n,pin:p,admin:adm});
        save(); close(); if(t&&t.id===S.teacherId&&!adm) S.tTab="grupos"; teacherPanel();
      };
    });
  body.querySelector("[data-new]").onclick=()=>form(null);
  body.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>form(byId(DB.teachers,b.dataset.edit)));
  const tr=body.querySelector("[data-transfer]"); if(tr) tr.onclick=()=>{
    const others=DB.teachers.filter(x=>x.id!==S.teacherId);
    if(!others.length) return toast("Primero da de alta a otro docente");
    modal(`<h3>Transferir la administración</h3><p class="muted">Elige a quién pasa la administración. Tú seguirás como docente normal (con tus clases) y después podrán borrarte si hace falta.</p>
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(9em,1fr))">${others.map(x=>`<button class="tile" data-to="${x.id}" style="min-height:5em"><span style="font-size:2em">👩‍🏫</span>${esc(x.name)}</button>`).join("")}</div>
      <div class="row end"><button class="btn" data-x>Cancelar</button></div>`,(m,close)=>{
      m.querySelector("[data-x]").onclick=close;
      m.querySelectorAll("[data-to]").forEach(b=>b.onclick=()=>{ const to=byId(DB.teachers,b.dataset.to);
        confirmBox(`¿Pasar la administración a ${to.name}? Dejarás de ser administrador.`,"Transferir",()=>{
          to.admin=true; me().admin=false; save(); close(); toast(`Ahora administra ${to.name}`); S.tTab="grupos"; teacherPanel(); }); });
    });
  };
  body.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{const t=byId(DB.teachers,b.dataset.del); if(!t||t.admin) return;
    confirmBox(`¿Eliminar a ${t.name}? Sus clases se mantienen.`,"Eliminar",()=>{
      DB.teachers=DB.teachers.filter(x=>x.id!==t.id); DB.groups.forEach(g=>g.teachers=(g.teachers||[]).filter(x=>x!==t.id)); save(); teacherPanel(); });});
}

/* =========================================================
   ARRANQUE
   ========================================================= */
if("serviceWorker" in navigator && (location.protocol==="https:"||/^(localhost|127\.0\.0\.1)$/.test(location.hostname))){ navigator.serviceWorker.register("sw.js").catch(()=>{}); }
if(DESKTOP && DESKTOP.onCloseRequest){
  DESKTOP.onCloseRequest(()=>{
    if(DB.settings.lock) pinGate("Para cerrar la aplicación, PIN de docente",()=>DESKTOP.confirmClose());
    else DESKTOP.confirmClose();
  });
}
// Pedir al navegador que no borre los datos aunque falte espacio
try{ if(navigator.storage&&navigator.storage.persist) navigator.storage.persisted().then(p=>{ if(!p) navigator.storage.persist(); }); }catch(e){}
Promise.all([AUDIO.init(),PICTO.init(),initRecords(),initRecent()]).finally(()=>{ screenGroups(); autoBackup(); });
