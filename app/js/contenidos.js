"use strict";
/* =========================================================
   CONTENIDOS
   ========================================================= */
const LETTERS = "abcdefghijklmnñopqrstuvwxyz".split("");
const LETTER_NAMES = {a:"a",b:"be",c:"ce",d:"de",e:"e",f:"efe",g:"ge",h:"hache",i:"i",j:"jota",k:"ka",l:"ele",m:"eme",n:"ene","ñ":"eñe",o:"o",p:"pe",q:"cu",r:"erre",s:"ese",t:"te",u:"u",v:"uve",w:"uve doble",x:"equis",y:"i griega",z:"zeta"};
const VOWELS = ["a","e","i","o","u"];

// Palabras con dibujo (emoji) y sílabas
const WORDS = (()=>{                                  // del banco de contenidos (banco.js)
  const seen=new Set(), out=[];
  BANCO_PALABRAS.split(/[|\n]/).map(x=>x.trim()).filter(Boolean).forEach(it=>{
    const i=it.indexOf(" "); const syl=it.slice(0,i).split("-"); const w=syl.join(""); const e=it.slice(i+1).trim();
    if(!seen.has(w)){ seen.add(w); out.push({w,s:syl,e}); }
  });
  return out;
})();
// Palabra de ejemplo para cada letra (tarjeta lateral y pista)
const LETTER_WORD = {a:"avión",b:"bota",c:"casa",d:"dado",e:"erizo",f:"foca",g:"gato",h:"helado",i:"isla",j:"jirafa",k:"koala",l:"luna",m:"mano",n:"nube","ñ":"piña",o:"oso",p:"pato",q:"queso",r:"rana",s:"sol",t:"taza",u:"uva",v:"vaca",w:"kiwi",x:"taxi",y:"yoyó",z:"zapato"};

// Sílabas directas
const SYLLABLES = (()=>{
  const out=[];
  const simple=["m","p","l","s","t","n","d","f","b","r","v","j","ñ","ll","ch","y"];
  simple.forEach(c=>VOWELS.forEach(v=>out.push(c+v)));
  ["ca","co","cu","que","qui","ga","go","gu","gue","gui","za","zo","zu","ce","ci","ge","gi","ha","he","hi","ho","hu","ka","ki","ko"].forEach(s=>out.push(s));
  return [...new Set(out)];
})();

// Frases cortas con dibujo
const PHRASES = BANCO_FRASES.split("\n").map(x=>x.trim()).filter(Boolean).map(l=>{
  const [t,k]=l.split("|"); const w=WORDS.find(x=>x.w===k); return {t,k,e:w?w.e:"🖼️"};
}).filter(p=>WORDS.some(w=>w.w===p.k));

const AVATARS = ["🐶","🐱","🐭","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🦆","🦉","🐴","🦄","🐝","🐞","🦋","🐢","🐙","🐳","🐬","🐟","🦀","🦒","🐘","🦔","🦓","🌻","🌈","⭐","🍎","🚀","⚽"];
const GROUP_COLORS = ["#6C4AB6","#E0618A","#2E9E8F","#E8873D","#3C7DD9","#8BB43A","#C2453D","#7A5C3E"];

const LEVELS = {
  lectura:[null,"Letras","Sílabas","Palabras","Frases"],
  escritura:[null,"Letras","Sílabas","Palabras"],
  escucha:[null,"Sílabas","Sonidos","Comprensión","Escenas","Juegos de sonidos"]
};
const FONTS = {
  imprenta:{label:"Imprenta (minúscula)",css:"'Andika'",transform:s=>s},
  mayusculas:{label:"Mayúsculas",css:"'Andika'",transform:s=>s.toLocaleUpperCase("es")},
  cursiva:{label:"Escolar (enlazada)",css:"'Playwrite ES'",transform:s=>s.toLocaleLowerCase("es")}
};
const TOLERANCE = {
  baja:{label:"Exigente",cover:.86,cell:.95,out:.12,k:.85},
  media:{label:"Normal",cover:.78,cell:.9,out:.2,k:1},
  alta:{label:"Muy flexible",cover:.62,cell:.75,out:.38,k:1.45}
};
const ROUND = 6;

