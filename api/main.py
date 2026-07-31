"""
Portfolio backend — FastAPI + SQLite.

What it does:
  GET    /api/projects          -> public, lists projects (newest first)
  POST   /api/projects          -> admin, add a project
  PUT    /api/projects/{id}     -> admin, edit a project
  DELETE /api/projects/{id}     -> admin, remove a project
  POST   /api/contact           -> public, store a contact message (+ optional email)
  GET    /api/health            -> public, uptime check for Cloudflare Tunnel

Admin routes require:  Authorization: Bearer <ADMIN_TOKEN>

This is intentionally small and dependency-light so it doubles as a
Python learning project. Run it in Docker on your homelab and expose
it through a Cloudflare Tunnel (see DEPLOY.md).
"""

import os
import re
import smtplib
import sqlite3
import secrets
from email.message import EmailMessage
from contextlib import contextmanager

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

# ----- config (from environment / .env) -----
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "change-me")
DB_PATH = os.getenv("DB_PATH", "data/portfolio.db")
# Comma-separated list of allowed front-end origins (your Pages domain + localhost)
ALLOWED_ORIGINS = [o.strip() for o in os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:8000,http://127.0.0.1:5500"
).split(",") if o.strip()]

# Optional SMTP for the contact form. Leave blank to just store messages.
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
CONTACT_TO = os.getenv("CONTACT_TO", "lamunoz12@gmail.com")

app = FastAPI(title="Luis Portfolio API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


# ----- database helpers -----
@contextmanager
def db():
    os.makedirs(os.path.dirname(DB_PATH) or ".", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id        TEXT PRIMARY KEY,
                meta      TEXT,
                title     TEXT NOT NULL,
                body      TEXT,
                tags      TEXT,            -- stored as comma-separated
                url       TEXT,
                created   TEXT DEFAULT (datetime('now'))
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id      INTEGER PRIMARY KEY AUTOINCREMENT,
                name    TEXT, email TEXT, message TEXT,
                created TEXT DEFAULT (datetime('now'))
            )
        """)


init_db()


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s or secrets.token_hex(4)


def require_admin(authorization: str | None):
    expected = f"Bearer {ADMIN_TOKEN}"
    # constant-time compare avoids leaking the token via timing
    if not authorization or not secrets.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")


# ----- schemas -----
class ProjectIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    meta: str = ""
    body: str = ""
    tags: list[str] = []
    url: str = ""


class Contact(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    message: str = Field(min_length=1, max_length=4000)


def row_to_project(r: sqlite3.Row) -> dict:
    return {
        "id": r["id"], "meta": r["meta"], "title": r["title"],
        "body": r["body"], "url": r["url"],
        "tags": [t for t in (r["tags"] or "").split(",") if t],
    }


# ----- routes -----
@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/projects")
def list_projects():
    with db() as conn:
        rows = conn.execute("SELECT * FROM projects ORDER BY created DESC").fetchall()
    return [row_to_project(r) for r in rows]


@app.post("/api/projects")
def add_project(p: ProjectIn, authorization: str | None = Header(default=None)):
    require_admin(authorization)
    pid = slugify(p.title)
    with db() as conn:
        # make the slug unique if it already exists
        if conn.execute("SELECT 1 FROM projects WHERE id=?", (pid,)).fetchone():
            pid = f"{pid}-{secrets.token_hex(2)}"
        conn.execute(
            "INSERT INTO projects (id, meta, title, body, tags, url) VALUES (?,?,?,?,?,?)",
            (pid, p.meta, p.title, p.body, ",".join(p.tags), p.url),
        )
    return {"id": pid, "ok": True}


@app.put("/api/projects/{pid}")
def edit_project(pid: str, p: ProjectIn, authorization: str | None = Header(default=None)):
    require_admin(authorization)
    with db() as conn:
        cur = conn.execute(
            "UPDATE projects SET meta=?, title=?, body=?, tags=?, url=? WHERE id=?",
            (p.meta, p.title, p.body, ",".join(p.tags), p.url, pid),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Not found")
    return {"id": pid, "ok": True}


@app.delete("/api/projects/{pid}")
def delete_project(pid: str, authorization: str | None = Header(default=None)):
    require_admin(authorization)
    with db() as conn:
        conn.execute("DELETE FROM projects WHERE id=?", (pid,))
    return {"ok": True}


@app.post("/api/contact")
def contact(msg: Contact):
    with db() as conn:
        conn.execute(
            "INSERT INTO messages (name, email, message) VALUES (?,?,?)",
            (msg.name, msg.email, msg.message),
        )
    _maybe_email(msg)
    return {"ok": True}


def _maybe_email(msg: Contact):
    if not SMTP_HOST:
        return  # storing only — no SMTP configured
    try:
        email = EmailMessage()
        email["Subject"] = f"Portfolio message from {msg.name}"
        email["From"] = SMTP_USER
        email["To"] = CONTACT_TO
        email["Reply-To"] = msg.email
        email.set_content(f"From: {msg.name} <{msg.email}>\n\n{msg.message}")
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.starttls()
            s.login(SMTP_USER, SMTP_PASS)
            s.send_message(email)
    except Exception as e:  # don't fail the request if email hiccups
        print("email send failed:", e)
