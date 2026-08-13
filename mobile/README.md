# Studious Party — App móvil (Expo)

Cliente móvil del MVP que consume la misma API que la web.

**API por defecto:** https://studious-party-api.onrender.com

## Requisitos

- Node.js 18+
- App **Expo Go** en el teléfono (Android / iOS), o emulador

## Instalación

```bash
cd mobile
npm install
copy .env.example .env
```

En `.env`:

```
EXPO_PUBLIC_API_URL=https://studious-party-api.onrender.com
```

## Arranque

```bash
npm start
```

Escanea el QR con Expo Go.  
Comandos útiles: `npm run android` · `npm run ios` · `npm run web`

### API local

- Emulador Android: `EXPO_PUBLIC_API_URL=http://10.0.2.2:8002`
- Dispositivo físico: `EXPO_PUBLIC_API_URL=http://<IP-LAN-de-tu-PC>:8002`
- No uses `127.0.0.1` en un teléfono real (apunta al propio dispositivo).

## MVP incluido

- Login / registro (JWT en SecureStore)
- Feed con pull-to-refresh
- Like y comentarios
- Crear post (texto o texto + imagen de galería)
- Perfil propio y perfil al tocar `@usuario`
- Cerrar sesión

## Estructura

```
mobile/
  app/(auth)/     # welcome, login, register
  app/(app)/      # tabs: feed, compose, profile
  src/context/    # AuthContext
  src/services/   # axios
  src/components/ # PostCard
  src/utils/      # mediaUrl, errores
  src/theme/      # colores Studious Party
```

## Cuentas demo

Si la BD tiene seed:

| Email | Password |
|-------|----------|
| `ana@studious.party` | `demo1234` |

## Generar APK (EAS)

Requiere cuenta en [expo.dev](https://expo.dev) y haber hecho `npx eas-cli login`.

```bash
cd mobile
npx eas-cli build -p android --profile preview
```

O: `npm run build:apk`

Proyecto EAS: https://expo.dev/accounts/kagarrutax/projects/studious-party

Cuando termine, Expo muestra un enlace para descargar el APK. En el teléfono hay que permitir instalar apps de orígenes desconocidos.

No hace falta Android Studio ni Play Store. El perfil `preview` genera **APK** (instalación directa). El perfil `production` genera **AAB** (solo para la tienda).

## Nota sobre Render

El plan free de Render puede tardar ~30–60 s en despertar.

La app **reintenta sola**: en login, registro y feed hace ping a `/api/health` y muestra
“Despertando el servidor…” antes de fallar. Si aún así falla, usa **Reintentar**.

Implementación: `mobile/src/utils/withRetry.js` (`wakeApi` + `withApiRetry`).

