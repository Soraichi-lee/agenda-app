import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useCloud } from './cloud'
import { supabase } from './supabase'

// Semua data Agenda disimpan di perangkat dengan awalan ini (cache lokal).
export const STORAGE_PREFIX = 'agenda:'

export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

type Options = {
  /** false = hanya simpan lokal, tidak dikirim ke database (default true) */
  sync?: boolean
}

/**
 * Seperti useState, tetapi nilainya:
 *  1. tetap ada di perangkat (localStorage sebagai cache), dan
 *  2. disinkronkan ke tabel user_state di Supabase saat pengguna login.
 */
export function usePersistentState<T>(
  key: string,
  initial: T | (() => T),
  { sync = true }: Options = {},
): [T, Dispatch<SetStateAction<T>>] {
  const cloud = useCloud()
  const [value, setValue] = useState<T>(() =>
    readStored(key, typeof initial === 'function' ? (initial as () => T)() : initial),
  )

  // valueRef selalu berisi nilai terbaru, termasuk di antara dua pembaruan beruntun.
  const valueRef = useRef(value)
  const keyRef = useRef(key)
  const userRef = useRef(cloud.userId)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  keyRef.current = key
  userRef.current = cloud.userId

  // Cache lokal
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    } catch {
      /* penyimpanan penuh / diblokir */
    }
  }, [key, value])

  const push = useCallback((k: string, v: T, immediate = false) => {
    const uid = userRef.current
    if (!sync || !uid) return
    const send = () =>
      void supabase
        .from('user_state')
        .upsert({ user_id: uid, key: k, value: v as unknown, updated_at: new Date().toISOString() }, { onConflict: 'user_id,key' })
    clearTimeout(timer.current)
    if (immediate) send()
    else timer.current = setTimeout(send, 800) // kumpulkan perubahan beruntun
  }, [sync])

  // Ambil nilai dari database begitu data siap (dan setiap kali dimuat ulang).
  useEffect(() => {
    if (!sync || !cloud.ready) return
    if (key in cloud.data) {
      valueRef.current = cloud.data[key] as T
      setValue(cloud.data[key] as T)
    } else {
      // Belum ada di database: kirim nilai lokal sebagai data awal akun ini.
      push(key, valueRef.current, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sync, cloud.ready, cloud.version, key])

  // Pembungkus setter: perubahan dari pengguna disimpan lokal lalu dikirim ke database.
  const setAndSync: Dispatch<SetStateAction<T>> = useCallback((action) => {
    const next = typeof action === 'function' ? (action as (prev: T) => T)(valueRef.current) : action
    valueRef.current = next
    setValue(next)
    push(keyRef.current, next)
  }, [push])

  return [value, setAndSync]
}

/** Hapus semua cache lokal Agenda dari perangkat (pengaturan suara alarm tidak ikut). */
export function clearStoredData() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(STORAGE_PREFIX))
    .forEach((k) => localStorage.removeItem(k))
}
