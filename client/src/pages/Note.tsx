import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Lock, Save, Trash2, Tag, X, Eye, Edit3, Loader2
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuthStore } from '@/store/authStore'
import { useNotesStore } from '@/store/notesStore'
import { saveNote } from '@/services/notesService'
import { notesApi } from '@/services/api'

const AUTOSAVE_DELAY_MS = 1500

export default function NotePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { encryptionKey, session } = useAuthStore()
  const { notes, upsertNote, removeNote } = useNotesStore()

  const note = notes.find((n) => n.id === id)

  const [title, setTitle] = useState(note?.title ?? '')
  const [content, setContent] = useState(note?.content ?? '')
  const [tags, setTags] = useState<string[]>(note?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [isDeleting, setIsDeleting] = useState(false)

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDirty = useRef(false)

  // Sync from store when note loads
  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setTags(note.tags)
    }
  }, [note?.id])

  const persistNote = useCallback(
    async (t: string, c: string, tg: string[]) => {
      if (!encryptionKey || !session || !id) return
      setSaveStatus('saving')
      try {
        const updated = await saveNote({ id, title: t, content: c, tags: tg }, encryptionKey, session.salt)
        upsertNote(updated)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('error')
      }
    },
    [encryptionKey, session, id]
  )

  // Trigger autosave on content change
  function scheduleAutosave(t: string, c: string, tg: string[]) {
    isDirty.current = true
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      persistNote(t, c, tg)
    }, AUTOSAVE_DELAY_MS)
  }

  function handleTitleChange(val: string) {
    setTitle(val)
    scheduleAutosave(val, content, tags)
  }

  function handleContentChange(val: string) {
    setContent(val)
    scheduleAutosave(title, val, tags)
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) {
      const next = [...tags, t]
      setTags(next)
      setTagInput('')
      scheduleAutosave(title, content, next)
    }
  }

  function removeTag(tag: string) {
    const next = tags.filter((t) => t !== tag)
    setTags(next)
    scheduleAutosave(title, content, next)
  }

  async function handleDelete() {
    if (!id || !window.confirm('Delete this note permanently?')) return
    setIsDeleting(true)
    try {
      await notesApi.delete(id)
      removeNote(id)
      navigate('/dashboard')
    } catch {
      setIsDeleting(false)
    }
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-secondary mb-4">Note not found or still loading.</p>
          <button onClick={() => navigate('/dashboard')} className="btn-ghost">
            Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-0 flex flex-col">

      {/* Toolbar */}
      <header className="border-b border-surface-3 bg-surface-1/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="btn-ghost p-2">
            <ArrowLeft size={16} />
          </button>

          <div className="flex-1" />

          {/* Save status */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {saveStatus === 'saving' && (
              <span className="text-ink-tertiary flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Encrypting…
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-accent flex items-center gap-1">
                <Lock size={12} /> Saved encrypted
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-danger">Save failed</span>
            )}
            {saveStatus === 'idle' && (
              <span className="text-ink-disabled flex items-center gap-1">
                <Lock size={11} /> <span className="hidden sm:inline">AES-256-GCM</span>
              </span>
            )}
          </div>

          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`btn-ghost flex items-center gap-1.5 text-xs ${isPreview ? 'text-accent' : ''}`}
          >
            {isPreview ? <Edit3 size={14} /> : <Eye size={14} />}
            {isPreview ? 'Edit' : 'Preview'}
          </button>

          <button
            onClick={() => persistNote(title, content, tags)}
            disabled={saveStatus === 'saving'}
            className="btn-ghost p-2"
          >
            <Save size={15} />
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn-ghost p-2 text-ink-tertiary hover:text-danger"
          >
            {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          </button>
        </div>
      </header>

      {/* Editor */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Note title"
          className="w-full bg-transparent text-2xl font-display font-700 text-ink-primary
                     placeholder-ink-disabled border-none outline-none mb-4
                     focus:ring-0 resize-none"
        />

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {tags.map((tag) => (
            <span key={tag}
              className="flex items-center gap-1 bg-surface-2 border border-surface-4
                         text-xs text-ink-secondary px-2.5 py-1 rounded-full">
              <Tag size={10} />
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-danger ml-0.5">
                <X size={10} />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
            }}
            placeholder="Add tag…"
            className="bg-transparent text-xs text-ink-tertiary placeholder-ink-disabled
                       border-none outline-none focus:ring-0 w-24"
          />
        </div>

        <div className="border-t border-surface-3 mb-6" />

        {/* Content area */}
        {isPreview ? (
          <article className="prose prose-invert prose-sm max-w-none
                              prose-headings:font-display prose-headings:text-ink-primary
                              prose-p:text-ink-secondary prose-p:leading-relaxed
                              prose-code:text-accent prose-code:bg-surface-2
                              prose-pre:bg-surface-2 prose-pre:border prose-pre:border-surface-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || '_Nothing here yet. Switch to edit mode._'}
            </ReactMarkdown>
          </article>
        ) : (
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing… Markdown is supported."
            className="w-full min-h-[60vh] bg-transparent text-ink-secondary text-sm
                       leading-relaxed border-none outline-none focus:ring-0 resize-none
                       placeholder-ink-disabled font-mono"
            autoFocus
          />
        )}
      </main>
    </div>
  )
}
