# Wireframes — Studious Party

Bocetos textuales de las pantallas mínimas. Sustituir por capturas/Figma cuando estén listos.

## 1. Login (`/login`)

```
┌────────────────────────────────────┐
│         Studious Party             │
│                                    │
│   Email    [________________]      │
│   Password [________________]      │
│                                    │
│        [  Iniciar sesión  ]        │
│   ¿No tienes cuenta? Registrarse   │
└────────────────────────────────────┘
```

## 2. Registro (`/register`)

```
┌────────────────────────────────────┐
│         Crear cuenta               │
│                                    │
│   Usuario  [________________]      │
│   Email    [________________]      │
│   Password [________________]      │
│                                    │
│        [    Registrarse     ]      │
│   ¿Ya tienes cuenta? Iniciar sesión│
└────────────────────────────────────┘
```

## 3. Feed (`/feed`)

```
┌─ Navbar: Logo | Feed | Perfil | Panel | Salir ─┐
│                                                  │
│  ┌─ Nueva publicación ───────────────────────┐  │
│  │ [texto...]              [imagen] [Publicar]│  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌─ Post ─────────────────────────────────────┐  │
│  │ @usuario · hace 2h                         │  │
│  │ Contenido del post...                      │  │
│  │ [imagen]                                   │  │
│  │ ♥ 12  ·  💬 3                              │  │
│  │ Comentarios...                             │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

## 4. Perfil (`/users/:id`)

```
┌─ Navbar ───────────────────────────────────────┐
│  [avatar]  @username                            │
│  Bio del estudiante...                          │
│  N publicaciones                                │
│                                                 │
│  Grid / lista de posts del usuario              │
└─────────────────────────────────────────────────┘
```

## 5. Dashboard (`/dashboard`)

```
┌─ Panel ─────────────────────────────────────────┐
│  Usuarios: 42                                   │
│  Publicaciones: 128                             │
│  Likes totales: 890                             │
│  Comentarios: 210                               │
└─────────────────────────────────────────────────┘
```

## 6. Layout móvil

- Navbar compacta o menú inferior.
- Cards a ancho completo.
- Formularios apilados (una columna).
