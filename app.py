from __future__ import annotations

import json
import os
import shutil
import sqlite3
import subprocess
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from functools import wraps
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from flask import Flask, flash, g, redirect, render_template, request, session, url_for
from markupsafe import Markup
import markdown
from werkzeug.security import check_password_hash, generate_password_hash


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "change-me-in-production")
    app.config["OPENCLAW_WORKSPACE"] = Path(
        os.environ.get("OPENCLAW_WORKSPACE", str(Path.home() / ".openclaw" / "workspace"))
    ).expanduser()
    app.config["CLAWHUB_BIN"] = os.environ.get("CLAWHUB_BIN", "clawhub")
    app.config["PORTAL_DB"] = Path(
        os.environ.get(
            "PORTAL_DB",
            str(Path(__file__).resolve().parent / "portal.db"),
        )
    )
    app.config["ADMIN_USERNAME"] = os.environ.get("ADMIN_USERNAME", "admin")
    app.config["ADMIN_PASSWORD_HASH"] = resolve_password_hash()
    app.config["SKILLS_DIR"] = app.config["OPENCLAW_WORKSPACE"] / "skills"
    app.config["LOCK_FILE"] = app.config["OPENCLAW_WORKSPACE"] / ".clawhub" / "lock.json"

    app.config["PORTAL_VERSION"] = "0.1.0"

    ensure_dirs(app)
    init_db(app)

    @app.before_request
    def load_db() -> None:
        g.db = sqlite3.connect(app.config["PORTAL_DB"])
        g.db.row_factory = sqlite3.Row

    @app.teardown_request
    def close_db(_: Exception | None) -> None:
        db = getattr(g, "db", None)
        if db is not None:
            db.close()

    @app.context_processor
    def inject_globals() -> dict[str, Any]:
        return {
            "workspace_path": str(app.config["OPENCLAW_WORKSPACE"]),
            "skills_path": str(app.config["SKILLS_DIR"]),
            "portal_version": app.config["PORTAL_VERSION"],
            "current_user": session.get("username"),
        }

    @app.template_filter("dt")
    def format_dt(value: float | int | None) -> str:
        if not value:
            return "Unknown"
        return datetime.fromtimestamp(value, tz=timezone.utc).astimezone().strftime(
            "%Y-%m-%d %H:%M:%S %Z"
        )

    @app.template_filter("bytesize")
    def format_bytes(value: int | None) -> str:
        if value is None:
            return "Unknown"
        size = float(value)
        units = ["B", "KB", "MB", "GB", "TB"]
        for unit in units:
            if size < 1024 or unit == units[-1]:
                return f"{size:.1f} {unit}" if unit != "B" else f"{int(size)} B"
            size /= 1024
        return f"{int(value)} B"

    @app.template_filter("markdown")
    def render_markdown(value: str | None) -> Markup:
        if not value:
            return Markup("")
        html = markdown.markdown(
            value,
            extensions=["fenced_code", "tables", "nl2br", "sane_lists"],
        )
        return Markup(html)

    def login_required(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not session.get("authenticated"):
                return redirect(url_for("login", next=request.path))
            return func(*args, **kwargs)

        return wrapper

    @app.get("/")
    def root():
        return redirect(url_for("dashboard"))

    @app.route("/login", methods=["GET", "POST"])
    def login():
        if session.get("authenticated"):
            return redirect(url_for("dashboard"))
        if request.method == "POST":
            username = request.form.get("username", "").strip()
            password = request.form.get("password", "")
            user = get_admin_user(g.db, username)
            if user and check_password_hash(user["password_hash"], password):
                client_ip = get_client_ip(request)
                g.db.execute(
                    """
                    UPDATE admin_users
                    SET last_login_at = ?, last_login_ip = ?, updated_at = ?
                    WHERE username = ?
                    """,
                    (time.time(), client_ip, time.time(), username),
                )
                g.db.commit()
                record_activity(g.db, "_admin", "login", f"{username} from {client_ip}")
                session.clear()
                session["authenticated"] = True
                session["username"] = username
                flash("Signed in.", "success")
                next_url = request.args.get("next") or url_for("dashboard")
                return redirect(next_url)
            flash("Invalid username or password.", "danger")
        return render_template("login.html")

    @app.post("/logout")
    def logout():
        session.clear()
        flash("Signed out.", "info")
        return redirect(url_for("login"))

    @app.post("/change-password")
    @login_required
    def change_password():
        username = session.get("username", app.config["ADMIN_USERNAME"])
        current_password = request.form.get("current_password", "")
        new_password = request.form.get("new_password", "")
        confirm_password = request.form.get("confirm_password", "")

        user = get_admin_user(g.db, username)
        if user is None:
            flash("Admin account is missing.", "danger")
            return redirect(url_for("dashboard"))
        if not check_password_hash(user["password_hash"], current_password):
            flash("Current password is incorrect.", "danger")
            return redirect(url_for("dashboard"))
        if len(new_password) < 8:
            flash("New password must be at least 8 characters.", "warning")
            return redirect(url_for("dashboard"))
        if new_password != confirm_password:
            flash("New password confirmation does not match.", "warning")
            return redirect(url_for("dashboard"))
        if current_password == new_password:
            flash("New password must be different from the current password.", "warning")
            return redirect(url_for("dashboard"))

        g.db.execute(
            "UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE username = ?",
            (generate_password_hash(new_password), time.time(), username),
        )
        g.db.commit()
        record_activity(g.db, "_admin", "password_change", f"Password changed for {username}")
        flash("Admin password updated.", "success")
        return redirect(url_for("dashboard"))

    @app.get("/dashboard")
    @login_required
    def dashboard():
        query = request.args.get("q", "").strip().lower()
        skills = list_skills(app, g.db)
        if query:
            skills = [
                skill
                for skill in skills
                if query in skill.slug.lower()
                or query in (skill.title or "").lower()
                or query in (skill.summary or "").lower()
                or query in (skill.owner_id or "").lower()
            ]
        summary = summarize(skills)
        return render_template("dashboard.html", skills=skills, summary=summary, query=query)

    @app.get("/skills/<slug>")
    @login_required
    def skill_detail(slug: str):
        skill = get_skill(app, g.db, slug)
        if skill is None:
            flash(f"Skill '{slug}' was not found.", "warning")
            return redirect(url_for("dashboard"))
        record_activity(g.db, slug, "view", "Viewed skill details")
        activity = recent_activity(g.db, slug)
        return render_template("skill_detail.html", skill=skill, activity=activity)

    @app.post("/install")
    @login_required
    def install_skill():
        raw_input = request.form.get("slug", "").strip()
        slug = normalize_skill_slug(raw_input)
        if not slug:
            flash("Enter a ClawHub skill slug or URL.", "warning")
            return redirect(url_for("dashboard"))
        command = [app.config["CLAWHUB_BIN"], "install", slug]
        try:
            result = run_clawhub(app, command)
        except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
            record_activity(g.db, slug, "install_failed", str(exc))
            flash(f"Install failed for '{slug}': {exc}", "danger")
            return redirect(url_for("dashboard"))
        if result.returncode == 0:
            record_activity(g.db, slug, "install", result.stdout.strip() or "Installed")
            flash(f"Installed '{slug}'.", "success")
        else:
            record_activity(g.db, slug, "install_failed", result.stderr.strip() or result.stdout.strip())
            flash(f"Install failed for '{slug}': {clean_output(result)}", "danger")
        return redirect(url_for("dashboard"))

    @app.post("/skills/<slug>/update")
    @login_required
    def update_skill(slug: str):
        command = [app.config["CLAWHUB_BIN"], "update", slug]
        try:
            result = run_clawhub(app, command)
        except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
            record_activity(g.db, slug, "update_failed", str(exc))
            flash(f"Update failed for '{slug}': {exc}", "danger")
            return redirect(url_for("skill_detail", slug=slug))
        if result.returncode == 0:
            record_activity(g.db, slug, "update", result.stdout.strip() or "Updated")
            flash(f"Updated '{slug}'.", "success")
        else:
            record_activity(g.db, slug, "update_failed", result.stderr.strip() or result.stdout.strip())
            flash(f"Update failed for '{slug}': {clean_output(result)}", "danger")
        return redirect(url_for("skill_detail", slug=slug))

    @app.post("/skills/<slug>/delete")
    @login_required
    def delete_skill(slug: str):
        try:
            skill_dir = safe_skill_dir(app, slug)
        except ValueError as exc:
            flash(str(exc), "danger")
            return redirect(url_for("dashboard"))
        if not skill_dir.exists():
            flash(f"Skill '{slug}' is already gone.", "warning")
            return redirect(url_for("dashboard"))
        shutil.rmtree(skill_dir)
        remove_from_lock(app.config["LOCK_FILE"], slug)
        record_activity(g.db, slug, "delete", "Removed skill from workspace")
        flash(f"Deleted '{slug}'.", "success")
        return redirect(url_for("dashboard"))

    return app


def resolve_password_hash() -> str:
    password_hash = os.environ.get("ADMIN_PASSWORD_HASH", "").strip()
    if password_hash:
        return password_hash
    password = os.environ.get("ADMIN_PASSWORD", "change-me-now")
    return generate_password_hash(password)


def ensure_dirs(app: Flask) -> None:
    app.config["SKILLS_DIR"].mkdir(parents=True, exist_ok=True)
    app.config["LOCK_FILE"].parent.mkdir(parents=True, exist_ok=True)
    if not app.config["LOCK_FILE"].exists():
        app.config["LOCK_FILE"].write_text(json.dumps({"version": 1, "skills": {}}, indent=2))


def init_db(app: Flask) -> None:
    db_path = app.config["PORTAL_DB"]
    conn = sqlite3.connect(db_path)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS admin_users (
            username TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL,
            created_at REAL NOT NULL,
            updated_at REAL NOT NULL,
            last_login_at REAL,
            last_login_ip TEXT
        )
        """
    )
    ensure_admin_user_columns(conn)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS skill_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT NOT NULL,
            action TEXT NOT NULL,
            detail TEXT,
            created_at REAL NOT NULL
        )
        """
    )
    seed_admin_user(conn, app.config["ADMIN_USERNAME"], app.config["ADMIN_PASSWORD_HASH"])
    conn.commit()
    conn.close()


