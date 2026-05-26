import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Shield, Monitor, Smartphone, Clock,
  Trash2, AlertTriangle, Lock, CheckCircle2, RotateCcw
} from 'lucide-react'
import { sessionApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { formatDistanceToNow } from 'date-fns'
import type { DeviceSession } from '@/types/crypto'

export default function SecurityPage() {
  const navigate = useNavigate()
  const { session } = useAuthStore()
  const [sessions, setSessions] = useState<DeviceSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)

  useEffect(() => {
    sessionApi.list()
      .then((res) => setSessions(res.data as DeviceSession[]))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  async function revokeSession(id: string) {
    setRevoking(id)
    try {
      await sessionApi.revoke(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setRevoking(null)
    }
  }

  async function revokeAll() {
    if (!window.confirm('Revoke all other sessions? You will need to log in again on other devices.')) return
    try {
      await sessionApi.revokeAll()
      setSessions((prev) => prev.filter((s) => s.is_current))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <header className="border-b border-surface-3 bg-surface-1/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="btn-ghost p-2">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-accent" />
            <span className="font-medium text-sm text-ink-primary">Security Center</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Encryption status */}
        <section className="glass-card p-6">
          <h2 className="font-display font-700 text-ink-primary mb-4 flex items-center gap-2">
            <Lock size={16} className="text-accent" />
            Encryption Status
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Encryption algorithm', value: 'AES-256-GCM', ok: true },
              { label: 'Key derivation', value: 'PBKDF2-SHA256', ok: true },
              { label: 'Iterations', value: '310,000', ok: true },
              { label: 'Key storage', value: 'In-memory only', ok: true },
              { label: 'Server knowledge', value: 'Zero (ciphertext only)', ok: true },
              { label: 'Transport', value: 'HTTPS enforced', ok: true },
            ].map((item) => (
              <div key={item.label}
                className="flex items-center justify-between bg-surface-2 rounded-lg px-4 py-3">
                <span className="text-xs text-ink-secondary">{item.label}</span>
                <span className="flex items-center gap-1.5 text-xs font-mono text-accent">
                  <CheckCircle2 size={11} />
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Active sessions */}
        <section className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-700 text-ink-primary flex items-center gap-2">
              <Monitor size={16} className="text-accent" />
              Active Sessions
            </h2>
            {sessions.filter((s) => !s.is_current).length > 0 && (
              <button
                onClick={revokeAll}
                className="btn-ghost text-xs text-danger hover:text-danger flex items-center gap-1"
              >
                <RotateCcw size={12} />
                Revoke all others
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-ink-tertiary text-center py-6">No sessions found.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id}
                  className={`flex items-center justify-between rounded-lg px-4 py-3 border
                    ${s.is_current
                      ? 'bg-accent/5 border-accent/20'
                      : 'bg-surface-2 border-surface-3'
                    }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                      ${s.is_current ? 'bg-accent/10' : 'bg-surface-3'}`}>
                      {s.device_name.toLowerCase().includes('mobile')
                        ? <Smartphone size={14} className={s.is_current ? 'text-accent' : 'text-ink-tertiary'} />
                        : <Monitor size={14} className={s.is_current ? 'text-accent' : 'text-ink-tertiary'} />
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-ink-primary font-medium">{s.device_name}</span>
                        {s.is_current && (
                          <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                            This device
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-ink-tertiary">{s.ip_address}</span>
                        <span className="flex items-center gap-1 text-xs text-ink-tertiary">
                          <Clock size={10} />
                          {formatDistanceToNow(new Date(s.last_active), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!s.is_current && (
                    <button
                      onClick={() => revokeSession(s.id)}
                      disabled={revoking === s.id}
                      className="btn-ghost p-2 text-ink-tertiary hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Threat model summary */}
        <section className="glass-card p-6">
          <h2 className="font-display font-700 text-ink-primary mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-warning" />
            Threat Model
          </h2>
          <div className="space-y-3">
            <ThreatRow
              threat="Server compromise / database breach"
              status="protected"
              detail="Only ciphertext stored. Server has no key."
            />
            <ThreatRow
              threat="Network interception (MITM)"
              status="protected"
              detail="HTTPS + GCM authentication tag detects tampering."
            />
            <ThreatRow
              threat="Weak password brute-force"
              status="partial"
              detail="PBKDF2 (310k iterations) raises cost. Weak passwords remain vulnerable."
            />
            <ThreatRow
              threat="Compromised browser / malicious extension"
              status="not-protected"
              detail="Encryption runs inside the browser. A compromised browser context can read memory."
            />
            <ThreatRow
              threat="Physical device access"
              status="not-protected"
              detail="Out of scope. Use full-disk encryption on your OS."
            />
          </div>
          <p className="text-xs text-ink-tertiary mt-4 leading-relaxed">
            Documenting limitations is part of responsible security engineering.
            No system is unconditionally secure.
          </p>
        </section>

      </main>
    </div>
  )
}

function ThreatRow({
  threat, status, detail,
}: {
  threat: string
  status: 'protected' | 'partial' | 'not-protected'
  detail: string
}) {
  const colors = {
    protected:     { dot: 'bg-accent',   label: 'Protected',     text: 'text-accent' },
    partial:       { dot: 'bg-warning',  label: 'Partial',       text: 'text-warning' },
    'not-protected': { dot: 'bg-danger', label: 'Out of scope',  text: 'text-danger' },
  }
  const c = colors[status]

  return (
    <div className="bg-surface-2 rounded-lg p-4">
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="text-sm text-ink-primary font-medium">{threat}</span>
        <span className={`flex items-center gap-1.5 text-xs font-mono flex-shrink-0 ${c.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
          {c.label}
        </span>
      </div>
      <p className="text-xs text-ink-tertiary leading-relaxed">{detail}</p>
    </div>
  )
}
