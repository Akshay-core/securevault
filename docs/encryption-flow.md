# SecureVault — Encryption Flow

*Author: Akshay*

Step-by-step walkthrough of every cryptographic operation in SecureVault.

---

## Registration

```
1. User enters email + password in browser

2. generateSalt()
   → crypto.getRandomValues(32 bytes)
   → base64 encode
   → Result: unique 256-bit salt for this user

3. deriveAuthKey(password, salt)
   → PBKDF2-SHA256(password + ":auth", salt, 310000 iterations, 256 bits)
   → base64 encode
   → This is the "verifier" — what the server uses for authentication

4. POST /api/auth/register { email, salt, verifier }
   → Server stores: email, salt, verifier
   → Server never sees: the actual password

5. deriveEncryptionKey(password, salt)
   → PBKDF2-SHA256(password, salt, 310000 iterations, 256 bits)
   → Returns: non-extractable CryptoKey (AES-GCM)
   → This key NEVER leaves the browser
```

---

## Login

```
1. User enters email + password

2. GET /api/auth/salt?email={email}
   → Server returns: stored salt for this user

3. deriveAuthKey(password, salt)
   → Same PBKDF2 derivation as registration
   → Produces the same verifier if password is correct

4. POST /api/auth/login { email, verifier }
   → Server compares verifier using hmac.compare_digest()
   → Constant-time comparison prevents timing attacks
   → On match: returns access_token + refresh_token

5. deriveEncryptionKey(password, salt)
   → Derives the encryption key (same as at registration)
   → Stored in Zustand state in-memory ONLY

6. Session established. Key lives in memory until logout.
```

---

## Writing a Note

```
1. User types note content in editor

2. After AUTOSAVE_DELAY_MS (1500ms) of inactivity:

3. encryptField(title, key)
   → IV = crypto.getRandomValues(12 bytes)
   → ciphertext = AES-256-GCM(title, key, IV)
   → Result: { ciphertext: base64, iv: base64 }

4. encryptNote(content, key)
   → Same process, new random IV
   → IV uniqueness per operation is CRITICAL for GCM security

5. encryptField(JSON.stringify(tags), key)
   → Tags are also zero-knowledge

6. PUT /api/notes/{id} {
     encrypted_title: JSON.stringify({ciphertext, iv}),
     encrypted_content: JSON.stringify({ciphertext, iv}),
     encrypted_tags: JSON.stringify({ciphertext, iv}),
     salt: user.salt
   }
   → Server stores opaque blobs. Cannot read any field.

7. UI updates with decrypted note (local state, no re-fetch needed)
```

---

## Reading Notes

```
1. GET /api/notes
   → Returns array of NoteRecord (all ciphertext)

2. For each NoteRecord:
   decryptNote(JSON.parse(encrypted_content), key)
   → IV extracted from stored payload
   → AES-256-GCM.decrypt(ciphertext, key, IV)
   → GCM authentication tag VERIFIED automatically
   → If tag mismatch: throws DecryptionError (tamper detected)

3. Decrypted notes stored in Zustand (memory only)

4. Search runs over decrypted content — all local, no server involved
```

---

## Why IV Uniqueness Matters

AES-GCM is a stream cipher in construction. If the same (Key, IV) pair is ever reused to encrypt two different plaintexts, an attacker can XOR the two ciphertexts to eliminate the keystream and recover plaintext. This is catastrophic.

SecureVault generates a fresh `crypto.getRandomValues(12 bytes)` IV for every encryption operation — every note save, every field, every time. With a 96-bit IV and a secure RNG, the probability of collision for 2^32 operations is approximately 2^(-32), which is considered negligible in practice.

---

## Key Non-Extractability

The CryptoKey object produced by `deriveEncryptionKey()` is created with `extractable: false`. This means:

- `crypto.subtle.exportKey()` will throw a `DOMException`
- The raw key bytes are inaccessible to JavaScript
- The key lives in the browser's internal crypto engine

This doesn't prevent all attacks (a compromised browser context still controls the API calls), but it raises the bar significantly compared to storing key bytes in a plain JS variable.
