# Plan de implementación — Sistema de diseño Studious Party

**Proyecto:** Studious Party (`studious-party`)  
**Alcance:** Frontend React + Vite — aplicar el sistema de diseño “corcho de campus por la noche” con **Tailwind CSS**  
**Backend:** sin cambios (FastAPI existente)  
**Estado:** Implementado (Fases A–F) — verificar en local

Este plan es la hoja de ruta para implementar fielmente el prompt/spec de diseño.  
**No inventar** colores, fuentes ni patrones fuera de lo definido aquí.

---

## 1. Objetivo

Reemplazar el CSS actual (`App.css` / estilos ad hoc) por el sistema de diseño oficial:

- Concepto: **corcho de campus por la noche**
- Feed = tablón de anuncios; posts = fichas con chinche
- Login/registro = notecard clavada al centro
- Dashboard = cuadrícula de notas adhesivas
- Único gesto juguetón: **rotación leve + chinche de color**
- Stack: React + Vite + React Router + axios + **Tailwind CSS**

### Evitar explícitamente

1. Fondo crema cálido + serif alto contraste + terracota  
2. Fondo casi negro + un solo acento neón  
3. Layout tipo periódico (reglas finas, esquinas cuadradas densas)

---

## 2. Fuente de verdad (tokens)

### Colores

| Token | Hex | Uso |
|-------|-----|-----|
| `sp-bg` | `#16241C` | Fondo general (pizarra) |
| `sp-surface` | `#1F3327` | Tarjetas, navbar, paneles |
| `sp-surface-raised` | `#28402F` | Hover / elevado |
| `sp-ink` | `#F3EFE2` | Texto principal |
| `sp-ink-muted` | `#A9B8AC` | Texto secundario |
| `sp-ink-faint` | `#6E8074` | Metadatos |
| `sp-pink` | `#FF5DA2` | Primario, likes, chinche 1, CTA |
| `sp-yellow` | `#F4D35E` | Secundario, chinche 2, highlights |
| `sp-cyan` | `#7EE8CB` | Enlaces, chinche 3 |
| `sp-danger` | `#FF6B6B` | Errores |
| borde | `rgba(243,239,226,0.14)` | Default |
| borde fuerte | `rgba(243,239,226,0.28)` | Dashed / énfasis |

**Rotación de acentos (cíclica, nunca al azar):**  
`pink → yellow → cyan → pink…` en posts, stats y tabs activos.

### Tipografía

| Rol | Fuente | Uso |
|-----|--------|-----|
| Display | Bricolage Grotesque 700–800 | `h1`–`h3`, logo, números grandes |
| Cuerpo | Inter 400–600 | Prosa |
| Meta | IBM Plex Mono | Usernames, timestamps, labels, contadores (uppercase, tracking) |

### Constantes estáticas (obligatorio — sin template strings)

```js
export const PIN_COLORS = ['sp-pin-pink', 'sp-pin-yellow', 'sp-pin-cyan']
export const ROTATIONS = ['rotate-sp-1', 'rotate-sp-2', 'rotate-sp-3']
export const ACCENT_BORDERS = ['border-sp-pink', 'border-sp-yellow', 'border-sp-cyan']
export const ACCENT_TOP = ['border-t-sp-pink', 'border-t-sp-yellow', 'border-t-sp-cyan']
export const TAB_ACTIVE = ['border-sp-pink', 'border-sp-yellow', 'border-sp-cyan']
```

Usar siempre `PIN_COLORS[index % 3]`, etc. **Nunca** `` `bg-${color}` ``.

---

## 3. Fases de implementación

### Fase A — Fundación Tailwind (1 sesión)

