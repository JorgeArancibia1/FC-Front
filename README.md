# FC — Frontend

PWA en Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui.
Cliente del backend `simonfc-api` (carpeta `FC-API`) para inscripción a partidos de fútbol.

## Stack

- **Vite 8** + **React 19** + **TypeScript 6**
- **Tailwind CSS v4** (`@tailwindcss/vite`) + **shadcn/ui** (style new-york)
- **react-router-dom v7** — routing SPA con guards por rol
- **TanStack Query 5** — caching y refetch
- **axios** — cliente HTTP con interceptor de refresh JWT automático
- **vite-plugin-pwa** — PWA instalable con service worker auto-update
- **lucide-react** — iconos

## Setup local

```bash
pnpm install
cp .env.example .env       # ajustar VITE_API_URL si tu backend no está en localhost:3000
pnpm dev                   # http://localhost:5173
```

## Scripts

| Script         | Qué hace                                       |
| -------------- | ---------------------------------------------- |
| `pnpm dev`     | Dev server con HMR                             |
| `pnpm build`   | Type-check + build de producción a `dist/`     |
| `pnpm preview` | Sirve `dist/` localmente para probar el build  |
| `pnpm lint`    | ESLint                                         |
| `pnpm icons`   | Regenera los iconos PNG del PWA en `public/`   |

## Estructura

```
src/
├── components/
│   ├── admin/
│   │   └── admin-shell.tsx     # Layout del panel admin (header + nav + Outlet)
│   ├── auth/                   # RequireAuth, RedirectByRole
│   ├── ui/                     # Componentes shadcn (Button, Input, Card, Label)
│   ├── match-hero-board.tsx    # Tablero de equipos con DnD (GSAP + Atlaskit)
│   ├── player-card-hero.tsx    # Tarjeta de jugador (reveal + drag & drop)
│   ├── match-enroll-button.tsx # Botón de inscripción al partido
│   ├── match-status-badge.tsx  # Badge de estado del partido
│   └── install-button.tsx      # Instalación de la PWA (Android/iOS)
├── hooks/
│   ├── use-auth.ts             # useLogin, useLogout, useCurrentUser
│   ├── use-match-realtime.ts   # socket.io: room del partido + token dinámico
│   ├── use-install-prompt.ts   # beforeinstallprompt / flujo iOS
│   └── use-theme-color.ts      # <meta name="theme-color"> por ruta
├── lib/
│   ├── api.ts                  # axios + interceptor de refresh JWT
│   ├── api-matches.ts          # queries/mutations de partidos (TanStack Query)
│   ├── api-users.ts            # usuarios (admin)
│   ├── api-profile.ts          # perfil del usuario
│   ├── auth-store.ts           # tokens en localStorage + pub/sub (subscribe)
│   ├── teams.ts                # buildTeams: armado de equipos y slots
│   └── utils.ts                # cn() de shadcn
├── routes/
│   ├── login.tsx
│   ├── perfil.tsx
│   ├── partido-activo.tsx      # Vista del próximo partido (mobile-first)
│   ├── admin-dashboard.tsx
│   ├── admin-matches-list.tsx  # /admin/partidos
│   ├── admin-match-new.tsx     # /admin/partidos/nuevo
│   ├── admin-match-detail.tsx  # /admin/partidos/:id
│   └── admin-users-list.tsx    # /admin/usuarios
├── types/
│   └── auth.ts, match.ts, profile.ts, admin-user.ts
├── App.tsx                     # router
├── main.tsx                    # providers (QueryClient)
└── index.css                   # Tailwind + design tokens
```

## Auth flow

1. `/` → `RedirectByRole` → si no hay sesión va a `/login`.
2. Login OK → guarda `token`, `refreshToken`, `user` en `localStorage` y redirige según rol:
   - `admin` o `supervisor` → `/admin`
   - `usuario` → `/partido-activo`
3. Si el access token expira (401), el interceptor de axios llama `/auth/refresh` automáticamente, persiste el nuevo par y reintenta la request original.
4. Si el refresh falla, limpia sesión y redirige a `/login`.

## PWA

Configurada en `vite.config.ts` con `vite-plugin-pwa` (`registerType: 'autoUpdate'`).
El build genera `sw.js`, `manifest.webmanifest` y precachea los assets con hash.

Los iconos ya están en `public/`: `icon-192.png`, `icon-512.png`,
`icon-192-maskable.png`, `icon-512-maskable.png`, `apple-touch-icon.png` y
`favicon.ico` (los mismos que declara el manifest en `vite.config.ts`).
Si cambia el logo, dejá la fuente en `public/` y regenerarlos con `pnpm icons`.

## Deploy a Netlify

El repo incluye `netlify.toml` con la config real del deploy:
redirect SPA (`/*` → `/index.html`, para que los deep links no den 404),
headers de seguridad (CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`,
`Permissions-Policy`) y cache headers (assets con hash immutable,
`index.html`/`manifest` sin cache).

### Antes de desplegar
1. Tu **backend** (`FC-API`, paquete `simonfc-api`) debe estar publicado en algún lado (Railway, Render, Fly.io, etc.).
2. Necesitas saber su URL pública — la usarás como `VITE_API_URL`.
3. Agregar el dominio Netlify (`https://<tu-sitio>.netlify.app`) a la variable `CORS_ALLOWED_ORIGINS` del backend.

### Variable de entorno requerida

| Variable        | Valor                                  |
| --------------- | -------------------------------------- |
| `VITE_API_URL`  | `https://<tu-backend>/api`             |

### Opción A — Drag & drop (más rápido, ideal para probar)

```bash
pnpm build
```
Luego abre <https://app.netlify.com/drop> y arrastra la carpeta `dist/`. Netlify te da una URL inmediatamente.

Después de subir:
- Site settings → Build & deploy → Environment → Environment variables → agregar `VITE_API_URL`
- Deploys → Trigger deploy → Deploy site (para que el build use la variable)



Para previews:
```bash
netlify deploy --build                    # crea una URL temporal de preview
```

### Opción C — GitHub (recomendado para producción)

1. Sube el repo a GitHub (`git init && git remote add origin … && git push`).
2. En [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project** → conecta GitHub y selecciona el repo.
3. Netlify autodetecta `netlify.toml` — build command y publish directory ya están definidos.
4. En **Site configuration → Environment variables** agrega `VITE_API_URL`.
5. Cada push a `main` redeploya automáticamente. Cada PR genera un deploy preview con URL propia.

### Verificación post-deploy

Abre tu URL `*.netlify.app` y revisa:
- ✅ `/login` carga (no 404 al refrescar con F5)
- ✅ DevTools → Application → Manifest → muestra "Simón FC"
- ✅ DevTools → Application → Service Workers → `sw.js` activo
- ✅ DevTools → Network → `sw.js` con `Cache-Control: max-age=0`
- ✅ DevTools → Network → `assets/*-<hash>.js` con `max-age=31536000`
- ✅ Login real contra tu backend funciona (si falla con CORS, revisa `CORS_ALLOWED_ORIGINS`)