def ensure_admin_user_columns(conn: sqlite3.Connection) -> None:
    columns = {
        row[1] for row in conn.execute("PRAGMA table_info(admin_users)").fetchall()
    }
    if "last_login_at" not in columns:
        conn.execute("ALTER TABLE admin_users ADD COLUMN last_login_at REAL")
    if "last_login_ip" not in columns:
        conn.execute("ALTER TABLE admin_users ADD COLUMN last_login_ip TEXT")


def seed_admin_user(conn: sqlite3.Connection, username: str, password_hash: str) -> None:
    row = conn.execute(
        "SELECT username FROM admin_users WHERE username = ?",
        (username,),
    ).fetchone()
    if row is not None:
        return
    now = time.time()
    conn.execute(
        """
        INSERT INTO admin_users (username, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        """,
        (username, password_hash, now, now),
    )


def get_admin_user(db: sqlite3.Connection, username: str) -> sqlite3.Row | None:
    return db.execute(
        """
        SELECT username, password_hash, created_at, updated_at, last_login_at, last_login_ip
        FROM admin_users
        WHERE username = ?
        """,
        (username,),
    ).fetchone()


def get_client_ip(req) -> str:
    forwarded = req.headers.get("X-Forwarded-For", "").strip()
    if forwarded:
        parts = [part.strip() for part in forwarded.split(",") if part.strip()]
        if parts:
            return parts[0]
    return req.remote_addr or "unknown"


