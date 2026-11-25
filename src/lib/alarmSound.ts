// Suara alarm kustom dari penyimpanan perangkat.
// Browser tidak memberi akses ke path file asli di HP, jadi isi file audio-nya sendiri
// disimpan permanen di IndexedDB (tetap ada setelah aplikasi ditutup / HP dinyalakan ulang).

export const ALARM_ACCEPT = '.mp3,.wav,.ogg,audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/wave,audio/ogg'
export const ALARM_MAX_BYTES = 20 * 1024 * 1024
const EXT_OK = /\.(mp3|wav|ogg)$/i
const MIME_OK = /^audio\/(mpeg|mp3|wav|x-wav|wave|vnd\.wave|ogg)$/i

const DB_NAME = 'agenda-files'
const STORE = 'files'
const KEY = 'alarm-sound'

export type AlarmSound = { name: string; type: string; size: number; savedAt: number; blob: Blob }
// Disimpan sebagai ArrayBuffer (lebih andal daripada Blob di IndexedDB pada beberapa browser HP)
type StoredSound = Omit<AlarmSound, 'blob'> & { data: ArrayBuffer }

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  }).finally(() => db.close()) as Promise<T>
}

/** Validasi format & ukuran. Mengembalikan pesan error atau null jika valid. */
export function validateAlarmFile(file: File): string | null {
  if (!EXT_OK.test(file.name) && !MIME_OK.test(file.type)) return 'Format tidak didukung. Pilih file .mp3, .wav, atau .ogg.'
  if (file.size > ALARM_MAX_BYTES) return 'File terlalu besar (maks. 20 MB).'
  if (file.size === 0) return 'File kosong.'
  return null
}

/** Pastikan file benar-benar bisa diputar oleh perangkat ini. */
export function canDecode(file: Blob): Promise<boolean> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const a = new Audio()
    const done = (ok: boolean) => { URL.revokeObjectURL(url); a.removeAttribute('src'); resolve(ok) }
    a.preload = 'metadata'
    a.onloadedmetadata = () => done(true)
    a.onerror = () => done(false)
    setTimeout(() => done(false), 8000)
    a.src = url
  })
}

const guessType = (name: string) => (/\.wav$/i.test(name) ? 'audio/wav' : /\.ogg$/i.test(name) ? 'audio/ogg' : 'audio/mpeg')

let cachedUrl: string | null = null
let cachedMeta: Omit<AlarmSound, 'blob'> | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((f) => f())
export const onAlarmSoundChange = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f) } }

export async function saveAlarmSound(file: File): Promise<void> {
  const type = file.type || guessType(file.name)
  const data = await file.arrayBuffer()
  const stored: StoredSound = { name: file.name, type, size: file.size, savedAt: Date.now(), data }
  await tx('readwrite', (s) => s.put(stored, KEY))
  const rec: AlarmSound = { ...stored, blob: new Blob([data], { type }) }
  // minta browser agar penyimpanan tidak dihapus otomatis saat ruang penuh
  navigator.storage?.persist?.().catch(() => {})
  setCache(rec)
}

export async function loadAlarmSound(): Promise<Omit<AlarmSound, 'blob'> | null> {
  if (cachedMeta) return cachedMeta
  try {
    const rec = await tx<StoredSound | undefined>('readonly', (s) => s.get(KEY))
    if (rec?.data) setCache({ name: rec.name, type: rec.type, size: rec.size, savedAt: rec.savedAt, blob: new Blob([rec.data], { type: rec.type }) }, false)
  } catch { /* IndexedDB tidak tersedia */ }
  return cachedMeta
}

export async function clearAlarmSound(): Promise<void> {
  await tx('readwrite', (s) => s.delete(KEY))
  if (cachedUrl) URL.revokeObjectURL(cachedUrl)
  cachedUrl = null
  cachedMeta = null
  emit()
}

/** URL yang siap diputar untuk suara kustom, atau null jika memakai bawaan. */
export function getAlarmSoundUrl(): string | null { return cachedUrl }

function setCache(rec: AlarmSound, notify = true) {
  if (cachedUrl) URL.revokeObjectURL(cachedUrl)
  cachedUrl = URL.createObjectURL(rec.blob)
  cachedMeta = { name: rec.name, type: rec.type, size: rec.size, savedAt: rec.savedAt }
  if (notify) emit()
}

// Muat sekali saat aplikasi dibuka agar alarm langsung memakai suara pilihan
if (typeof indexedDB !== 'undefined') loadAlarmSound().then(() => emit())
