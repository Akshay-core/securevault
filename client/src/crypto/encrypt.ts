/**
 * encrypt.ts
 *
 * AES-256-GCM encryption using the Web Crypto API.
 * This is the heart of SecureVault's zero-knowledge guarantee:
 * all encryption happens here, in the browser, before any data
 * is sent to the server.
 *
 * Design decisions:
 * - AES-256-GCM over AES-256-CBC: GCM provides authenticated encryption,
 *   meaning tampering with the ciphertext is detectable. CBC does not.
 * - 96-bit IVs: Recommended length for GCM. We generate a fresh one per
 *   encryption operation — never reuse IVs with the same key.
 * - We return IV alongside ciphertext because decryption requires it.
 *   The IV is not a secret; it just must be unique.
 */

import type { EncryptedPayload } from '@/types/crypto'

const GCM_IV_LENGTH = 12   // 96 bits — GCM standard
const GCM_TAG_LENGTH = 128 // authentication tag bits

/**
 * Encrypts a plaintext string using the provided CryptoKey.
 * Returns the ciphertext and IV, both base64-encoded for transport.
 */
export async function encryptNote(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(GCM_IV_LENGTH))
  const encoded = new TextEncoder().encode(plaintext)

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: GCM_TAG_LENGTH },
    key,
    encoded
  )

  return {
    ciphertext: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv),
  }
}

/**
 * Encrypts arbitrary metadata (tags, title) alongside content.
 * Same mechanism — title and tags are also zero-knowledge.
 */
export async function encryptField(
  value: string,
  key: CryptoKey
): Promise<EncryptedPayload> {
  return encryptNote(value, key)
}

// --- Helpers ---

export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
