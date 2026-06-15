# 🚀 Desplegar FUE Border Control en Vercel (para usar en el móvil)

Esta app se despliega en **Vercel** (gratis). El frontend (React) y la función
serverless (`frontend/api/flights.js`, el puente HTTP→HTTPS) van juntos.

> ⚠️ **MUY IMPORTANTE sobre la API key:** la URL de Vercel es **pública**.
> **NO** pongas tu API key como variable de entorno en Vercel: cualquiera que
> abra la URL gastaría tu cupo. En su lugar, **cada persona introduce su propia
> key dentro de la app** (botón ⚙) y se guarda solo en su teléfono.

---

## 1) Subir el proyecto a GitHub

✅ **El repositorio git YA está creado y con el primer commit hecho** (lo hizo
Claude). El `.gitignore` ya deja fuera tu `.env`, `node_modules` y `dist`.
Solo falta **publicarlo** en GitHub. Tienes dos formas:

### Opción A — GitHub Desktop (sin comandos, recomendada)

1. Instala **GitHub Desktop** desde https://desktop.github.com
2. Ábrelo e inicia sesión con tu cuenta de GitHub (te abre el navegador).
3. Menú **File → Add local repository…** y elige la carpeta:
   `C:\Users\DaVid AnDreS\Desktop\Claude Docs\FUE Border Control`
4. Pulsa **Publish repository** (puedes dejarlo privado). ¡Listo!

### Opción B — Comandos (PowerShell)

> ⚠️ Pega las líneas **una a una en PowerShell**. NO escribas la palabra
> `bash` ni las comillas ```` ``` ````: eso es solo formato del documento.

1. Crea un repo vacío en https://github.com/new (nómbralo `fue-border-control`,
   **sin** marcar "Add a README").
2. En PowerShell, pega estas tres líneas (cambia `TU_USUARIO`):

       cd "C:\Users\DaVid AnDreS\Desktop\Claude Docs\FUE Border Control"
       git remote add origin https://github.com/TU_USUARIO/fue-border-control.git
       git push -u origin main

3. La primera vez se abrirá una ventana del navegador para iniciar sesión en
   GitHub (no hace falta escribir contraseñas ni tokens). Acepta y se sube solo.

---

## 2) Importar en Vercel

1. Entra en https://vercel.com y regístrate **con tu cuenta de GitHub**.
2. Pulsa **Add New… → Project** e importa el repo `fue-border-control`.
3. En la pantalla de configuración, lo único que hay que ajustar:
   - **Root Directory** → pulsa *Edit* y selecciona la carpeta **`frontend`**.
     (Es donde está la app y la carpeta `api/`).
   - Framework Preset: debería detectar **Vite** solo. Déjalo así.
   - Build Command / Output: por defecto (`npm run build` → `dist`). No tocar.
   - **Environment Variables**: **NO añadas ninguna** (recuerda el aviso de la key).
4. Pulsa **Deploy** y espera ~1 minuto.

Cuando termine, Vercel te da una URL tipo `https://fue-border-control.vercel.app`.

---

## 3) Usarla en el móvil

1. Abre la URL en el navegador del teléfono.
2. La primera vez te pedirá tu **API key de AviationStack** → pégala y *Guardar*.
   (Se guarda solo en ese móvil; otra persona pondrá la suya).
3. Para tenerla como app:
   - **Android (Chrome):** menú ⋮ → *Añadir a pantalla de inicio*.
   - **iPhone (Safari):** botón *Compartir* → *Añadir a pantalla de inicio*.

Listo: icono en el teléfono, pantalla completa, y el contador de 100/mes se
lleva en el propio dispositivo.

---

## Desarrollo local (opcional)

Para probar en tu PC antes de desplegar, **un solo comando** dentro de `frontend/`:

```bash
npm install        # solo la primera vez
npm run dev        # web + API local en http://localhost:5173
```

La primera vez, pega tu API key en el botón ⚙ (se guarda solo en tu navegador).

> El mismo `npm run dev` sirve la web y la API: la función `api/flights.js`
> (la misma que ejecuta Vercel en producción) se monta como middleware del
> dev server de Vite. No hace falta un segundo proceso ni la carpeta `backend/`.
