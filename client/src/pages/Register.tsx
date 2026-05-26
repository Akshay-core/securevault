import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react'
import zxcvbn from 'zxcvbn'
import { authApi } from '@/services/api'
import { generateSalt, deriveEncryptionKey, deriveAuthKey } from '@/crypto/keygen'
import { useAuthStore } from '@/store/authStore'

const strengthLabels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong']
const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-accent', 'bg-accent']

export default function RegisterPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const strength = password ? zxcvbn(password) : null
  const strengthScore = strength?.score ?? 0

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (strengthScore < 2) {
      setError('Password is too weak. Use a longer, more complex passphrase.')
      return
    }

    setIsLoading(true)

    try {
      // Generate a unique salt for this user
      const salt = generateSalt()

      // Derive auth verifier — what we send to the server for future login verification
      const verifier = await deriveAuthKey(password, salt)

      // Register: server stores email, salt, and verifier (not the password)
      await authApi.register(email, salt, verifier)

      // Immediately log in after registration
      const loginRes = await authApi.login(email, verifier)
      const { access_token, refresh_token, user_id } = loginRes.data

      // Derive the actual encryption key (never sent to server)
      const encryptionKey = await deriveEncryptionKey(password, salt)

      setSession(
        { userId: user_id, email, salt, createdAt: new Date().toISOString() },
        encryptionKey,
        { access: access_token, refresh: refresh_token }
      )

      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-0 bg-grid flex flex-col items-center justify-center px-4">

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px]
                      bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/30
                            flex items-center justify-center">
              <ShieldCheck size={18} className="text-accent" />
            </div>
            <span className="font-display font-700 text-lg text-ink-primary">SecureVault</span>
          </Link>
          <h1 className="text-xl font-600 text-ink-primary">Create your vault</h1>
          <p className="text-sm text-ink-secondary mt-1">
            Choose a strong password — it encrypts everything.
          </p>
        </div>

        <div className="glass-card p-6">
          <form onSubmit={handleRegister} className="space-y-4">
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
                Master password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-base pr-10"
                  placeholder="Use a long, unique passphrase"
                  required
                  autoComplete="new-password"
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

              {/* Password strength meter */}
              {password && (
                <div className="mt-2 animate-fade-in">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strengthScore ? strengthColors[strengthScore] : 'bg-surface-4'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-ink-tertiary">
                      {strengthLabels[strengthScore]}
                    </span>
                    {strength?.feedback?.warning && (
                      <span className="text-xs text-warning flex items-center gap-1">
                        <AlertTriangle size={10} />
                        {strength.feedback.warning}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                Confirm password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`input-base ${
                  confirmPassword && confirmPassword !== password
                    ? 'border-danger focus:border-danger focus:ring-danger/20'
                    : ''
                }`}
                placeholder="Repeat your passphrase"
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="text-xs text-danger bg-danger/10 border border-danger/20
                             rounded-lg px-3 py-2 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email || !password || !confirmPassword}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <><Loader2 size={15} className="animate-spin" /> Setting up encryption…</>
              ) : (
                'Create vault'
              )}
            </button>
          </form>
        </div>

        {/* Warning */}
        <div className="mt-4 bg-warning/5 border border-warning/20 rounded-lg px-4 py-3">
          <div className="flex gap-2">
            <AlertTriangle size={14} className="text-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-ink-secondary leading-relaxed">
              <span className="text-warning font-medium">Important:</span>{' '}
              Your password is the only key to your data. If lost, your notes cannot be recovered —
              not by us, not by anyone.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-ink-secondary mt-6">
          Already have a vault?{' '}
          <Link to="/login" className="text-accent hover:text-accent-hover transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
