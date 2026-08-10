# Navigation & Responsive Spec

## Objetivo
Asegurar una experiencia de usuario fluida y adaptable a distintos dispositivos.

## Estado actual
Implementado a nivel de CSS y React Router.

## Alcance
- Menú de navegación (Navbar/Sidebar).
- Diseño adaptable (Mobile-first o Desktop-first con media queries).

## Fuera de alcance
- Animaciones complejas de transición entre páginas.
- Soporte para navegadores muy antiguos (IE11).

## Archivos involucrados
- `frontend/src/App.jsx` (Router)
- `frontend/src/components/Navbar.jsx`
- `frontend/index.css` y configuración de Tailwind.

## Pasos
1. Configurar rutas en React Router.
2. Diseñar layout principal responsivo.
3. Condicionar menú según estado de autenticación.

## Criterios de aceptación
- La aplicación se ve correctamente en móviles, tablets y escritorio.
- El menú de navegación enlaza a las vistas correctas.
- Ocultar rutas protegidas si no hay sesión.

## Testing
- Pruebas manuales redimensionando ventana o en herramientas de emulación.

## Seguridad
- Frontend no debe confiar ciegamente en estado de auth para proteger información sensible, el backend debe validarlo.

## Riesgos
- Desborde de contenido (overflow) en pantallas pequeñas.