| # | Tarea | Criterio de hecho |
|---|--------|-------------------|
| A1 | Instalar `tailwindcss`, `postcss`, `autoprefixer` | Dependencias en `frontend/package.json` |
| A2 | Crear `frontend/tailwind.config.js` exacto al spec | Tokens, fonts, shadows, corkboard, rotates, skeleton |
| A3 | Crear `frontend/postcss.config.js` | Plugins tailwind + autoprefixer |
| A4 | Reescribir `src/index.css` con `@import` fonts + `@tailwind` + `@layer base/components` | Clases `.sp-*` disponibles |
| A5 | Asegurar `index.css` importado solo en `main.jsx` | Un solo punto de entrada |
| A6 | Eliminar o vaciar `App.css` y quitar su import en `App.jsx` | Sin estilos legacy conflictivos |
| A7 | Actualizar `index.html`: `lang="es"`, quitar links de fuentes viejas si sobran | Fuentes solo vía `index.css` |

**Hito A:** `npm run build` OK con Tailwind generando utilidades.

---

### Fase B — Primitivos y layout (1 sesión)

| # | Tarea | Criterio de hecho |
|---|--------|-------------------|
| B1 | Crear `src/design/tokens.js` (arrays estáticos de acentos/rotaciones) | Sin clases dinámicas |
| B2 | Reimplementar **Navbar** (sticky, logo `✺` + wordmark, tabs con borde activo cíclico, chip usuario, hamburger `< md`) | Spec §8.1 |
| B3 | Ajustar `Layout.jsx` para usar navbar nueva + `sp-container` donde aplique | Home puede ser full-bleed si se define; resto en container |
| B4 | Verificar `:focus-visible` y navegación con Tab | Outline cian |

**Hito B:** Shell de app con look corkboard; responsive 480 / 768.

---

### Fase C — Auth (notecard) (½–1 sesión)

| # | Tarea | Criterio de hecho |
|---|--------|-------------------|
| C1 | **Login** como `.sp-notecard` centrada + chinche pink centrada | Spec §8.4 |
| C2 | **Register** mismo patrón | Spec §8.4 |
| C3 | Labels `.sp-label`, inputs `.sp-input`, errores `.sp-input-error` + `.sp-error-text` | Validación visible |
| C4 | CTA `.sp-btn-primary w-full`; link switch en `text-sp-yellow` | Spec §8.4 |

**Hito C:** Login/registro funcionales contra API existente, look notecard.

---

### Fase D — Feed + PostCard (1–2 sesiones)

| # | Tarea | Criterio de hecho |
|---|--------|-------------------|
| D1 | **PostCard**: `.sp-card` + `rotate-sp-*` + `.sp-pin-*` por índice | Spec §8.2 |
| D2 | Header avatar 40px + username + timestamp `sp-meta` | Spec §8.2 |
| D3 | Contenido, imagen opcional, footer con `.sp-divider`, like (rosa si liked) + comentarios + contadores mono | Spec §8.2 |
| D4 | **Feed**: composer card dashed, “+ Imagen”, “Publicar” primary | Spec §8.3 |
| D5 | Estados: skeleton / error danger / vacío muted | Spec §8.3 |
| D6 | Mantener lógica axios actual (posts, upload, like, comments) | Sin inventar endpoints |

**Hito D:** Feed usable con chinches cíclicas y rotaciones.

---

### Fase E — Perfil + Dashboard (1 sesión)

| # | Tarea | Criterio de hecho |
|---|--------|-------------------|
| E1 | **Perfil**: header con radiales pink/cyan, avatar 88px + chinche yellow, stats chips con borde top cíclico | Spec §8.5 |
| E2 | Lista de posts del usuario reutilizando PostCard o variante | Datos de API actuales |
| E3 | **Dashboard**: grid 2 cols móvil / 4 desktop, cards con rotación + borde top cíclico | Spec §8.6 |
| E4 | Panel “Actividad reciente” con filas y `.sp-divider` | Spec §8.6 (valores desde `/api/stats` o derivados; documentar supuestos) |

**Hito E:** Perfil y panel alineados al sistema.

---

### Fase F — Home + QA (½–1 sesión)

