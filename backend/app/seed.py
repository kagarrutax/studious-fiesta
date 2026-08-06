"""Carga datos de demostración para Studious Party.

Uso (desde backend/ con venv activo):
    python -m app.seed
"""

from sqlalchemy import select

from app.core.security import hash_password
from app.db import Base, SessionLocal, engine
from app.models import Comment, Like, Post, User
import app.models  # noqa: F401


DEMO_USERS = [
    {
        "username": "ana",
        "email": "ana@studious.party",
        "password": "demo1234",
        "bio": "Estudiante de sistemas. Café y código.",
    },
    {
        "username": "bruno",
        "email": "bruno@studious.party",
        "password": "demo1234",
        "bio": "Diseño UX · campus norte",
    },
    {
        "username": "carla",
        "email": "carla@studious.party",
        "password": "demo1234",
        "bio": "Organizando el próximo hackathon.",
    },
]


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.scalar(select(User).where(User.email == DEMO_USERS[0]["email"]))
        if existing is not None:
            print("Seed ya aplicado (usuarios demo existen).")
            return

        users: list[User] = []
        for data in DEMO_USERS:
            user = User(
                username=data["username"],
                email=data["email"],
                password_hash=hash_password(data["password"]),
                bio=data["bio"],
            )
            db.add(user)
            users.append(user)
        db.commit()
        for user in users:
            db.refresh(user)

        posts = [
            Post(content="¡Bienvenidos a Studious Party! 🎉 Primera publicación del campus.", author_id=users[0].id),
            Post(content="Alguien para estudiar juntos bases de datos esta tarde?", author_id=users[1].id),
            Post(content="Tips: usen Swagger en /docs para probar la API.", author_id=users[2].id),
            Post(content="Feed listo. Likes y comentarios activados.", author_id=users[0].id),
        ]
        db.add_all(posts)
        db.commit()
        for post in posts:
            db.refresh(post)

        db.add_all(
            [
                Like(user_id=users[1].id, post_id=posts[0].id),
                Like(user_id=users[2].id, post_id=posts[0].id),
                Like(user_id=users[0].id, post_id=posts[1].id),
                Comment(content="Cuenta conmigo!", user_id=users[0].id, post_id=posts[1].id),
                Comment(content="Excelente tip 👍", user_id=users[1].id, post_id=posts[2].id),
            ]
        )
        db.commit()
        print("Seed OK.")
        print("Usuarios demo (password: demo1234):")
        for data in DEMO_USERS:
            print(f"  - {data['email']}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
