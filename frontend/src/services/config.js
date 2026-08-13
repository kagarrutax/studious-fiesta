/**
 * Único punto de verdad para la URL base del backend.
 *
 * Desarrollo local:
 *   Definir VITE_API_URL=http://localhost:8000 en frontend/.env
 *
 * Producción (Vercel):
 *   Configurar la variable de entorno VITE_API_URL en el dashboard de Vercel
 *   apuntando a la URL de Render, p. ej. https://studious-party-api.onrender.com
 *
 * El fallback garantiza que el servidor Vite dev arranque incluso
 * sin .env, apuntando al puerto canónico del backend local.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
