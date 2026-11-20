# Lectoescritura

Aplicación de lectoescritura y conciencia fonológica para **pizarra digital táctil** (Guadalinex), **tablets Android**, **móviles** y **PC**. Funciona en el navegador, sin instalar nada y sin conexión una vez abierta.

Pensada para Infantil, Primaria y alumnado con necesidades específicas: cada alumno tiene su propio nivel **por áreas** (escuchar, leer y escribir), su **tipo de letra** y sus **ayudas**.

**Abrir la app:** https://jurjurjur87-wq.github.io/Lectoescritura/

![Portada](docs/capturas/01_portada.jpg)

| Trazado con modelo animado | Conciencia fonológica | Progreso del alumno |
|---|---|---|
| ![](docs/capturas/03_escolar_modelo.jpg) | ![](docs/capturas/06_escuchar_rima.jpg) | ![](docs/capturas/11_progreso.jpg) |

## Qué incluye (versión 0.3)

### Para el alumnado
El alumno entra sin saber leer: toca su clase y después su animal. Tiene tres áreas, cada una con su nivel.

**Escuchar** (conciencia fonológica y comprensión oral)
1. **Sílabas**: ¿cuántas palmadas?, la palabra más larga, une las sílabas, cuenta las palabras de una frase.
2. **Sonidos**: ¿dónde suena «ma»?, ¿cómo empieza?, ¿cómo termina?, la intrusa.
3. **Comprensión**: escucha una frase y elige la escena.
4. **Escenas**: escucha y monta la escena con dibujos.
5. **Juegos de sonidos**: rimas, quita una sílaba, da la vuelta.

**Leer**
1. **Letras**: escucha y toca la letra.
2. **Sílabas**: escucha y toca la sílaba; completa la sílaba que falta.
3. **Palabras**: elige la palabra del dibujo; forma la palabra con sílabas; completa la letra que falta.
4. **Frases**: lee y toca el dibujo; ordena la frase; **las tijeras** (separa las palabras de una frase).

**Escribir**
1. **Letras**: abecedario con estrellas y trazado letra a letra.
2. **Sílabas**: trazado y dictado con letras móviles.
3. **Palabras**: trazado y dictado con letras móviles.

### Trazado trazo a trazo
- En **imprenta**, **mayúsculas** y **letra escolar enlazada**, cada letra tiene su punto de inicio, flecha de dirección, número de trazo y **modelo animado** («Ver cómo se hace»).
- La app avisa si se empieza en otro sitio, al revés o si se sale del camino.
- La **letra escolar** (solo minúsculas, con rabito de entrada) se usa en toda la app: tarjetas, opciones, palabras y frases, que van enteras en minúscula. Las palabras se escriben enlazadas, y los puntos, tildes y rayas se hacen al final.

### Contenidos
- Banco de **unas 260 palabras** con sílabas y dibujo, **más de 100 frases** y **unas 300 escenas**. Las actividades se generan al azar y la app evita repetir lo que ha salido hace poco.
- **Palabras y frases propias** del docente (nombres del alumnado, vocabulario del tema…), con separación en sílabas automática y foto opcional.
- **Pictogramas de ARASAAC**: se descargan una vez y se usan solos en todas las actividades. Si falta alguno, se usa el emoji. Cada dibujo se puede cambiar eligiendo otro pictograma o una foto propia.
- **Audios grabados por el docente** para letras, sílabas, palabras, frases y ánimos. Si no hay grabación, se usa la voz del equipo.

### Estilo visual y ayudas
- Tres aspectos: **Plus** (más colorido, por defecto), **Básico** y **Sensible** (sobrio: colores apagados, sin adornos ni animaciones).
- Ayudas por alumno: modo sensible, botones grandes, voz lenta, apoyo con dibujos, exigencia del trazado y letras trabajadas.
- Celebración configurable (estrellas, solo ✓ o nada) y voz de ánimo activable.

### Para el docente
- Cuentas con PIN. Puede haber **varios administradores** (siempre al menos uno); la administración se puede transferir.
- Clases compartidas entre docentes (tutora + PT + AL). Alta rápida pegando una lista de nombres.
- **Progreso**: resumen de la clase, evolución semanal por áreas, mapa por letras y lo que más le cuesta a cada alumno. Cada aviso cuenta como intento, y un ejercicio que no se termina bien cuenta como fallo.
- **Informe imprimible** por alumno (o en PDF), con observaciones.
- **Bloqueo del aula**: clase fija en el equipo; cambiar de clase y el modo demostración piden PIN.
- **Copias de seguridad** en archivo (con o sin audios), con recordatorio cada 14 días.

Los datos se guardan **solo en el dispositivo** donde se usa la app (en el navegador). No se envía nada a internet. La app pide al navegador que no borre sus datos.

## Cómo usarla

### En la pizarra (Guadalinex) o en un PC
1. Abre https://jurjurjur87-wq.github.io/Lectoescritura/ en Firefox o Chromium.
2. Pulsa el botón de pantalla completa de la portada (o F11).
3. Usa siempre el **mismo navegador** y no borres sus datos de navegación: ahí se guarda el progreso.

En Chrome se puede instalar como aplicación: menú ⋮ → *Enviar, guardar y compartir* → *Instalar página como aplicación*.

### En tablet o móvil Android
Abre la dirección en Chrome y elige menú ⋮ → **Añadir a pantalla de inicio**. Después funciona sin conexión.

### Actualizaciones
Cada vez que se publica una versión nueva, se carga sola la próxima vez que se abre la app con internet. Clases, alumnado, progreso, audios y pictogramas se mantienen.

### Pasar datos entre dispositivos
Cada dispositivo guarda sus propios datos. Para pasarlos de uno a otro: *Panel docente → Copias → Descargar copia* en uno y *Recuperar copia* en el otro.

### Voz
La app usa la voz del sistema. En Guadalinex puede hacer falta instalar una voz en español:

```
sudo apt install speech-dispatcher espeak-ng
```

## Estructura

```
app/                La aplicación web
  index.html        Página principal
  css/              Estilos (Plus, Básico y Sensible)
  js/banco.js       Banco de palabras, frases y escenas
  js/contenidos.js  Letras, niveles y actividades
  js/trazos.js      Forma y orden de cada letra (imprenta, mayúsculas y escolar)
  js/medios.js      Audios, pictogramas e iconos
  js/app.js         Pantallas y lógica
  fonts/            Fuentes (licencia SIL OFL)
  sw.js             Uso sin conexión
electron/           Envoltorio de escritorio (preparado, sin usar de momento)
docs/capturas/      Capturas de pantalla
```

## Publicación
- **Web:** cada cambio en `main` se publica solo en GitHub Pages (`.github/workflows/pages.yml`).
- **Instaladores** (opcional, sin usar de momento): el `.deb` para Guadalinex y el instalador de Windows se generan solo si se lanza a mano el flujo «Empaquetar» en la pestaña *Actions* (`.github/workflows/release.yml`).
- **Versiones:** cada entrega importante se marca con una etiqueta (`v0.3.0`…) para tener un punto de referencia y poder volver a él.

## Licencias
- Aplicación: [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/deed.es). Se puede usar y compartir citando al autor, sin fines comerciales y sin distribuir versiones modificadas.
- Fuentes Andika y Playwrite España: SIL Open Font License 1.1.
- Pictogramas (si se descargan): Sergio Palao. Origen: ARASAAC (https://arasaac.org). Licencia: CC BY-NC-SA. Propiedad: Gobierno de Aragón (España).
