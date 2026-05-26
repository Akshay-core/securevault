import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Shield, ExternalLink, Github, Globe, Linkedin } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { session, clearSession } = useAuthStore()

  function handleLogout() {
    clearSession()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <header className="border-b border-surface-3 bg-surface-1/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="btn-ghost p-2">
            <ArrowLeft size={16} />
          </button>
          <span className="font-medium text-sm text-ink-primary">Settings</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Account */}
        <section className="glass-card p-6">
          <h2 className="font-display font-700 text-ink-primary mb-4 flex items-center gap-2">
            <User size={16} className="text-accent" />
            Account
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-surface-2 rounded-lg px-4 py-3">
              <span className="text-xs text-ink-secondary">Email</span>
              <span className="text-xs font-mono text-ink-primary">{session?.email}</span>
            </div>
            <div className="flex items-center justify-between bg-surface-2 rounded-lg px-4 py-3">
              <span className="text-xs text-ink-secondary">User ID</span>
              <span className="text-xs font-mono text-ink-tertiary">{session?.userId.slice(0, 16)}…</span>
            </div>
            <div className="flex items-center justify-between bg-surface-2 rounded-lg px-4 py-3">
              <span className="text-xs text-ink-secondary">Session since</span>
              <span className="text-xs font-mono text-ink-tertiary">
                {session?.createdAt ? new Date(session.createdAt).toLocaleTimeString() : '—'}
              </span>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="glass-card p-6">
          <h2 className="font-display font-700 text-ink-primary mb-4 flex items-center gap-2">
            <Shield size={16} className="text-accent" />
            Security
          </h2>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/security')}
              className="w-full flex items-center justify-between bg-surface-2 hover:bg-surface-3
                         rounded-lg px-4 py-3 transition-colors text-left"
            >
              <span className="text-sm text-ink-primary">Security Center</span>
              <ExternalLink size={13} className="text-ink-tertiary" />
            </button>
          </div>
        </section>

        {/* About */}
        <section className="glass-card p-6">
          <h2 className="font-display font-700 text-ink-primary mb-1">About SecureVault</h2>
          <p className="text-xs text-ink-tertiary mb-4">v1.0.0 · MIT License</p>
          <p className="text-sm text-ink-secondary leading-relaxed mb-4">
            SecureVault is engineered with a focus on privacy, zero-knowledge architecture,
            and modern client-side cryptography. Every note is encrypted before it leaves your browser.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: Globe, label: 'Portfolio', href: 'https://akshay.fruvvi.com' },
              { icon: Github, label: 'GitHub', href: 'https://github.com/Akshay-core' },
              { icon: Linkedin, label: 'LinkedIn', href: 'https://linkedin.com/in/akshay-tb-791bb4372' },
            ].map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 btn-ghost text-xs border border-surface-4 rounded-lg px-3 py-2">
                <link.icon size={12} />
                {link.label}
                <ExternalLink size={10} className="text-ink-disabled" />
              </a>
            ))}
          </div>
        </section>

        {/* Danger zone */}
        <section className="border border-danger/20 rounded-xl p-6">
          <h2 className="font-display font-700 text-danger mb-4">Danger Zone</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink-primary font-medium">Sign out</p>
                <p className="text-xs text-ink-tertiary mt-0.5">
                  Clears encryption key from memory. You'll need your password to log back in.
                </p>
              </div>
              <button onClick={handleLogout}
                className="flex-shrink-0 text-sm text-danger border border-danger/30
                           hover:bg-danger/10 px-4 py-2 rounded-lg transition-colors">
                Sign out
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
