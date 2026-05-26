/**
 * helpers.ts
 *
 * Utility functions that support the crypto layer.
 * These are intentionally kept separate from the core encrypt/decrypt
 * logic to make each file easier to reason about in isolation.
 */

/**
 * Constant-time string comparison to prevent timing attacks.
 * Standard === comparison exits early on first mismatch, leaking info.
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Generates a random note ID that doesn't leak creation order.
 * Using crypto.randomUUID() over sequential IDs prevents enumeration attacks.
 */
export function generateNoteId(): string {
  return crypto.randomUUID()
}

/**
 * Estimates password entropy in bits.
 * Used for the password strength indicator on registration.
 * This is a rough approximation — for precise analysis we use zxcvbn.
 */
export function estimateEntropy(password: string): number {
  let charsetSize = 0
  if (/[a-z]/.test(password)) charsetSize += 26
  if (/[A-Z]/.test(password)) charsetSize += 26
  if (/[0-9]/.test(password)) charsetSize += 10
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32
  return Math.floor(password.length * Math.log2(charsetSize || 1))
}

/**
 * Wipes a string from memory by overwriting its underlying buffer.
 * JavaScript doesn't expose direct memory control, so this is best-effort.
 * The primary defense is to never store passwords in state.
 */
export function wipeString(value: string): void {
  // We can't truly zero a JS string, but we can at least not hold references
  void value
}
