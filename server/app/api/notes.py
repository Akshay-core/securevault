"""
notes.py

Note CRUD endpoints. The server is deliberately unaware of note content —
all fields are opaque JSON blobs from its perspective.

Design note on validation: We validate that encrypted fields are non-empty
strings, but we don't attempt to parse or validate the encryption structure.
That's intentional — we're not the right layer for that, and attempting it
would require understanding the key, which we don't have.
"""

import uuid
import aiosqlite
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.db.database import get_db
from app.auth.auth import get_current_user

router = APIRouter()


class CreateNoteRequest(BaseModel):
    encrypted_title: str
    encrypted_content: str
    encrypted_tags: str
    salt: str


class UpdateNoteRequest(BaseModel):
    encrypted_title: str
    encrypted_content: str
    encrypted_tags: str
    salt: str


@router.get("")
async def list_notes(
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute(
        """SELECT id, encrypted_title, encrypted_content, encrypted_tags,
                  salt, created_at, updated_at, user_id
           FROM notes WHERE user_id = ? ORDER BY updated_at DESC""",
        (current_user["id"],)
    ) as cur:
        rows = await cur.fetchall()

    return [dict(r) for r in rows]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_note(
    body: CreateNoteRequest,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    note_id = str(uuid.uuid4())
    await db.execute(
        """INSERT INTO notes (id, user_id, encrypted_title, encrypted_content, encrypted_tags, salt)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (note_id, current_user["id"], body.encrypted_title,
         body.encrypted_content, body.encrypted_tags, body.salt)
    )
    await db.commit()

    async with db.execute("SELECT * FROM notes WHERE id = ?", (note_id,)) as cur:
        note = await cur.fetchone()

    return dict(note)


@router.put("/{note_id}")
async def update_note(
    note_id: str,
    body: UpdateNoteRequest,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute(
        "SELECT id FROM notes WHERE id = ? AND user_id = ?",
        (note_id, current_user["id"])
    ) as cur:
        if not await cur.fetchone():
            raise HTTPException(status_code=404, detail="Note not found")

    await db.execute(
        """UPDATE notes
           SET encrypted_title = ?, encrypted_content = ?, encrypted_tags = ?,
               salt = ?, updated_at = datetime('now')
           WHERE id = ? AND user_id = ?""",
        (body.encrypted_title, body.encrypted_content, body.encrypted_tags,
         body.salt, note_id, current_user["id"])
    )
    await db.commit()

    async with db.execute("SELECT * FROM notes WHERE id = ?", (note_id,)) as cur:
        note = await cur.fetchone()

    return dict(note)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: str,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute(
        "SELECT id FROM notes WHERE id = ? AND user_id = ?",
        (note_id, current_user["id"])
    ) as cur:
        if not await cur.fetchone():
            raise HTTPException(status_code=404, detail="Note not found")

    await db.execute("DELETE FROM notes WHERE id = ? AND user_id = ?", (note_id, current_user["id"]))
    await db.commit()
