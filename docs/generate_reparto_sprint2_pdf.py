"""Genera PDF del Sprint 2 — reparto de features (equipo Studious Party)."""
from pathlib import Path

from fpdf import FPDF

OUT = Path(__file__).resolve().parent / "Reparto_Sprint2_Mejoras_UX.pdf"


class TeamPDF(FPDF):
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
        self.cell(
            0,
            6,
            "Studious Party - Sprint 2 (reparto de mejoras UX)",
            new_x="LMARGIN",
            new_y="NEXT",
        )
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

    def code(self, text):
        self.set_x(self.l_margin)
        self.set_font("Courier", "", 8)
        self.set_text_color(20, 20, 20)
        self.multi_cell(0, 4.5, text)
        self.ln(1)

    def banner(self, text):
        self.set_x(self.l_margin)
        self.set_fill_color(31, 51, 39)
        self.set_text_color(255, 255, 255)
        self.set_font("ArialUni", "B", 10)
        self.cell(0, 8, f"  {text}", new_x="LMARGIN", new_y="NEXT", fill=True)
        self.set_text_color(30, 30, 30)
        self.ln(2)

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
            self.cell(col_w[i], 7, h, border=1, fill=True)
        self.ln()
        self.set_font("ArialUni", "", 8)
        self.set_text_color(20, 20, 20)
        fill = False
        for row in rows:
            lines = []
            for i, cell in enumerate(row):
                lines.append(self.multi_cell(col_w[i], 5, str(cell), dry_run=True, output="LINES"))
            row_h = max(max(len(ls) for ls in lines) * 5, 7)
            x0 = self.l_margin
            y0 = self.get_y()
            if y0 + row_h > self.h - 20:
                self.add_page()
                y0 = self.get_y()
            for i, cell in enumerate(row):
                self.set_xy(x0 + sum(col_w[:i]), y0)
                self.set_fill_color(232, 240, 234) if fill else self.set_fill_color(255, 255, 255)
                self.rect(x0 + sum(col_w[:i]), y0, col_w[i], row_h)
                self.multi_cell(col_w[i], 5, str(cell), border=0, fill=False)
            self.set_y(y0 + row_h)
            fill = not fill
        self.ln(2)