// Actividades de cada nivel (en una ronda se van alternando)
const ACTIVITIES = {
  lectura:  {1:["toca-letra"], 2:["toca-silaba","falta-silaba"], 3:["elige-palabra","forma-palabra","falta-letra","une-dibujo","intrusa-lee"], 4:["elige-dibujo","ordena-frase","tijeras","verdad-mentira"]},
  escritura:{1:["trazo"], 2:["trazo","dictado"], 3:["trazo","dictado","copia","completa"]},
  escucha:  {1:["contar-silabas","mas-larga","une-silabas","cuenta-palabras","mas-corta"], 2:["sonido-en","empieza-por","termina-en","intrusa","suena-igual"], 3:["elige-escena"], 4:["monta-escena"], 5:["rima","quita-silaba","da-la-vuelta","encadenadas","anade-silaba"]}
};
const ACT_NAMES = {"toca-letra":"Escucha y toca la letra","toca-silaba":"Escucha y toca la sílaba","falta-silaba":"¿Qué sílaba falta?",
  "elige-palabra":"¿Qué palabra es?","forma-palabra":"Forma la palabra","falta-letra":"¿Qué letra falta?","elige-dibujo":"Lee y toca el dibujo",
  "ordena-frase":"Ordena la frase","trazo":"Repasa","dictado":"Escucha y escribe","tijeras":"Las tijeras",
  "contar-silabas":"¿Cuántas palmadas?","sonido-en":"¿Dónde suena?","empieza-por":"¿Cómo empieza?","elige-escena":"Escucha y elige","monta-escena":"Monta la escena",
  "mas-larga":"La palabra más larga","une-silabas":"Une las sílabas","cuenta-palabras":"Cuenta las palabras","termina-en":"¿Cómo termina?",
  "intrusa":"La intrusa","rima":"Rimas","quita-silaba":"Quita una sílaba","da-la-vuelta":"Da la vuelta"};

// Catálogo de actividades de cada área: nombre propio, icono y nivel
const CATALOG = {
  escucha:[
    {lvl:1,act:"contar-silabas",name:"¿Cuántas palmadas?",icon:"👏"},
    {lvl:1,act:"mas-larga",name:"La palabra más larga",icon:"📏"},
    {lvl:1,act:"une-silabas",name:"Une las sílabas",icon:"🧩"},
    {lvl:1,act:"cuenta-palabras",name:"Cuenta las palabras",icon:"🔢"},
    {lvl:1,act:"mas-corta",name:"¿Cuál es más corta?",icon:"🐜"},
    {lvl:2,act:"sonido-en",name:"¿Dónde suena?",icon:"👂"},
    {lvl:2,act:"empieza-por",name:"¿Cómo empieza?",icon:"🚦"},
    {lvl:2,act:"termina-en",name:"¿Cómo termina?",icon:"🏁"},
    {lvl:2,act:"intrusa",name:"La intrusa",icon:"🕵️"},
    {lvl:2,act:"suena-igual",name:"¿Suena igual?",icon:"👯"},
    {lvl:3,act:"elige-escena",name:"Escucha y elige",icon:"🖼️"},
    {lvl:4,act:"monta-escena",name:"Monta la escena",icon:"🎬"},
    {lvl:5,act:"rima",name:"Rimas",icon:"🎵"},
    {lvl:5,act:"quita-silaba",name:"Quita una sílaba",icon:"🧽"},
    {lvl:5,act:"da-la-vuelta",name:"Da la vuelta",icon:"🔄"},
    {lvl:5,act:"encadenadas",name:"Encadenadas",icon:"🔗"},
    {lvl:5,act:"anade-silaba",name:"Añade una sílaba",icon:"➕"}
  ],
  lectura:[
    {lvl:1,act:"toca-letra",name:"Busca la letra",icon:"🔍"},
    {lvl:2,act:"toca-silaba",name:"Busca la sílaba",icon:"🔎"},
    {lvl:2,act:"falta-silaba",name:"¿Qué sílaba falta?",icon:"❓"},
    {lvl:3,act:"elige-palabra",name:"¿Qué palabra es?",icon:"🏷️"},
    {lvl:3,act:"forma-palabra",name:"Forma la palabra",icon:"🧱"},
    {lvl:3,act:"falta-letra",name:"¿Qué letra falta?",icon:"🔡"},
    {lvl:3,act:"une-dibujo",name:"Une palabra y dibujo",icon:"🖇️"},
    {lvl:3,act:"intrusa-lee",name:"La tarjeta equivocada",icon:"🃏"},
    {lvl:4,act:"elige-dibujo",name:"Lee y toca el dibujo",icon:"📖"},
    {lvl:4,act:"ordena-frase",name:"Ordena la frase",icon:"🔀"},
    {lvl:4,act:"tijeras",name:"Las tijeras",icon:"✂️"},
    {lvl:4,act:"verdad-mentira",name:"¿Verdad o mentira?",icon:"🤔"}
  ],
  escritura:[
    {lvl:1,act:"trazo",name:"Repasa las letras",icon:"✏️"},
    {lvl:2,act:"trazo",name:"Repasa sílabas",icon:"🖍️"},
    {lvl:2,act:"dictado",name:"Dictado de sílabas",icon:"🎧"},
    {lvl:3,act:"trazo",name:"Repasa palabras",icon:"🖊️"},
    {lvl:3,act:"dictado",name:"Dictado de palabras",icon:"📝"},
    {lvl:3,act:"copia",name:"Copia la palabra",icon:"📋"},
    {lvl:3,act:"completa",name:"Completa la palabra",icon:"🔤"}
  ]
};
// Frases de verdad o mentira, a partir del banco
const VERDAD = BANCO_VERDAD.trim().split("\n").flatMap(l=>{ const [k,suj,v,f]=l.split("|");
  return [...v.split(";").map(p=>({k,t:`${suj} ${p}.`,ok:true})),...f.split(";").map(p=>({k,t:`${suj} ${p}.`,ok:false}))]; });