@dataclass
class SkillRecord:
    slug: str
    title: str
    summary: str | None
    version: str | None
    installed_version: str | None
    installed_at: float | None
    published_at: float | None
    modified_at: float | None
    size_bytes: int
    file_count: int
    owner_id: str | None
    registry: str | None
    readme_path: str | None
    skill_path: str
    usage_instructions: str | None
    portal_last_used_at: float | None
    portal_last_action: str | None
    raw_meta: dict[str, Any]
    raw_origin: dict[str, Any]


def list_skills(app: Flask, db: sqlite3.Connection) -> list[SkillRecord]:
    lock_data = read_json(app.config["LOCK_FILE"], {"version": 1, "skills": {}})
    lock_skills = lock_data.get("skills", {})
    rows = db.execute(
        """
        SELECT slug, action, created_at
        FROM skill_activity
        WHERE id IN (
            SELECT MAX(id)
            FROM skill_activity
            GROUP BY slug
        )
        """
    ).fetchall()
    latest_activity = {row["slug"]: row for row in rows}

    skills: list[SkillRecord] = []
    for skill_dir in sorted(app.config["SKILLS_DIR"].iterdir(), key=lambda p: p.name.lower()):
        if not skill_dir.is_dir():
            continue
        slug = skill_dir.name
        meta = read_json(skill_dir / "_meta.json", {})
        origin = read_json(skill_dir / ".clawhub" / "origin.json", {})
        readme_path = skill_dir / "README.md"
        skill_md_path = skill_dir / "SKILL.md"
        title, summary = extract_title_summary(readme_path if readme_path.exists() else skill_md_path)
        usage_instructions = extract_usage_instructions(skill_md_path, readme_path if readme_path.exists() else None)
        stats = collect_dir_stats(skill_dir)
        installed_entry = lock_skills.get(slug, {})
        installed_at_ms = installed_entry.get("installedAt") or origin.get("installedAt")
        published_at_ms = meta.get("publishedAt")
        activity = latest_activity.get(slug)

        skills.append(
            SkillRecord(
                slug=slug,
                title=title or slug,
                summary=summary,
                version=string_or_none(meta.get("version")),
                installed_version=string_or_none(
                    installed_entry.get("version") or origin.get("installedVersion")
                ),
                installed_at=ms_to_seconds(installed_at_ms),
                published_at=ms_to_seconds(published_at_ms),
                modified_at=stats["modified_at"],
                size_bytes=stats["size_bytes"],
                file_count=stats["file_count"],
                owner_id=string_or_none(meta.get("ownerId")),
                registry=string_or_none(origin.get("registry")),
                readme_path=str(readme_path) if readme_path.exists() else None,
                skill_path=str(skill_md_path),
                usage_instructions=usage_instructions,
                portal_last_used_at=activity["created_at"] if activity else None,
                portal_last_action=activity["action"] if activity else None,
                raw_meta=meta,
                raw_origin=origin,
            )
        )
    skills.sort(key=lambda skill: (skill.installed_at or 0, skill.slug), reverse=True)
    return skills


