# Project Spec — Studious Party

## Objetivo

Desarrollar una red social web estudiantil básica utilizando React
para frontend y FastAPI para backend.

## Funcionalidades

- registro;
- login;
- perfil;
- publicaciones;
- feed;
- likes;
- comentarios;
- dashboard;
- navegación;
- responsive.

## Arquitectura

- **Frontend:** React 19, Vite, React Router, Tailwind CSS, Axios.
- **Backend:** FastAPI, SQLAlchemy, Pydantic, JWT (bcrypt).
- **Base de datos:** PostgreSQL (desarrollo).
- **Despliegue:** Render (Backend), Vercel (Frontend).
- **Comunicación:** REST/JSON + JWT.

## Reglas Spec-as-Source

Toda nueva solicitud debe seguir:

Solicitud
→ Análisis
→ Spec
→ Skill
→ Implementación
→ Testing
→ Seguridad
→ Validación

## Testing

- Estrategia de pruebas automáticas con `pytest` en el backend (carpeta `backend/tests/`).
- Ejecución manual de validación de endpoints e interfaz de usuario.

## Seguridad

- autenticación;
- JWT;
- hash de contraseñas (bcrypt);
- variables de entorno;
- protección de rutas;
- validación de entradas (Pydantic).

## Riesgos

- Incompatibilidad de CORS entre Vercel y Render.
- Pérdida de estado de JWT por expiración.
- Concurrencia de datos en SQLite si se usa en producción.
- Tiempos de inicio (cold starts) prolongados en Render (Free tier).
