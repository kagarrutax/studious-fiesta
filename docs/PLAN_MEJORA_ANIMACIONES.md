# Plan de mejora — Animación y estilo (Studious Party)

**Proyecto:** Studious Party  
**Dueño sugerido:** Adrian Arboleda (UX / estilos)  
**Alcance:** solo frontend — **sin cambiar** paleta, tipografías ni concepto “corcho de campus por la noche”  
**Estado:** Implementado (M0–M3) — verificar en local con `npm run dev`

---

## 1. Respuesta corta

**Sí, se puede mejorar.** Hoy ya hay base buena (hover de cards, skeleton, toast, `motion-reduce`), pero falta:

- entrada de páginas y posts (stagger)
- microinteracciones de like / publicar / tabs
- presencia del hero y notecards
- chinche / pin con más vida (sin volverse “neon glow”)

La mejora debe sentirse como **fichas clavadas en un tablón**, no como dashboard SaaS ni app con glow púrpura.

---

## 2. Estado actual (auditoría)

| Ya existe | Dónde | Nota |
|-----------|--------|------|
| Hover lift + sombra en cards | `.sp-card` | Bueno; se puede suavizar timing |
| Rotación leve estática | `rotate-sp-1/2/3` | Mantener; animar solo al entrar |
| Skeleton shimmer | `.sp-skeleton` | OK |
| Toast slide-in | `animate-sp-toast-in` | OK; falta exit opcional |
| Botones brightness + press | `.sp-btn` | OK |
| `motion-reduce:*` | cards, skeleton, btn | **Obligatorio conservar y extender** |

| Falta | Impacto |
|-------|---------|
| Entrada escalonada del feed | Alto — el tablón “cobra vida” |
| Transición entre rutas | Medio |
| Feedback del like (pulso / color) | Alto — gesto social |
| Hero / home con presencia | Medio |
| Pin que “se clava” al montar | Bajo–medio, muy on-brand |
| Empty states / loading coherentes | Medio |

---

## 3. Principios (no negociables)

1. **Máximo 2–3 motions por viewport** visibles a la vez (regla del plan de diseño).
2. **Misma paleta** (`sp-pink` / `sp-yellow` / `sp-cyan` / surfaces). Sin glow neón, sin blur excesivo, sin morado.
3. **Duraciones cortas:** 180–450 ms; stagger ≤ 80 ms entre ítems.
4. **Easing:** `ease-out` o `cubic-bezier(0.22, 1, 0.36, 1)` — nada elástico exagerado.
5. **`prefers-reduced-motion`:** si está activo → solo fades o nada.
6. **Sin librerías nuevas** en la v1 de este plan (solo Tailwind + CSS).
7. **No tocar lógica de API** salvo clases en JSX.

---

## 4. Dirección creativa (“tablón vivo”)

Metáfora a animar:

| Elemento UI | Motion |
|-------------|--------|
| Post card | Entra desde abajo + opacidad; rotación vuelve a su ángulo de chinche |
| Chinche (pin) | Escala 0 → 1 con rebote mínimo al montar |
| Like | Corazón late una vez + tint a `sp-pink` |
| Toast | Ya entra; opcional salida hacia abajo |
| Notecard login | Ligero “clavado” (scale 0.98 → 1 + sombra) |
| Navbar tabs | Underline / borde de color con `transition` |
| Home hero | Título fade+up; CTA aparece 100 ms después |

---

## 5. Fases de implementación

### Fase M0 — Tokens de motion (≈ 45–60 min)

**Archivos:** `tailwind.config.js`, `frontend/src/index.css`, opcional `frontend/src/design/motion.js`

| # | Tarea | Hecho cuando |
|---|--------|--------------|
| M0.1 | Añadir keyframes: `sp-fade-up`, `sp-pin-pop`, `sp-like-pop`, `sp-page-in` | Tokens en Tailwind |
| M0.2 | Utilities: `animate-sp-fade-up`, delays `sp-delay-1…5` (40–80 ms steps) | Clases usables |
| M0.3 | Documentar en este plan la tabla de duraciones | Tabla §6 |

**No cambiar** pantallas todavía.

---

### Fase M1 — Microinteracciones (≈ 2–3 h)

**Archivos:** `PostCard.jsx`, `index.css` (`.sp-card`, `.sp-btn-primary`), `ToastViewport.jsx`, `Navbar.jsx`

| # | Tarea | Hecho cuando |
|---|--------|--------------|
| M1.1 | Feed: cada `PostCard` con `animate-sp-fade-up` + delay por `index % 5` | Posts entran en cascada |
| M1.2 | Pin: `animate-sp-pin-pop` al montar (1 sola vez) | Chinche “se clava” |
| M1.3 | Like: clase temporal `animate-sp-like-pop` al togglear | Feedback inmediato |
| M1.4 | Botón Publicar: estado `aria-busy` con leve pulse opacity | No se siente muerto |
| M1.5 | Tabs Navbar: `transition-colors` + borde inferior ya existente más suave | Cambio de ruta claro |
| M1.6 | Toast: fade-out opcional al dismiss (150 ms) | Salida limpia |

