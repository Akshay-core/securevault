import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react'
import { authApi } from '@/services/api'
import { deriveEncryptionKey, deriveAuthKey } from '@/crypto/keygen'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Step 1: Fetch the user's salt from the server (public, no auth needed)
      // We need the salt before we can derive keys
      const saltRes = await authApi.getSalt(email)
      const { salt } = saltRes.data

      // Step 2: Derive the auth key (separate from encryption key)
      // We send this to the server for verification, not the real password
      const authKey = await deriveAuthKey(password, salt)

      // Step 3: Login with email + auth key verifier
      const loginRes = await authApi.login(email, authKey)
      const { access_token, refresh_token, user_id } = loginRes.data

      // Step 4: Derive the encryption key — happens after auth, never sent to server
      const encryptionKey = await deriveEncryptionKey(password, salt)

      // Step 5: Store session in memory
      setSession(
        { userId: user_id, email, salt, createdAt: new Date().toISOString() },
        encryptionKey,
        { access: access_token, refresh: refresh_token }
      )

      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-0 bg-grid flex flex-col items-center justify-center px-4">

      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px]
                      bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/30
                            flex items-center justify-center">
              <ShieldCheck size={18} className="text-accent" />
            </div>
            <span className="font-display font-700 text-lg text-ink-primary">SecureVault</span>
          </Link>
          <h1 className="text-xl font-600 text-ink-primary">Welcome back</h1>
          <p className="text-sm text-ink-secondary mt-1">
            Your key is derived locally. We never see it.
          </p>
        </div>

        {/* Form */}
        <div className="glass-card p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base pr-10"
                  placeholder="Your master password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary
                             hover:text-ink-secondary transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-danger bg-danger/10 border border-danger/20
                             rounded-lg px-3 py-2 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <><Loader2 size={15} className="animate-spin" /> Deriving key…</>
              ) : (
                'Unlock vault'
              )}
            </button>
          </form>
        </div>

        {/* Security note */}
        <div className="mt-4 bg-surface-2 border border-surface-3 rounded-lg px-4 py-3">
          <p className="text-xs text-ink-tertiary leading-relaxed">
            <span className="text-accent font-medium">Zero-knowledge login:</span>{' '}
            Your password derives a key locally. Only an auth verifier is sent to the server —
            never the password or encryption key.
          </p>
        </div>

        <p className="text-center text-sm text-ink-secondary mt-6">
          No account?{' '}
          <Link to="/register" className="text-accent hover:text-accent-hover transition-colors">
            Create one
          </Link>
        </p>

        {/* Footer branding */}
        <p className="text-center text-xs text-ink-disabled mt-8">
          Designed &amp; engineered by{' '}
          <a href="https://akshay.fruvvi.com" target="_blank" rel="noreferrer"
             className="hover:text-ink-tertiary transition-colors">
            Akshay
          </a>
        </p>
      </div>
    </div>
  )
}
