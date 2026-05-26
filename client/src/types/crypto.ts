// crypto.ts — Types for the encryption layer

export interface EncryptedPayload {
  ciphertext: string  // base64-encoded AES-GCM ciphertext
  iv: string          // base64-encoded 96-bit IV
}

export interface EncryptedNote {
  id: string
  encryptedTitle: EncryptedPayload
  encryptedContent: EncryptedPayload
  encryptedTags: EncryptedPayload
  salt: string        // base64, stored per-note for future key rotation support
  createdAt: string
  updatedAt: string
  userId: string
}

// Decrypted view — this only ever exists in browser memory
export interface DecryptedNote {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

// What the server stores and returns — no plaintext
export interface NoteRecord {
  id: string
  encrypted_title: string   // serialized EncryptedPayload
  encrypted_content: string
  encrypted_tags: string
  salt: string
  created_at: string
  updated_at: string
  user_id: string
}

// Auth types
export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface UserSession {
  userId: string
  email: string
  salt: string      // needed client-side for key derivation
  createdAt: string
}

// Session management
export interface DeviceSession {
  id: string
  device_name: string
  ip_address: string
  created_at: string
  last_active: string
  is_current: boolean
}
