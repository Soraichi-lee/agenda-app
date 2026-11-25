import { isAlarmMusicOn, setAlarmMusicOn, stopAlarm } from '../lib/notify'
import { PixelIcon, type PixelIconName } from '../assets/PixelIcons'
import { useState } from 'react'
import { useCloud } from '../lib/cloud'
import type { User } from './Login'
import AlarmSoundPicker from './AlarmSoundPicker'

const AVATAR_COLORS = [
  { id: 'orange', bg: 'var(--color-orange)', label: 'Oranye' },
  { id: 'teal', bg: 'var(--color-teal)', label: 'Hijau' },
  { id: 'berry', bg: 'var(--color-berry)', label: 'Berry' },
  { id: 'violet', bg: 'var(--color-violet)', label: 'Ungu' },
  { id: 'sky', bg: 'var(--color-sky)', label: 'Langit' },
  { id: 'yellow', bg: 'var(--color-yellow)', label: 'Kuning' },
]

const AVATAR_BG: Record<string, string> = Object.fromEntries(AVATAR_COLORS.map((c) => [c.id, c.bg]))

type Section = 'profil' | 'notifikasi' | 'privasi' | 'tentang'

type Props = {
  user: User
  onUpdate: (u: User) => void
  onClose: () => void
  onLogout: () => void
}

