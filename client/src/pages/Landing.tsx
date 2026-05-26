import { Link } from 'react-router-dom'
import { ShieldCheck, Lock, Zap, Eye, ArrowRight, Github } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-0 bg-grid overflow-x-hidden">

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]
                        bg-accent/5 rounded-full blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30
                          flex items-center justify-center">
            <ShieldCheck size={16} className="text-accent" />
          </div>
          <span className="font-display font-700 text-ink-primary tracking-tight">
            SecureVault
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/Akshay-core/securevault"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost flex items-center gap-2"
          >
            <Github size={15} />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <Link to="/login" className="btn-ghost">Sign in</Link>
          <Link to="/register" className="btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-20 pb-32 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-surface-2 border border-surface-4
                        rounded-full px-4 py-1.5 text-xs text-ink-secondary mb-8 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-slow" />
          AES-256-GCM · Zero-Knowledge · Web Crypto API
        </div>

        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-800 text-ink-primary
                       leading-[1.05] tracking-tight mb-6 animate-slide-up">
          Your notes.{' '}
          <span className="text-accent">Your keys.</span>
          <br />Your data.
        </h1>

        <p className="text-lg text-ink-secondary max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
          SecureVault encrypts everything in your browser before it reaches our servers.
          We store only ciphertext — even we cannot read your notes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in">
          <Link to="/register"
            className="btn-primary flex items-center gap-2 text-base px-7 py-3">
            Start encrypting <ArrowRight size={16} />
          </Link>
          <a href="#how-it-works" className="btn-ghost text-base px-7 py-3">
            How it works
          </a>
        </div>

        {/* Tagline */}
        <p className="mt-8 text-xs text-ink-tertiary font-mono animate-fade-in">
          Plaintext never leaves your device.
        </p>
      </section>

      {/* Feature Grid */}
      <section className="relative z-10 px-6 py-20 max-w-6xl mx-auto" id="how-it-works">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl font-700 text-ink-primary mb-3">
            Security by design, not by promise
          </h2>
          <p className="text-ink-secondary max-w-xl mx-auto">
            Most apps claim to be secure. SecureVault is architecturally incapable of reading your data.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="glass-card p-6 hover:border-surface-5 transition-colors duration-200">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <f.icon size={20} className="text-accent" />
              </div>
              <h3 className="font-medium text-ink-primary mb-2">{f.title}</h3>
              <p className="text-sm text-ink-secondary leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Encryption flow visualization */}
      <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto">
        <div className="glass-card p-8">
          <h3 className="font-display font-700 text-ink-primary text-xl mb-8 text-center">
            Zero-Knowledge Encryption Flow
          </h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {flowSteps.map((step, i) => (
              <div key={step.label} className="flex flex-col sm:flex-row items-center gap-4">
                <div className="text-center">
                  <div className={`text-xs font-mono mb-1 ${step.secure ? 'text-accent' : 'text-ink-tertiary'}`}>
                    {step.layer}
                  </div>
                  <div className="bg-surface-3 border border-surface-4 rounded-lg px-4 py-2.5 text-sm text-ink-primary font-medium">
                    {step.label}
                  </div>
                  {step.note && (
                    <div className="text-xs text-ink-tertiary mt-1">{step.note}</div>
                  )}
                </div>
                {i < flowSteps.length - 1 && (
                  <ArrowRight size={16} className="text-surface-5 flex-shrink-0 rotate-90 sm:rotate-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-20 text-center max-w-2xl mx-auto">
        <h2 className="font-display text-3xl font-700 text-ink-primary mb-4">
          Own your data completely
        </h2>
        <p className="text-ink-secondary mb-8">
          Free, open source, and designed for people who think about where their data actually goes.
        </p>
        <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3">
          Create your vault <ArrowRight size={16} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-surface-3 px-8 py-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-ink-tertiary">
            <ShieldCheck size={14} className="text-accent" />
            <span>SecureVault v1.0</span>
          </div>
          <div className="text-xs text-ink-tertiary text-center">
            Designed &amp; engineered by{' '}
            <a href="https://akshay.fruvvi.com" target="_blank" rel="noreferrer"
               className="text-ink-secondary hover:text-accent transition-colors">
              Akshay
            </a>
            {' · '}
            <a href="https://github.com/Akshay-core" target="_blank" rel="noreferrer"
               className="text-ink-secondary hover:text-accent transition-colors">
              GitHub
            </a>
          </div>
          <div className="text-xs text-ink-tertiary">MIT License</div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: Lock,
    title: 'AES-256-GCM Encryption',
    description: 'Industry-standard authenticated encryption. The GCM mode detects any tampering with your data in transit.',
  },
  {
    icon: ShieldCheck,
    title: 'Zero-Knowledge Architecture',
    description: 'Keys are derived from your password in the browser using PBKDF2. The server stores only opaque ciphertext.',
  },
  {
    icon: Eye,
    title: 'Server Blindness',
    description: 'We cannot read your notes. Not because of policy — because we architecturally never receive the plaintext.',
  },
  {
    icon: Zap,
    title: 'Offline-First Sync',
    description: 'Notes cache encrypted in IndexedDB. Work offline, sync when connected. Your key never leaves the device.',
  },
  {
    icon: ShieldCheck,
    title: 'Session Management',
    description: 'View active devices, revoke sessions remotely, and audit login history from your security dashboard.',
  },
  {
    icon: Lock,
    title: 'Open Source',
    description: 'Audit every line. The security guarantees are in the code, not a marketing claim.',
  },
]

const flowSteps = [
  { layer: 'Browser', label: 'Your Password', note: 'Never sent', secure: true },
  { layer: 'PBKDF2', label: 'Key Derivation', note: '310k iterations', secure: true },
  { layer: 'AES-256-GCM', label: 'Encrypt Note', note: 'In browser', secure: true },
  { layer: 'Network', label: 'Ciphertext Only', note: 'No plaintext', secure: false },
  { layer: 'Server', label: 'Store Blob', note: 'Cannot decrypt', secure: false },
]
