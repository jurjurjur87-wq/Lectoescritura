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
so-pa 🍲|a-rroz 🍚|sal-chi-cha 🌭|ham-bur-gue-sa 🍔|bo-ca-di-llo 🥪|cho-co-la-te 🍫|pa-lo-mi-tas 🍿|pi-ru-le-ta 🍭|mag-da-le-na 🧁
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
pin-güi-no 🐧|pá-ja-ro 🐦|á-gui-la 🦅|fla-men-co 🦩|hi-po-pó-ta-mo 🦛|ri-no-ce-ron-te 🦏|go-ri-la 🦍|cier-vo 🦌|ma-pa-che 🦝|nu-tria 🦦
cas-tor 🦫|mo-fe-ta 🦨|os-tra 🦪|ca-la-mar 🦑|lan-gos-ta 🦞|gu-sa-no 🪱|es-cor-pión 🦂|gri-llo 🦗|mos-ca 🪰
dra-gón 🐉|u-ni-cor-nio 🦄|to-ro 🐂|car-ne-ro 🐏|ja-ba-lí 🐗|le-o-par-do 🐆|ca-cho-rro 🐕|ca-ba-lli-to 🎠
a-gua-ca-te 🥑|be-ren-je-na 🍆|bró-co-li 🥦|guin-di-lla 🌶️|a-jo 🧄|ce-bo-lla 🧅|me-lo-co-tón 🍑|man-go 🥭|ca-ca-hue-te 🥜
pa-e-lla 🥘|es-pa-gue-tis 🍝|ta-co 🌮|ros-qui-lla 🍩|sal 🧂|a-cei-tu-na 🫒|cuen-co 🥣|bi-be-rón 🍼|té 🍵
zu-mo 🧃|hie-lo 🧊|fi-le-te 🥩|po-llo 🍗|ja-món 🍖|man-te-qui-lla 🧈|ba-rra 🥖|pas-tel 🍰
ti-ri-ta 🩹|ter-mó-me-tro 🌡️|ca-rri-to 🛒|co-me-ta 🪁|ra-que-ta 🏸|ba-lón 🏀|pa-tín 🛼|mo-ne-da 🪙|can-da-do 🔒|lin-ter-na 🔦
pi-la 🔋|en-chu-fe 🔌|sie-rra 🪚|ha-cha 🪓|es-ca-le-ra 🪜|cu-bo 🪣|ce-pi-llo 🪥|es-pe-jo 🪞|ven-ta-na 🪟|si-lla 🪑
ba-ñe-ra 🛁|du-cha 🚿|vá-ter 🚽|es-pon-ja 🧽|bo-lí-gra-fo 🖊️|cua-der-no 📓|car-pe-ta 📁|ca-len-da-rio 📅|clip 📎|chin-che-ta 📌
pe-rió-di-co 📰|ma-pa 🗺️|brú-ju-la 🧭|tro-fe-o 🏆|me-da-lla 🏅|ban-de-ra 🚩|cas-co ⛑️|som-bre-ro 👒|cor-ba-ta 👔|chan-cla 🩴
za-pa-ti-lla 👟|ta-cón 👠|pi-ña-ta 🪅|puz-le 🧩|a-je-drez ♟️|plan-ta 🌱|tron-co 🪵|pie-dra 🪨|ca-ra-co-la 🐚|pa-ja-ri-ta 🎀
i-gle-sia ⛪|fá-bri-ca 🏭|ca-ba-ña 🛖|es-ta-dio 🏟️|fuen-te ⛲|de-sier-to 🏜️|no-che 🌃|ciu-dad 🏙️|tor-na-do 🌪️|nie-bla 🌫️
pla-ne-ta 🪐|sa-té-li-te 🛰️|tran-ví-a 🚋|me-tro 🚇|pa-ra-ca-í-das 🪂|grú-a 🏗️|se-má-fo-ro 🚦|an-cla ⚓|mo-no-pa-tín 🛹|ga-so-li-ne-ra ⛽
guar-dia 💂|bai-la-ri-na 💃|va-que-ro 🤠|si-re-na 🧜|vam-pi-ro 🧛|án-gel 👼|ce-re-bro 🧠|hue-so 🦴|len-gua 👅|u-ña 💅
mu-ñe-ca 🪆|pa-pel 📄|so-bre 📩|ca-mi-no 🛤️
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
El pingüino tiene frío.|pingüino
El pájaro canta.|pájaro
El águila vuela alto.|águila
El flamenco es rosa.|flamenco
El hipopótamo se baña.|hipopótamo
El gorila come fruta.|gorila
El ciervo corre por el bosque.|ciervo
El gusano sale de la tierra.|gusano
El grillo canta de noche.|grillo
La mosca vuela.|mosca
El dragón echa fuego.|dragón
El unicornio es blanco.|unicornio
El toro es fuerte.|toro
El jabalí corre.|jabalí
El aguacate es verde.|aguacate
La cebolla me hace llorar.|cebolla
El melocotón es dulce.|melocotón
Como un mango.|mango
Papá hace paella.|paella
Me gustan los espaguetis.|espaguetis
Comemos tacos.|taco
El bebé toma el biberón.|biberón
Bebo zumo de naranja.|zumo
El hielo está frío.|hielo
Comemos pollo.|pollo
La tirita me cura.|tirita
Empujo el carrito.|carrito
Mi cometa vuela.|cometa
Boto el balón.|balón
Guardo la moneda.|moneda
Enciendo la linterna.|linterna
Subo por la escalera.|escalera
Lleno el cubo de arena.|cubo
Me lavo los dientes con el cepillo.|cepillo
Me miro en el espejo.|espejo
Abro la ventana.|ventana
Me siento en la silla.|silla
Me baño en la bañera.|bañera
Me ducho con agua.|ducha
Escribo con el bolígrafo.|bolígrafo
Pinto en el cuaderno.|cuaderno
Miro el mapa.|mapa
Gano una medalla.|medalla
La bandera es roja.|bandera
Llevo un sombrero.|sombrero
Me pongo las zapatillas.|zapatilla
Rompemos la piñata.|piñata
Hago un puzle.|puzle
Riego la planta.|planta
Tiro una piedra al río.|piedra
Vamos a la iglesia.|iglesia
La fuente echa agua.|fuente
El desierto tiene arena.|desierto
Es de noche.|noche
Hay mucha niebla.|niebla
Viajo en metro.|metro
El semáforo está en verde.|semáforo
El barco echa el ancla.|ancla
Monto en monopatín.|monopatín
La bailarina baila.|bailarina
El vaquero monta a caballo.|vaquero
La sirena nada en el mar.|sirena
Me duele la uña.|uña
El perro come un hueso.|hueso
Saco la lengua.|lengua
Juego con mi muñeca.|muñeca
Mando un sobre.|sobre
El camino es largo.|camino
Mi papel es blanco.|papel
El castor hace una casa.|castor
El calamar es largo.|calamar
La langosta es roja.|langosta
El planeta es redondo.|planeta
El tranvía para aquí.|tranvía
La grúa sube la caja.|grúa
El cachorro juega.|cachorro
Me echo sal.|sal
Pongo mantequilla en el pan.|mantequilla
Oigo el mar en la caracola.|caracola
`;
// Escenas para la comprensión oral: quién + qué hace + con qué
const BANCO_SUJETOS = [
  {k:"niño",t:"El niño",e:"👦"},{k:"niña",t:"La niña",e:"👧"},{k:"abuela",t:"La abuela",e:"👵"},{k:"abuelo",t:"El abuelo",e:"👴"},
  {k:"bebé",t:"El bebé",e:"👶"},{k:"mamá",t:"Mamá",e:"👩"},{k:"papá",t:"Papá",e:"👨"},{k:"perro",t:"El perro",e:"🐶"},
  {k:"gato",t:"El gato",e:"🐱"},{k:"mono",t:"El mono",e:"🐒"},{k:"oso",t:"El oso",e:"🐻"},{k:"conejo",t:"El conejo",e:"🐰"},
  {k:"payaso",t:"El payaso",e:"🤡"},{k:"rey",t:"El rey",e:"🤴"},{k:"reina",t:"La reina",e:"👸"},{k:"hada",t:"El hada",e:"🧚"},
  {k:"robot",t:"El robot",e:"🤖"},{k:"pingüino",t:"El pingüino",e:"🐧"}
];
const PERSONAS=["niño","niña","abuela","abuelo","mamá","papá"];
const MAYORES=["abuela","abuelo","mamá","papá"];
const BANCO_ACCIONES = [
  {k:"comer",t:"come",e:"🍴",who:[...PERSONAS,"bebé","perro","gato","mono","oso","conejo","rey","reina","payaso","hada"],objs:[{k:"fresa",t:"una fresa",e:"🍓"},{k:"pastel",t:"un pastel",e:"🍰"},{k:"uva",t:"una uva",e:"🍇"},{k:"manzana",t:"una manzana",e:"🍎"},{k:"plátano",t:"un plátano",e:"🍌"},{k:"pan",t:"pan",e:"🍞"},{k:"helado",t:"un helado",e:"🍦"},{k:"galleta",t:"una galleta",e:"🍪"},{k:"pera",t:"una pera",e:"🍐"},{k:"zanahoria",t:"una zanahoria",e:"🥕"},{k:"tarta",t:"tarta",e:"🎂"}]},
  {k:"beber",t:"bebe",e:"🥤",who:[...PERSONAS,"bebé","perro","gato","oso"],objs:[{k:"leche",t:"leche",e:"🥛"},{k:"agua",t:"agua",e:"💧"},{k:"zumo",t:"zumo",e:"🧃"}]},
  {k:"jugar",t:"juega con",e:"🧸",who:["niño","niña","bebé","perro","gato","mono"],objs:[{k:"pelota",t:"la pelota",e:"⚽"},{k:"globo",t:"un globo",e:"🎈"},{k:"coche",t:"un coche",e:"🚗"},{k:"robot",t:"un robot",e:"🤖"},{k:"dado",t:"un dado",e:"🎲"},{k:"peluche",t:"un peluche",e:"🧸"}]},
  {k:"pintar",t:"pinta",e:"🖌️",who:["niño","niña","abuela","abuelo","mamá","papá"],objs:[{k:"casa",t:"una casa",e:"🏠"},{k:"sol",t:"un sol",e:"☀️"},{k:"flor",t:"una flor",e:"🌸"},{k:"árbol",t:"un árbol",e:"🌳"},{k:"estrella",t:"una estrella",e:"⭐"}]},
  {k:"dormir",t:"duerme en",e:"💤",who:[...PERSONAS,"bebé","perro","gato","oso"],objs:[{k:"cama",t:"la cama",e:"🛏️"},{k:"sofá",t:"el sofá",e:"🛋️"}]},
  {k:"leer",t:"lee",e:"👀",who:PERSONAS,objs:[{k:"libro",t:"un libro",e:"📖"},{k:"carta",t:"una carta",e:"✉️"}]},
  {k:"lavar",t:"lava",e:"🧼",who:PERSONAS,objs:[{k:"plato",t:"un plato",e:"🍽️"},{k:"coche",t:"el coche",e:"🚗"},{k:"camiseta",t:"una camiseta",e:"👕"}]},
  {k:"tocar",t:"toca",e:"🎶",who:["niño","niña","abuela","abuelo","mamá","papá","mono","oso","payaso","robot","rey","reina"],objs:[{k:"violín",t:"el violín",e:"🎻"},{k:"saxofón",t:"el saxofón",e:"🎷"},{k:"tambor",t:"el tambor",e:"🥁"},{k:"guitarra",t:"la guitarra",e:"🎸"},{k:"piano",t:"el piano",e:"🎹"},{k:"trompeta",t:"la trompeta",e:"🎺"}]},
  {k:"subir",t:"sube al",e:"⬆️",who:PERSONAS,objs:[{k:"autobús",t:"autobús",e:"🚌"},{k:"tren",t:"tren",e:"🚆"},{k:"barco",t:"barco",e:"⛵"},{k:"avión",t:"avión",e:"✈️"}]},
  {k:"abrir",t:"abre",e:"👐",who:[...PERSONAS,"rey","reina","payaso","robot"],objs:[{k:"puerta",t:"la puerta",e:"🚪"},{k:"caja",t:"la caja",e:"📦"},{k:"regalo",t:"un regalo",e:"🎁"},{k:"ventana",t:"la ventana",e:"🪟"},{k:"maleta",t:"la maleta",e:"🧳"}]},
  {k:"llevar",t:"lleva",e:"🤲",who:[...PERSONAS,"payaso","robot","hada"],objs:[{k:"mochila",t:"la mochila",e:"🎒"},{k:"paraguas",t:"un paraguas",e:"☂️"},{k:"cesta",t:"una cesta",e:"🧺"},{k:"globo",t:"un globo",e:"🎈"},{k:"bolso",t:"un bolso",e:"👜"},{k:"flor",t:"una flor",e:"🌸"}]},
  {k:"ponerse",t:"se pone",e:"🧍",who:[...PERSONAS,"rey","reina","payaso","pingüino"],objs:[{k:"gorra",t:"la gorra",e:"🧢"},{k:"gafas",t:"las gafas",e:"👓"},{k:"bufanda",t:"la bufanda",e:"🧣"},{k:"corona",t:"la corona",e:"👑"},{k:"sombrero",t:"un sombrero",e:"👒"},{k:"chaqueta",t:"la chaqueta",e:"🧥"}]},
  {k:"conducir",t:"conduce",e:"🚦",who:[...MAYORES,"robot","payaso"],objs:[{k:"coche",t:"el coche",e:"🚗"},{k:"camión",t:"el camión",e:"🚚"},{k:"tractor",t:"el tractor",e:"🚜"},{k:"autobús",t:"el autobús",e:"🚌"},{k:"moto",t:"la moto",e:"🏍️"},{k:"taxi",t:"el taxi",e:"🚕"}]},
  {k:"cortar",t:"corta",e:"🔪",who:MAYORES,objs:[{k:"pan",t:"el pan",e:"🍞"},{k:"tarta",t:"la tarta",e:"🎂"},{k:"tomate",t:"un tomate",e:"🍅"},{k:"pizza",t:"la pizza",e:"🍕"},{k:"queso",t:"el queso",e:"🧀"},{k:"sandía",t:"la sandía",e:"🍉"}]},
  {k:"mirar",t:"mira",e:"👁️",who:[...PERSONAS,"bebé","gato","perro","mono","rey","reina","hada","pingüino"],objs:[{k:"luna",t:"la luna",e:"🌙"},{k:"estrella",t:"una estrella",e:"⭐"},{k:"arcoíris",t:"el arcoíris",e:"🌈"},{k:"mariposa",t:"una mariposa",e:"🦋"},{k:"televisión",t:"la televisión",e:"📺"},{k:"pez",t:"un pez",e:"🐟"}]},
  {k:"coger",t:"coge",e:"✊",who:[...PERSONAS,"bebé","mono","robot","hada"],objs:[{k:"llave",t:"la llave",e:"🔑"},{k:"pelota",t:"la pelota",e:"⚽"},{k:"lápiz",t:"un lápiz",e:"✏️"},{k:"manzana",t:"una manzana",e:"🍎"},{k:"teléfono",t:"el teléfono",e:"📱"},{k:"seta",t:"una seta",e:"🍄"}]}
];

// ¿Verdad o mentira?: dibujo|sujeto|cosas verdaderas;...|cosas falsas;...
const BANCO_VERDAD = `
pez|El pez|nada;vive en el agua;tiene aletas|vuela;ladra;tiene ruedas;anda en bici
perro|El perro|ladra;tiene cola;come huesos;tiene cuatro patas|maúlla;vuela;pone huevos;lee libros
gato|El gato|maúlla;tiene bigotes;bebe leche;caza ratones|ladra;nada en el mar;conduce;tiene alas
pájaro|El pájaro|vuela;tiene plumas;canta;tiene pico|ladra;tiene ruedas;vive en el mar;lleva gafas
vaca|La vaca|da leche;come hierba;dice mu;tiene cuernos|vuela;pone huevos;vive en el mar;sabe leer
gallina|La gallina|pone huevos;tiene plumas;tiene pico|da leche;ladra;tiene ruedas;nada en el río
oveja|La oveja|tiene lana;come hierba;dice bee|tiene alas;ladra;conduce un coche
caballo|El caballo|corre mucho;come hierba;tiene cola|vuela;pone huevos;vive en el agua
pato|El pato|nada;tiene pico;tiene plumas|tiene ruedas;ladra;lleva corbata
rana|La rana|salta;es verde;vive en la charca|tiene plumas;ladra;es muy grande
mono|El mono|sube a los árboles;come plátanos;tiene cola|vive en el mar;pone huevos;tiene ruedas
león|El león|ruge;tiene melena;es fuerte|maúlla;come hierba;vuela
elefante|El elefante|es grande;tiene trompa;tiene orejas grandes|es pequeño;vuela;cabe en una caja
jirafa|La jirafa|tiene el cuello largo;es alta;come hojas|es bajita;vive en el mar;ladra
tortuga|La tortuga|es lenta;tiene caparazón;pone huevos|corre mucho;vuela;tiene alas
caracol|El caracol|es lento;tiene concha;deja baba|corre mucho;tiene alas;ladra
abeja|La abeja|hace miel;vuela;tiene alas|da leche;ladra;tiene ruedas
mariposa|La mariposa|vuela;tiene alas de colores|ladra;nada en el mar;es un pez
ballena|La ballena|vive en el mar;es enorme;nada|vuela;es pequeña;vive en un árbol
pingüino|El pingüino|vive en el frío;nada;anda despacio|vive en el desierto;vuela alto;tiene ruedas
oso|El oso|come miel;es grande;tiene pelo|vuela;pone huevos;es muy pequeño
conejo|El conejo|salta;come zanahorias;tiene orejas largas|ladra;vuela;come piedras
ratón|El ratón|es pequeño;come queso;tiene cola|es enorme;vuela;ladra
araña|La araña|tiene ocho patas;hace telas|tiene dos patas;da leche;canta
serpiente|La serpiente|no tiene patas;se arrastra|tiene alas;ladra;tiene cuatro patas
cocodrilo|El cocodrilo|tiene muchos dientes;nada en el río|vuela;come pasteles;tiene plumas
búho|El búho|vuela de noche;tiene plumas;tiene ojos grandes|ladra;nada en el mar;tiene ruedas
loro|El loro|habla;tiene plumas;tiene pico|tiene ruedas;vive en el mar;da leche
sol|El sol|da luz;da calor;sale de día|sale de noche;es frío;es azul
luna|La luna|sale de noche;está en el cielo|sale de día;está en el mar;se come
nieve|La nieve|es fría;es blanca;cae en invierno|es caliente;es verde;cae en verano
fuego|El fuego|quema;da calor|es frío;se bebe;es azul
agua|El agua|moja;se bebe;está en el mar|quema;es de madera;se come con tenedor
lluvia|La lluvia|moja;cae de las nubes|quema;sale de la tierra;es de papel
árbol|El árbol|tiene hojas;tiene tronco;crece|anda;habla;tiene ruedas
flor|La flor|huele bien;crece en el jardín;tiene pétalos|ladra;se conduce;tiene patas
manzana|La manzana|es una fruta;se come;puede ser roja|es un animal;ladra;se pone en los pies
plátano|El plátano|es amarillo;es una fruta;se pela|es azul;ladra;se conduce
limón|El limón|es amarillo;es ácido|es dulce como un caramelo;vuela;es un juguete
helado|El helado|es frío;es dulce;se derrite|es caliente;se lee;tiene patas
pan|El pan|se come;está hecho de harina|se bebe;ladra;es de cristal
leche|La leche|es blanca;se bebe|es verde;se come con tenedor;vuela
huevo|El huevo|lo pone la gallina;se rompe|lo pone el perro;es de madera;anda
queso|El queso|se come;lo hacen con leche|se bebe;vuela;es de metal
coche|El coche|tiene ruedas;va por la carretera;tiene volante|tiene alas;come hierba;nada
avión|El avión|vuela;tiene alas;va por el cielo|va por el mar;tiene patas;come pan
barco|El barco|va por el mar;flota|vuela;va por la carretera;come hierba
tren|El tren|va por las vías;tiene vagones|vuela;nada;come queso
bicicleta|La bicicleta|tiene dos ruedas;tiene pedales|tiene alas;ladra;come hierba
cohete|El cohete|va al espacio;sube muy alto|nada en el río;come pan;es un animal
pelota|La pelota|es redonda;bota;rueda|es cuadrada;habla;come queso
libro|El libro|tiene páginas;se lee|se come;ladra;tiene ruedas
lápiz|El lápiz|sirve para escribir;tiene punta|sirve para comer;ladra;vuela solo
tijera|La tijera|corta;sirve para cortar papel|se come;canta;es un animal
cama|La cama|sirve para dormir;es blanda;tiene almohada|sirve para cocinar;vuela;come;tiene ruedas de coche
silla|La silla|sirve para sentarse;tiene patas|sirve para beber;vuela;canta
paraguas|El paraguas|se abre cuando llueve;nos tapa del agua|se come;ladra;sirve para dormir
zapato|El zapato|se pone en el pie|se pone en la cabeza;se come;vuela
gafas|Las gafas|se ponen en los ojos;ayudan a ver|se ponen en los pies;se comen;ladran
reloj|El reloj|marca la hora|se come;nada;ladra
teléfono|El teléfono|sirve para hablar;suena|sirve para comer;es un animal;crece
llave|La llave|abre la puerta|se come;vuela;ladra
casa|La casa|tiene puertas;tiene ventanas;tiene tejado|anda;come;tiene alas
escuela|La escuela|tiene clases;tiene pizarra|está en el mar;se come;vuela
mano|La mano|tiene cinco dedos;sirve para coger|tiene ruedas;sirve para oír
ojo|El ojo|sirve para ver|sirve para oír;sirve para comer
oreja|La oreja|sirve para oír|sirve para ver;sirve para andar
diente|El diente|es blanco;sirve para morder|es de papel;sirve para oír
bebé|El bebé|es pequeño;toma biberón;llora|conduce un coche;lee el periódico;es muy alto
abuelo|El abuelo|es mayor;tiene nietos|es un bebé;vuela;tiene alas
bombero|El bombero|apaga el fuego;lleva casco|enciende fuegos;vive en el mar
médico|El médico|cura a las personas|vende pan;es un animal
payaso|El payaso|hace reír;tiene la nariz roja|da miedo siempre;es un pez
robot|El robot|es de metal;es una máquina|es un animal;come hierba
reina|La reina|lleva corona;vive en un castillo|vive en el mar;es una fruta
tambor|El tambor|hace ruido;se toca con palillos|se come;vuela
guitarra|La guitarra|tiene cuerdas;suena|se come;ladra;tiene ruedas
globo|El globo|sube;se llena de aire|es de piedra;ladra;se come
estrella|La estrella|brilla de noche|sale de día;se come;ladra
nube|La nube|está en el cielo;es blanca o gris|está en el suelo;se come;ladra
playa|La playa|tiene arena;está junto al mar|está en el cielo;es de chocolate
montaña|La montaña|es alta;tiene piedras|es pequeña como un botón;se come
hielo|El hielo|es frío;se derrite|es caliente;ladra;quema
`;

// Frases cortas para escribir (2 o 3 palabras): "Frase.|palabra del dibujo"
const BANCO_FRASES_CORTAS = `
Mi casa.|casa
Un sol.|sol
La luna.|luna
Mi mamá.|mamá
Mi papá.|papá
Un sapo.|rana
Veo un pez.|pez
Mi oso.|oso
Un pato.|pato
La vaca.|vaca
Mi gato.|gato
Un dado.|dado
Una uva.|uva
Mi pelota.|pelota
El oso come.|oso
Mi pato nada.|pato
La cámara.|cámara
Un lobo.|lobo
Una nube.|nube
Un pájaro.|pájaro
Tomo sopa.|sopa
Pinto la luna.|luna
Veo la mano.|mano
Mi dedo.|dedo
Un helado.|helado
Toco el piano.|piano
Lola lee.|libro
Pepe ríe.|niño
Mimo al gato.|gato
Ana come pan.|pan
Paco sube.|niño
Sale el sol.|sol
Mi abuelo.|abuelo
La ola.|ola
Una seta.|seta
Mi moto.|moto
Un tomate.|tomate
Toma la llave.|llave
Una rosa.|rosa
Mi pie.|pie
Mi boca.|boca
Un ratón.|ratón
La rana.|rana
Un limón.|limón
La pera.|pera
Mi taza.|taza
El agua.|agua
Un regalo.|regalo
Una vela.|vela
Mi bota.|bota
La cama.|cama
Un sofá.|sofá
El tren.|tren
Un barco.|barco
La isla.|isla
Mi coche.|coche
El taxi.|taxi
La tiza.|tiza
Una caja.|caja
Mi camiseta.|camiseta
Ese mono.|mono
Mi reloj.|reloj
Un dragón.|dragón
Mi tarta.|tarta
Bebo leche.|leche
Como queso.|queso
Veo la nieve.|nieve
Un búho.|búho
La jirafa.|jirafa
Un cepillo.|cepillo
Una hoja.|hoja
El fuego.|fuego
Un hada.|hada
La reina.|reina
El rey.|rey
Un yoyó.|yoyó
Mi kiwi.|kiwi
Un payaso.|payaso
La foca.|foca
Una abeja.|abeja
Mi lápiz.|lápiz
Mi libro.|libro
Un zapato.|zapato
La mochila.|mochila
Una pizza.|pizza
Un pan.|pan
La miel.|miel
Mi globo.|globo
Una flor.|flor
El árbol.|árbol
Un mapa.|mapa
Una moneda.|moneda
La escoba.|escoba
Una gorra.|gorra
Mi bici.|bicicleta
El avión.|avión
Un cohete.|cohete
Mi tambor.|tambor
Mi muñeca.|muñeca
Una ballena.|ballena
Mi silla.|silla
El dinero.|dinero
Un camello.|camello
La lupa.|lupa
Un pino.|pino
Mi bebé.|bebé
La playa.|playa
Un cubo.|cubo
`;
