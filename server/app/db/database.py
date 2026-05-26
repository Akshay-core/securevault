"""
database.py

SQLite via aiosqlite for async I/O. The schema is intentionally simple —
we store blobs, not structured note data. This reflects the zero-knowledge design:
the server shouldn't even be curious about what it's storing.

Migration strategy: We're using raw SQL here rather than an ORM to keep things
transparent and easy to audit. For production scaling, swap the connection string
for PostgreSQL (asyncpg) — the query structure remains compatible.
"""

import aiosqlite
import os
from pathlib import Path

DB_PATH = os.getenv("DATABASE_URL", "securevault.db")


async def get_db() -> aiosqlite.Connection:
    """Dependency: yields a database connection per request."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db


async def init_db():
    """Create tables if they don't exist. Run once on startup."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(SCHEMA)
        await db.commit()
    print(f"[db] Initialized at {DB_PATH}")


SCHEMA = """
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    salt        TEXT NOT NULL,
    verifier    TEXT NOT NULL,         -- derived auth key, not the password
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notes (
    id                  TEXT PRIMARY KEY,
    user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    encrypted_title     TEXT NOT NULL,   -- JSON: {ciphertext, iv}
    encrypted_content   TEXT NOT NULL,
    encrypted_tags      TEXT NOT NULL,
    salt                TEXT NOT NULL,   -- per-note salt for future key rotation
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);

CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL,           -- hashed refresh token, not raw
    device_name TEXT NOT NULL DEFAULT 'Unknown Device',
    ip_address  TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    last_active TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT NOT NULL,
    event       TEXT NOT NULL,
    ip_address  TEXT,
    metadata    TEXT,                    -- JSON blob for extra context
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
"""