def get_skill(app: Flask, db: sqlite3.Connection, slug: str) -> SkillRecord | None:
    for skill in list_skills(app, db):
        if skill.slug == slug:
            return skill
    return None


def summarize(skills: list[SkillRecord]) -> dict[str, Any]:
    admin = get_admin_user(g.db, session.get("username", "admin")) if hasattr(g, "db") else None
    return {
        "count": len(skills),
        "total_size": sum(skill.size_bytes for skill in skills),
        "latest_install": max((skill.installed_at or 0 for skill in skills), default=0) or None,
        "last_login_at": admin["last_login_at"] if admin else None,
        "last_login_ip": admin["last_login_ip"] if admin else None,
    }


def recent_activity(db: sqlite3.Connection, slug: str) -> list[sqlite3.Row]:
    return db.execute(
        """
        SELECT action, detail, created_at
        FROM skill_activity
        WHERE slug = ?
        ORDER BY id DESC
        LIMIT 20
        """,
        (slug,),
    ).fetchall()


def record_activity(db: sqlite3.Connection, slug: str, action: str, detail: str | None) -> None:
    db.execute(
        "INSERT INTO skill_activity (slug, action, detail, created_at) VALUES (?, ?, ?, ?)",
        (slug, action, detail, time.time()),
    )
    db.commit()


