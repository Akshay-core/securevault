# SecureVault — Architecture

*Author: Akshay*

## Overview

SecureVault is a zero-knowledge encrypted workspace. The central architectural constraint is that **the server never handles plaintext**. All encryption and decryption happens in the browser using the Web Crypto API before any data crosses the network boundary.

## System Components

```
┌──────────────────────────────────────────────────────┐
│                   Client (Browser)                    │
│                                                      │
│  ┌──────────┐   ┌──────────┐   ┌─────────────────┐  │
│  │  React   │──▶│  Zustand │   │  Web Crypto API │  │
│  │   UI     │   │  Store   │   │  (AES-256-GCM)  │  │
│  └──────────┘   └──────────┘   └────────┬────────┘  │
│                      │                  │            │
│                      ▼                  ▼            │
│              ┌───────────────────────────────────┐   │
│              │         Services Layer             │   │
│              │  notesService.ts: orchestrates    │   │
│              │  encrypt → API → decrypt flow     │   │
│              └──────────────┬────────────────────┘   │
│                             │ Only ciphertext         │
└─────────────────────────────┼──────────────────────── ┘
                              │ HTTPS
┌─────────────────────────────┼──────────────────────── ┐
│                   FastAPI Backend                      │
│                             │                         │
│              ┌──────────────▼────────────────────┐    │
│              │         API Routers               │    │
│              │  /auth, /notes, /sessions         │    │
│              └──────────────┬────────────────────┘    │
│                             │                         │
│  ┌──────────────────────────▼──────────────────────┐  │
│  │               Middleware Stack                   │  │
│  │  Rate Limiting → Security Headers → CORS         │  │
│  └──────────────────────────┬──────────────────────┘  │
│                             │                         │
│              ┌──────────────▼────────────────────┐    │
│              │           SQLite                   │    │
│              │  Stores: ciphertext, salt, IV      │    │
│              │  Never: password, key, plaintext   │    │
│              └───────────────────────────────────┘    │
└────────────────────────────────────────────────────── ┘
```

## Key Derivation Flow

```
User Password (string)
       │
       ▼
PBKDF2-SHA256 (310,000 iterations, 256-bit salt)
       │
       ├──▶ Encryption Key (AES-256-GCM, non-extractable CryptoKey)
       │    Used for: note encryption/decryption
       │    Stored: in-memory only, cleared on logout
       │
       └──▶ Auth Verifier (domain-separated: password + ":auth")
            Used for: server-side login verification
            Sent to: server during login/register
            Server stores: this verifier, not the password
```

The two-key separation ensures that stealing the auth verifier (even from the server) does not compromise note encryption.

## Encryption Flow (Per Note)

```
plaintext (string)
    │
    ▼
TextEncoder.encode() → Uint8Array
    │
    ▼
crypto.getRandomValues(96-bit IV)  ← unique per operation
    │
    ▼
crypto.subtle.encrypt(AES-GCM, key, plaintext)
    │
    ▼
{ ciphertext: base64, iv: base64 }
    │
    ▼
JSON.stringify() → stored in database
```

## Why AES-GCM?

AES-GCM (Galois/Counter Mode) provides **authenticated encryption**. This means:

1. **Confidentiality**: Only the key holder can decrypt.
2. **Integrity**: Any modification to the ciphertext or IV causes decryption to fail with a detectable error. CBC mode does not provide this.

The authentication tag is automatically appended to the ciphertext by the Web Crypto API and verified during decryption.

## Session Management

- Access tokens: JWT, 15-minute expiry
- Refresh tokens: random 64-char hex, SHA-256 hashed before storage
- Refresh rotation: each use returns a new token (future improvement)
- Session revocation: user can delete any session by device from the Security Center

## Database Schema Design

The schema is intentionally minimal. Note fields are stored as opaque JSON strings (`encrypted_content`, `encrypted_title`, etc.). The server never attempts to parse these — they're treated as black-box blobs.

This keeps the server "dumb" by design, which limits what an attacker can learn even with full database read access.

## Scalability Path

The current SQLite setup works well for self-hosted single-instance deployment. Scaling path:

1. Replace `aiosqlite` + SQLite with `asyncpg` + PostgreSQL (connection string swap)
2. Add Redis for rate limiting (replace in-process bucket with `slowapi + redis`)
3. Add CDN in front of the static frontend build
4. Consider read replicas if note fetch latency becomes an issue at scale

The encryption layer is unaffected by any infrastructure changes — it's entirely client-side.
