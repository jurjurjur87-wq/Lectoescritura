"use strict";
/* =========================================================
   DATOS (se guardan en este equipo)
   ========================================================= */
const LS_KEY = "lectoescritura.v1";
const DEFAULT_SETTINGS = {celebration:"confeti", praise:true, sensible:false, pictos:"emoji", lock:false, fixedGroup:null, lastBackup:null, lastAutoBackup:null};
function blankDB(){ return {version:1,teachers:[],groups:[],students:[],records:[],settings:Object.assign({},DEFAULT_SETTINGS)}; }
function loadDB(){
  try{ const s=localStorage.getItem(LS_KEY); if(s){ const d=JSON.parse(s); const r=Object.assign(blankDB(),d); r.settings=Object.assign({},DEFAULT_SETTINGS,d.settings||{}); return r; } }catch(e){}
  return blankDB();
}
let DB = loadDB();
let storageOK = true;
function save(){
  try{ localStorage.setItem(LS_KEY,JSON.stringify(DB)); storageOK=true; }
  catch(e){ if(storageOK) toast("No se ha podido guardar en este equipo"); storageOK=false; }
}
const uid = ()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const byId = (arr,id)=>arr.find(x=>x.id===id);
const shuffle = a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const pick = a=>a[Math.floor(Math.random()*a.length)];
const esc = s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const stripAcc = s=>s.toLowerCase().replace(/[áàä]/g,"a").replace(/[éèë]/g,"e").replace(/[íìï]/g,"i").replace(/[óòö]/g,"o").replace(/[úùü]/g,"u");
const wordOf = w=>WORDS.find(x=>x.w===w);

function defaultCfg(){ return {lectura:1,escritura:1,font:"imprenta"}; }
function defaultHelps(){ return {grande:false,tol:"media",lenta:false,calma:false,picto:true}; }

/* Estado de la sesión */
const S = {groupId:null, studentId:null, demo:false, demoLevels:null, teacherId:null, tTab:"grupos", tGroup:null, tStudent:null};
function student(){
  if(S.demo){
    const g=byId(DB.groups,S.groupId);
    const d={id:"demo",name:"Demostración",avatar:"👩‍🏫",cfg:Object.assign(defaultCfg(),g?g.defaults:{}),helps:defaultHelps(),letters:null};
    if(S.demoLevels) Object.assign(d.cfg,S.demoLevels);
    return d;
  }
  return byId(DB.students,S.studentId);
}
const inStudent = ()=>!!(S.studentId||S.demo);
function enabledLetters(st){ return (st.letters && st.letters.length) ? st.letters : LETTERS; }
function fontOf(st){ return FONTS[st.cfg.font]||FONTS.imprenta; }
function show(st,text){ return fontOf(st).transform(text); }
function sensible(){ return DB.settings.sensible || (inStudent() && student() && student().helps.calma); }

function record(area,lvl,item,tries,acc,ms,act){
  if(S.demo) return;
  DB.records.push({id:uid(),st:S.studentId,t:Date.now(),area,lvl,act,item,tries,acc:Math.round(acc),ms:Math.round(ms)});
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
  try{
    if(!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text); u.lang="es-ES"; if(VOICE) u.voice=VOICE;
    const st=inStudent()?student():null;
    u.rate = st && st.helps && st.helps.lenta ? .65 : .9;
    speechSynthesis.speak(u);
  }catch(e){}
}
function say(text,key){
  if(key && AUDIO.has(key)){ try{speechSynthesis.cancel();}catch(e){} AUDIO.play(key); return; }
  tts(text);
}
function praise(name){
  if(DB.settings.praise===false) return;
  const rec=["animo:1","animo:2","animo:3"].filter(k=>AUDIO.has(k));
  if(rec.length) return AUDIO.play(pick(rec));
  tts(name?`¡Muy bien, ${name}!`:pick(["¡Muy bien!","¡Genial!","¡Eso es!","¡Fenomenal!"]));
}
function tryAgain(){ say("Prueba otra vez","aviso:otra"); }

/* =========================================================
   UTILIDADES DE INTERFAZ
   ========================================================= */
const app=document.getElementById("app");
function h(html){ app.innerHTML=html; }
function toast(msg){
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
  for(let i=0;i<18;i++){
    const s=document.createElement("span"); s.innerHTML=ICON.star; s.style.color=pick(colors);
    s.style.left=Math.random()*100+"vw"; s.style.animationDelay=(Math.random()*.5)+"s";
    s.style.fontSize=(1.2+Math.random()*1.6)+"em"; c.appendChild(s);
  }
  document.body.appendChild(c); setTimeout(()=>c.remove(),2400);
}
function applyLook(){
  const st=inStudent()?student():null;
  document.body.classList.toggle("grande", !!(st && st.helps && st.helps.grande));
  document.body.classList.toggle("sensible", !!sensible());
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
function pic(word,emoji,cls="emoji"){
  if(DB.settings.pictos==="arasaac" && PICTO.has(word)) return `<img class="picto ${cls}" src="${PICTO.urls[word]}" alt="${esc(word)}" draggable="false">`;
  return `<span class="${cls}" role="img" aria-label="${esc(word)}">${emoji||""}</span>`;
}
function dots(i,n){ return `<div class="progress-dots">${Array.from({length:n},(_,k)=>`<span class="${k<i?"on":""}"></span>`).join("")}</div>`; }

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
function screenGroups(force){
  S.studentId=null; S.demo=false;
  const fixed=DB.settings.lock && byId(DB.groups,DB.settings.fixedGroup);
  if(fixed && !force){ S.groupId=fixed.id; return screenStudents(); }
  S.groupId=null; applyLook();
  const groups=DB.groups;
  h(`${topBar("Lectoescritura",false,`<button class="iconbtn" data-teacher aria-label="Docentes">${ICON.gear}</button>`)}
  <div class="main">
    <div class="hero"><h2>¿Cuál es tu clase?</h2></div>
    ${groups.length?`<div class="grid">${groups.map(g=>`
      <button class="tile group-tile" data-g="${g.id}" style="--gc:${g.color}">
        <span class="big deco">${g.icon||"🏫"}</span><span>${esc(g.name)}</span>
        <small>${DB.students.filter(s=>s.group===g.id).length} alumnos</small>
      </button>`).join("")}</div>`
    :`<div class="empty"><p style="font-size:1.3em">Todavía no hay clases.</p><p>Pulsa el engranaje de arriba a la derecha para entrar como docente y crear la primera.</p></div>`}
  </div>`);
  app.querySelector("[data-teacher]").onclick=teacherLogin;
  app.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{S.groupId=b.dataset.g; screenStudents();});
}
function screenStudents(){
  const g=byId(DB.groups,S.groupId); if(!g) return screenGroups(true);
  S.studentId=null; S.demo=false; applyLook();
  const locked=DB.settings.lock && DB.settings.fixedGroup===g.id;
  const sts=DB.students.filter(s=>s.group===g.id).sort((a,b)=>a.name.localeCompare(b.name,"es"));
  h(`${topBar(esc(g.name),!locked,locked?`<button class="iconbtn" data-teacher aria-label="Docentes">${ICON.lock}</button>`:"")}
  <div class="main">
    <div class="hero"><h2>¿Quién eres?</h2></div>
    <div class="grid">
      ${sts.map(s=>`<button class="tile" data-s="${s.id}"><span class="big">${s.avatar}</span>${esc(s.name)}</button>`).join("")}
      <button class="tile demo-tile" data-demo><span class="big">👩‍🏫</span>Demostración<small>No guarda progreso</small></button>
    </div>
    ${sts.length?"":`<p class="empty">Esta clase aún no tiene alumnos. Añádelos desde el panel docente.</p>`}
  </div>`);
  bindBack(()=>screenGroups(true));
  const tb=app.querySelector("[data-teacher]"); if(tb) tb.onclick=teacherLogin;
  app.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{S.studentId=b.dataset.s; screenStudentHome();});
  app.querySelector("[data-demo]").onclick=()=>pinGate("Modo demostración: PIN de docente",()=>{S.demo=true; S.demoLevels=null; screenStudentHome();});
}
function screenStudentHome(){
  const st=student(); applyLook();
  const lr=LEVELS.lectura[st.cfg.lectura], es=LEVELS.escritura[st.cfg.escritura];
  h(`${topBar("¡Hola!",true)}
  <div class="main center">
    <div class="menu">
      <button class="tile menu-tile read" data-read><span class="badge">${lr}</span><span class="ico-circle">${ICON.book}</span>Leer</button>
      <button class="tile menu-tile write" data-write><span class="badge">${es}</span><span class="ico-circle">${ICON.pencil}</span>Escribir</button>
    </div>
    ${S.demo?`<div class="panel demo-bar">
      <b>Demostración</b>
      <label>Leer <select data-dl>${LEVELS.lectura.slice(1).map((n,i)=>`<option value="${i+1}" ${st.cfg.lectura==i+1?"selected":""}>${n}</option>`).join("")}</select></label>
      <label>Escribir <select data-de>${LEVELS.escritura.slice(1).map((n,i)=>`<option value="${i+1}" ${st.cfg.escritura==i+1?"selected":""}>${n}</option>`).join("")}</select></label>
      <label>Letra <select data-df>${Object.entries(FONTS).map(([k,f])=>`<option value="${k}" ${st.cfg.font==k?"selected":""}>${f.label}</option>`).join("")}</select></label>
    </div>`:""}
  </div>`);
  bindBack(screenStudents);
  app.querySelector("[data-read]").onclick=startReading;
  app.querySelector("[data-write]").onclick=startWriting;
  if(S.demo){
    const upd=()=>{ S.demoLevels={lectura:+app.querySelector("[data-dl]").value,escritura:+app.querySelector("[data-de]").value,font:app.querySelector("[data-df]").value}; screenStudentHome(); };
    ["[data-dl]","[data-de]","[data-df]"].forEach(q=>app.querySelector(q).onchange=upd);
  }
}

