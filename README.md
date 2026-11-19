# Lectoescritura

Aplicación de lectoescritura para **pizarra digital táctil** (Guadalinex), que también funciona en **PC con Windows** y **tablets Android**.

Pensada para Infantil, Primaria y alumnado con necesidades específicas: cada alumno tiene su propio nivel **por áreas** (lectura y escritura), su **tipo de letra** y sus **ayudas**.

![Trazado de la letra m](docs/capturas/07b_trazado_conseguido.jpg)

| Leer palabras (cursiva) | Progreso del alumno |
|---|---|
| ![](docs/capturas/14_leer_palabras_cursiva.jpg) | ![](docs/capturas/12_progreso_alumna.jpg) |

## Qué incluye (versión 0.1)

**Alumnado**
- Entrada sin saber leer: el alumno toca su clase y después su animal.
- **Leer**, en 4 niveles: letras (escucha y toca), sílabas, palabras con dibujo y frases.
- **Escribir**, en 3 niveles: trazado de letras (abecedario con estrellas), sílabas y palabras.
- El trazado se comprueba de verdad: tiene que repasarse toda la letra, zona por zona, sin salirse demasiado.
- Voz en español para enunciados y refuerzos.

**Tipos de letra:** imprenta minúscula (Andika), mayúsculas y cursiva ligada escolar (Playwrite España).

**Ayudas por alumno:** botones grandes, voz lenta, modo tranquilo (sin confeti), apoyo con dibujos, exigencia del trazado (exigente / normal / muy flexible) y letras trabajadas (por ejemplo, solo vocales, o m, p, l, s).

**Docentes**
- Cuentas con PIN de 4 cifras. La primera cuenta es la de administración.
- Clases compartidas entre docentes (por ejemplo, tutora + PT + AL).
- Alta rápida pegando una lista de nombres.
- Progreso: resumen de la clase, evolución semanal, mapa por letras y lo que más le cuesta a cada alumno.
- Copias de seguridad en archivo (de todo o por clase), para guardar o pasar datos entre equipos.
- Modo «Demostración» para que el docente haga de modelo sin guardar progreso.

Los datos se guardan **solo en el equipo** donde se usa la app. No se envía nada a internet.

## Cómo usarla

### En la pizarra (Guadalinex)
1. En la pestaña **Releases** de este repositorio, descarga el archivo `.deb`.
2. Instálalo con doble clic (o con `sudo dpkg -i lectoescritura_*.deb`).
3. Aparecerá **Lectoescritura** en el menú de aplicaciones y se abrirá a pantalla completa. `F11` sale de la pantalla completa y `Ctrl+Q` cierra la app.

Si no puedes instalar paquetes, copia la carpeta `app` al equipo y abre `index.html` con Firefox o Chromium.

### En tablet Android o PC
Abre la web publicada: `https://jurjurjur87-wq.github.io/lectoescritura/`

- **Tablet:** en Chrome, menú ⋮ → **Añadir a pantalla de inicio**. Después funciona sin conexión.
- **Windows:** usa la web o descarga el instalador `.exe` desde **Releases**.

El progreso de cada dispositivo es independiente. Para juntarlo, usa **Panel docente → Copias**.

### Voz
La app usa la voz del sistema. En Guadalinex puede hacer falta instalar una voz en español, por ejemplo:

```
sudo apt install speech-dispatcher espeak-ng
```

## Cómo se publica

- **Web:** cada cambio subido a `main` se publica solo en GitHub Pages (`.github/workflows/pages.yml`). Hay que activarlo una vez en *Settings → Pages → Source: GitHub Actions*.
- **Paquetes:** al crear una etiqueta de versión (por ejemplo, `v0.1.0`), GitHub Actions genera el `.deb`, el `AppImage` y el instalador de Windows, y los deja en **Releases** (`.github/workflows/release.yml`).

```
git tag v0.1.0
git push origin v0.1.0
```

## Estructura

```
app/            La aplicación web (todo lo que ve el alumno y el docente)
  index.html    Código de la aplicación
  fonts/        Fuentes escolares (licencia SIL OFL)
  sw.js         Uso sin conexión en tablet / web
electron/       Envoltorio de escritorio para Guadalinex y Windows
build/          Icono para los paquetes
```

## Ideas para próximas versiones
- Orden y dirección de los trazos, con punto de inicio y animación del modelo.
- Grabar audios propios (voz del docente) para letras y sílabas.
- Pictogramas de ARASAAC en lugar de emojis.
- Más actividades: formar palabras con sílabas, dictado o completar la palabra.

## Licencias
- Código: MIT.
- Fuentes Andika y Playwrite España: SIL Open Font License 1.1.