export default function Settings({ user, onUpdate, onClose, onLogout}: Props) {
  const cloud = useCloud()
  const [alarmMusic, setAlarmMusic] = useState(isAlarmMusicOn())
  const [section, setSection] = useState<Section>('profil')
  const [draft, setDraft] = useState<User>(user)
  const [saved, setSaved] = useState(false)

  // notifications state
  const [notifReminder, setNotifReminder] = useState(true)
  const [notifStreak, setNotifStreak] = useState(true)
  const [notifStore, setNotifStore] = useState(false)

  const handleSave = () => {
    onUpdate(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const SECTIONS: { id: Section; icon: PixelIconName; label: string }[] = [
    { id: 'profil', icon: 'profil', label: 'Profil' },
    { id: 'notifikasi', icon: 'bell', label: 'Notifikasi' },
    { id: 'privasi', icon: 'lock', label: 'Privasi' },
    { id: 'tentang', icon: 'info', label: 'Tentang' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative z-10 flex h-[100dvh] w-full flex-col overflow-hidden bg-paper"
      >
        {/* modal header */}
        <div className="flex shrink-0 items-center justify-between border-b-4 border-ink px-6 py-4">
          <p className="font-display text-xl">Pengaturan</p>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border-[2px] border-ink font-display text-base transition-all hover:-translate-y-0.5"
            style={{ boxShadow: '2px 2px 0 0 var(--color-ink)', background: 'var(--color-cream)' }}
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 overflow-hidden">
          {/* sidebar */}
          <nav className="shrink-0 w-36 sm:w-44 border-r-[2px] border-ink/15 py-3 overflow-y-auto">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className="flex w-full items-center gap-2.5 px-4 py-3 font-body text-sm transition-colors text-left"
                style={{
                  background: section === s.id ? 'var(--color-ink)' : 'transparent',
                  color: section === s.id ? 'var(--color-cream)' : 'var(--color-ink)',
                  borderRight: section === s.id ? '3px solid var(--color-orange)' : '3px solid transparent',
                }}
              >
                <span aria-hidden className="flex"><PixelIcon name={s.icon} size={18} /></span>
                {s.label}
              </button>
            ))}
            <div className="mt-auto mx-3 mt-4">
              <button
                onClick={onLogout}
                className="w-full rounded-xl border-[2px] border-berry px-3 py-2 font-mono text-xs text-berry transition-all hover:bg-berry hover:text-paper"
              >
                Keluar
              </button>
            </div>
          </nav>

          {/* content */}
          <div className="flex-1 overflow-y-auto p-6">
            {section === 'profil' && (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-ink font-display text-2xl shrink-0"
                    style={{
                      background: AVATAR_BG[draft.avatarColor] ?? 'var(--color-orange)',
                      color: 'var(--color-paper)',
                      boxShadow: '3px 3px 0 0 var(--color-ink)',
                    }}
                  >
                    {draft.name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')}
                  </div>
                  <div>
                    <p className="font-display text-base">{draft.name || 'Nama Kamu'}</p>
                    <p className="font-mono text-xs text-ink/60">{draft.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs text-ink/60 mb-1.5">Warna Avatar</label>
                  <div className="flex gap-2 flex-wrap">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setDraft((d) => ({ ...d, avatarColor: c.id }))}
                        className="w-8 h-8 rounded-full border-[2px] transition-all"
                        style={{
                          background: c.bg,
                          borderColor: draft.avatarColor === c.id ? 'var(--color-ink)' : 'transparent',
                          boxShadow: draft.avatarColor === c.id ? '2px 2px 0 0 var(--color-ink)' : 'none',
                          transform: draft.avatarColor === c.id ? 'scale(1.2)' : 'scale(1)',
                        }}
                        aria-label={c.label}
                      />
                    ))}
                  </div>
                </div>

                <SettingField label="Nama Lengkap" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} />
                <SettingField label="Email" type="email" value={draft.email} onChange={(v) => setDraft((d) => ({ ...d, email: v }))} />

                <button
                  onClick={handleSave}
                  className="w-full py-3 rounded-xl border-[3px] border-ink font-display text-sm transition-transform active:translate-y-0.5"
                  style={{
                    background: saved ? 'var(--color-teal)' : 'var(--color-orange)',
                    color: 'var(--color-paper)',
                    boxShadow: '4px 4px 0 0 var(--color-ink)',
                  }}
                >
                  {saved ? '✓ Tersimpan!' : 'Simpan Perubahan'}
                </button>
              </div>
            )}

            {section === 'notifikasi' && (
              <div className="space-y-4">
                <p className="font-display text-lg mb-4">Notifikasi</p>
                <Toggle
                  label="Pengingat Tugas"
                  sub="Notifikasi 30 menit sebelum deadline"
                  value={notifReminder}
                  onChange={setNotifReminder}
                />
                <Toggle
                  label="Peringatan Streak"
                  sub="Ingatkan jika streak hampir putus"
                  value={notifStreak}
                  onChange={setNotifStreak}
                />
                <Toggle
                  label="Promo & Toko"
                  sub="Info diskon dan item baru di toko"
                  value={notifStore}
                  onChange={setNotifStore}
                />
                <Toggle
                  label="Musik Alarm"
                  sub="Putar suara alarm berulang saat notifikasi muncul"
                  value={alarmMusic}
                  onChange={(v) => {
                    setAlarmMusic(v)
                    setAlarmMusicOn(v)
                    if (!v) stopAlarm()
                  }}
                />
                <AlarmSoundPicker />
                <div
                  className="rounded-xl border-[2px] border-ink/20 p-4 mt-2 font-mono text-xs text-ink/50"
                  style={{ background: 'var(--color-cream)' }}
                >
                  Notifikasi berjalan di perangkat kamu. Pastikan izin browser sudah diaktifkan.
                </div>
              </div>
            )}

            {section === 'privasi' && (
              <div className="space-y-4">
                <p className="font-display text-lg mb-4">Privasi & Data</p>
                <InfoCard
                  icon="📁"
                  title="Data Tersimpan di Akunmu"
                  desc="Tugas, jadwal, dan poinmu disimpan di akunmu sehingga bisa dibuka dari perangkat lain. Hanya kamu yang dapat membacanya."
                />
                <InfoCard
                  icon="🔑"
                  title="Keamanan Akun"
                  desc="Gunakan kata sandi yang kuat dan unik. Jangan bagikan akun ke orang lain."
                />
                <button
                  onClick={async () => {
                    if (!window.confirm('Hapus semua tugas, jadwal, dan poin dari akun ini? Tindakan ini tidak bisa dibatalkan.')) return
                    await cloud.resetData()
                    window.location.reload()
                  }}
                  className="w-full py-3 rounded-xl border-[2px] border-ink/30 font-mono text-xs text-ink/60 transition-all hover:border-berry hover:text-berry"
                >
                  Hapus Semua Data Saya
                </button>
              </div>
            )}

            {section === 'tentang' && (
              <div className="space-y-4">
                <p className="font-display text-lg mb-4">Tentang Agenda</p>
                <div
                  className="rounded-xl border-[3px] border-ink p-5 text-center"
                  style={{ background: 'var(--color-cream)', boxShadow: '4px 4px 0 0 var(--color-ink)' }}
                >
                  <p className="font-display text-3xl mb-1">Agenda</p>
                  <p className="font-mono text-xs text-ink/50">Versi 1.0.0 · planner mahasiswa</p>
                </div>
                <InfoCard icon="⚡" title="Dibangun dengan" desc="React 19 · TypeScript · Tailwind CSS v4 · Recharts" />
                <InfoCard icon="🎨" title="Desain" desc="Neo-brutalist — tebal, tegas, dan tidak ada kompromi pada keterbacaan." />
                <InfoCard icon="❤️" title="Tujuan" desc="Membantu mahasiswa mengatur waktu, menjaga kebiasaan belajar, dan tetap produktif setiap hari." />
                <p className="font-mono text-[11px] text-ink/40 text-center pt-2">
                  © 2026 Agenda — atur waktu, kejar streak, jangan sampai kelewat. ◆
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div>
      <label className="block font-mono text-xs text-ink/60 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border-[2px] border-ink bg-cream font-body text-sm outline-none transition-all focus:border-orange"
        style={{ boxShadow: '2px 2px 0 0 var(--color-ink)' }}
      />
    </div>
  )
}

function Toggle({ label, sub, value, onChange }: { label: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl border-[2px] border-ink/20 px-4 py-3"
      style={{ background: 'var(--color-cream)' }}
    >
      <div>
        <p className="font-body text-sm font-medium">{label}</p>
        <p className="font-mono text-[11px] text-ink/50">{sub}</p>
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className="relative shrink-0 h-6 w-11 rounded-full border-[2px] border-ink transition-colors"
        style={{ background: value ? 'var(--color-orange)' : 'var(--color-cream)' }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full border-[2px] border-ink transition-all"
          style={{
            left: value ? 'calc(100% - 18px)' : '1px',
            background: value ? 'var(--color-paper)' : 'var(--color-ink)',
          }}
        />
      </button>
    </div>
  )
}

function InfoCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div
      className="rounded-xl border-[2px] border-ink/20 p-4 flex gap-3"
      style={{ background: 'var(--color-cream)' }}
    >
      <span className="text-xl shrink-0">{icon}</span>
      <div>
        <p className="font-display text-sm">{title}</p>
        <p className="font-mono text-[11px] text-ink/60 mt-0.5">{desc}</p>
      </div>
    </div>
  )
}
