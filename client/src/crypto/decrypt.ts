/**
 * decrypt.ts
 *
 * Counterpart to encrypt.ts. Decryption also happens entirely client-side.
 * The server never participates in this operation.
 *
 * GCM authentication: if the ciphertext or IV has been tampered with,
 * subtle.decrypt() will throw a DOMException. We surface this as a
 * structured error so the UI can handle it appropriately.
 */

import { base64ToBuffer } from './encrypt'
import type { EncryptedPayload } from '@/types/crypto'

/**
 * Decrypts an EncryptedPayload back to a plaintext string.
 * Throws DecryptionError if authentication fails (data was tampered with).
 */
export async function decryptNote(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<string> {
  try {
    const cipherBuffer = base64ToBuffer(payload.ciphertext)
    const iv = base64ToBuffer(payload.iv)

    const plaintextBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      key,
      cipherBuffer
    )

    return new TextDecoder().decode(plaintextBuffer)
  } catch (err) {
    // GCM tag mismatch means either wrong key or tampered data
    throw new DecryptionError(
      'Decryption failed. The key may be incorrect or the data may be corrupted.',
      err
    )
  }
}

export async function decryptField(
  payload: EncryptedPayload,
  key: CryptoKey
): Promise<string> {
  return decryptNote(payload, key)
}

export class DecryptionError extends Error {
  cause: unknown
  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'DecryptionError'
    this.cause = cause
  }
}
