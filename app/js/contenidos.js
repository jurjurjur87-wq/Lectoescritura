"use strict";
/* =========================================================
   CONTENIDOS
   ========================================================= */
const LETTERS = "abcdefghijklmnñopqrstuvwxyz".split("");
const LETTER_NAMES = {a:"a",b:"be",c:"ce",d:"de",e:"e",f:"efe",g:"ge",h:"hache",i:"i",j:"jota",k:"ka",l:"ele",m:"eme",n:"ene","ñ":"eñe",o:"o",p:"pe",q:"cu",r:"erre",s:"ese",t:"te",u:"u",v:"uve",w:"uve doble",x:"equis",y:"i griega",z:"zeta"};
const VOWELS = ["a","e","i","o","u"];

// Palabras con dibujo (emoji) y sílabas
const WORDS = [
  {w:"avión",s:["a","vión"],e:"✈️"},{w:"bota",s:["bo","ta"],e:"👢"},{w:"casa",s:["ca","sa"],e:"🏠"},
  {w:"dado",s:["da","do"],e:"🎲"},{w:"erizo",s:["e","ri","zo"],e:"🦔"},{w:"foca",s:["fo","ca"],e:"🦭"},
  {w:"gato",s:["ga","to"],e:"🐱"},{w:"helado",s:["he","la","do"],e:"🍦"},{w:"isla",s:["is","la"],e:"🏝️"},
  {w:"jirafa",s:["ji","ra","fa"],e:"🦒"},{w:"koala",s:["ko","a","la"],e:"🐨"},{w:"luna",s:["lu","na"],e:"🌙"},
  {w:"mano",s:["ma","no"],e:"✋"},{w:"nube",s:["nu","be"],e:"☁️"},{w:"piña",s:["pi","ña"],e:"🍍"},
  {w:"oso",s:["o","so"],e:"🐻"},{w:"pato",s:["pa","to"],e:"🦆"},{w:"queso",s:["que","so"],e:"🧀"},
  {w:"rana",s:["ra","na"],e:"🐸"},{w:"sol",s:["sol"],e:"☀️"},{w:"taza",s:["ta","za"],e:"☕"},
  {w:"uva",s:["u","va"],e:"🍇"},{w:"vaca",s:["va","ca"],e:"🐄"},{w:"kiwi",s:["ki","wi"],e:"🥝"},
  {w:"taxi",s:["ta","xi"],e:"🚕"},{w:"yoyó",s:["yo","yó"],e:"🪀"},{w:"zapato",s:["za","pa","to"],e:"👞"},
  {w:"mono",s:["mo","no"],e:"🐒"},{w:"mesa",s:["me","sa"],e:"🪑"},{w:"pera",s:["pe","ra"],e:"🍐"},
  {w:"tomate",s:["to","ma","te"],e:"🍅"},{w:"pelota",s:["pe","lo","ta"],e:"⚽"},{w:"coche",s:["co","che"],e:"🚗"},
  {w:"llave",s:["lla","ve"],e:"🔑"},{w:"conejo",s:["co","ne","jo"],e:"🐰"},{w:"mariposa",s:["ma","ri","po","sa"],e:"🦋"},
  {w:"lobo",s:["lo","bo"],e:"🐺"},{w:"pez",s:["pez"],e:"🐟"},{w:"dedo",s:["de","do"],e:"☝️"},
  {w:"leche",s:["le","che"],e:"🥛"},{w:"fresa",s:["fre","sa"],e:"🍓"},{w:"globo",s:["glo","bo"],e:"🎈"},
  {w:"pie",s:["pie"],e:"🦶"},{w:"limón",s:["li","món"],e:"🍋"},{w:"seta",s:["se","ta"],e:"🍄"},
  {w:"loro",s:["lo","ro"],e:"🦜"},{w:"cama",s:["ca","ma"],e:"🛏️"},{w:"tijera",s:["ti","je","ra"],e:"✂️"},
  {w:"pala",s:["pa","la"],e:"🪣"},{w:"ratón",s:["ra","tón"],e:"🐭"},{w:"camión",s:["ca","mión"],e:"🚚"},
  {w:"melón",s:["me","lón"],e:"🍈"},{w:"vela",s:["ve","la"],e:"🕯️"},{w:"moto",s:["mo","to"],e:"🏍️"}
];
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
const PHRASES = [
  {t:"El pato nada.",e:"🦆",k:"pato"},{t:"La luna sale.",e:"🌙",k:"luna"},{t:"Mi gato duerme.",e:"🐱",k:"gato"},{t:"La vaca come.",e:"🐄",k:"vaca"},
  {t:"Tomo una pera.",e:"🍐",k:"pera"},{t:"El coche corre.",e:"🚗",k:"coche"},{t:"La foca nada.",e:"🦭",k:"foca"},{t:"Mi casa es bonita.",e:"🏠",k:"casa"},
  {t:"El oso come miel.",e:"🐻",k:"oso"},{t:"Me gusta el helado.",e:"🍦",k:"helado"},{t:"Mamá me da una uva.",e:"🍇",k:"uva"},
  {t:"El sol brilla.",e:"☀️",k:"sol"},{t:"La rana salta.",e:"🐸",k:"rana"},{t:"El mono come.",e:"🐒",k:"mono"},{t:"Pepe tiene un globo.",e:"🎈",k:"globo"},
  {t:"La moto es roja.",e:"🏍️",k:"moto"},{t:"Lola toma leche.",e:"🥛",k:"leche"},{t:"El loro habla.",e:"🦜",k:"loro"},{t:"Mi pelota bota.",e:"⚽",k:"pelota"},
  {t:"La mariposa vuela.",e:"🦋",k:"mariposa"}
];