/* ---------- Banco de ejercicios según las letras activas ---------- */
function pools(st){
  const en=new Set(enabledLetters(st));
  const ok=w=>[...stripAcc(w)].filter(c=>/[a-zñ]/.test(c)).every(c=>en.has(c));
  let syl=SYLLABLES.filter(ok); if(syl.length<4) syl=SYLLABLES;
  let words=WORDS.filter(x=>ok(x.w)); if(words.length<4) words=WORDS;
  let phr=PHRASES.filter(x=>ok(x.t.replace(/[.,]/g,""))); if(phr.length<3) phr=PHRASES;
  return {letters:enabledLetters(st), syl, words, phr, multi:words.filter(w=>w.s.length>1)};
}
function buildItems(area,lvl,st,n=ROUND){
  const P=pools(st); const acts=ACTIVITIES[area][lvl]; const items=[];
  const pickN=(arr,m)=>{ const out=[]; let bag=[]; while(out.length<m){ if(!bag.length) bag=shuffle(arr); out.push(bag.pop()); } return out; };
  for(let i=0;i<n;i++){
    const act=acts[i%acts.length];
    let it;
    if(act==="toca-letra") it={act,key:pickN(P.letters,1)[0]};
    else if(act==="toca-silaba") it={act,key:pickN(P.syl,1)[0]};
    else if(act==="falta-silaba"||act==="forma-palabra"){ it={act,word:pickN(P.multi.length?P.multi:WORDS.filter(w=>w.s.length>1),1)[0]}; it.key=it.word.w; }
    else if(act==="elige-palabra"||act==="falta-letra"){ it={act,word:pickN(P.words,1)[0]}; it.key=it.word.w; }
    else if(act==="elige-dibujo"||act==="ordena-frase"){ it={act,phrase:pickN(P.phr,1)[0]}; it.key=it.phrase.t; }
    else if(act==="trazo"||act==="dictado"){
      if(lvl===2) it={act,key:pickN(P.syl,1)[0]};
      else { const w=pickN(P.words.filter(x=>x.w.length<=7),1)[0]||pickN(WORDS,1)[0]; it={act,key:w.w,word:w}; }
    }
    items.push(it);
  }
  // evita repetir el mismo elemento seguido
  return items;
}

