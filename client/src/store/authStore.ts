/**
 * authStore.ts
 *
 * Global auth state. Critically, we store the CryptoKey object here
 * in memory — it never touches localStorage or sessionStorage.
 * When the user logs out or closes the tab, the key is gone.
 *
 * This is intentional: it means every session requires re-entering
 * the password, which re-derives the key. The server has no way to
 * give us the key because it never had it.
 */

import { create } from 'zustand'
import type { UserSession } from '@/types/crypto'

interface AuthState {
  isAuthenticated: boolean
  session: UserSession | null
  encryptionKey: CryptoKey | null  // In-memory only, never persisted

  setSession: (session: UserSession, key: CryptoKey, tokens: { access: string; refresh: string }) => void
  clearSession: () => void
  getAccessToken: () => string | null
}

// We store tokens in memory too — avoids XSS risks of localStorage for access tokens.
// Trade-off: tokens are lost on tab close, requiring re-login. Acceptable for a
// security-focused product.
let _accessToken: string | null = null
let _refreshToken: string | null = null

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  session: null,
  encryptionKey: null,

  setSession: (session, key, tokens) => {
    _accessToken = tokens.access
    _refreshToken = tokens.refresh
    set({ isAuthenticated: true, session, encryptionKey: key })
  },

  clearSession: () => {
    _accessToken = null
    _refreshToken = null
    set({ isAuthenticated: false, session: null, encryptionKey: null })
  },

  getAccessToken: () => _accessToken,
}))

// Export refresh token accessor for the API service interceptor
export const getRefreshToken = () => _refreshToken
export const setAccessToken = (token: string) => { _accessToken = token }
