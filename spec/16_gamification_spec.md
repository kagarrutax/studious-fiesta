# Gamification Spec — Fase 10 / Sprint S9

## Objetivo
XP, niveles e insignias ligeras + ranking top 10.

## Alcance
- Columnas `users.xp`, `users.level`.
- Tablas `badges`, `user_badges`, `xp_events`.
- `services/xp.py`: award en post, comment, resource, share.
- `GET /api/gamification/me` · `GET /api/gamification/leaderboard`.
- Perfil muestra XP/nivel/insignias; dashboard muestra ranking.

## Fuera de alcance
- Tienda de recompensas.
- Ranking global avanzado / temporadas.

## Criterios
- [x] Publicar/comentar sube XP.
- [x] Insignia `first_post` al primer post.
- [x] Leaderboard top 10.
- [x] JWT; sin secretos en respuesta.

## Testing
- `pytest tests/test_gamification.py`