def run_clawhub(app: Flask, command: list[str]) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env["CLAWHUB_WORKDIR"] = str(app.config["OPENCLAW_WORKSPACE"])
    return subprocess.run(
        command,
        cwd=str(app.config["OPENCLAW_WORKSPACE"]),
        env=env,
        text=True,
        capture_output=True,
        timeout=120,
    )


def clean_output(result: subprocess.CompletedProcess[str]) -> str:
    text = (result.stderr or result.stdout or "").strip()
    return text.splitlines()[-1] if text else "Unknown error"


def normalize_skill_slug(value: str) -> str | None:
    if not value:
        return None
    if "://" in value:
        parsed = urlparse(value)
        parts = [part for part in parsed.path.split("/") if part]
        if not parts:
            return None
        return parts[-1]
    return value.strip().strip("/")


def safe_skill_dir(app: Flask, slug: str) -> Path:
    skills_root = app.config["SKILLS_DIR"].resolve()
    skill_dir = (skills_root / slug).resolve()
    if skills_root not in skill_dir.parents:
        raise ValueError("Refusing to operate outside the skills directory")
    return skill_dir


def remove_from_lock(lock_file: Path, slug: str) -> None:
    data = read_json(lock_file, {"version": 1, "skills": {}})
    skills = data.setdefault("skills", {})
    skills.pop(slug, None)
    lock_file.write_text(json.dumps(data, indent=2))


def read_json(path: Path, default: dict[str, Any]) -> dict[str, Any]:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return default


def extract_title_summary(path: Path) -> tuple[str | None, str | None]:
    try:
        lines = path.read_text().splitlines()
    except OSError:
        return None, None
    title = None
    summary = None
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("# ") and not title:
            title = stripped[2:].strip()
            continue
        if stripped and not stripped.startswith("#") and summary is None:
            summary = stripped
        if title and summary:
            break
    return title, summary


def extract_usage_instructions(skill_path: Path, readme_path: Path | None) -> str | None:
    for path in [skill_path, readme_path]:
        if path is None or not path.exists():
            continue
        try:
            lines = path.read_text().splitlines()
        except OSError:
            continue
        snippets: list[str] = []
        capture = False
        heading_found = False
        for line in lines:
            stripped = line.strip()
            lowered = stripped.lower()
            if stripped.startswith("#"):
                if heading_found and capture:
                    break
                capture = lowered.startswith(("## usage", "## how to use", "## instructions", "## process", "# usage"))
                if capture:
                    heading_found = True
                    continue
            if capture:
                snippets.append(line.rstrip())
        if snippets:
            text = "\n".join(snippets).strip()
            if text:
                return text

        try:
            raw = path.read_text().strip()
        except OSError:
            raw = ""
        if raw:
            return raw[:4000]
    return None


def collect_dir_stats(skill_dir: Path) -> dict[str, Any]:
    total_size = 0
    file_count = 0
    modified_at = 0.0
    for path in skill_dir.rglob("*"):
        try:
            if path.is_file():
                stat = path.stat()
                total_size += stat.st_size
                file_count += 1
                modified_at = max(modified_at, stat.st_mtime)
        except OSError:
            continue
    return {"size_bytes": total_size, "file_count": file_count, "modified_at": modified_at or None}


def ms_to_seconds(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        return float(value) / 1000.0
    return None


def string_or_none(value: Any) -> str | None:
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return None


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5057")), debug=False)
