# SecureVault — Threat Model

*Author: Akshay*

This document defines the security boundaries, assumptions, and known limitations of SecureVault. Documenting what a system cannot protect against is as important as documenting what it can.

---

## Trust Boundaries

| Component | Trust Level | Reasoning |
|---|---|---|
| Browser (user's) | Trusted | Encryption runs here. If this is compromised, all bets are off. |
| Server / database | Untrusted | Designed to function correctly without trusting it with secrets. |
| Network | Untrusted | HTTPS mitigates most threats; GCM authentication tag catches tampering. |
| Third-party scripts | Untrusted | CSP headers restrict what scripts can run. |

---

## Threats

### Protected

**Database breach**
The database contains only ciphertext, salts, and IVs. Without the user's password, none of this is recoverable. An attacker with full database read access gains nothing useful.

**Server compromise (code injection, RCE)**
Even with arbitrary code execution on the server, an attacker cannot read notes. The encryption key is never transmitted to or derived on the server.

**Network interception**
HTTPS provides transport security. AES-GCM's authentication tag additionally ensures that any ciphertext modification is detected during decryption.

**Weak password brute-force (offline)**
PBKDF2 with 310,000 iterations raises the cost of offline brute-force attacks by roughly 310,000x compared to no KDF. For passwords with reasonable entropy (12+ characters, mixed), this is effectively infeasible with current hardware.

**User enumeration on login**
The `/auth/salt` endpoint returns a deterministic fake salt for non-existent emails to prevent confirming whether an email is registered.

---

### Partially Mitigated

**Weak user passwords**
We enforce minimum length and warn on weak passwords via zxcvbn analysis. However, we cannot force users to pick good passwords. A password of "abc123" with PBKDF2 is still breakable.

*Mitigation:* Password strength UI, warning on registration.

**Session token theft (XSS)**
Access tokens are stored in memory (not localStorage), making them inaccessible to XSS attacks. Refresh tokens are also memory-only. However, XSS that runs synchronously in the same JS context can still read in-memory values.

*Mitigation:* CSP headers, memory-only storage, short-lived access tokens (15 min).

---

### Out of Scope

**Compromised browser or OS**
If the user's browser is compromised — via a malicious extension, a browser exploit, or an OS-level keylogger — the attacker can intercept the decrypted note content or the password as it's typed. This is outside the threat model of any client-side encryption system.

**Coercion or legal compulsion**
We cannot protect users from being forced to reveal their passwords. We have no way to access encrypted content ourselves.

**Physical device access**
If an attacker has physical access to an unlocked device, they can access any in-memory state. Full-disk encryption at the OS level is recommended.

**Supply chain attacks**
A compromised npm package or CDN asset could inject malicious code. We minimize external dependencies and recommend self-hosting or verifying build artifacts.

---

## Cryptographic Assumptions

- AES-256-GCM is cryptographically sound (no known practical breaks as of 2024)
- PBKDF2-SHA256 is an acceptable KDF for password-derived keys (Argon2 would be stronger; considered for future upgrade)
- Web Crypto API implementation in major browsers is correct and trustworthy
- Random IV generation via `crypto.getRandomValues()` produces cryptographically secure random numbers

---

## Known Limitations

- **No forward secrecy per-note**: All notes are encrypted with a key derived from the same password. A password change does not re-encrypt existing notes without explicit key rotation (planned feature).
- **No audit trail for note access**: The server logs auth events but not note fetch events. A compromised server could silently log encrypted blobs without detection.
- **Single-key architecture**: All notes share one encryption key derived from the master password. Asymmetric per-note keys (planned for secure sharing) would isolate compromise.
- **No third-party audit**: This project has not undergone a professional security audit.

---

## Reporting Vulnerabilities

See [SECURITY.md](../SECURITY.md) for responsible disclosure guidelines.
