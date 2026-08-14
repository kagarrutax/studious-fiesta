# Posts advanced Spec — share / report (Sprint S9)

## Objetivo
Compartir y reportar publicaciones desde el PostCard.

## Alcance
- `POST /api/posts/{id}/share` — registra share (1 por usuario) y sube contador.
- `POST /api/posts/{id}/report` — reason obligatorio; 1 reporte abierto por usuario/post.
- `PostOut.shares_count` y `reported_by_me`.
- UI botones en `PostCard`.

## Fuera de alcance
- Moderación admin / ban.
- Compartir a redes externas.

## Criterios
- [x] Share idempotente (no duplica filas).
- [x] Report valida reason; 403/404 coherentes.
- [x] JWT requerido.

## Testing
- `pytest tests/test_posts.py` (+ casos share/report)