const AVATARS = ["🐶","🐱","🐭","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🦆","🦉","🐴","🦄","🐝","🐞","🦋","🐢","🐙","🐳","🐬","🐟","🦀","🦒","🐘","🦔","🦓","🌻","🌈","⭐","🍎","🚀","⚽"];
const GROUP_COLORS = ["#6C4AB6","#E0618A","#2E9E8F","#E8873D","#3C7DD9","#8BB43A","#C2453D","#7A5C3E"];

const LEVELS = {
  lectura:[null,"Letras","Sílabas","Palabras","Frases"],
  escritura:[null,"Letras","Sílabas","Palabras"],
  escucha:[null,"Sílabas","Sonidos","Comprensión","Escenas"]
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
  lectura:  {1:["toca-letra"], 2:["toca-silaba","falta-silaba"], 3:["elige-palabra","forma-palabra","falta-letra"], 4:["elige-dibujo","ordena-frase","tijeras"]},
  escritura:{1:["trazo"], 2:["trazo","dictado"], 3:["trazo","dictado"]},
  escucha:  {1:["contar-silabas"], 2:["sonido-en","empieza-por"], 3:["elige-escena"], 4:["monta-escena"]}
};
const ACT_NAMES = {"toca-letra":"Escucha y toca la letra","toca-silaba":"Escucha y toca la sílaba","falta-silaba":"¿Qué sílaba falta?",
  "elige-palabra":"¿Qué palabra es?","forma-palabra":"Forma la palabra","falta-letra":"¿Qué letra falta?","elige-dibujo":"Lee y toca el dibujo",
  "ordena-frase":"Ordena la frase","trazo":"Repasa","dictado":"Escucha y escribe","tijeras":"Las tijeras",
  "contar-silabas":"¿Cuántas palmadas?","sonido-en":"¿Dónde suena?","empieza-por":"¿Cómo empieza?","elige-escena":"Escucha y elige","monta-escena":"Monta la escena"};

// Escenas para la comprensión oral: quién + qué hace + con qué
const SCENE_SUBJ = [
  {k:"niño",t:"El niño",e:"👦"},{k:"niña",t:"La niña",e:"👧"},{k:"abuela",t:"La abuela",e:"👵"},
  {k:"bebé",t:"El bebé",e:"👶"},{k:"perro",t:"El perro",e:"🐶"},{k:"gato",t:"El gato",e:"🐱"}
];
const SCENE_ACT = [
  {k:"comer",t:"come",e:"🍴",who:["niño","niña","abuela","bebé","perro","gato"],objs:[{k:"manzana",t:"una manzana",e:"🍎"},{k:"plátano",t:"un plátano",e:"🍌"},{k:"pan",t:"pan",e:"🍞"},{k:"helado",t:"un helado",e:"🍦"}]},
  {k:"beber",t:"bebe",e:"🥤",who:["niño","niña","abuela","bebé","perro","gato"],objs:[{k:"leche",t:"leche",e:"🥛"},{k:"agua",t:"agua",e:"💧"},{k:"zumo",t:"zumo",e:"🧃"}]},
  {k:"jugar",t:"juega con",e:"🧸",who:["niño","niña","bebé","perro","gato"],objs:[{k:"pelota",t:"la pelota",e:"⚽"},{k:"globo",t:"un globo",e:"🎈"},{k:"coche",t:"un coche",e:"🚗"}]},
  {k:"pintar",t:"pinta",e:"🖌️",who:["niño","niña","abuela"],objs:[{k:"casa",t:"una casa",e:"🏠"},{k:"sol",t:"un sol",e:"☀️"},{k:"flor",t:"una flor",e:"🌸"}]},
  {k:"dormir",t:"duerme en",e:"💤",who:["niño","niña","abuela","bebé","perro","gato"],objs:[{k:"cama",t:"la cama",e:"🛏️"},{k:"sofá",t:"el sofá",e:"🛋️"}]}
];
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