**Criterio de demo:** publicar → like → toast, todo con feedback visible en &lt; 1 s.

---

### Fase M2 — Páginas y atmósfera (≈ 2–3 h)

**Archivos:** `Home.jsx`, `Login.jsx`, `Register.jsx`, `Dashboard.jsx`, `Search.jsx`, `Profile.jsx`, `Layout.jsx`

| # | Tarea | Hecho cuando |
|---|--------|--------------|
| M2.1 | Home: brand + headline + CTA con fade-up escalonado | Hero con presencia |
| M2.2 | Login/Register: `.sp-notecard` con `animate-sp-page-in` | Notecard “clavada” |
| M2.3 | Dashboard stats: entrada escalonada de tarjetas | Panel menos plano |
| M2.4 | Search results: fade-up por fila | Lista más viva |
| M2.5 | Empty states (feed vacío, sin resultados): fade suave | No aparecen de golpe |
| M2.6 | Revisar contraste hover en móvil (menos translate en touch) | `@media (hover: hover)` |

---

### Fase M3 — Pulido y accesibilidad (≈ 1–1.5 h)

| # | Tarea | Hecho cuando |
|---|--------|--------------|
| M3.1 | Auditoría `motion-reduce` en todas las nuevas animaciones | Reduced motion OK |
| M3.2 | No animar si hay &gt; 20 posts visibles a la vez (cap de delay o desactivar stagger) | Feed largo no jank |
| M3.3 | Smoke en Chrome + móvil + `prefers-reduced-motion` | Checklist §8 |
| M3.4 | Actualizar capturas / nota en README si la entrega lo pide | Docs al día |

---

## 6. Tabla de duraciones (fuente de verdad)

| Motion | Duración | Delay | Uso |
|--------|----------|-------|-----|
| `sp-fade-up` | 320 ms | index × 60 ms (máx 300 ms) | Cards, filas, CTAs |
| `sp-page-in` | 380 ms | 0 | Notecard, bloques de página |
| `sp-pin-pop` | 420 ms | 80 ms tras card | Chinche |
| `sp-like-pop` | 280 ms | 0 | Like |
| `sp-toast-in` | 350 ms | 0 | Ya existe |
| Hover card | 200 ms | — | Ya existe; unificar easing |

---

## 7. Archivos a tocar (mapa)

```
frontend/
├── tailwind.config.js          # keyframes + animation utilities
├── src/index.css               # helpers + hover:hover guards
├── src/design/motion.js        # (opcional) DELAYS = [0,60,120...]
├── src/components/PostCard.jsx
├── src/components/Navbar.jsx
├── src/components/ToastViewport.jsx
├── src/components/Layout.jsx   # solo si hay page wrapper
└── src/pages/{Home,Login,Register,Feed,Dashboard,Search,Profile}.jsx
```

**Fuera de alcance de este plan**

- Rediseñar colores / tipografías  
- Dark/light toggle  
- Lottie / Rive / videos de fondo  
- Animar el corkboard pattern (caro y distractor)  
- Backend

---

## 8. Checklist de aceptación

- [ ] Home, feed, login tienen al menos una animación de entrada
- [ ] Like y publicar dan feedback motion claro
- [ ] Con “reducir movimiento” del SO, no hay slides ni pops (solo estático o fade mínimo)
- [ ] No hay jank notable con 15+ posts
- [ ] Se mantiene look tablón (pins + rotación leve), sin glow
- [ ] Build OK: `npm run build`

---

## 9. Orden de trabajo recomendado

```text
M0 tokens → M1 PostCard/like/toast → M2 Home+auth+dashboard → M3 a11y + build
```

Rama sugerida: `feature/notificaciones-ui` (si sigue abierta) o `feature/motion-polish`.

---

## 10. Relación con otros docs

| Doc | Relación |
|-----|----------|
| `PLAN_IMPLEMENTACION_DISENO.md` | Este plan **extiende** motion; no reemplaza tokens de color/tipo |
| `docs/equipo-features.md` (Persona 5) | Encaja como mejora UX post-toasts |
| `docs/PLAN_IMPLEMENTACION_23H.md` | Hacer **después** del merge de features críticas, o en huecos de QA |

---

## 11. Estimación por persona

| Quién | Rol |
|-------|-----|
| Adrian | Implementa M0–M3 |
| Jessica / Yadii | Review visual en PR (¿se siente tablón o “app genérica”?) |
| Todo el equipo | Probar reduced motion 5 min |

**Total:** ~6–8 h · **PR único** preferible (más fácil de reviewar el feel).
