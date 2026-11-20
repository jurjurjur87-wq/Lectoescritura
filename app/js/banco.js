"use strict";
/* =========================================================
   BANCO DE CONTENIDOS
   Palabras (con sílabas y emoji de reserva), frases y escenas.
   Si hay pictograma de ARASAAC descargado para la palabra, se usa en lugar del emoji.
   Formato de palabra: "pa-la-bra emoji"
   ========================================================= */
const BANCO_PALABRAS = `
pa-to 🦆|ga-to 🐱|pe-rro 🐶|o-so 🐻|va-ca 🐄|cer-do 🐷|ca-ba-llo 🐴|o-ve-ja 🐑|ca-bra 🐐|co-ne-jo 🐰
ra-tón 🐭|ra-na 🐸|mo-no 🐒|le-ón 🦁|ti-gre 🐯|ce-bra 🦓|ji-ra-fa 🦒|e-le-fan-te 🐘|ca-me-llo 🐫|lo-bo 🐺
zo-rro 🦊|ar-di-lla 🐿️|e-ri-zo 🦔|ko-a-la 🐨|pan-da 🐼|fo-ca 🦭|ba-lle-na 🐳|del-fín 🐬|pez 🐟|ti-bu-rón 🦈
pul-po 🐙|can-gre-jo 🦀|tor-tu-ga 🐢|ser-pien-te 🐍|co-co-dri-lo 🐊|di-no-sau-rio 🦕|lo-ro 🦜|bú-ho 🦉|po-lli-to 🐥|ga-llo 🐓
ga-lli-na 🐔|pa-lo-ma 🕊️|a-be-ja 🐝|ma-ri-po-sa 🦋|a-ra-ña 🕷️|hor-mi-ga 🐜|ca-ra-col 🐌|mos-qui-to 🦟|mur-cié-la-go 🦇|can-gu-ro 🦘
lla-ma 🦙|pa-vo 🦃|gam-ba 🦐|la-gar-to 🦎|cis-ne 🦢|o-ru-ga 🐛|ma-ri-qui-ta 🐞|ra-ta 🐀
man-za-na 🍎|pe-ra 🍐|plá-ta-no 🍌|u-va 🍇|fre-sa 🍓|ce-re-za 🍒|li-món 🍋|na-ran-ja 🍊|pi-ña 🍍|me-lón 🍈
san-dí-a 🍉|ki-wi 🥝|co-co 🥥|to-ma-te 🍅|za-na-ho-ria 🥕|pa-ta-ta 🥔|ma-íz 🌽|pe-pi-no 🥒|le-chu-ga 🥬|se-ta 🍄
pan 🍞|que-so 🧀|hue-vo 🥚|le-che 🥛|miel 🍯|he-la-do 🍦|tar-ta 🎂|ga-lle-ta 🍪|ca-ra-me-lo 🍬|piz-za 🍕
so-pa 🍲|a-rroz 🍚|sal-chi-cha 🌭|ham-bur-gue-sa 🍔|bo-ca-di-llo 🥪|cho-co-la-te 🍫|pa-lo-mi-tas 🍿|pi-ru-li-to 🍭|mag-da-le-na 🧁
ca-sa 🏠|ca-ma 🛏️|so-fá 🛋️|puer-ta 🚪|lla-ve 🔑|re-loj ⌚|li-bro 📖|lá-piz ✏️|ti-je-ra ✂️|re-gla 📏
mo-chi-la 🎒|pe-lo-ta ⚽|glo-bo 🎈|yo-yó 🪀|da-do 🎲|tam-bor 🥁|gui-ta-rra 🎸|pia-no 🎹|trom-pe-ta 🎺|vio-lín 🎻
cam-pa-na 🔔|ve-la 🕯️|bom-bi-lla 💡|te-lé-fo-no 📱|or-de-na-dor 💻|te-le-vi-sión 📺|ra-dio 📻|cá-ma-ra 📷|pa-ra-guas ☂️|ga-fas 👓
za-pa-to 👞|bo-ta 👢|cal-ce-tín 🧦|ca-mi-se-ta 👕|pan-ta-lón 👖|ves-ti-do 👗|go-rra 🧢|co-ro-na 👑|a-ni-llo 💍|bol-so 👜
ma-le-ta 🧳|es-co-ba 🧹|ja-bón 🧼|mar-ti-llo 🔨|tor-ni-llo 🔩|i-mán 🧲|re-ga-lo 🎁|bo-te-lla 🍾|cu-cha-ra 🥄|te-ne-dor 🍴
cu-chi-llo 🔪|pla-to 🍽️|sar-tén 🍳|ta-za ☕|car-ta ✉️|ca-ja 📦|lu-pa 🔍
co-che 🚗|mo-to 🏍️|bi-ci-cle-ta 🚲|au-to-bús 🚌|ca-mión 🚚|tren 🚆|a-vión ✈️|bar-co ⛵|co-he-te 🚀|ta-xi 🚕
trac-tor 🚜|he-li-cóp-te-ro 🚁|am-bu-lan-cia 🚑|pa-ti-ne-te 🛴|ya-te 🛥️|fur-go-ne-ta 🚐|po-li-cí-a 👮|bom-be-ro 🚒|lan-cha 🚤|ca-no-a 🛶
sol ☀️|lu-na 🌙|es-tre-lla ⭐|nu-be ☁️|llu-via 🌧️|nie-ve ❄️|ra-yo ⚡|ar-co-í-ris 🌈|flor 🌸|ro-sa 🌹
ár-bol 🌳|ho-ja 🍃|cac-tus 🌵|mon-ta-ña ⛰️|vol-cán 🌋|is-la 🏝️|pla-ya 🏖️|fue-go 🔥|a-gua 💧|o-la 🌊
pal-me-ra 🌴|gi-ra-sol 🌻|tu-li-pán 🌷|tré-bol 🍀|pi-no 🌲|tie-rra 🌍|vien-to 🌬️|ca-la-ba-za 🎃|be-llo-ta 🌰
ma-no ✋|pie 🦶|o-jo 👁️|o-re-ja 👂|na-riz 👃|bo-ca 👄|dien-te 🦷|de-do ☝️|pier-na 🦵|bra-zo 💪
ni-ño 👦|ni-ña 👧|be-bé 👶|a-bue-la 👵|a-bue-lo 👴|ma-má 👩|pa-pá 👨|rey 🤴|rei-na 👸|ha-da 🧚
pa-ya-so 🤡|ro-bot 🤖|fan-tas-ma 👻|bru-ja 🧙|mé-di-co 🩺|pin-tor 🎨|ma-go 🎩
cas-ti-llo 🏰|es-cue-la 🏫|hos-pi-tal 🏥|tien-da 🏪|cir-co 🎪|fe-ria 🎡|ca-rre-te-ra 🛣️|puen-te 🌉|cam-pa-men-to ⛺
sa-xo-fón 🎷|mi-cró-fo-no 🎤|pin-cel 🖌️|ti-za 🖍️|ces-ta 🧺
ca-ra 🙂|ca-ri-ño 🤗|be-so 😘|ri-sa 😂|sue-ño 😴|llan-to 😢|fies-ta 🎉|mú-si-ca 🎵|co-ra-zón ❤️
pe-lu-che 🧸|ar-co 🏹|di-ne-ro 💰|bu-fan-da 🧣|guan-te 🧤|cha-que-ta 🧥
`;
// Palabras repetidas o con dibujo dudoso se filtran al cargar
const BANCO_FRASES = `
El pato nada.|pato
La luna sale.|luna
Mi gato duerme.|gato
La vaca come hierba.|vaca
Tomo una pera.|pera
El coche corre.|coche
La foca nada.|foca
Mi casa es bonita.|casa
El oso come miel.|oso
Me gusta el helado.|helado
Mamá me da una uva.|uva
El sol brilla.|sol
La rana salta.|rana
El mono come un plátano.|mono
Pepe tiene un globo.|globo
La moto es roja.|moto
Lola toma leche.|leche
El loro habla.|loro
Mi pelota bota.|pelota
La mariposa vuela.|mariposa
El perro ladra.|perro
El caballo corre.|caballo
La oveja come.|oveja
El conejo salta.|conejo
El ratón come queso.|ratón
El león ruge.|león
La jirafa es alta.|jirafa
El elefante es grande.|elefante
El pez nada en el agua.|pez
La tortuga es lenta.|tortuga
La abeja hace miel.|abeja
El caracol sube.|caracol
La gallina pone un huevo.|gallina
El gallo canta.|gallo
El búho vuela de noche.|búho
La ballena es enorme.|ballena
Como una manzana roja.|manzana
La fresa es dulce.|fresa
El limón es amarillo.|limón
Pela la naranja.|naranja
La sandía tiene pepitas.|sandía
Corto el tomate.|tomate
El conejo come zanahoria.|zanahoria
El pan está caliente.|pan
Rompo un huevo.|huevo
Hay una tarta de cumpleaños.|tarta
La galleta es redonda.|galleta
Comemos pizza.|pizza
La sopa quema.|sopa
Me voy a la cama.|cama
Abro la puerta.|puerta
Tengo una llave.|llave
Leo un libro.|libro
Pinto con el lápiz.|lápiz
Corto con la tijera.|tijera
Llevo la mochila.|mochila
Toco la guitarra.|guitarra
Toco el tambor.|tambor
Suena la campana.|campana
Enciendo la vela.|vela
Hablo por teléfono.|teléfono
Uso el paraguas.|paraguas
Mi abuela lleva gafas.|gafas
Me pongo el zapato.|zapato
Llevo una camiseta azul.|camiseta
El rey tiene una corona.|corona
Barro con la escoba.|escoba
Me lavo con jabón.|jabón
Te doy un regalo.|regalo
Como con la cuchara.|cuchara
El plato está lleno.|plato
Monto en bicicleta.|bicicleta
Subo al autobús.|autobús
El tren pita.|tren
El avión vuela alto.|avión
El barco navega.|barco
El cohete va a la luna.|cohete
El tractor ara.|tractor
La ambulancia corre.|ambulancia
Mira la estrella.|estrella
Hay una nube gris.|nube
Cae la lluvia.|lluvia
Juego con la nieve.|nieve
Sale el arcoíris.|arcoíris
Huelo una flor.|flor
Subo al árbol.|árbol
Cae una hoja.|hoja
Vamos a la playa.|playa
El fuego quema.|fuego
Bebo agua.|agua
Me lavo las manos.|mano
Me duele el diente.|diente
El niño ríe.|niño
La niña salta.|niña
El bebé duerme.|bebé
Mi abuelo pasea.|abuelo
El payaso hace reír.|payaso
El robot anda.|robot
El fantasma da miedo.|fantasma
La bruja vuela.|bruja
El castillo es enorme.|castillo
Voy a la escuela.|escuela
Vamos al circo.|circo
Duermo con mi peluche.|peluche
Me pongo la bufanda.|bufanda
Me abrocho la chaqueta.|chaqueta
`;
// Escenas para la comprensión oral: quién + qué hace + con qué
const BANCO_SUJETOS = [
  {k:"niño",t:"El niño",e:"👦"},{k:"niña",t:"La niña",e:"👧"},{k:"abuela",t:"La abuela",e:"👵"},{k:"abuelo",t:"El abuelo",e:"👴"},
  {k:"bebé",t:"El bebé",e:"👶"},{k:"mamá",t:"Mamá",e:"👩"},{k:"papá",t:"Papá",e:"👨"},{k:"perro",t:"El perro",e:"🐶"},
  {k:"gato",t:"El gato",e:"🐱"},{k:"mono",t:"El mono",e:"🐒"},{k:"oso",t:"El oso",e:"🐻"},{k:"conejo",t:"El conejo",e:"🐰"}
];
const PERSONAS=["niño","niña","abuela","abuelo","mamá","papá"];
const BANCO_ACCIONES = [
  {k:"comer",t:"come",e:"🍴",who:[...PERSONAS,"bebé","perro","gato","mono","oso","conejo"],objs:[{k:"manzana",t:"una manzana",e:"🍎"},{k:"plátano",t:"un plátano",e:"🍌"},{k:"pan",t:"pan",e:"🍞"},{k:"helado",t:"un helado",e:"🍦"},{k:"galleta",t:"una galleta",e:"🍪"},{k:"pera",t:"una pera",e:"🍐"},{k:"zanahoria",t:"una zanahoria",e:"🥕"},{k:"tarta",t:"tarta",e:"🎂"}]},
  {k:"beber",t:"bebe",e:"🥤",who:[...PERSONAS,"bebé","perro","gato","oso"],objs:[{k:"leche",t:"leche",e:"🥛"},{k:"agua",t:"agua",e:"💧"},{k:"zumo",t:"zumo",e:"🧃"}]},
  {k:"jugar",t:"juega con",e:"🧸",who:["niño","niña","bebé","perro","gato","mono"],objs:[{k:"pelota",t:"la pelota",e:"⚽"},{k:"globo",t:"un globo",e:"🎈"},{k:"coche",t:"un coche",e:"🚗"},{k:"robot",t:"un robot",e:"🤖"},{k:"dado",t:"un dado",e:"🎲"},{k:"peluche",t:"un peluche",e:"🧸"}]},
  {k:"pintar",t:"pinta",e:"🖌️",who:["niño","niña","abuela","abuelo","mamá","papá"],objs:[{k:"casa",t:"una casa",e:"🏠"},{k:"sol",t:"un sol",e:"☀️"},{k:"flor",t:"una flor",e:"🌸"},{k:"árbol",t:"un árbol",e:"🌳"},{k:"estrella",t:"una estrella",e:"⭐"}]},
  {k:"dormir",t:"duerme en",e:"💤",who:[...PERSONAS,"bebé","perro","gato","oso"],objs:[{k:"cama",t:"la cama",e:"🛏️"},{k:"sofá",t:"el sofá",e:"🛋️"}]},
  {k:"leer",t:"lee",e:"👀",who:PERSONAS,objs:[{k:"libro",t:"un libro",e:"📖"},{k:"carta",t:"una carta",e:"✉️"}]},
  {k:"lavar",t:"lava",e:"🧼",who:PERSONAS,objs:[{k:"plato",t:"un plato",e:"🍽️"},{k:"coche",t:"el coche",e:"🚗"},{k:"camiseta",t:"una camiseta",e:"👕"}]},
  {k:"tocar",t:"toca",e:"🎶",who:["niño","niña","abuela","abuelo","mamá","papá","mono","oso"],objs:[{k:"tambor",t:"el tambor",e:"🥁"},{k:"guitarra",t:"la guitarra",e:"🎸"},{k:"piano",t:"el piano",e:"🎹"},{k:"trompeta",t:"la trompeta",e:"🎺"}]},
  {k:"subir",t:"sube al",e:"⬆️",who:PERSONAS,objs:[{k:"autobús",t:"autobús",e:"🚌"},{k:"tren",t:"tren",e:"🚆"},{k:"barco",t:"barco",e:"⛵"},{k:"avión",t:"avión",e:"✈️"}]}
];