/* ---------- LEER ---------- */
function startReading(){
  const st=student(); const lvl=st.cfg.lectura;
  const items=buildItems("lectura",lvl,st);
  runRound("lectura",lvl,items,startReading);
}
function startWriting(){
  const st=student();
  if(st.cfg.escritura===1) return screenAlphabet();
  runRound("escritura",st.cfg.escritura,buildItems("escritura",st.cfg.escritura,st),startWriting);
}
function runRound(area,lvl,items,again){
  let idx=0, good=0;
  const next=()=>{
    if(idx>=items.length) return roundEnd(area,good,items.length,again);
    const it=items[idx];
    const done=firstTry=>{ if(firstTry) good++; idx++; next(); };
    const ctx={area,lvl,idx,n:items.length,done};
    const A={
      "toca-letra":actChooseSound,"toca-silaba":actChooseSound,"falta-silaba":actMissing,"falta-letra":actMissing,
      "elige-palabra":actChooseWord,"elige-dibujo":actChoosePicture,"forma-palabra":actBuild,"ordena-frase":actBuild,
      "dictado":actBuild,"trazo":actTrace
    }[it.act];
    A(it,ctx);
  };
  next();
}
function roundEnd(area,good,total,again){
  const st=student(); applyLook();
  const stars=good===total?3:good>=total*.6?2:1;
  celebrate(); praise(st.name);
  h(`${topBar(area==="lectura"?"Leer":"Escribir",true)}
  <div class="main center">
    <div class="hero">
      <div class="stars">${[0,1,2].map(i=>`<span class="${i<stars?"on":""}">${ICON.star}</span>`).join("")}</div>
      <h2>¡Muy bien, ${esc(st.name)}!</h2><p>${good} de ${total} a la primera</p></div>
    <div class="row" style="justify-content:center;gap:1.2em">
      <button class="btn primary big-btn" data-again>${ICON.again} Otra vez</button>
      <button class="btn big-btn" data-home>${ICON.home} Menú</button>
    </div>
  </div>`);
  bindBack(screenStudentHome);
  app.querySelector("[data-again]").onclick=again;
  app.querySelector("[data-home]").onclick=screenStudentHome;
}
function actHeader(ctx,title){
  return `${topBar((ctx.area==="lectura"?"Leer":"Escribir")+" · "+esc(title),true)}`;
}
/* Elección entre 3 opciones (base de varias actividades) */
function choiceScreen(ctx,{title,prompt,options,correct,fontCss,emo,onSay,sayKey,record:rec}){
  const st=student(); applyLook();
  h(`${actHeader(ctx,title)}
  <div class="main">
    ${dots(ctx.idx,ctx.n)}
    <div class="prompt">${prompt}</div>
    <div class="options">${options.map((o,i)=>`<button class="opt ${emo?"emo":""}" data-i="${i}" style="${fontCss?`font-family:${fontCss}`:""}">${o.html}</button>`).join("")}</div>
  </div>`);
  bindBack(screenStudentHome);
  let tries=0, locked=false; const t0=performance.now();
  const sb=app.querySelector("[data-say]"); if(sb) sb.onclick=onSay;
  if(onSay) setTimeout(onSay,350);
  app.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{
    if(locked) return; const o=options[+b.dataset.i]; tries++;
    if(o.ok){
      locked=true; b.classList.add("ok");
      rec(tries,performance.now()-t0);
      celebrate(); praise();
      setTimeout(()=>ctx.done(tries===1),1400);
    }else{
      b.classList.remove("bad"); void b.offsetWidth; b.classList.add("bad");
      tryAgain(); if(onSay) setTimeout(onSay,1100);
    }
  });
}
function actChooseSound(it,ctx){
  const st=student(); const isL=it.act==="toca-letra"; const P=pools(st);
  const pool=isL?P.letters:P.syl;
  const opts=shuffle([it.key,...shuffle(pool.filter(x=>x!==it.key)).slice(0,2)]);
  const w=isL?wordOf(LETTER_WORD[it.key]):null;
  choiceScreen(ctx,{title:LEVELS.lectura[ctx.lvl],
    prompt:`<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button><span class="ask">${isL?"Escucha y toca la letra":"Escucha y toca la sílaba"}</span>${isL&&st.helps.picto&&w?pic(w.w,w.e):""}`,
    options:opts.map(x=>({html:esc(show(st,x)),ok:x===it.key})), fontCss:fontOf(st).css,
    onSay:()=>isL?say(`¿Dónde está la ${LETTER_NAMES[it.key]}?`,"letra:"+it.key):say(it.key,"silaba:"+it.key),
    record:(tries,ms)=>record("lectura",ctx.lvl,it.key,tries,tries===1?100:Math.max(0,100-50*(tries-1)),ms,it.act)});
}
function actChooseWord(it,ctx){
  const st=student(); const P=pools(st);
  const opts=shuffle([it.word,...shuffle(P.words.filter(x=>x.w!==it.word.w)).slice(0,2)]);
  choiceScreen(ctx,{title:ACT_NAMES[it.act],
    prompt:`${pic(it.word.w,it.word.e)}<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button>`,
    options:opts.map(x=>({html:esc(show(st,x.w)),ok:x===it.word})), fontCss:fontOf(st).css,
    onSay:()=>say(it.word.w,"palabra:"+it.word.w),
    record:(tries,ms)=>record("lectura",ctx.lvl,it.key,tries,tries===1?100:Math.max(0,100-50*(tries-1)),ms,it.act)});
}
function actChoosePicture(it,ctx){
  const st=student(); const P=pools(st);
  const opts=shuffle([it.phrase,...shuffle(P.phr.filter(x=>x.k!==it.phrase.k)).slice(0,2)]);
  choiceScreen(ctx,{title:ACT_NAMES[it.act],
    prompt:`<span class="phrase" style="font-family:${fontOf(st).css}">${esc(show(st,it.phrase.t))}</span><button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button>`,
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
  const shown=parts.map((p,i)=>i===hole?`<span class="hole">${"&nbsp;".repeat(Math.max(2,p.length*2))}</span>`:esc(show(st,p))).join("");
  choiceScreen(ctx,{title:ACT_NAMES[it.act],
    prompt:`${pic(w.w,w.e)}<span class="phrase" style="font-family:${fontOf(st).css}">${shown}</span><button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button>`,
    options:opts.map(x=>({html:esc(show(st,x)),ok:x===answer})), fontCss:fontOf(st).css,
    onSay:()=>say(w.w,"palabra:"+w.w),
    record:(tries,ms)=>record("lectura",ctx.lvl,it.key,tries,tries===1?100:Math.max(0,100-50*(tries-1)),ms,it.act)});
}
/* Construir tocando piezas en orden: sílabas → palabra, palabras → frase, letras → dictado */
function actBuild(it,ctx){
  const st=student(); applyLook(); const fcss=fontOf(st).css; const P=pools(st);
  let target,extra,promptHTML,sayFn,title=ACT_NAMES[it.act],joiner="";
  if(it.act==="forma-palabra"){
    target=[...it.word.s]; extra=shuffle(P.syl.filter(x=>!target.includes(x))).slice(0,1);
    promptHTML=`${pic(it.word.w,it.word.e)}<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button>`;
    sayFn=()=>say(it.word.w,"palabra:"+it.word.w);
  }else if(it.act==="ordena-frase"){
    target=it.phrase.t.replace(/\.$/,"").split(" "); extra=[]; joiner=" ";
    promptHTML=`${pic(it.phrase.k,it.phrase.e)}<button class="speak" data-say aria-label="Escuchar">${ICON.speaker}</button>`;
    sayFn=()=>say(it.phrase.t,"frase:"+it.phrase.t);
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
  <div class="main">
    ${dots(ctx.idx,ctx.n)}
    <div class="prompt">${promptHTML}</div>
    <div class="slots ${it.act==="ordena-frase"?"words":""}" style="font-family:${fcss}" data-slots></div>
    <div class="tiles" style="font-family:${fcss}" data-tiles></div>
  </div>`);
  bindBack(screenStudentHome);
  app.querySelector("[data-say]").onclick=sayFn; setTimeout(sayFn,350);
  const sEl=app.querySelector("[data-slots]"), tEl=app.querySelector("[data-tiles]");
  function paint(){
    sEl.innerHTML=slots.map((s,i)=>`<button class="slot ${s?"full":""}" data-si="${i}">${s?esc(show(st,s.t)):""}</button>`).join(joiner?"":"");
    tEl.innerHTML=tiles.map((t,i)=>`<button class="piece ${slots.includes(t)?"used":""}" data-ti="${i}">${esc(show(st,t.t))}</button>`).join("");
    sEl.querySelectorAll("[data-si]").forEach(b=>b.onclick=()=>{ if(locked) return; const i=+b.dataset.si; if(slots[i]){slots[i]=null;paint();} });
    tEl.querySelectorAll("[data-ti]").forEach(b=>b.onclick=()=>{
      if(locked) return; const t=tiles[+b.dataset.ti]; if(slots.includes(t)) return;
      const free=slots.indexOf(null); if(free<0) return; slots[free]=t; paint();
      if(!slots.includes(null)) check();
    });
  }
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

/* ---------- ESCRIBIR ---------- */
function letterStats(stId){
  const done={};
  DB.records.filter(r=>r.st===stId&&r.area==="escritura"&&r.lvl===1).forEach(r=>{done[r.item]=Math.max(done[r.item]||0,r.acc)});
  return done;
}
function screenAlphabet(){
  const st=student(); applyLook(); const en=new Set(enabledLetters(st));
  const done=S.demo?{}:letterStats(st.id); const fcss=fontOf(st).css;
  h(`${topBar("Elige una letra",true)}
  <div class="main">
    <div class="abc">${LETTERS.map(l=>`
      <button class="tile ${done[l]!=null?"done":""} ${en.has(l)?"":"off"}" data-l="${l}">
        ${done[l]!=null?`<span class="star">${ICON.star}</span>`:""}
        <span class="big" style="font-family:${fcss}">${esc(show(st,l))}</span>
      </button>`).join("")}</div>
    <p class="hint" style="margin-top:1em">${Object.keys(done).filter(l=>en.has(l)).length} de ${en.size} letras practicadas</p>
  </div>`);
  bindBack(screenStudentHome);
  app.querySelectorAll("[data-l]").forEach(b=>b.onclick=()=>traceLetter(b.dataset.l));
}
function traceLetter(l){
  const st=student(); const en=enabledLetters(st);
  const w=wordOf(LETTER_WORD[l]);
  traceScreen({text:l,title:`La letra ${show(st,l)}`,word:w,speak:()=>say(`${LETTER_NAMES[l]}, de ${w.w}`,"letra:"+l),
    lvl:1,act:"trazo",autoDemo:true,onBack:screenAlphabet,nextLabel:"Siguiente letra",
    onDone:()=>{ const i=en.indexOf(l); traceLetter(en[(i+1)%en.length]); }});
}
function actTrace(it,ctx){
  const isWord=ctx.lvl===3;
  traceScreen({text:it.key,title:LEVELS.escritura[ctx.lvl],word:it.word||null,lvl:ctx.lvl,act:"trazo",progress:[ctx.idx,ctx.n],
    speak:()=>say(it.key,(isWord?"palabra:":"silaba:")+it.key),
    onBack:screenStudentHome,onDone:firstTry=>ctx.done(firstTry)});
}
function traceScreen(o){
  const st=student(); applyLook();
  const tol=TOLERANCE[st.helps.tol]||TOLERANCE.media;
  const font=fontOf(st); const text=font.transform(o.text);
  const ordered=st.cfg.font!=="cursiva" && TRAZOS.supports(text);
  const showWord=o.word && (st.helps.picto || o.lvl>1);
  h(`${topBar(esc(o.title),true)}
  <div class="main trace-main">
    ${o.progress?dots(o.progress[0],o.progress[1]):""}
    <div class="trace-wrap">
      <div class="trace-side">
        ${showWord?`<div class="side-card word-card">${pic(o.word.w,o.word.e)}<div class="word" style="font-family:${font.css}">${esc(font.transform(o.word.w))}</div></div>`:""}
        <div class="tools">
          <button class="btn primary" data-say>${ICON.speaker}<span>Escuchar</span></button>
          ${ordered?`<button class="btn" data-demo>${ICON.play}<span>Ver cómo se hace</span></button>`:""}
          <button class="btn" data-clear>${ICON.eraser}<span>Borrar</span></button>
          ${ordered?"":`<button class="btn ok" data-check>${ICON.check}<span>He terminado</span></button>`}
          <div class="side-card status"><div class="meter"><i data-meter></i></div><div class="hint" data-msg>${ordered?"Empieza en el punto verde y sigue la flecha":"Repasa la letra con el dedo"}</div></div>
        </div>
      </div>
      <div class="trace-board"><canvas data-guide></canvas><canvas data-demo-c></canvas><canvas data-ink></canvas></div>
    </div>
  </div>`);
  const board=app.querySelector(".trace-board"), meter=app.querySelector("[data-meter]"), msg=app.querySelector("[data-msg]");
  const sens=sensible();
  const colors=sens?{ink:"#4A5568",done:"#3F7D5C",guide:"#EEF0F3",start:"#3F7D5C",dots:"#7A8394",future:"#D5D9E0",fill:"#E2E5EA",lines:["#E1E4E9","#B9C6D6","#8EA3BD"]}:{};
  const t0=performance.now(); let finished=false;
  const onProgress=(p,m,warn)=>{ meter.style.width=Math.round(p*100)+"%"; meter.style.background=warn?"var(--warn)":"var(--ok)"; if(m!=null&&m!=="") msg.textContent=m; else if(m==="" && p<1 && !finished) {} };
  const onSuccess=(acc,errors)=>{
    finished=true;
    record("escritura",o.lvl,o.text,errors+1,acc,performance.now()-t0,o.act);
    celebrate(); praise(); msg.textContent="¡Conseguido!";
    const tools=app.querySelector(".tools");
    const nb=document.createElement("button"); nb.className="btn primary next-btn"; nb.innerHTML=`${ICON.next}<span>${o.nextLabel||"Siguiente"}</span>`;
    nb.onclick=()=>{cleanup(); o.onDone(errors===0);}; tools.prepend(nb);
    if(!o.nextLabel) setTimeout(()=>{ if(document.body.contains(nb)) nb.click(); },1800);
  };
  const opts={text,guide:app.querySelector("[data-guide]"),ink:app.querySelector("[data-ink]"),demo:app.querySelector("[data-demo-c]"),
    tol,colors,onProgress,onSuccess,say:m=>tts(m),still:sens,fontCss:font.css};
  const eng=ordered?createStrokeEngine(opts):createCoverageEngine(opts);
  bindBack(()=>{ cleanup(); o.onBack(); });
  app.querySelector("[data-say]").onclick=o.speak;
  app.querySelector("[data-clear]").onclick=()=>{ eng.clear(); msg.textContent=ordered?"Empieza en el punto verde y sigue la flecha":"Repasa la letra con el dedo"; };
  const ch=app.querySelector("[data-check]"); if(ch) ch.onclick=()=>eng.check(true);
  const dm=app.querySelector("[data-demo]"); if(dm) dm.onclick=()=>eng.demo();
  let first=true;
  const ro=new ResizeObserver(()=>{ const r=board.getBoundingClientRect(); if(r.width<10||r.height<10) return; eng.resize(r.width,r.height);
    if(first){ first=false; setTimeout(()=>{ o.speak(); if(ordered&&o.autoDemo) setTimeout(()=>eng.demo(),900); },300); } });
  function cleanup(){ ro.disconnect(); eng.destroy(); }
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
  <label>PIN de 4 cifras<input type="password" inputmode="numeric" maxlength="4" data-p></label></div>
  <div class="row end"><button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>Crear</button></div>`,(m,close)=>{
    m.querySelector("[data-x]").onclick=close;
    m.querySelector("[data-ok]").onclick=()=>{
      const n=m.querySelector("[data-n]").value.trim(), p=m.querySelector("[data-p]").value.trim();
      if(!n||!/^\d{4}$/.test(p)) return toast("Escribe un nombre y un PIN de 4 cifras");
      const t={id:uid(),name:n,pin:p,admin:true}; DB.teachers.push(t); save(); close();
      S.teacherId=t.id; S.tTab="grupos"; teacherPanel();
    };
  });
}
function me(){ return byId(DB.teachers,S.teacherId); }
function myGroups(){ const t=me(); return DB.groups.filter(g=>t.admin||(g.teachers||[]).includes(t.id)); }
const DAY=864e5;
function backupBanner(){
  const last=Math.max(DB.settings.lastBackup||0,DB.settings.lastAutoBackup||0);
  if(!DB.records.length) return "";
  const days=last?Math.floor((Date.now()-last)/DAY):null;
  if(days!==null && days<14) return "";
  return `<div class="banner">${ICON.lock}<span>${days===null?"Todavía no has hecho ninguna copia de seguridad.":`Hace ${days} días de la última copia de seguridad.`}</span><button class="btn small" data-gobackup>Hacer copia</button></div>`;
}
function teacherPanel(){
  const t=me(); if(!t) return screenGroups(true);
  document.body.classList.remove("grande");
  document.body.classList.toggle("sensible",!!DB.settings.sensible);
  const tabs=[["grupos","Clases"],["alumnos","Alumnado"],["progreso","Progreso"],["audios","Audios"],["copias","Copias"],["ajustes","Ajustes"]];
  if(t.admin) tabs.push(["docentes","Docentes"]);
  h(`<div class="teacher">
    <div class="top"><h1>Panel docente</h1><div class="who">👩‍🏫 <span class="nm">${esc(t.name)}</span></div><button class="btn small" data-out>Salir</button></div>
    <div class="tabs">${tabs.map(([k,l])=>`<button data-tab="${k}" class="${S.tTab===k?"on":""}">${l}</button>`).join("")}</div>
    <div class="main" style="padding-top:1em">${backupBanner()}<div data-body></div></div></div>`);
  app.querySelector("[data-out]").onclick=()=>{S.teacherId=null;screenGroups(true);};
  app.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{S.tTab=b.dataset.tab; S.tStudent=null; teacherPanel();});
  const gb=app.querySelector("[data-gobackup]"); if(gb) gb.onclick=()=>{S.tTab="copias";teacherPanel();};
  const body=app.querySelector("[data-body]");
  ({grupos:tabGroups,alumnos:tabStudents,progreso:tabProgress,audios:tabAudios,copias:tabBackup,ajustes:tabSettings,docentes:tabTeachers})[S.tTab](body);
}

/* ---- Clases ---- */
function cfgFields(cfg){
  return `<div class="two">
    <label>Nivel de lectura<select data-cl>${LEVELS.lectura.slice(1).map((n,i)=>`<option value="${i+1}" ${cfg.lectura==i+1?"selected":""}>${i+1}. ${n}</option>`).join("")}</select></label>
    <label>Nivel de escritura<select data-ce>${LEVELS.escritura.slice(1).map((n,i)=>`<option value="${i+1}" ${cfg.escritura==i+1?"selected":""}>${i+1}. ${n}</option>`).join("")}</select></label>
    <label>Tipo de letra<select data-cf>${Object.entries(FONTS).map(([k,f])=>`<option value="${k}" ${cfg.font==k?"selected":""}>${f.label}</option>`).join("")}</select></label>
  </div>`;
}
const readCfg=m=>({lectura:+m.querySelector("[data-cl]").value,escritura:+m.querySelector("[data-ce]").value,font:m.querySelector("[data-cf]").value});
function tabGroups(body){
  const gs=myGroups();
  body.innerHTML=`<div class="panel"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Mis clases</h3><button class="btn primary" data-new>Nueva clase</button></div></div>
  ${gs.length?gs.map(g=>{const n=DB.students.filter(s=>s.group===g.id).length;
    const tn=(g.teachers||[]).map(id=>byId(DB.teachers,id)).filter(Boolean).map(x=>`<span class="chip">${esc(x.name)}</span>`).join("");
    return `<div class="panel"><div class="list-item"><span class="av gicon" style="--gc:${g.color}">${g.icon||"🏫"}</span>
    <div class="grow"><b>${esc(g.name)}</b>${DB.settings.lock&&DB.settings.fixedGroup===g.id?` <span class="chip">Clase fija en este equipo</span>`:""}<div class="muted small-t">${n} alumnos · Por defecto: ${LEVELS.lectura[g.defaults.lectura]} / ${LEVELS.escritura[g.defaults.escritura]} / ${FONTS[g.defaults.font].label}</div><div>${tn}</div></div>
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
    <fieldset><legend>Valores por defecto para alumnos nuevos</legend>${cfgFields(g.defaults)}
      ${isNew?"":`<button class="btn small" data-apply style="margin-top:.8em">Aplicar a todo el alumnado de la clase</button>`}</fieldset>
    <fieldset><legend>Docentes que comparten esta clase</legend>${DB.teachers.map(x=>`<label class="check"><input type="checkbox" data-tt="${x.id}" ${(g.teachers||[]).includes(x.id)?"checked":""}> ${esc(x.name)}</label>`).join("")}</fieldset>
  </div><div class="row end">${isNew?"":`<button class="btn danger" data-del>Eliminar</button>`}<span style="flex:1"></span><button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>Guardar</button></div>`,(m,close)=>{
    m.querySelectorAll("[data-c]").forEach(s=>s.onclick=()=>{color=s.dataset.c;m.querySelectorAll("[data-c]").forEach(x=>x.classList.toggle("on",x===s));});
    m.querySelectorAll("[data-i]").forEach(s=>s.onclick=()=>{icon=s.dataset.i;m.querySelectorAll("[data-i]").forEach(x=>x.classList.toggle("on",x===s));});
    m.querySelector("[data-x]").onclick=close;
    const collect=()=>{
      const n=m.querySelector("[data-n]").value.trim(); if(!n){toast("Pon un nombre a la clase");return false;}
      g.name=n; g.color=color; g.icon=icon; g.defaults=readCfg(m);
      g.teachers=[...m.querySelectorAll("[data-tt]")].filter(x=>x.checked).map(x=>x.dataset.tt);
      if(!g.teachers.includes(t.id)&&!t.admin) g.teachers.push(t.id);
      return true;
    };
    m.querySelector("[data-ok]").onclick=()=>{ if(!collect())return; if(isNew)DB.groups.push(g); save(); close(); teacherPanel(); };
    const ap=m.querySelector("[data-apply]"); if(ap) ap.onclick=()=>{ if(!collect())return;
      confirmBox("¿Aplicar estos niveles y tipo de letra a todo el alumnado de la clase?","Aplicar",()=>{
        DB.students.filter(s=>s.group===g.id).forEach(s=>s.cfg=Object.assign({},g.defaults)); save(); close(); toast("Aplicado"); teacherPanel(); }); };
    const del=m.querySelector("[data-del]"); if(del) del.onclick=()=>confirmBox(`¿Eliminar la clase «${g.name}» con todo su alumnado y progreso?`,"Eliminar",()=>{
      const ids=new Set(DB.students.filter(s=>s.group===g.id).map(s=>s.id));
      DB.records=DB.records.filter(r=>!ids.has(r.st)); DB.students=DB.students.filter(s=>s.group!==g.id);
      DB.groups=DB.groups.filter(x=>x.id!==g.id); if(DB.settings.fixedGroup===g.id) DB.settings.fixedGroup=null; save(); close(); teacherPanel(); });
  });
}

/* ---- Alumnado ---- */
function groupSelect(extra){
  const gs=myGroups();
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
  body.innerHTML=groupSelect(`<span style="flex:1"></span><button class="btn primary" data-add>Añadir alumnado</button>`);
  bindGroupSelect(body); if(!myGroups().length) return;
  const g=byId(DB.groups,S.tGroup);
  const sts=DB.students.filter(s=>s.group===g.id).sort((a,b)=>a.name.localeCompare(b.name,"es"));
  body.insertAdjacentHTML("beforeend",`<div class="panel">${sts.length?`<div class="tw"><table><thead><tr><th></th><th>Nombre</th><th>Lectura</th><th>Escritura</th><th>Letra</th><th>Ayudas</th><th>Letras</th></tr></thead><tbody>
    ${sts.map(s=>`<tr class="click" data-s="${s.id}"><td style="font-size:1.6em">${s.avatar}</td><td><b>${esc(s.name)}</b></td>
    <td>${LEVELS.lectura[s.cfg.lectura]}</td><td>${LEVELS.escritura[s.cfg.escritura]}</td><td>${FONTS[s.cfg.font].label}</td>
    <td>${helpChips(s.helps)}</td><td>${s.letters&&s.letters.length<27?`<span class="chip">${s.letters.length} de 27</span>`:"Todas"}</td></tr>`).join("")}
  </tbody></table></div>`:`<div class="empty">No hay alumnado en esta clase.</div>`}</div>`);
  body.querySelector("[data-add]").onclick=()=>bulkAdd(g);
  body.querySelectorAll("[data-s]").forEach(r=>r.onclick=()=>studentForm(byId(DB.students,r.dataset.s)));
}
function bulkAdd(g){
  modal(`<h3>Añadir alumnado a «${esc(g.name)}»</h3><div class="form">
    <label>Escribe o pega los nombres, uno por línea<textarea data-names placeholder="Lucía&#10;Mateo&#10;Aitana"></textarea></label>
    <p class="muted" style="margin:0">Se crearán con los valores por defecto de la clase (${LEVELS.lectura[g.defaults.lectura]} / ${LEVELS.escritura[g.defaults.escritura]} / ${FONTS[g.defaults.font].label}) y un animal distinto para cada uno. Después puedes ajustar a cada alumno por separado.</p>
  </div><div class="row end"><button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>Añadir</button></div>`,(m,close)=>{
    m.querySelector("[data-x]").onclick=close;
    m.querySelector("[data-ok]").onclick=()=>{
      const names=m.querySelector("[data-names]").value.split(/\n|,/).map(s=>s.trim()).filter(Boolean);
      if(!names.length) return toast("Escribe al menos un nombre");
      const used=new Set(DB.students.filter(s=>s.group===g.id).map(s=>s.avatar));
      const free=shuffle(AVATARS.filter(a=>!used.has(a)));
      names.forEach((n,i)=>DB.students.push({id:uid(),group:g.id,name:n,avatar:free[i]||pick(AVATARS),cfg:Object.assign({},g.defaults),helps:defaultHelps(),letters:null,notes:""}));
      save(); close(); toast(`${names.length} alumno(s) añadido(s)`); teacherPanel();
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
      s.helps={grande:m.querySelector("[data-hg]").checked,lenta:m.querySelector("[data-hl]").checked,calma:m.querySelector("[data-hc]").checked,picto:m.querySelector("[data-hp]").checked,tol:m.querySelector("[data-ht]").value};
      s.letters=letters.size===27?null:LETTERS.filter(l=>letters.has(l));
      save(); close(); teacherPanel();
    };
    m.querySelector("[data-del]").onclick=()=>confirmBox(`¿Eliminar a ${s.name} y todo su progreso?`,"Eliminar",()=>{
      DB.students=DB.students.filter(x=>x.id!==s.id); DB.records=DB.records.filter(r=>r.st!==s.id); save(); close(); teacherPanel(); });
  });
}

/* ---- Progreso ---- */
function weekStart(t){ const d=new Date(t); d.setHours(0,0,0,0); const wd=(d.getDay()+6)%7; return d.getTime()-wd*DAY; }
function summarize(recs){
  const Lr=recs.filter(r=>r.area==="lectura"), E=recs.filter(r=>r.area==="escritura");
  return {
    days:new Set(recs.map(r=>new Date(r.t).toDateString())).size,
    lect:Lr.length?Math.round(Lr.filter(r=>r.tries===1).length/Lr.length*100):null, nL:Lr.length,
    escr:E.length?Math.round(E.reduce((a,r)=>a+r.acc,0)/E.length):null, nE:E.length,
    last:recs.length?Math.max(...recs.map(r=>r.t)):null
  };
}
const pctColor=v=>v==null?"#EEEAF4":v>=80?"#CDEFD9":v>=50?"#FBE7C2":"#F8D3D1";
const fmtDate=t=>t?new Date(t).toLocaleDateString("es-ES",{day:"numeric",month:"short"}):"—";
function weekly(recs,n){
  const now=weekStart(Date.now()); const out=[];
  for(let i=n-1;i>=0;i--){ const ws=now-i*7*DAY; const rs=recs.filter(r=>r.t>=ws&&r.t<ws+7*DAY); const sm=summarize(rs); out.push({ws,lect:sm.lect,escr:sm.escr,n:rs.length}); }
  return out;
}
function spark(recs){
  const w=weekly(recs,4); const mx=Math.max(1,...w.map(x=>x.n));
  return `<svg width="84" height="26" viewBox="0 0 84 26" aria-label="Actividad semanal">${w.map((x,i)=>{const v=x.n?Math.max(3,x.n/mx*24):2;return `<rect x="${i*21+2}" y="${26-v}" width="16" height="${v}" rx="3" fill="${x.n?"#8E6DE0":"#E6DFF2"}"><title>${x.n} ejercicios</title></rect>`;}).join("")}</svg>`;
}
function tabProgress(body){
  body.innerHTML=groupSelect(); bindGroupSelect(body); if(!myGroups().length) return;
  if(S.tStudent) return studentProgress(body,byId(DB.students,S.tStudent));
  const g=byId(DB.groups,S.tGroup);
  const sts=DB.students.filter(s=>s.group===g.id).sort((a,b)=>a.name.localeCompare(b.name,"es"));
  body.insertAdjacentHTML("beforeend",`<div class="panel"><h3>Resumen de la clase</h3>
  ${sts.length?`<div class="tw"><table><thead><tr><th></th><th>Nombre</th><th>Días de uso</th><th>Lectura<br><small>aciertos a la primera</small></th><th>Escritura<br><small>precisión del trazo</small></th><th>Últimas 4 semanas</th><th>Último uso</th></tr></thead><tbody>
  ${sts.map(s=>{const recs=DB.records.filter(r=>r.st===s.id); const sm=summarize(recs);
    return `<tr class="click" data-s="${s.id}"><td style="font-size:1.6em">${s.avatar}</td><td><b>${esc(s.name)}</b></td><td>${sm.days}</td>
    <td><span class="chip pct" style="background:${pctColor(sm.lect)}">${sm.lect==null?"—":sm.lect+" %"}</span> <small class="muted">${sm.nL} ej.</small></td>
    <td><span class="chip pct" style="background:${pctColor(sm.escr)}">${sm.escr==null?"—":sm.escr+" %"}</span> <small class="muted">${sm.nE} ej.</small></td>
    <td>${spark(recs)}</td><td>${fmtDate(sm.last)}</td></tr>`;}).join("")}
  </tbody></table></div><p class="muted small-t">Toca un alumno para ver su evolución, el detalle por letras y el informe imprimible.</p>`:`<div class="empty">No hay alumnado en esta clase.</div>`}</div>`);
  body.querySelectorAll("[data-s]").forEach(r=>r.onclick=()=>{S.tStudent=r.dataset.s;teacherPanel();});
}
function studentAnalysis(s){
  const recs=DB.records.filter(r=>r.st===s.id); const sm=summarize(recs); const wk=weekly(recs,8);
  const per=area=>{const m={}; recs.filter(r=>r.area===area&&r.lvl===1).forEach(r=>{(m[r.item]=m[r.item]||[]).push(r)}); return m;};
  const pl1=per("lectura"), pe1=per("escritura");
  const cellL=l=>{const a=pl1[l]; if(!a) return null; return Math.round(a.filter(r=>r.tries===1).length/a.length*100);};
  const cellE=l=>{const a=pe1[l]; if(!a) return null; return Math.round(a.reduce((x,r)=>x+r.acc,0)/a.length);};
  const items=[...new Set(recs.filter(r=>r.lvl>1).map(r=>r.area+"|"+r.item))].map(k=>{const [area,item]=k.split("|");const rs=recs.filter(r=>r.area===area&&r.item===item);
    const v=area==="lectura"?rs.filter(r=>r.tries===1).length/rs.length*100:rs.reduce((a,r)=>a+r.acc,0)/rs.length; return {area,item,v:Math.round(v),n:rs.length};});
  const hardest=items.filter(x=>x.v<70).sort((a,b)=>a.v-b.v).slice(0,10);
  const mastered=LETTERS.filter(l=>(cellL(l)??-1)>=80&&(cellE(l)??-1)>=80);
  const pending=LETTERS.filter(l=>{const a=cellL(l),b=cellE(l); return (a!=null&&a<50)||(b!=null&&b<50);});
  return {recs,sm,wk,cellL,cellE,hardest,mastered,pending};
}
function weeklyChart(wk){
  const Wd=640,Hd=220,pl=36,pb=28,bw=(Wd-pl-10)/wk.length;
  const y=v=>Hd-pb-(v/100)*(Hd-pb-12);
  const bars=wk.map((x,i)=>{
    const X=pl+i*bw; let r="";
    if(x.lect!=null) r+=`<rect x="${X+bw*.14}" y="${y(x.lect)}" width="${bw*.34}" height="${Hd-pb-y(x.lect)}" rx="4" fill="#6C4AB6"><title>Lectura ${x.lect} %</title></rect>`;
    if(x.escr!=null) r+=`<rect x="${X+bw*.52}" y="${y(x.escr)}" width="${bw*.34}" height="${Hd-pb-y(x.escr)}" rx="4" fill="#2E9E8F"><title>Escritura ${x.escr} %</title></rect>`;
    r+=`<text x="${X+bw/2}" y="${Hd-8}" text-anchor="middle" font-size="12" fill="#6B6380">${new Date(x.ws).toLocaleDateString("es-ES",{day:"numeric",month:"numeric"})}</text>`;
    return r;}).join("");
  const grid=[0,50,100].map(v=>`<line x1="${pl}" x2="${Wd-6}" y1="${y(v)}" y2="${y(v)}" stroke="#ECE7F4"/><text x="${pl-6}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="#6B6380">${v}%</text>`).join("");
  return `<div class="legend"><span><i style="background:#6C4AB6"></i>Lectura (aciertos a la primera)</span><span><i style="background:#2E9E8F"></i>Escritura (precisión)</span></div>
    <svg viewBox="0 0 ${Wd} ${Hd}" class="wchart">${grid}${bars}</svg>`;
}
function heat(fn,lab){ return `<h3 style="margin-top:1em">${lab}</h3><div class="heat">${LETTERS.map(l=>{const v=fn(l);return `<div style="background:${pctColor(v)}">${l}<small>${v==null?"—":v+"%"}</small></div>`;}).join("")}</div>`; }
const heatLegend=`<div class="legend"><span><i style="background:#CDEFD9"></i>80 % o más</span><span><i style="background:#FBE7C2"></i>50–79 %</span><span><i style="background:#F8D3D1"></i>menos de 50 %</span><span><i style="background:#EEEAF4"></i>sin datos</span></div>`;
function studentProgress(body,s){
  const A=studentAnalysis(s); const {recs,sm}=A;
  body.insertAdjacentHTML("beforeend",`<div class="panel">
    <div class="row"><button class="btn small" data-backp>${ICON.back} Clase</button><span style="font-size:2em">${s.avatar}</span><h3 style="margin:0">${esc(s.name)}</h3>
    <span class="chip">Lectura: ${LEVELS.lectura[s.cfg.lectura]}</span><span class="chip">Escritura: ${LEVELS.escritura[s.cfg.escritura]}</span><span class="chip">${FONTS[s.cfg.font].label}</span>
    <span style="flex:1"></span><button class="btn primary small" data-report>${ICON.print} Informe</button></div>
    <div class="stats">
      <div><div class="muted">Días de uso</div><b>${sm.days}</b></div>
      <div><div class="muted">Lectura · aciertos a la primera</div><b>${sm.lect==null?"—":sm.lect+" %"}</b><small class="muted">${sm.nL} ejercicios</small></div>
      <div><div class="muted">Escritura · precisión media</div><b>${sm.escr==null?"—":sm.escr+" %"}</b><small class="muted">${sm.nE} ejercicios</small></div>
    </div></div>
  <div class="panel"><h3>Evolución semanal</h3>${weeklyChart(A.wk)}${recs.length?"":`<p class="empty">Todavía no hay actividad registrada.</p>`}</div>
  <div class="panel">${heat(A.cellL,"Reconocimiento de letras (lectura)")}${heat(A.cellE,"Trazado de letras (escritura)")}${heatLegend}</div>
  ${A.hardest.length?`<div class="panel"><h3>Lo que más le cuesta (sílabas, palabras y frases)</h3>${A.hardest.map(x=>`<span class="chip pct" style="background:${pctColor(x.v)}">${x.area==="lectura"?"Lectura":"Escritura"} · ${esc(x.item)} · ${x.v} %</span>`).join(" ")}</div>`:""}
  <div class="panel"><h3>Actividad reciente</h3>${recs.length?`<div class="tw"><table><thead><tr><th>Fecha</th><th>Área</th><th>Actividad</th><th>Ejercicio</th><th>Intentos</th><th>Resultado</th></tr></thead><tbody>
    ${recs.slice(-15).reverse().map(r=>`<tr><td>${new Date(r.t).toLocaleString("es-ES",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</td><td>${r.area==="lectura"?"Lectura":"Escritura"}</td><td>${ACT_NAMES[r.act]||LEVELS[r.area][r.lvl]}</td><td><b>${esc(r.item)}</b></td><td>${r.tries}</td><td>${r.acc} %</td></tr>`).join("")}
  </tbody></table></div>`:`<div class="empty">Sin actividad.</div>`}</div>`);
  body.querySelector("[data-backp]").onclick=()=>{S.tStudent=null;teacherPanel();};
  body.querySelector("[data-report]").onclick=()=>openReport(s);
}

/* ---- Informe imprimible ---- */
function openReport(s){
  const A=studentAnalysis(s); const g=byId(DB.groups,s.group); const t=me();
  const hp=Object.assign(defaultHelps(),s.helps);
  const first=A.recs.length?Math.min(...A.recs.map(r=>r.t)):null;
  const el=document.createElement("div"); el.id="report";
  el.innerHTML=`<div class="report-bar no-print"><button class="btn" data-close>${ICON.back} Volver</button><span style="flex:1"></span><button class="btn primary" data-print>${ICON.print} Imprimir o guardar PDF</button></div>
  <article class="report">
    <header><div><h1>Informe de lectoescritura</h1><div class="muted">${esc(g?g.name:"")} · ${new Date().toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"})}</div></div><div class="r-name">${s.avatar} ${esc(s.name)}</div></header>
    <section class="r-grid">
      <div><h2>Configuración</h2><table class="r-t">
        <tr><td>Nivel de lectura</td><td>${s.cfg.lectura}. ${LEVELS.lectura[s.cfg.lectura]}</td></tr>
        <tr><td>Nivel de escritura</td><td>${s.cfg.escritura}. ${LEVELS.escritura[s.cfg.escritura]}</td></tr>
        <tr><td>Tipo de letra</td><td>${FONTS[s.cfg.font].label}</td></tr>
        <tr><td>Ayudas</td><td>${[hp.calma&&"Modo sensible",hp.grande&&"Botones grandes",hp.lenta&&"Voz lenta",!hp.picto&&"Sin dibujos","Trazado: "+TOLERANCE[hp.tol].label].filter(Boolean).join(", ")}</td></tr>
        <tr><td>Letras trabajadas</td><td>${s.letters&&s.letters.length<27?s.letters.join(" "):"Todas"}</td></tr>
      </table></div>
      <div><h2>Resumen</h2><table class="r-t">
        <tr><td>Periodo</td><td>${first?fmtDate(first)+" – "+fmtDate(Date.now()):"Sin actividad"}</td></tr>
        <tr><td>Días de uso</td><td>${A.sm.days}</td></tr>
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
    ${A.hardest.length?`<section><h2>Sílabas, palabras y frases que más le cuestan</h2><p>${A.hardest.map(x=>`${esc(x.item)} (${x.area==="lectura"?"lectura":"escritura"}, ${x.v} %)`).join(" · ")}</p></section>`:""}
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

/* ---- Audios ---- */
function tabAudios(body){
  const cats={
    letras:{label:"Letras",items:LETTERS.map(l=>({k:"letra:"+l,txt:l,tts:`¿Dónde está la ${LETTER_NAMES[l]}?`,hint:`Ej.: «${LETTER_NAMES[l]}» o «¿dónde está la ${LETTER_NAMES[l]}?»`}))},
    silabas:{label:"Sílabas",items:SYLLABLES.map(x=>({k:"silaba:"+x,txt:x,tts:x}))},
    palabras:{label:"Palabras",items:WORDS.map(w=>({k:"palabra:"+w.w,txt:w.w,tts:w.w}))},
    frases:{label:"Frases",items:PHRASES.map(p=>({k:"frase:"+p.t,txt:p.t,tts:p.t}))},
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
    <td class="acts"><button class="btn small" data-play>${ICON.play}</button><button class="btn small rec" data-rec>${ICON.mic} Grabar</button>${AUDIO.has(it.k)?`<button class="btn small" data-del>${ICON.trash}</button>`:""}</td></tr>`).join("")}</tbody></table></div></div>`;
  body.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{S.aCat=b.dataset.cat;tabAudios(body);});
  body.querySelectorAll("tr[data-r]").forEach(tr=>{
    const it=cat.items[+tr.dataset.r];
    tr.querySelector("[data-play]").onclick=()=>AUDIO.has(it.k)?AUDIO.play(it.k):tts(it.tts);
    const rb=tr.querySelector("[data-rec]");
    rb.onclick=async()=>{
      if(AUDIO.rec){ AUDIO.stop(); return; }
      try{
        await AUDIO.start(async blob=>{ await AUDIO.save(it.k,blob); toast("Audio guardado"); tabAudios(body); });
        rb.classList.add("danger"); rb.innerHTML=`${ICON.stop} Parar`;
      }catch(e){ toast("No se puede usar el micrófono: "+(e.message||e.name)); }
    };
    const db=tr.querySelector("[data-del]"); if(db) db.onclick=async()=>{ await AUDIO.remove(it.k); tabAudios(body); };
  });
}

/* ---- Copias de seguridad ---- */
async function exportData(groupIds,withAudio){
  const gs=DB.groups.filter(g=>groupIds.includes(g.id)); const gids=new Set(gs.map(g=>g.id));
  const students=DB.students.filter(s=>gids.has(s.group)); const sids=new Set(students.map(s=>s.id));
  const tids=new Set(gs.flatMap(g=>g.teachers||[]));
  const data={app:"lectoescritura",version:2,exported:new Date().toISOString(),teachers:DB.teachers.filter(t=>tids.has(t.id)),groups:gs,students,records:DB.records.filter(r=>sids.has(r.st))};
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
    ${DB.settings.lastBackup?`<p class="muted small-t">Última copia descargada: ${new Date(DB.settings.lastBackup).toLocaleString("es-ES")}</p>`:""}
    ${DESKTOP?`<p class="muted small-t">Versión de escritorio: cada día se guarda también una copia automática (sin audios) en <b data-bdir>Documentos/Lectoescritura</b>. Se conservan las 15 más recientes.${DB.settings.lastAutoBackup?` Última: ${new Date(DB.settings.lastAutoBackup).toLocaleString("es-ES")}.`:""}</p>`:""}
  </div>
  <div class="panel"><h3>Recuperar o juntar una copia</h3>
    <p class="muted">Se añaden las clases, alumnos y registros del archivo. Lo que ya existe se actualiza y no se duplica.</p>
    <input type="file" accept=".json,application/json" data-imp></div>
  ${me().admin?`<div class="panel"><h3>Zona peligrosa</h3><button class="btn danger" data-wipe>Borrar todos los datos de este equipo</button></div>`:""}`;
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