function actName(area,lvl,act){ const e=(CATALOG[area]||[]).find(x=>x.act===act&&x.lvl===lvl)||(CATALOG[area]||[]).find(x=>x.act===act); return e?e.name:(ACT_NAMES[act]||act); }

// Parte de la palabra que rima: desde la vocal tónica hasta el final
function rimaKey(word){
  const w=word.toLowerCase(); const plain=w.normalize("NFD").replace(/[\u0301]/g,"").normalize("NFC");
  const V="aeiouáéíóú"; const vowelsIdx=[]; [...w].forEach((ch,i)=>{ if(V.includes(ch)) vowelsIdx.push(i); });
  if(!vowelsIdx.length) return plain;
  // agrupa vocales seguidas (diptongos)
  const groups=[]; vowelsIdx.forEach(i=>{ const g=groups[groups.length-1]; if(g&&g[g.length-1]===i-1) g.push(i); else groups.push([i]); });
  let tonic;
  const acc=[...w].findIndex(ch=>"áéíóú".includes(ch));
  if(acc>=0) tonic=acc;
  else if(/[aeiouns]$/.test(w) && groups.length>1) tonic=groups[groups.length-2][0];
  else tonic=groups[groups.length-1][0];
  // dentro del diptongo, la vocal fuerte
  const g=groups.find(g=>g.includes(tonic)); if(g&&acc<0){ const strong=g.find(i=>"aeo".includes(w[i])); if(strong!=null) tonic=strong; }
  return [...plain].slice(tonic).join("");
}

// Escenas para la comprensión oral (banco.js)
const SCENE_SUBJ = BANCO_SUJETOS;
const SCENE_ACT = BANCO_ACCIONES;
// Palabras que se descargan como pictogramas (además de las de WORDS)
const PICTO_EXTRA = [...new Set([...SCENE_SUBJ.map(x=>x.k),...SCENE_ACT.map(x=>x.k),...SCENE_ACT.flatMap(a=>a.objs.map(o=>o.k))])];

// Separación en sílabas (aproximada; el docente puede corregirla)
function silabear(word){
  const w=word.toLowerCase(), V="aeiouáéíóúü", strong="aeoáéíóú";
  const isV=c=>V.includes(c);
  const insep=["pl","pr","bl","br","cl","cr","dr","tr","fl","fr","gl","gr","ch","ll","rr","kl","kr"];
  const out=[]; let cur=""; let i=0;
  const chars=[...w];
  // posiciones de núcleos vocálicos (diptongos juntos)
  const nuc=[]; for(let j=0;j<chars.length;j++){ if(isV(chars[j])){ const st=j; while(j+1<chars.length&&isV(chars[j+1])&&!(strong.includes(chars[j])&&strong.includes(chars[j+1]))) j++; nuc.push([st,j]); } }
  if(nuc.length<=1) return [w];
  let start=0;
  for(let n=0;n<nuc.length-1;n++){
    const a=nuc[n][1], b=nuc[n+1][0]; const cons=chars.slice(a+1,b).join("");
    let cut;
    if(cons.length===0) cut=b;
    else if(cons.length===1) cut=a+1;
    else if(cons.length===2) cut=insep.includes(cons)?a+1:a+2;
    else if(cons.length===3) cut=insep.includes(cons.slice(1))?a+2:a+3;
    else cut=a+3;
    out.push(chars.slice(start,cut).join("")); start=cut;
  }
  out.push(chars.slice(start).join(""));
  return out;
}
