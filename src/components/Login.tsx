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


export default function Login() {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
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
              Belum punya akun? Buka tab Daftar di atas.
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
