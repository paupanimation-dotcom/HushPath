# Hushpath — jugar desde un link (GitHub Pages)

Esta versión está pensada para que puedas **subirla tal cual a GitHub** y tener un **link jugable en el navegador** (gratis).

## Qué incluye

### ✅ ASCII “limpio” (técnica del ASCII Art Generator)
El juego genera primero una **imagen en blanco/negro con silueta** (fondo negro, sujeto blanco) y luego la convierte a ASCII. Esa es la misma idea que usabas en el generador, y es lo que hace que el ASCII salga **muy legible**.

En GitHub Pages no podemos depender de un servidor de Stable Diffusion, así que:
- **por defecto** se genera una **silueta procedural** (en navegador) y se convierte a ASCII (100% gratis)
- **opcional**: puedes conectar a un motor local (Ollama/SD en tu PC) para resultados “IA real”

### ✅ Jugable sin instalar nada
Por defecto usa un **modo DEMO** en el navegador (sin modelos, sin API keys). La historia se mueve y el ASCII se actualiza.

---

## Subirlo a GitHub y obtener el link

### Opción A (la más fácil): subir por la web de GitHub (sin comandos)

1) En GitHub: **New repository** → ponle nombre, por ejemplo: `hushpath`.
2) Dentro del repo recién creado → **Add file → Upload files**.
3) Arrastra **todo el contenido de esta carpeta** (los archivos y carpetas) y pulsa **Commit**.
4) Ve a **Settings → Pages**.
5) En **Build and deployment**, selecciona:
   - **Source: GitHub Actions**
6) Vuelve a la pestaña **Actions** y espera a que el workflow “Deploy Hushpath to GitHub Pages” termine.
7) Tu link aparecerá en **Settings → Pages** (arriba).

### Opción B: subir con Git (si algún día te apetece)
- `git clone ...`
- copiar archivos
- `git add . && git commit -m "init" && git push`

---

## Probarlo antes (sin instalar nada)

La forma más simple es:
1) Súbelo a GitHub (pasos arriba)
2) Activa GitHub Pages
3) Abre el link y prueba el juego

Si tú sí quieres probarlo en local más adelante, necesitarás Node.js y luego:
- `npm install`
- `npm run dev`

---

## Modo “IA real” opcional (para ti, en tu PC)

En el link de GitHub Pages, puedes forzar Ollama así:

```
https://TU_USUARIO.github.io/TU_REPO/?backend=ollama
```

Requisitos:
- Tener **Ollama** corriendo en tu PC (por defecto `http://127.0.0.1:11434`).
- El navegador necesita que Ollama permita llamadas desde esa página (CORS). Si no quieres pelearte con eso, el modo DEMO es suficiente para la versión web.

---

## Archivos importantes

- `.github/workflows/deploy-pages.yml` → construye y publica automáticamente en GitHub Pages
- `vite.config.ts` → `base: './'` para que funcione bien en Pages
- `services/storyEngine.ts` → backend DEMO por defecto + opcional `?backend=ollama`
- `services/asciiImageService.ts` → fallback procedural para silueta (ASCII legible)
