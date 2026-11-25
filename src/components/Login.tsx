import { useState } from 'react'
import { PixelIcon } from '../assets/PixelIcons'
import { supabase } from '../lib/supabase'

export type User = {
  name: string
  nim: string
  jurusan: string
  email: string
  avatarColor: string
}

type Mode = 'login' | 'register'


// Login sosial lewat Supabase Auth (Google harus diaktifkan di dashboard Supabase)
const SOCIAL_PROVIDERS = [
  {
    id: 'google',
    label: 'Google',
    accentVar: '--color-sky',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor" opacity=".9"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" opacity=".75"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="currentColor" opacity=".6"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
      </svg>
    ),
  },
]

export default function Login() {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState('')

  // Setelah berhasil, CloudProvider mendeteksi sesi baru dan App langsung menampilkan aplikasi.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (mode === 'login') {
      if (!email || !password) { setError('Email dan kata sandi wajib diisi.'); return }
      setBusy(true)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setBusy(false)
      if (error) setError('Email atau kata sandi salah.')
    } else {
      if (!name || !email || !password) { setError('Semua kolom wajib diisi.'); return }
      if (password.length < 6) { setError('Kata sandi minimal 6 karakter.'); return }
      setBusy(true)
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
      setBusy(false)
      if (error) { setError(error.message); return }
      // Bila konfirmasi email aktif di Supabase, sesi baru ada setelah tautan di email diklik.
      if (!data.session) setInfo('Akun dibuat. Cek email kamu untuk konfirmasi, lalu masuk.')
    }
  }

  const handleSocial = async (provider: typeof SOCIAL_PROVIDERS[number]) => {
    setError('')
    setLoadingProvider(provider.id)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider.id as 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) { setLoadingProvider(null); setError(error.message) }
    // Bila sukses, browser dialihkan ke halaman login Google.
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-12">
      <div
        className="pointer-events-none fixed top-0 right-0 w-72 h-72 rounded-full opacity-20"
        style={{ background: 'var(--color-orange)', filter: 'blur(80px)' }}
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 w-64 h-64 rounded-full opacity-15"
        style={{ background: 'var(--color-teal)', filter: 'blur(70px)' }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div
              role="img"
              aria-label="Logo Agenda"
              className="h-14 w-14 shrink-0 overflow-hidden border-[3px] border-ink"
              style={{ boxShadow: '4px 4px 0 0 var(--color-ink)' }}
            >
              <PixelIcon name="logo" size={50} />
            </div>
            <div className="text-left">
              <p className="font-display text-3xl leading-none">Agenda</p>
              <p className="font-mono text-xs text-ink/60">planner mahasiswa</p>
            </div>
          </div>
          <p className="font-body text-ink/70 text-sm">
            {mode === 'login' ? 'Masuk dan lanjutkan streakmu 🔥' : 'Buat akun baru, mulai perjalananmu'}
          </p>
        </div>

        {/* card */}
        <div
          className="bg-paper rounded-2xl border-[3px] border-ink p-8"
          style={{ boxShadow: '0 6px 0 0 var(--color-ink)' }}
        >
          {/* mode toggle */}
          <div className="flex mb-6 border-[2px] border-ink rounded-xl overflow-hidden">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className="flex-1 py-2 font-display text-sm transition-colors"
                style={{
                  background: mode === m ? 'var(--color-ink)' : 'var(--color-paper)',
                  color: mode === m ? 'var(--color-cream)' : 'var(--color-ink)',
                }}
              >
                {m === 'login' ? 'Masuk' : 'Daftar'}
              </button>
            ))}
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-1 gap-2.5 mb-5">
            {SOCIAL_PROVIDERS.map((p) => {
              const isLoading = loadingProvider === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSocial(p)}
                  disabled={!!loadingProvider}
                  className="flex items-center justify-center gap-2.5 border-[3px] border-ink px-4 py-3 font-display text-sm shadow-[3px_3px_0_0_var(--color-ink)] transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none"
                  style={{
                    background: `var(${p.accentVar})`,
                    color: 'var(--color-paper)',
                    boxShadow: isLoading ? 'none' : '3px 3px 0 0 var(--color-ink)',
                  }}
                  title={mode === 'login' ? `Masuk dengan ${p.label}` : `Daftar dengan ${p.label}`}
                >
                  {isLoading ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    p.icon
                  )}
                  <span className="leading-tight text-center">{isLoading ? 'Menghubungkan...' : `${mode === 'login' ? 'Masuk' : 'Daftar'} dengan ${p.label}`}</span>
                </button>
              )
            })}
          </div>

          {/* divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-[2px] bg-ink/10 rounded-full" />
            <span className="font-mono text-[11px] text-ink/40 shrink-0">atau dengan email</span>
            <div className="flex-1 h-[2px] bg-ink/10 rounded-full" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <Field label="Nama Pengguna" value={name} onChange={setName} placeholder="Nama pengguna" />
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="kamu@univ.ac.id" />
            <Field label="Kata Sandi" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

            {error && (
              <p
                className="text-xs font-mono px-3 py-2 rounded-lg border-[2px] border-berry text-berry"
                style={{ background: 'rgba(224,69,123,0.08)' }}
              >
                {error}
              </p>
            )}
            {info && (
              <p className="text-xs font-mono px-3 py-2 rounded-lg border-[2px] border-teal text-teal">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 disabled:opacity-60 rounded-xl border-[3px] border-ink font-display text-base transition-transform hover:-translate-y-0.5 active:translate-y-0"
              style={{
                background: 'var(--color-orange)',
                color: 'var(--color-paper)',
                boxShadow: '4px 4px 0 0 var(--color-ink)',
              }}
            >
              {mode === 'login' ? 'Masuk →' : 'Buat Akun →'}
            </button>
          </form>

          {mode === 'login' && (
            <p className="mt-4 text-center font-mono text-[11px] text-ink/50">
              Demo: gunakan email & kata sandi apa saja, atau login sosial
            </p>
          )}
        </div>

        <p className="text-center font-mono text-[11px] text-ink/40 mt-6">
          Agenda © 2026 — atur waktu, kejar streak ◆
        </p>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="block font-mono text-xs text-ink/70 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border-[2px] border-ink bg-cream font-body text-sm outline-none transition-all focus:border-orange placeholder:text-ink/30"
        style={{ boxShadow: '2px 2px 0 0 var(--color-ink)' }}
      />
    </div>
  )
}