def build():
    pdf = TeamPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.set_margins(16, 16, 16)
    pdf.add_page()

    pdf.h1("Studious Party — Sprint 2")
    pdf.body(
        "Reparto de features: 3 mejoras UX (cold start, editar/borrar posts, busqueda + follow en movil)."
    )
    pdf.banner("Regla: 1 persona = 1 rama = 1 PR. No subir directo a main.")

    pdf.h2("Objetivo")
    pdf.bullet("Que el producto aguante el cold start de Render.")
    pdf.bullet("Que el autor pueda editar y borrar sus posts (web + movil).")
    pdf.bullet("Que la app movil tenga busqueda y follow (paridad con la web).")

    pdf.h2("Tabla de reparto")
    pdf.table(
        ["#", "Integrante", "Feature", "Rama"],
        [
            ["1", "Yokabeth Valdes", "Follow en app movil", "feature/seguir-mobile"],
            ["2", "Jessica Angulo", "Editar/borrar posts (API+web+movil)", "feature/editar-borrar-post"],
            ["3", "YadiiCabeza96", "Busqueda en app movil", "feature/busqueda-mobile"],
            ["4", "meilynperea2-debug", "Cold start web + QA cierre", "feature/cold-start-web"],
            ["5", "Adrian Arboleda", "Cold start movil + docs + APK", "feature/cold-start-mobile"],
        ],
        [12, 42, 70, 55],
    )

    pdf.h2("Orden de merge (menos conflictos)")
    pdf.bullet("1. Adrian + Meilyn en paralelo (Adrian solo mobile/, Meilyn solo frontend/)")
    pdf.bullet("2. Jessica (API posts + PostCard web/movil)")
    pdf.bullet("3. Yadira (tab Buscar — toca _layout)")
    pdf.bullet("4. Yokabeth (follow en perfiles)")
    pdf.bullet("5. Meilyn confirma QA → merge a main")
    pdf.body("Si Yadira y Yokabeth terminan juntas: primero Yadira (tabs), luego Yokabeth (perfil).")

    pdf.add_page()
    pdf.h2("Persona 1 — Yokabeth — Follow movil")
    pdf.body("Entrega: boton Seguir / Dejar de seguir y contadores en perfil Expo.")
    pdf.h3("Archivos")
    pdf.bullet("mobile/app/(app)/profile/[id].jsx")
    pdf.bullet("mobile/app/(app)/profile/index.jsx")
    pdf.bullet("API ya existe: POST/DELETE /api/users/{id}/follow , GET /api/users/{id}")
    pdf.h3("No tocar")
    pdf.bullet("search, posts edit/delete, auth, tabs layout (salvo lo minimo)")
    pdf.h3("Criterio")
    pdf.body("Desde la app se sigue a alguien y el contador de seguidores cambia (coherente con la web).")

    pdf.h2("Persona 2 — Jessica — Editar / borrar posts")
    pdf.body("Entrega: el autor edita texto y elimina su post en web y movil. Completar API si falta.")
    pdf.h3("Archivos")
    pdf.bullet("backend/app/api/posts.py")
    pdf.bullet("backend/app/schemas/post.py (PostUpdate)")
    pdf.bullet("backend/tests/test_posts.py")
    pdf.bullet("frontend/src/components/PostCard.jsx (+ Feed/Profile/Search onDeleted)")
    pdf.bullet("mobile/src/components/PostCard.jsx")
    pdf.h3("Endpoints")
    pdf.code("PATCH /api/posts/{id}   { content }   solo autor\nDELETE /api/posts/{id}  204             solo autor")
    pdf.h3("No tocar")
    pdf.bullet("auth, follows, search API, Navbar")
    pdf.h3("Criterio")
    pdf.body("Autor edita/borra; otro usuario no ve el menu de opciones.")

    pdf.h2("Persona 3 — Yadira — Busqueda movil")
    pdf.body("Entrega: tab Buscar en la app Expo (usuarios + posts).")
    pdf.h3("Archivos")
    pdf.bullet("NUEVO mobile/app/(app)/search.jsx")
    pdf.bullet("mobile/app/(app)/_layout.jsx")
    pdf.bullet("API ya existe: GET /api/search?q=")
    pdf.bullet("Referencia web: frontend/src/pages/Search.jsx")
    pdf.h3("No tocar")
    pdf.bullet("posts.py, follows, auth")
    pdf.h3("Criterio")
    pdf.body("Buscar desde la app abre perfiles y muestra posts.")

    pdf.add_page()
    pdf.h2("Persona 4 — Meilyn — Cold start web + QA")
    pdf.body(
        "Entrega: reintento / mensaje 'Despertando el servidor...' en login, registro, "
        "feed y dashboard web. Checklist QA del sprint."
    )
    pdf.h3("Archivos")
    pdf.bullet("NUEVO frontend/src/utils/withRetry.js")
    pdf.bullet("frontend/src/pages/Login.jsx, Register.jsx, Feed.jsx, Dashboard.jsx")
    pdf.h3("No tocar")
    pdf.bullet("movil (Adrian), PostCard edit/delete, follows")
    pdf.h3("Checklist QA de cierre")
    pdf.bullet("Login web tras cold start de Render")
    pdf.bullet("Login movil tras cold start")
    pdf.bullet("Autor edita y borra post (web + movil)")
    pdf.bullet("Otro usuario no ve menu editar/borrar")
    pdf.bullet("Buscar usuario/post en app")
    pdf.bullet("Seguir / dejar de seguir desde perfil app")
    pdf.bullet("Contadores coherentes con la web")

    pdf.h2("Persona 5 — Adrian — Cold start movil + entrega")
    pdf.body("Entrega: wake/retry en la app Expo; docs; coordinar redeploy y APK.")
    pdf.h3("Archivos")
    pdf.bullet("NUEVO mobile/src/utils/withRetry.js")
    pdf.bullet("mobile/app/(auth)/login.jsx, register.jsx")
    pdf.bullet("mobile/app/(app)/feed.jsx")
    pdf.bullet("mobile/README.md, docs/PLAN_APP_MOVIL.md, docs/equipo-features.md")
    pdf.h3("No tocar")
    pdf.bullet("frontend web cold start (Meilyn), edit/delete (Jessica), search/follow movil")
    pdf.h3("Tras merges")
    pdf.bullet("Redeploy Render (si Jessica toco API) + Vercel + APK nuevo (versionCode +1)")

    pdf.h2("Comandos base")
    pdf.code(
        "git checkout main\n"
        "git pull\n"
        "git checkout -b feature/nombre-de-tu-feature\n"
        "# ... cambios ...\n"
        "git add .\n"
        'git commit -m "add brief description of feature"\n'
        "git push -u origin HEAD\n"
        "# Abrir Pull Request hacia main"
    )

    pdf.h2("Fuente")
    pdf.body("Detalle completo en docs/equipo-features.md (seccion Sprint 2).")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUT))
    print(f"OK -> {OUT}")


if __name__ == "__main__":
    build()
