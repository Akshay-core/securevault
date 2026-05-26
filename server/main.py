"""
main.py — SecureVault API

The server is architecturally incapable of reading note content.
It receives encrypted blobs, stores them, and returns them.
The encryption key is derived client-side and never transmitted here.
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path

# Load .env before anything else reads os.getenv()
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import init_db
from app.auth.auth import router as auth_router
from app.api.notes import router as notes_router
from app.api.sessions import router as sessions_router
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="SecureVault API",
    description="Zero-knowledge encrypted notes backend. Stores only ciphertext.",
    version="1.0.0",
    lifespan=lifespan,
)

# --- CORS ---
allowed_origins = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)

# --- Routes ---
app.include_router(auth_router,     prefix="/api/auth",     tags=["auth"])
app.include_router(notes_router,    prefix="/api/notes",    tags=["notes"])
app.include_router(sessions_router, prefix="/api/sessions", tags=["sessions"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "securevault-api"}


# --- Entry point ---
# python main.py            → development (auto-reload on file changes)
# uvicorn main:app ...      → production
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("ENVIRONMENT", "development") == "development",
        log_level="info",
    )