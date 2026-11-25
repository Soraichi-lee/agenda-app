import React, { useEffect, useRef, useState } from 'react'
import type { User } from './Login'
import { IconStreak } from '../assets/NavIcons'
import { PixelIcon, type PixelIconName } from '../assets/PixelIcons'

const AVATAR_BG: Record<string, string> = {
  orange: 'var(--color-orange)',
  teal: 'var(--color-teal)',
  berry: 'var(--color-berry)',
  violet: 'var(--color-violet)',
  sky: 'var(--color-sky)',
  yellow: 'var(--color-yellow)',
}

type Props = {
  user: User
  points: number
  streak: number
  premium: boolean
  onOpenSettings: () => void
  onGoAnalytics: () => void
  onSubscribe: () => void
  onLogout: () => void
}

export default function ProfileMenu({ user, points, streak, premium, onOpenSettings, onGoAnalytics, onSubscribe, onLogout }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  const bg = AVATAR_BG[user.avatarColor] ?? 'var(--color-orange)'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-full border-[2px] border-ink font-display text-sm font-bold transition-transform hover:-translate-y-0.5 active:translate-y-0"
        style={{
          background: bg,
          color: 'var(--color-paper)',
          boxShadow: open ? 'none' : '2px 2px 0 0 var(--color-ink)',
        }}
        aria-label="Menu profil"
      >
        {initials || '?'}
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 w-72 rounded-2xl border-[3px] border-ink bg-paper z-50"
          style={{ boxShadow: '6px 6px 0 0 var(--color-ink)' }}
        >
          {/* profile header */}
          <div className="p-5 border-b-[2px] border-ink/20">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full border-[2px] border-ink font-display text-lg font-bold shrink-0"
                style={{ background: bg, color: 'var(--color-paper)', boxShadow: '2px 2px 0 0 var(--color-ink)' }}
              >
                {initials || '?'}
              </div>
              <div className="overflow-hidden">
                <p className="font-display text-base leading-tight truncate">{user.name}</p>
                <p className="font-mono text-[11px] text-ink/60 truncate">{user.nim} · {user.jurusan}</p>
                <p className="font-mono text-[10px] text-ink/40 truncate">{user.email}</p>
              </div>
            </div>

            {/* stats row */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Stat label="Poin" value={`◆ ${points}`} color="var(--color-yellow)" />
              <Stat label="Streak" value={<span className="inline-flex items-center gap-1"><IconStreak size={12} />{streak}</span>} color="var(--color-orange)" />
              <Stat label="Status" value={premium ? '⭐ Pro' : 'Gratis'} color={premium ? 'var(--color-violet)' : undefined} />
            </div>
          </div>

          {/* premium banner */}
          {!premium ? (
            <div className="mx-3 mb-1 mt-2">
              <button
                onClick={() => { setOpen(false); onSubscribe() }}
                className="w-full rounded-xl border-[2px] border-ink px-4 py-3 text-left transition-transform hover:-translate-y-0.5"
                style={{ background: 'var(--color-ink)', boxShadow: '3px 3px 0 0 var(--color-orange)' }}
              >
                <p className="font-display text-sm text-cream leading-tight"><span className="inline-block align-[-2px]"><PixelIcon name="star" size={14} /></span> Langganan Premium</p>
                <p className="font-mono text-[11px] text-cream/60 mt-0.5">Rp15.000/bulan · Analitik lengkap</p>
              </button>
            </div>
          ) : (
            <div className="mx-3 mb-1 mt-2 rounded-xl border-[2px] border-teal/40 px-4 py-2.5" style={{ background: 'rgba(31,158,143,0.08)' }}>
              <p className="font-display text-sm text-teal"><span className="inline-block align-[-2px]"><PixelIcon name="star" size={14} /></span> Premium Aktif</p>
              <p className="font-mono text-[10px] text-ink/50 mt-0.5">Akses penuh ke semua fitur analitik</p>
            </div>
          )}

          {/* menu items */}
          <div className="p-2">
            <MenuItem icon="settings" label="Pengaturan" onClick={() => { setOpen(false); onOpenSettings() }} />
            <MenuItem icon="analytics" label="Statistik Saya" onClick={() => { setOpen(false); onGoAnalytics() }} />
            <div className="my-1 border-t border-ink/10" />
            <MenuItem
              icon="door"
              label="Keluar"
              onClick={() => { setOpen(false); onLogout() }}
              danger
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div
      className="rounded-lg border-[2px] border-ink/15 px-2 py-1.5 text-center"
      style={{ background: color ? `${color}22` : 'var(--color-cream)' }}
    >
      <p className="font-display text-xs leading-none">{value}</p>
      <p className="font-mono text-[10px] text-ink/50 mt-0.5">{label}</p>
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
  muted,
}: {
  icon: PixelIconName
  label: string
  onClick: () => void
  danger?: boolean
  muted?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-body text-sm transition-colors hover:bg-ink/5 text-left"
      style={{ color: danger ? 'var(--color-berry)' : muted ? 'var(--color-ink)' : 'var(--color-ink)', opacity: muted ? 0.6 : 1 }}
    >
      <span aria-hidden className="flex w-5 justify-center"><PixelIcon name={icon} size={18} /></span>
      {label}
      {muted && <span className="ml-auto font-mono text-[10px] text-ink/30">segera</span>}
    </button>
  )
}
