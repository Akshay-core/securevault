/**
 * keygen.ts
 *
 * Key derivation is the most security-critical part of the system.
 * This module derives an AES-256-GCM CryptoKey from a user password
 * using PBKDF2-SHA256 with 310,000 iterations (NIST recommended minimum
 * as of 2023 is 600,000 for SHA-256; we use 310k for a UX/security balance
 * and document this tradeoff explicitly).
 *
 * The derived key is:
 * - Never stored anywhere (not localStorage, not memory beyond the session)
 * - Re-derived fresh on every login from the user's password
 * - Held in a non-extractable CryptoKey so the raw bytes can't be read
 *   even by JavaScript running in the same page
 *
 * Tradeoff documented: non-extractable keys cannot be exported for backup,
 * which means password loss = data loss. This is an intentional design
 * choice aligned with the zero-knowledge threat model.
 */

import { bufferToBase64, base64ToBuffer } from './encrypt'

const PBKDF2_ITERATIONS = 310_000
const SALT_LENGTH = 32 // 256-bit salt

/**
 * Generates a cryptographically random salt.
 * A unique salt per user prevents rainbow table attacks.
 */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  return bufferToBase64(salt)
}

/**
 * Derives an AES-256-GCM CryptoKey from a password and salt.
 * The key is non-extractable — Web Crypto holds the bytes internally.
 *
 * This is the only function that should ever touch the user's raw password.
 * After this call, the password string should be discarded.
 */
export async function deriveEncryptionKey(
  password: string,
  saltBase64: string
): Promise<CryptoKey> {
  const salt = base64ToBuffer(saltBase64)
  const passwordBytes = new TextEncoder().encode(password)

  // Import password as raw key material for PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    'PBKDF2',
    false, // not extractable
    ['deriveKey']
  )

  // Derive the actual AES-GCM encryption key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable — raw key bytes never leave the crypto engine
    ['encrypt', 'decrypt']
  )
}

/**
 * Derives a separate key used only for auth token verification.
 * Keeping auth and encryption keys separate limits blast radius
 * if one key is ever compromised.
 */
export async function deriveAuthKey(
  password: string,
  saltBase64: string
): Promise<string> {
  const salt = base64ToBuffer(saltBase64)
  const passwordBytes = new TextEncoder().encode(password + ':auth') // domain separation

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    'PBKDF2',
    false,
    ['deriveBits']
  )

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  )

  return bufferToBase64(bits)
}
