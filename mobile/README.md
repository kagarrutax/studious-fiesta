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
- Búsqueda de usuarios y posts (tab Buscar)
- Seguir / dejar de seguir en perfiles
- Editar y borrar tus posts
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

Preview actual (v1.1.1, versionCode 6):
https://expo.dev/artifacts/eas/q53dBkvV0LWrVOBXhsDhYP4lr_2nWaJ_k_8BDwE4VKQ.apk

Build: https://expo.dev/accounts/kagarrutax/projects/studious-party/builds/f405cc7f-b85f-475f-8a7f-68f6764b0d3d

Cuando termine, Expo muestra un enlace para descargar el APK. En el teléfono hay que permitir instalar apps de orígenes desconocidos.

**Actualizar al abrir:** los APK nativos consultan `GET /api/mobile/version`. Si `version_code` remoto es mayor, aparece un modal con **Actualizar** (abre el APK) y **Más tarde** (salvo `mandatory=true`). No se muestra en Expo Go ni en `expo start`.

**Play Protect / “virus”:** no es malware. Android marca casi cualquier APK fuera de Play Store.
Si aparece el aviso: *Más detalles* → *Instalar de todos modos*. Después puedes escanear la app
en Play Protect. Para evitar el aviso, usa **Expo Go** desde Play Store y `npm start` en `mobile/`.

No hace falta Android Studio ni Play Store. El perfil `preview` genera **APK** (instalación directa). El perfil `production` genera **AAB** (solo para la tienda).

### Permisos del APK

Solo fotos (`READ_MEDIA_IMAGES`) para publicar imágenes. Micrófono, cámara y ubicación están bloqueados a propósito para reducir falsos positivos de antivirus.

## Nota sobre Render

El plan free de Render puede tardar ~30–60 s en despertar.

La app **reintenta sola**: en login, registro y feed hace ping a `/api/health` y muestra
“Despertando el servidor…” antes de fallar. Si aún así falla, usa **Reintentar**.

Implementación: `mobile/src/utils/withRetry.js` (`wakeApi` + `withApiRetry`).

