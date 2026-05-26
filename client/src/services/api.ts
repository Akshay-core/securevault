/**
 * api.ts
 *
 * Centralized API client. All server communication goes through here.
 * Handles auth token injection, refresh token rotation, and error normalization.
 *
 * The refresh token flow:
 * 1. Request fails with 401
 * 2. Interceptor fires, calls /auth/refresh with stored refresh token
 * 3. On success, updates access token and retries original request
 * 4. On failure (refresh expired), clears session and redirects to login
 */

import axios, { type AxiosError } from 'axios'
import { useAuthStore, getRefreshToken, setAccessToken } from '@/store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Inject access token into every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401s with refresh token rotation
let isRefreshing = false
let failedQueue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = []

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined

    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(normalizeError(error))
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers!.Authorization = `Bearer ${token}`
        return apiClient(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const refreshToken = getRefreshToken()
      if (!refreshToken) throw new Error('No refresh token')

      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      })

      setAccessToken(data.access_token)
      failedQueue.forEach((p) => p.resolve(data.access_token))
      failedQueue = []

      original.headers!.Authorization = `Bearer ${data.access_token}`
      return apiClient(original)
    } catch (refreshError) {
      failedQueue.forEach((p) => p.reject(refreshError))
      failedQueue = []
      useAuthStore.getState().clearSession()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

function normalizeError(error: AxiosError): Error {
  const message =
    (error.response?.data as { detail?: string })?.detail ||
    error.message ||
    'An unexpected error occurred'
  return new Error(message)
}

// --- Typed API methods ---

export const authApi = {
  register: (email: string, salt: string, verifier: string) =>
    apiClient.post('/auth/register', { email, salt, verifier }),

  login: (email: string, verifier: string) =>
    apiClient.post<{ access_token: string; refresh_token: string; salt: string; user_id: string; email: string }>(
      '/auth/login', { email, verifier }
    ),

  logout: () => apiClient.post('/auth/logout'),

  getSalt: (email: string) =>
    apiClient.get<{ salt: string }>(`/auth/salt?email=${encodeURIComponent(email)}`),
}

export const notesApi = {
  list: () => apiClient.get('/notes'),
  create: (payload: object) => apiClient.post('/notes', payload),
  update: (id: string, payload: object) => apiClient.put(`/notes/${id}`, payload),
  delete: (id: string) => apiClient.delete(`/notes/${id}`),
}

export const sessionApi = {
  list: () => apiClient.get('/sessions'),
  revoke: (sessionId: string) => apiClient.delete(`/sessions/${sessionId}`),
  revokeAll: () => apiClient.delete('/sessions/all'),
}
