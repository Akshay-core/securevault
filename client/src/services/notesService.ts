/**
 * notesService.ts
 *
 * Orchestrates the encrypt → upload and download → decrypt flows.
 * This is the layer that ensures plaintext never reaches the network layer.
 *
 * Every note goes through: plaintext → encrypt → API (ciphertext only)
 * Every fetch goes through: API (ciphertext) → decrypt → UI (plaintext)
 */

import { encryptNote, encryptField } from '@/crypto/encrypt'
import { decryptNote, decryptField } from '@/crypto/decrypt'
import { notesApi } from './api'
import type { DecryptedNote, NoteRecord, EncryptedPayload } from '@/types/crypto'

function parsePayload(json: string): EncryptedPayload {
  return JSON.parse(json) as EncryptedPayload
}

/**
 * Decrypts a NoteRecord from the server into a DecryptedNote for the UI.
 */
export async function decryptRecord(
  record: NoteRecord,
  key: CryptoKey
): Promise<DecryptedNote> {
  const [title, content, tagsJson] = await Promise.all([
    decryptField(parsePayload(record.encrypted_title), key),
    decryptNote(parsePayload(record.encrypted_content), key),
    decryptField(parsePayload(record.encrypted_tags), key),
  ])

  let tags: string[] = []
  try { tags = JSON.parse(tagsJson) } catch { tags = [] }

  return {
    id: record.id,
    title,
    content,
    tags,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  }
}

/**
 * Encrypts a note and sends it to the server.
 * Returns the decrypted version for immediate local state update.
 */
export async function saveNote(
  note: { id?: string; title: string; content: string; tags: string[] },
  key: CryptoKey,
  salt: string
): Promise<DecryptedNote> {
  const [encTitle, encContent, encTags] = await Promise.all([
    encryptField(note.title || 'Untitled', key),
    encryptNote(note.content, key),
    encryptField(JSON.stringify(note.tags), key),
  ])

  const payload = {
    encrypted_title:   JSON.stringify(encTitle),
    encrypted_content: JSON.stringify(encContent),
    encrypted_tags:    JSON.stringify(encTags),
    salt,
  }

  let record: NoteRecord
  if (note.id) {
    const res = await notesApi.update(note.id, payload)
    record = res.data as NoteRecord
  } else {
    const res = await notesApi.create(payload)
    record = res.data as NoteRecord
  }

  return decryptRecord(record, key)
}

/**
 * Fetches all notes and decrypts them in parallel.
 */
export async function fetchAndDecryptNotes(key: CryptoKey): Promise<DecryptedNote[]> {
  const res = await notesApi.list()
  const records = res.data as NoteRecord[]

  return Promise.all(records.map((r) => decryptRecord(r, key)))
}
