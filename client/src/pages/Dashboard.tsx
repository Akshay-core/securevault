import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Plus, Search, LogOut, Settings, Lock,
  FileText, Tag, Clock, Shield
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNotesStore } from '@/store/notesStore'
import { fetchAndDecryptNotes, saveNote } from '@/services/notesService'
import { formatDistanceToNow } from 'date-fns'
import type { DecryptedNote } from '@/types/crypto'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { session, encryptionKey, clearSession } = useAuthStore()
  const { notes, setNotes, setLoading, isLoading, searchQuery, setSearchQuery, getFilteredNotes } = useNotesStore()
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (!encryptionKey) return
    setLoading(true)
    fetchAndDecryptNotes(encryptionKey)
      .then(setNotes)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [encryptionKey])

  async function createNote() {
    if (!encryptionKey || !session) return
    setIsCreating(true)
    try {
      const newNote = await saveNote(
        { title: 'Untitled', content: '', tags: [] },
        encryptionKey,
        session.salt
      )
      setNotes([newNote, ...notes])
      navigate(`/note/${newNote.id}`)
    } catch (err) {
      console.error('Failed to create note:', err)
    } finally {
      setIsCreating(false)
    }
  }

  function handleLogout() {
    clearSession()
    useNotesStore.getState().clearAll()
    navigate('/login')
  }

  const filtered = getFilteredNotes()

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">

      {/* Top nav */}
      <header className="border-b border-surface-3 bg-surface-1/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/30
                            flex items-center justify-center">
              <ShieldCheck size={14} className="text-accent" />
            </div>
            <span className="font-display font-700 text-ink-primary text-sm">SecureVault</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="badge-encrypted mr-2">
              <Lock size={10} />
              Encrypted
            </span>
            <button
              onClick={() => navigate('/security')}
              className="btn-ghost flex items-center gap-1.5"
            >
              <Shield size={15} />
              <span className="hidden sm:inline text-xs">Security</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="btn-ghost"
            >
              <Settings size={15} />
            </button>
            <button
              onClick={handleLogout}
              className="btn-ghost text-ink-tertiary hover:text-danger"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">

        {/* Search + Create */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your notes…"
              className="input-base pl-9"
            />
          </div>
          <button
            onClick={createNote}
            disabled={isCreating}
            className="btn-primary flex items-center gap-2 flex-shrink-0"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">New note</span>
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Notes', value: notes.length, icon: FileText },
            { label: 'Encrypted', value: notes.length, icon: Lock },
            { label: 'Tags', value: [...new Set(notes.flatMap(n => n.tags))].length, icon: Tag },
          ].map(stat => (
            <div key={stat.label} className="glass-card px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <stat.icon size={15} className="text-accent" />
              </div>
              <div>
                <div className="text-lg font-display font-700 text-ink-primary leading-none">
                  {stat.value}
                </div>
                <div className="text-xs text-ink-tertiary mt-0.5">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Notes grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-sm text-ink-tertiary font-mono">Decrypting notes…</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasSearch={!!searchQuery} onCreate={createNote} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function NoteCard({ note }: { note: DecryptedNote }) {
  const navigate = useNavigate()
  const preview = note.content.replace(/[#*`_\[\]]/g, '').slice(0, 120)

  return (
    <button
      onClick={() => navigate(`/note/${note.id}`)}
      className="glass-card p-5 text-left hover:border-surface-5 hover:bg-surface-3
                 transition-all duration-150 group animate-fade-in"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-ink-primary text-sm leading-snug line-clamp-1 group-hover:text-accent transition-colors">
          {note.title || 'Untitled'}
        </h3>
        <Lock size={11} className="text-accent/60 flex-shrink-0 mt-0.5" />
      </div>

      {preview && (
        <p className="text-xs text-ink-tertiary leading-relaxed line-clamp-3 mb-3">
          {preview}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto">
        {note.tags.length > 0 ? (
          <div className="flex gap-1 flex-wrap">
            {note.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-xs bg-surface-3 text-ink-tertiary px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
            {note.tags.length > 2 && (
              <span className="text-xs text-ink-disabled">+{note.tags.length - 2}</span>
            )}
          </div>
        ) : <div />}

        <div className="flex items-center gap-1 text-ink-disabled text-xs">
          <Clock size={10} />
          {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
        </div>
      </div>
    </button>
  )
}

function EmptyState({ hasSearch, onCreate }: { hasSearch: boolean; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-surface-4
                      flex items-center justify-center mb-4">
        {hasSearch ? <Search size={22} className="text-ink-tertiary" /> : <Lock size={22} className="text-accent/60" />}
      </div>
      <h3 className="text-ink-primary font-medium mb-1.5">
        {hasSearch ? 'No notes match your search' : 'Your vault is empty'}
      </h3>
      <p className="text-sm text-ink-tertiary mb-6 max-w-xs">
        {hasSearch
          ? 'Try different keywords — search runs across decrypted content locally.'
          : 'Create your first encrypted note. It never leaves your device as plaintext.'}
      </p>
      {!hasSearch && (
        <button onClick={onCreate} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Create first note
        </button>
      )}
    </div>
  )
}
