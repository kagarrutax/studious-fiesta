# Arquitectura — Studious Fiesta

> Borrador inicial (Día 1). Completar en Día 2 con wireframes y decisiones finales.

## Visión general

```
[ React (Vite) ]  ──HTTP/JSON──▶  [ FastAPI ]  ──▶  [ SQLite / PostgreSQL ]
     :5173                            :8000
```

## Capas

| Capa | Tecnología | Responsabilidad |
|------|------------|-----------------|
| Frontend | React 19 + Vite | UI, rutas, estado de auth |
| Backend | FastAPI | API REST, JWT, validación |
| BD | SQLAlchemy + SQLite (dev) | Usuarios, posts, likes, comentarios |

## Módulos backend (previstos)

- `app/core` — configuración, seguridad JWT
- `app/models` — modelos SQLAlchemy
- `app/schemas` — esquemas Pydantic
- `app/api` — routers REST

## Módulos frontend

- `src/pages` — vistas (Home, Login, Feed, Perfil…)
- `src/components` — Layout, tarjetas, formularios
- `src/services` — cliente HTTP (axios)
- `src/context` — autenticación global

## Autenticación

- Registro/login → JWT en respuesta
- Token almacenado en `localStorage`
- Header: `Authorization: Bearer <token>`

## Próximos pasos (Día 2)

- [ ] Diagrama ER de base de datos
- [ ] Lista definitiva de endpoints
- [ ] Wireframes en `docs/wireframes/`
