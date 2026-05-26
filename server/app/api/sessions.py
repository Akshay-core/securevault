"""
sessions.py

Session management endpoints. Allows users to view active devices
and revoke sessions remotely — a key feature for security-conscious users.
"""

import aiosqlite
from fastapi import APIRouter, Depends, HTTPException, Request

from app.db.database import get_db
from app.auth.auth import get_current_user

router = APIRouter()


@router.get("")
async def list_sessions(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    """Returns all active sessions for the current user."""
    current_ip = request.client.host if request.client else ""

    async with db.execute(
        """SELECT id, device_name, ip_address, created_at, last_active, ip_address as current_ip
           FROM sessions
           WHERE user_id = ? AND expires_at > datetime('now')
           ORDER BY last_active DESC""",
        (current_user["id"],)
    ) as cur:
        rows = await cur.fetchall()

    sessions = []
    for row in rows:
        s = dict(row)
        s["is_current"] = s["ip_address"] == current_ip
        sessions.append(s)

    return sessions


@router.delete("/all", status_code=204)
async def revoke_all_sessions(
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    """Revokes all sessions except the current one."""
    current_ip = request.client.host if request.client else ""

    await db.execute(
        """DELETE FROM sessions
           WHERE user_id = ? AND ip_address != ?""",
        (current_user["id"], current_ip)
    )
    await db.commit()


@router.delete("/{session_id}", status_code=204)
async def revoke_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: aiosqlite.Connection = Depends(get_db),
):
    async with db.execute(
        "SELECT id FROM sessions WHERE id = ? AND user_id = ?",
        (session_id, current_user["id"])
    ) as cur:
        if not await cur.fetchone():
            raise HTTPException(status_code=404, detail="Session not found")

    await db.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    await db.commit()
