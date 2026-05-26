/**
 * notesStore.ts
 *
 * Manages the decrypted notes cache in memory.
 * Notes are decrypted once after fetch and stored here for the session.
 * On logout, this store is cleared — no decrypted data persists.
 */

import { create } from 'zustand'
import type { DecryptedNote } from '@/types/crypto'

interface NotesState {
  notes: DecryptedNote[]
  activeNoteId: string | null
  isLoading: boolean
  searchQuery: string

  setNotes: (notes: DecryptedNote[]) => void
  upsertNote: (note: DecryptedNote) => void
  removeNote: (id: string) => void
  setActiveNote: (id: string | null) => void
  setLoading: (loading: boolean) => void
  setSearchQuery: (query: string) => void
  clearAll: () => void

  // Derived — filtered notes based on search
  getFilteredNotes: () => DecryptedNote[]
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  activeNoteId: null,
  isLoading: false,
  searchQuery: '',

  setNotes: (notes) => set({ notes }),

  upsertNote: (note) => set((state) => {
    const existing = state.notes.findIndex((n) => n.id === note.id)
    if (existing >= 0) {
      const updated = [...state.notes]
      updated[existing] = note
      return { notes: updated }
    }
    return { notes: [note, ...state.notes] }
  }),

  removeNote: (id) => set((state) => ({
    notes: state.notes.filter((n) => n.id !== id),
    activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
  })),

  setActiveNote: (id) => set({ activeNoteId: id }),
  setLoading: (isLoading) => set({ isLoading }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  clearAll: () => set({ notes: [], activeNoteId: null, searchQuery: '' }),

  getFilteredNotes: () => {
    const { notes, searchQuery } = get()
    if (!searchQuery.trim()) return notes
    const q = searchQuery.toLowerCase()
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
    )
  },
}))