/* ---- Ajustes del equipo ---- */
function tabSettings(body){
  const st=DB.settings; const cur=st.celebration||"confeti";
  const opt=(name,val,cur,title,desc,type="radio")=>`<label class="settings-opt ${cur?"on":""}"><input type="${type}" name="${name}" value="${val}" ${cur?"checked":""}><span><b>${title}</b><span class="muted">${desc}</span></span></label>`;
  const gs=DB.groups;
  body.innerHTML=`
  <div class="panel"><h3>Estilo visual</h3>
    ${opt("look","normal",!st.sensible,"Normal","Colores suaves, dibujos y pequeñas animaciones al acertar.")}
    ${opt("look","sensible",!!st.sensible,"Modo sensible para todo el equipo","Aspecto sobrio: colores apagados, sin sombras, sin adornos y sin animaciones. También se puede activar solo para un alumno desde su ficha.")}
  </div>
  <div class="panel"><h3>Celebración al acertar</h3>
    <p class="muted" style="margin-top:0">En modo sensible no hay animaciones, elijas lo que elijas aquí.</p>
    ${opt("cel","confeti",cur==="confeti","Estrellas","Caen unas estrellas por la pantalla.")}
    ${opt("cel","check",cur==="check","Solo una marca ✓","Aparece un ✓ verde y desaparece.")}
    ${opt("cel","nada",cur==="nada","Sin animaciones","Solo cambia de color la respuesta o el trazo.")}
    <div class="row" style="margin-top:.4em"><button class="btn small" data-test>${ICON.eye} Probar</button></div></div>
  <div class="panel"><h3>Voz de ánimo</h3>
    ${opt("praise","1",st.praise!==false,"Decir «¡Muy bien!» al acertar","Si lo desactivas, la voz solo lee los enunciados. Puedes grabar tus propios ánimos en la pestaña Audios.","checkbox")}</div>
  <div class="panel"><h3>Dibujos</h3>
    ${opt("pic","emoji",st.pictos!=="arasaac","Emojis","Funcionan siempre, sin descargar nada.")}
    ${opt("pic","arasaac",st.pictos==="arasaac","Pictogramas ARASAAC","Hay que descargarlos una vez con internet; después funcionan sin conexión. Si falta alguno, se usa el emoji.")}
    <div class="row"><button class="btn small" data-dl>Descargar pictogramas</button><span class="muted small-t" data-dlst>${PICTO.count()} de ${WORDS.length} descargados</span></div>
    <details style="margin-top:.8em"><summary class="small-t"><b>Ver y cambiar dibujos</b></summary><div class="picto-grid">${WORDS.map(w=>`<div class="pg"><div class="pg-img">${PICTO.has(w.w)?`<img src="${PICTO.urls[w.w]}" alt="">`:`<span>${w.e}</span>`}</div><div class="small-t">${w.w}</div>
      <label class="btn small">Cambiar<input type="file" accept="image/*" data-pw="${w.w}" hidden></label></div>`).join("")}</div></details>
    <p class="muted small-t">Pictogramas: Sergio Palao. Origen: ARASAAC (arasaac.org). Licencia: CC BY-NC-SA. Propiedad: Gobierno de Aragón (España).</p></div>
  <div class="panel"><h3>Bloqueo del aula</h3>
    ${opt("lock","1",!!st.lock,"Bloquear la salida","El alumnado no puede cambiar de clase ni cerrar la aplicación (versión de escritorio) sin el PIN de un docente. El modo demostración también pide PIN.","checkbox")}
    <label class="form" style="margin-top:.5em"><span class="small-t"><b>Clase fija en este equipo</b> (se abre directamente)</span>
      <select data-fixed class="sel"><option value="">Ninguna: el alumnado elige su clase</option>${gs.map(g=>`<option value="${g.id}" ${st.fixedGroup===g.id?"selected":""}>${esc(g.name)}</option>`).join("")}</select></label></div>
  <div class="panel"><h3>Acerca de</h3><p class="muted small-t" style="margin:0">Lectoescritura · Licencia CC BY-NC-ND 4.0. Fuentes Andika y Playwrite España (SIL OFL). Los datos se guardan solo en este equipo.</p></div>`;
  const rerender=()=>{ teacherPanel(); };
  body.querySelectorAll("input[name=look]").forEach(r=>r.onchange=()=>{st.sensible=r.value==="sensible"; save(); rerender(); toast("Guardado");});
  body.querySelectorAll("input[name=cel]").forEach(r=>r.onchange=()=>{st.celebration=r.value; save(); rerender(); toast("Guardado");});
  body.querySelector("input[name=praise]").onchange=e=>{st.praise=e.target.checked; save(); rerender(); toast("Guardado");};
  body.querySelectorAll("input[name=pic]").forEach(r=>r.onchange=()=>{st.pictos=r.value; save(); rerender(); toast("Guardado");});
  body.querySelector("input[name=lock]").onchange=e=>{st.lock=e.target.checked; save(); rerender(); toast("Guardado");};
  body.querySelector("[data-fixed]").onchange=e=>{st.fixedGroup=e.target.value||null; save(); toast("Guardado");};
  body.querySelector("[data-test]").onclick=()=>{ celebrate(); praise(); };
  body.querySelectorAll("[data-pw]").forEach(inp=>inp.onchange=async()=>{ const f=inp.files[0]; if(!f) return; await PICTO.set(inp.dataset.pw,f); toast("Dibujo cambiado"); rerender(); });
  body.querySelector("[data-dl]").onclick=async()=>{
    const stEl=body.querySelector("[data-dlst]"); let ok=0, fail=0;
    for(const w of WORDS){
      stEl.textContent=`Descargando… ${ok+fail+1} de ${WORDS.length}`;
      try{ await PICTO.fetchArasaac(w.w); ok++; }catch(e){ fail++; if(fail>=3&&ok===0){ stEl.textContent="No se ha podido conectar con ARASAAC. Comprueba la conexión a internet."; return; } }
    }
    st.pictos="arasaac"; save(); toast(`Pictogramas descargados: ${ok}${fail?` (${fail} sin encontrar)`:""}`); rerender();
  };
}

