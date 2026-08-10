"""Genera la guia PDF del sprint 23h — Studious Party."""
from pathlib import Path

from fpdf import FPDF

OUT = Path(__file__).resolve().parents[1] / "docs" / "Guia_Sprint_23H_Studious_Party.pdf"
# Inicio de referencia (cambiar START_H si el equipo arranca a otra hora)
START_H, START_M = 9, 0


def clock(sprint_hours: float) -> str:
    total = START_H * 60 + START_M + int(sprint_hours * 60)
    day = total // (24 * 60)
    mins = total % (24 * 60)
    h, m = divmod(mins, 60)
    suffix = "" if day == 0 else f" (+{day}d)"
    return f"{h:02d}:{m:02d}{suffix}"


def span(h0: float, h1: float) -> str:
    return f"{clock(h0)} - {clock(h1)}  |  H+{h0:g}-{h1:g}"


class GuidePDF(FPDF):
    def __init__(self):
        super().__init__(format="A4")
        self.add_font("ArialUni", "", r"C:\Windows\Fonts\arial.ttf")
        self.add_font("ArialUni", "B", r"C:\Windows\Fonts\arialbd.ttf")
        self.add_font("ArialUni", "I", r"C:\Windows\Fonts\ariali.ttf")

    def header(self):
        if self.page_no() == 1:
            return
        self.set_x(self.l_margin)
        self.set_font("ArialUni", "I", 8)
        self.set_text_color(90, 90, 90)
        self.cell(0, 6, "Studious Party - Guia sprint 23 h (paso a paso)", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def footer(self):
        self.set_y(-12)
        self.set_font("ArialUni", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, f"Pagina {self.page_no()}/{{nb}}", align="C")

    def h1(self, text):
        self.set_x(self.l_margin)
        self.set_font("ArialUni", "B", 16)
        self.set_text_color(22, 36, 28)
        self.multi_cell(0, 8, text)
        self.ln(2)

    def h2(self, text):
        self.ln(2)
        self.set_x(self.l_margin)
        self.set_font("ArialUni", "B", 13)
        self.set_text_color(31, 51, 39)
        self.multi_cell(0, 7, text)
        self.ln(1)

    def h3(self, text):
        self.ln(1)
        self.set_x(self.l_margin)
        self.set_font("ArialUni", "B", 11)
        self.set_text_color(40, 64, 47)
        self.multi_cell(0, 6, text)
        self.ln(0.5)

    def body(self, text):
        self.set_x(self.l_margin)
        self.set_font("ArialUni", "", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5.5, text)
        self.ln(1)

    def bullet(self, text):
        self.set_x(self.l_margin)
        self.set_font("ArialUni", "", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(0, 5.5, f"  -  {text}")

    def time_box(self, label):
        self.set_x(self.l_margin)
        self.set_fill_color(31, 51, 39)
        self.set_text_color(255, 255, 255)
        self.set_font("ArialUni", "B", 10)
        self.cell(0, 7, f"  {label}", new_x="LMARGIN", new_y="NEXT", fill=True)
        self.set_text_color(30, 30, 30)
        self.ln(2)

    def code(self, text):
        self.set_x(self.l_margin)
        self.set_font("Courier", "", 8)
        self.set_text_color(20, 20, 20)
        self.multi_cell(0, 4.5, text)
        self.ln(1)

    def table(self, headers, rows, col_w):
        usable = self.w - self.l_margin - self.r_margin
        if abs(sum(col_w) - usable) > 1:
            scale = usable / sum(col_w)
            col_w = [w * scale for w in col_w]
        self.set_x(self.l_margin)
        self.set_font("ArialUni", "B", 8)
        self.set_fill_color(40, 64, 47)
        self.set_text_color(255, 255, 255)
        for i, h in enumerate(headers):
            self.cell(col_w[i], 6, h, border=1, fill=True)
        self.ln()
        self.set_font("ArialUni", "", 8)
        self.set_text_color(20, 20, 20)
        fill = False
        for row in rows:
            self.set_x(self.l_margin)
            self.set_fill_color(232, 240, 234) if fill else self.set_fill_color(255, 255, 255)
            for i, cell in enumerate(row):
                txt = str(cell)
                max_chars = max(8, int(col_w[i] / 1.7))
                if len(txt) > max_chars:
                    txt = txt[: max_chars - 3] + "..."
                self.cell(col_w[i], 6, txt, border=1, fill=True)
            self.ln()
            fill = not fill
        self.ln(2)


def build():
    pdf = GuidePDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.add_page()

    pdf.set_font("ArialUni", "B", 22)
    pdf.set_text_color(22, 36, 28)
    pdf.ln(16)
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(0, 10, "Studious Party", align="C")
    pdf.set_font("ArialUni", "B", 14)
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(0, 8, "Guia completa paso a paso", align="C")
    pdf.set_font("ArialUni", "", 12)
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(0, 7, "Sprint de implementacion - 23 horas", align="C")
    pdf.ln(6)
    pdf.set_font("ArialUni", "", 10)
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(
        0,
        6,
        "Equipo: Yokabeth Valdes · Jessica Angulo · YadiiCabeza96 · "
        "meilynperea2-debug · Adrian Arboleda\n"
        f"Inicio de referencia del reloj: {clock(0)}  ->  Fin: {clock(23)}\n"
        "(Si arrancan a otra hora, sumen el mismo desfase a todos los horarios.)\n"
        "Repo: studious-fiesta  |  App: studious-party.vercel.app",
        align="C",
    )
    pdf.ln(6)
    pdf.time_box(f"Cronograma: {clock(0)} (H+0)  ->  {clock(23)} (H+23)")

    pdf.h2("1. Que ya esta listo (no rehacer)")
    for t in [
        "Login, registro, JWT",
        "Feed, posts, likes, comentarios, perfil, dashboard basico",
        "Diseno Tailwind (campus night)",
        "Supabase (Postgres), Vercel (frontend), Render (API)",
    ]:
        pdf.bullet(t)

    pdf.h2("2. Objetivo de estas 23 horas")
    pdf.body(
        "Completar 5 features extras (una por integrante), integrarlas en main "
        "sin romper la app, hacer QA cruzado y dejar la entrega academica lista "
        "(README, capturas, URLs)."
    )

    pdf.h2("3. Reglas del equipo")
    for t in [
        "1 persona = 1 rama = 1 Pull Request",
        "Nadie sube directo a main",
        "Antes de merge: login -> crear post -> like -> comentario",
        "Coordinador del reloj: Adrian (avisa al inicio de cada fase)",
        "No subir archivos .env ni contrasenas",
    ]:
        pdf.bullet(t)

    pdf.h2("4. Reparto de features")
    pdf.table(
        ["#", "Integrante", "Feature", "Rama"],
        [
            ["1", "Yokabeth Valdes", "Seguir usuarios", "feature/seguir-usuarios"],
            ["2", "Jessica Angulo", "Editar/borrar posts", "feature/editar-borrar-post"],
            ["3", "YadiiCabeza96", "Busqueda", "feature/busqueda"],
            ["4", "meilynperea2-debug", "Dashboard actividad", "feature/dashboard-actividad"],
            ["5", "Adrian Arboleda", "UX toasts + docs", "feature/notificaciones-ui"],
        ],
        [12, 42, 55, 81],
    )

    pdf.h2("5. Linea de tiempo (con hora de reloj)")
    pdf.table(
        ["Fase", "Reloj", "Sprint", "Meta"],
        [
            ["0 Setup", f"{clock(0)}-{clock(3)}", "H+0-3", "Entorno + ramas"],
            ["1 Build", f"{clock(3)}-{clock(11)}", "H+3-11", "Features en paralelo"],
            ["2 Merge", f"{clock(11)}-{clock(16)}", "H+11-16", "Integrar a main"],
            ["3 QA", f"{clock(16)}-{clock(20)}", "H+16-20", "Pruebas cruzadas"],
            ["4 Entrega", f"{clock(20)}-{clock(23)}", "H+20-23", "Docs + cierre"],
        ],
        [28, 48, 28, 86],
    )
    pdf.body(
        f"Nota: (+1d) = dia siguiente. Si empiezan a las {clock(0)}, terminan a las {clock(23)}. "
        "El contador H+0 ... H+23 no cambia aunque muevan el inicio."
    )

    # FASE 0
    pdf.add_page()
    pdf.h1("FASE 0 - Arranque sincronizado")
    pdf.time_box(span(0, 3))
    pdf.body("Meta: todos con el mismo main, entorno OK y ramas creadas.")
    pdf.h3("Paso a paso (todos)")
    pdf.table(
        ["Desde", "Hasta", "Quien", "Accion"],
        [
            [clock(0), clock(0.5), "Todos", "git pull / clonar. Leer esta guia y equipo-features.md"],
            [clock(0.5), clock(1.5), "Todos", "venv + pip install; npm install; API :8002 y Vite :5173"],
            [clock(1.5), clock(2), "Adrian", "Confirmar URLs prod (Vercel/Render/Supabase)"],
            [clock(2), clock(2.5), "Todos", "Crear y pushear su rama vacia desde main"],
            [clock(2.5), clock(3), "Todos", "Smoke test: registro, login, crear un post"],
        ],
        [24, 24, 28, 114],
    )
    pdf.h3("Comandos para crear tu rama")
    pdf.code(
        "git checkout main\n"
        "git pull\n"
        "git checkout -b feature/NOMBRE-DE-TU-FEATURE\n"
        "git push -u origin HEAD"
    )
    pdf.body(
        "Ramas: Yokabeth=feature/seguir-usuarios | Jessica=feature/editar-borrar-post | "
        "Yadii=feature/busqueda | meilyn=feature/dashboard-actividad | Adrian=feature/notificaciones-ui"
    )
    pdf.body(f"HITO ({clock(3)}): 5 ramas en GitHub + app local responde.")

    # FASE 1
    pdf.h1("FASE 1 - Construccion en paralelo")
    pdf.time_box(span(3, 11))
    pdf.body("Meta: cada feature usable en su rama. Todos trabajan a la vez (8 h).")

    pdf.h3("Yokabeth Valdes - Seguir usuarios")
    pdf.table(
        ["Desde", "Hasta", "Tarea"],
        [
            [clock(3), clock(5), "Modelo Follow + migracion BD"],
            [clock(5), clock(8), "API follow / unfollow / listar followers"],
            [clock(8), clock(11), "Boton en Profile.jsx + api.js"],
        ],
        [28, 28, 134],
    )
    pdf.body(
        "Archivos: models, supabase/migrations/, api/follows.py (nuevo), router.py, Profile.jsx, api.js. "
        "Endpoints: POST/DELETE /api/users/{id}/follow, GET .../followers. "
        "Done: seguir y dejar de seguir desde un perfil ajeno."
    )

    pdf.h3("Jessica Angulo - Editar y borrar posts")
    pdf.table(
        ["Desde", "Hasta", "Tarea"],
        [
            [clock(3), clock(5), "PATCH y DELETE /api/posts/{id} (solo autor)"],
            [clock(5), clock(8), "Tests en test_posts.py"],
            [clock(8), clock(11), "Menu editar/eliminar en PostCard.jsx"],
        ],
        [28, 28, 134],
    )
    pdf.body(
        "Archivos: api/posts.py, schemas/post.py, test_posts.py, PostCard.jsx, Feed.jsx. "
        "Done: el autor edita/borra; otro usuario no puede."
    )

    pdf.h3("YadiiCabeza96 - Busqueda")
    pdf.table(
        ["Desde", "Hasta", "Tarea"],
        [
            [clock(3), clock(6), "GET /api/search?q= (users + posts)"],
            [clock(6), clock(8), "Pagina Search.jsx + ruta en App.jsx"],
            [clock(8), clock(11), "Caja/link en Navbar.jsx"],
        ],
        [28, 28, 134],
    )
    pdf.body(
        "Archivos: api/search.py (nuevo), Search.jsx, App.jsx, Navbar.jsx, api.js. "
        "Done: buscar username o texto y ver resultados."
    )

    pdf.h3("meilynperea2-debug - Dashboard actividad")
    pdf.table(
        ["Desde", "Hasta", "Tarea"],
        [
            [clock(3), clock(6), "Ampliar GET /api/stats (recent_posts, recent_users)"],
            [clock(6), clock(11), "UI en Dashboard.jsx"],
        ],
        [28, 28, 134],
    )
    pdf.body("Archivos: api/stats.py, Dashboard.jsx. Done: totales + actividad reciente.")

    pdf.h3("Adrian Arboleda - UX toasts + docs")
    pdf.table(
        ["Desde", "Hasta", "Tarea"],
        [
            [clock(3), clock(6), "Componente Toast + uso en Layout"],
            [clock(6), clock(9), "Toasts en login, registro, crear post, errores"],
            [clock(9), clock(11), "Borrador README (integrantes, URLs)"],
        ],
        [28, 28, 134],
    )
    pdf.body(f"HITO ({clock(11)}): 5 PRs abiertos (draft OK). Check-in grupal.")

    # FASE 2
    pdf.add_page()
    pdf.h1("FASE 2 - Integracion y merges")
    pdf.time_box(span(11, 16))
    pdf.body("Meta: todo en main sin romper lo base. Orden fijo para menos conflictos.")
    pdf.table(
        ["#", "Desde", "Hasta", "PR", "Revisa"],
        [
            ["1", clock(11), clock(12), "UX/toasts (Adrian)", "Jessica"],
            ["2", clock(12), clock(13), "Editar/borrar (Jessica)", "Yokabeth"],
            ["3", clock(13), clock(14), "Dashboard (meilyn)", "Yadii"],
            ["4", clock(14), clock(15), "Busqueda (Yadii)", "meilyn"],
            ["5", clock(15), clock(16), "Follow (Yokabeth)", "Adrian + migracion"],
        ],
        [12, 24, 24, 70, 60],
    )
    pdf.h3("Paso a paso al mergear")
    for t in [
        "git checkout main && git pull && git checkout TU-RAMA && git merge main",
        "Resolver conflictos sin borrar el trabajo del otro",
        "Probar local: 127.0.0.1:5173 + API :8002",
        "Abrir/actualizar PR -> revision -> merge a main",
        "Avisar al equipo: los demas hacen git pull en sus ramas",
    ]:
        pdf.bullet(t)
    pdf.body(f"HITO ({clock(16)}): main tiene las 5 features; local OK.")

    # FASE 3
    pdf.h1("FASE 3 - QA cruzado")
    pdf.time_box(span(16, 20))
    pdf.table(
        ["Desde", "Hasta", "Tester", "Prueba el modulo de"],
        [
            [clock(16), clock(17), "Jessica", "Follow (Yokabeth)"],
            [clock(16), clock(17), "Yokabeth", "Editar/borrar (Jessica)"],
            [clock(17), clock(18), "meilyn", "Busqueda (Yadii)"],
            [clock(17), clock(18), "Yadii", "Dashboard (meilyn)"],
            [clock(18), clock(19), "Todos", "Flujo completo en LOCAL"],
            [clock(19), clock(20), "Adrian + 1", "Flujo en PRODUCCION"],
        ],
        [24, 24, 32, 110],
    )
    pdf.h3("Script de prueba (marcar)")
    for i, c in enumerate(
        [
            "Registro usuario nuevo",
            "Login",
            "Crear post texto + post con imagen",
            "Like + comentario",
            "Editar y borrar post propio",
            "Buscar usuario / texto",
            "Seguir a otro usuario",
            "Ver dashboard (totales + recientes)",
            "Ver toasts / mensajes de error",
            "Probar en movil (responsive)",
        ],
        1,
    ):
        pdf.bullet(f"[ ] {i}. {c}")
    pdf.body(f"Bugs -> fix/... chicos. NO features nuevas. HITO ({clock(20)}): sin blockers.")

    # FASE 4
    pdf.h1("FASE 4 - Entrega y cierre")
    pdf.time_box(span(20, 23))
    pdf.table(
        ["Desde", "Hasta", "Quien", "Entregable"],
        [
            [clock(20), clock(21), "Adrian", "README final (URLs, stack, integrantes)"],
            [clock(20), clock(21), "Yadii+Jessica", "4-6 capturas en docs/"],
            [clock(21), clock(22), "Yokabeth+meilyn", "Actualizar arquitectura.md"],
            [clock(21), clock(22), "Adrian", "Verificar deploy (health + login)"],
            [clock(22), clock(23), "Todos", "Repaso oral 5 min c/u"],
            [clock(23), clock(23), "Adrian", "Tag/commit final del sprint"],
        ],
        [24, 24, 36, 106],
    )
    pdf.h3("URLs a documentar")
    for t in [
        "App: https://studious-party.vercel.app",
        "API: https://studious-party-api.onrender.com",
        "Docs API: https://studious-party-api.onrender.com/docs",
        "Local: http://127.0.0.1:5173 + API http://127.0.0.1:8002",
    ]:
        pdf.bullet(t)

    pdf.add_page()
    pdf.h1("6. Como levantar el proyecto (local)")
    pdf.h3("Backend")
    pdf.code(
        "cd backend\n"
        "python -m venv venv\n"
        ".\\venv\\Scripts\\Activate.ps1\n"
        "pip install -r requirements.txt\n"
        "uvicorn app.main:app --host 127.0.0.1 --port 8002"
    )
    pdf.h3("Frontend")
    pdf.code(
        "cd frontend\n"
        "npm install\n"
        "npm run dev -- --host 127.0.0.1 --port 5173"
    )
    pdf.body(
        "Abrir http://127.0.0.1:5173 (no mezclar con Vercel si pruebas backend local). "
        "Demo: ana@studious.party / demo1234"
    )

    pdf.h1("7. Checklist antes de abrir PR")
    for t in [
        "Rama actualizada con main",
        "Probado en local 5173 + 8002",
        "No incluye .env ni secretos",
        "Descripcion del PR: que hace + como probarlo",
        "Otra persona del equipo revisa",
    ]:
        pdf.bullet(f"[ ] {t}")

    pdf.h1("8. A quien avisar si hay bloqueo")
    pdf.table(
        ["Problema", "Avisar a"],
        [
            ["Git / ramas / merge", "Adrian"],
            ["BD / migracion Supabase", "Yokabeth + Adrian"],
            ["API posts rota", "Jessica"],
            ["Navbar / rutas", "Yadii"],
            ["Stats / panel", "meilyn"],
            ["Deploy Vercel/Render", "Adrian"],
        ],
        [95, 95],
    )

    pdf.h1("9. Fuera de alcance (estas 23 h)")
    for t in [
        "Chat en tiempo real",
        "Stories / videos",
        "App movil nativa",
        "Refactor grande del diseno",
        "Cambiar de hosting",
    ]:
        pdf.bullet(t)

    pdf.h1("10. Como cambiar el horario de inicio")
    pdf.body(
        f"Esta guia usa inicio {clock(0)}. Si arrancan a las 14:00, sumen 5 horas a cada "
        "hora de reloj, o regeneren el PDF cambiando START_H en docs/generate_guia_pdf.py "
        "y ejecutando: python docs/generate_guia_pdf.py"
    )

    pdf.ln(4)
    pdf.set_font("ArialUni", "I", 9)
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(
        0,
        5,
        "Documentos hermanos: docs/PLAN_IMPLEMENTACION_23H.md y docs/equipo-features.md\n"
        "Generado para el equipo Studious Party - sprint 23 horas.",
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUT))
    print(f"OK -> {OUT}")


if __name__ == "__main__":
    build()
