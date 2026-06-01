# 🚀 Desplegar FUE Border Control en Vercel (para usar en el móvil)

Esta app se despliega en **Vercel** (gratis). El frontend (React) y la función
serverless (`frontend/api/flights.js`, el puente HTTP→HTTPS) van juntos.

> ⚠️ **MUY IMPORTANTE sobre la API key:** la URL de Vercel es **pública**.
> **NO** pongas tu API key como variable de entorno en Vercel: cualquiera que
> abra la URL gastaría tu cupo. En su lugar, **cada persona introduce su propia
> key dentro de la app** (botón ⚙) y se guarda solo en su teléfono.

---

## 1) Subir el proyecto a GitHub

1. Crea una cuenta en https://github.com (si no tienes).
2. Crea un repositorio nuevo, p. ej. `fue-border-control` (privado o público, da igual).
3. En tu PC, dentro de la carpeta del proyecto, abre una terminal y ejecuta:

   ```bash
   cd "C:\Users\DaVid AnDreS\Desktop\Claude Docs\FUE Border Control"
   git init
   git add .
   git commit -m "FUE Border Control"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/fue-border-control.git
   git push -u origin main
   ```

   El `.gitignore` ya evita que se suba tu `.env`, los `node_modules` ni el `dist`.

   > 💡 Si te pide login, GitHub ya no acepta contraseña: usa el navegador
   > (GitHub Desktop o `gh auth login`) o un *Personal Access Token*.

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

Para probar en tu PC antes de desplegar necesitas **dos terminales** dentro de `frontend/`:

```bash
npm install        # solo la primera vez
npm run dev:api    # terminal 1 → API local en :3001
npm run dev        # terminal 2 → web en http://localhost:5173
```

La carpeta `backend/` es el servidor antiguo y **ya no se usa** (lo reemplaza
`frontend/api/flights.js` + `frontend/dev-api.js`). Puedes ignorarla o borrarla.
