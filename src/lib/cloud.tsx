import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { clearStoredData } from './usePersistentState'

export type Profile = {
  id: string
  name: string
  nim: string
  jurusan: string
  avatar_color: string
  premium: boolean
  premium_until: string | null
}

type CloudValue = {
  /** true selama sesi login atau data awal masih dimuat */
  loading: boolean
  /** true bila data milik pengguna sudah dimuat dari database */
  ready: boolean
  session: Session | null
  userId: string | null
  profile: Profile | null
  premium: boolean
  /** isi tabel user_state: { key: value } */
  data: Record<string, unknown>
  /** naik setiap data dimuat ulang, dipakai hook untuk menyegarkan nilainya */
  version: number
  refresh: () => Promise<void>
  updateProfile: (p: { name: string; nim: string; jurusan: string; avatarColor: string }) => Promise<void>
  resetData: () => Promise<void>
  signOut: () => Promise<void>
}

const CloudContext = createContext<CloudValue | null>(null)

export function useCloud() {
  const ctx = useContext(CloudContext)
  if (!ctx) throw new Error('useCloud harus dipakai di dalam <CloudProvider>')
  return ctx
}

export function CloudProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [data, setData] = useState<Record<string, unknown>>({})
  const [version, setVersion] = useState(0)

  // Pantau sesi login (termasuk balik dari Google OAuth).
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthChecked(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id ?? null

  const load = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      setData({})
      setReady(false)
      return
    }
    const [state, prof] = await Promise.all([
      supabase.from('user_state').select('key,value'),
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    ])
    setData(Object.fromEntries((state.data ?? []).map((r) => [r.key as string, r.value])))
    let profileRow = (prof.data as Profile | null) ?? null
    if (!profileRow) {
      // Akun lama / trigger belum aktif: buat baris profil sendiri supaya tidak terjebak di layar login.
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const meta = (authUser?.user_metadata ?? {}) as Record<string, unknown>
      const name = String(meta.name ?? meta.full_name ?? authUser?.email?.split('@')[0] ?? 'Pengguna')
      const { error: insertError } = await supabase.from('profiles').insert({ id: userId, name })
      if (insertError) console.error('Gagal membuat profil:', insertError)
      else {
        const again = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
        profileRow = (again.data as Profile | null) ?? null
      }
    }
    setProfile(profileRow)
    setVersion((v) => v + 1)
    setReady(true)
  }, [userId])

  useEffect(() => { void load() }, [load])

  const premium = !!profile?.premium && (!profile.premium_until || new Date(profile.premium_until) > new Date())

  const updateProfile: CloudValue['updateProfile'] = async (p) => {
    if (!userId) return
    const { error } = await supabase
      .from('profiles')
      .update({ name: p.name, nim: p.nim, jurusan: p.jurusan, avatar_color: p.avatarColor })
      .eq('id', userId)
    if (!error) setProfile((prev) => (prev ? { ...prev, name: p.name, nim: p.nim, jurusan: p.jurusan, avatar_color: p.avatarColor } : prev))
  }

  const resetData = async () => {
    if (userId) await supabase.from('user_state').delete().eq('user_id', userId)
    clearStoredData()
  }

  const signOut = async () => {
    clearStoredData() // supaya data akun lama tidak bercampur dengan akun berikutnya di perangkat ini
    await supabase.auth.signOut()
  }

  const value = useMemo<CloudValue>(
    () => ({
      loading: !authChecked || (!!userId && !ready),
      ready, session, userId, profile, premium, data, version,
      refresh: load, updateProfile, resetData, signOut,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authChecked, ready, session, userId, profile, premium, data, version, load],
  )

  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>
}