| # | Tarea | Criterio de hecho |
|---|--------|-------------------|
| F1 | Rediseñar **Home** dentro del sistema (corkboard; sin clichés prohibidos; marca Studious Party dominante) | Coherente con tokens |
| F2 | `prefers-reduced-motion`: `motion-reduce:animate-none` en skeleton/hover rotate | Accesibilidad |
| F3 | Checklist visual 480px y 768px | Spec §10 |
| F4 | Tab / foco teclado en botones, inputs, links | Spec §10 |
| F5 | `npm run build` sin clases purgadas por template strings | Spec §9.1 |
| F6 | Actualizar `PLAN_DESARROLLO.md` / README: “UI = sistema corkboard + Tailwind” | Docs al día |

**Hito F:** Checklist de salida completo.

---

## 4. Mapa de archivos

| Archivo | Acción |
|---------|--------|
| `frontend/tailwind.config.js` | Crear (spec §5) |
| `frontend/postcss.config.js` | Crear (spec §6) |
| `frontend/src/index.css` | Reemplazar (spec §7) |
| `frontend/src/App.css` | Eliminar o dejar vacío + quitar import |
| `frontend/src/design/tokens.js` | Crear (arrays estáticos) |
| `frontend/src/components/Layout.jsx` | Reescribir con Navbar |
| `frontend/src/components/Navbar.jsx` | Crear (extraer de Layout) |
| `frontend/src/components/PostCard.jsx` | Reescribir |
| `frontend/src/pages/Home.jsx` | Reescribir |
| `frontend/src/pages/Login.jsx` | Reescribir |
| `frontend/src/pages/Register.jsx` | Reescribir |
| `frontend/src/pages/Feed.jsx` | Reescribir |
| `frontend/src/pages/Profile.jsx` | Reescribir |
| `frontend/src/pages/Dashboard.jsx` | Reescribir |
| `frontend/src/main.jsx` | Solo import `index.css` |
| `frontend/index.html` | Limpiar fuentes duplicadas |

**No tocar:** `services/api.js` (salvo ajustes menores de FormData), `context/AuthContext.jsx`, backend.

---

## 5. Supuestos de datos (explícitos)

Basados en el API actual — no inventar endpoints:

| UI | Props / datos |
|----|----------------|
| PostCard | `post`: id, content, image_url, created_at, author `{id, username, avatar_url?}`, likes_count, comments_count, liked_by_me + `index` para pin/rotate |
| Feed | `GET/POST /api/posts`, `POST /api/posts/upload` |
| Perfil | `GET /api/users/{id}` + filtrar posts del feed por `author_id` |
| Dashboard | `GET /api/stats` → `{ users, posts, likes, comments }` |
| Avatar | Si no hay `avatar_url`, iniciales o placeholder en `sp-surface-raised` |

---

## 6. Orden de ejecución recomendado

```
A (Tailwind) → B (Navbar) → C (Auth) → D (Feed/PostCard) → E (Perfil/Dashboard) → F (Home + QA)
```

Paralelizable tras A: C y D en paralelo si hay 2 personas (Auth / Feed).

---

## 7. Checklist de salida (spec §10)

- [x] `tailwind.config.js` y `postcss.config.js` en `frontend/`
- [x] `src/index.css` importado una sola vez en `main.jsx`
- [x] Navbar, PostCard, Feed, Login/Registro, Perfil y Dashboard según §8
- [x] Ninguna clase de color/rotación con template strings
- [ ] Responsive verificado en 768px y 480px _(revisión manual)_
- [ ] Foco visible con teclado (Tab) en botones, inputs y links _(revisión manual)_
- [x] `npm run build` exitoso
- [x] Sin librerías UI externas (MUI, Chakra, etc.)

---

## 8. Fuera de alcance (este plan)

- Despliegue Render/Vercel  
- Cambios de API / modelos  
- Redesign de marca distinto al corcho nocturno  
- Añadir tipografías o colores no listados  

---

## 9. Cómo arrancar cuando se apruebe

Mensaje sugerido: **“Implementa la Fase A del plan de diseño”** (o “implementa todo el plan de diseño”).

Referencia del prompt original: secciones 1–10 del sistema de diseño Studious Party (React + Tailwind).

---

*Documento creado: agosto 2026 — pendiente de ejecución.*