/* ---- Docentes ---- */
function tabTeachers(body){
  body.innerHTML=`<div class="panel"><div class="row" style="justify-content:space-between"><h3 style="margin:0">Docentes</h3><button class="btn primary" data-new>Nuevo docente</button></div>
  ${DB.teachers.map(t=>`<div class="list-item"><span class="av">👩‍🏫</span><div class="grow"><b>${esc(t.name)}</b> ${t.admin?`<span class="chip">Administración</span>`:""}
    <div class="muted small-t">${DB.groups.filter(g=>(g.teachers||[]).includes(t.id)).map(g=>esc(g.name)).join(", ")||"Sin clases asignadas"}</div></div>
    <button class="btn small" data-pin="${t.id}">Cambiar PIN</button>${t.id!==S.teacherId?`<button class="btn small" data-del="${t.id}">Eliminar</button>`:""}</div>`).join("")}</div>
  <p class="muted" style="padding:0 .5em">Las clases se comparten desde «Clases → Editar»: marca qué docentes pueden verlas (por ejemplo, tutora + PT + AL).</p>`;
  const form=t=>modal(`<h3>${t?"Cambiar PIN de "+esc(t.name):"Nuevo docente"}</h3><div class="form">
    ${t?"":`<label>Nombre<input type="text" data-n></label><label class="check"><input type="checkbox" data-adm> Administración (ve todas las clases)</label>`}
    <label>PIN de 4 cifras<input type="password" inputmode="numeric" maxlength="4" data-p></label></div>
    <div class="row end"><button class="btn" data-x>Cancelar</button><button class="btn primary" data-ok>Guardar</button></div>`,(m,close)=>{
      m.querySelector("[data-x]").onclick=close;
      m.querySelector("[data-ok]").onclick=()=>{
        const p=m.querySelector("[data-p]").value.trim(); if(!/^\d{4}$/.test(p)) return toast("El PIN debe tener 4 cifras");
        if(DB.teachers.some(x=>x.pin===p&&x!==t)) return toast("Ese PIN ya lo usa otro docente");
        if(t){ t.pin=p; } else { const n=m.querySelector("[data-n]").value.trim(); if(!n) return toast("Escribe el nombre"); DB.teachers.push({id:uid(),name:n,pin:p,admin:m.querySelector("[data-adm]").checked}); }
        save(); close(); teacherPanel();
      };
    });
  body.querySelector("[data-new]").onclick=()=>form(null);
  body.querySelectorAll("[data-pin]").forEach(b=>b.onclick=()=>form(byId(DB.teachers,b.dataset.pin)));
  body.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{const t=byId(DB.teachers,b.dataset.del); confirmBox(`¿Eliminar a ${t.name}? Sus clases se mantienen.`,"Eliminar",()=>{
    DB.teachers=DB.teachers.filter(x=>x.id!==t.id); DB.groups.forEach(g=>g.teachers=(g.teachers||[]).filter(x=>x!==t.id)); save(); teacherPanel(); });});
}

/* =========================================================
   ARRANQUE
   ========================================================= */
if("serviceWorker" in navigator && location.protocol==="https:"){ navigator.serviceWorker.register("sw.js").catch(()=>{}); }
if(DESKTOP && DESKTOP.onCloseRequest){
  DESKTOP.onCloseRequest(()=>{
    if(DB.settings.lock) pinGate("Para cerrar la aplicación, PIN de docente",()=>DESKTOP.confirmClose());
    else DESKTOP.confirmClose();
  });
}
Promise.all([AUDIO.init(),PICTO.init()]).finally(()=>{ screenGroups(); autoBackup(); });
