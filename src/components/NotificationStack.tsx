import { useEffect, useState } from 'react'
import { stopAlarm } from '../lib/notify'
import { PixelIcon, type PixelIconName } from '../assets/PixelIcons'

// Emoji ikon notifikasi -> ikon pixel-art
const PIXEL_FOR: Record<string, PixelIconName> = {
  '⏰': 'alarm', '🎯': 'target', '📋': 'tugas', '📝': 'tugas', '📚': 'belajar', '📅': 'jadwal',
  '🎓': 'kelas', '🤝': 'organisasi', '💼': 'kerja', '🏃': 'olahraga', '🏠': 'home', '📌': 'lainnya', '🔥': 'campfire', '🛒': 'store', '📊': 'analytics', '🛡️': 'shield', '🧪': 'potion',
}

export type Notif = {
  id: string
  title: string
  body: string
  icon: string
  color: string
  urgent?: boolean
}

type Props = {
  items: Notif[]
  onDismiss: (id: string) => void
}

export default function NotificationStack({ items, onDismiss }: Props) {
  return (
    <div className="pointer-events-none fixed left-1/2 top-3 z-50 flex -translate-x-1/2 flex-col gap-2" style={{ maxWidth: 'calc(100vw - 24px)', width: 360 }}>
      {items.map((n) => (
        <NotifCard key={n.id} notif={n} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function NotifCard({ notif, onDismiss }: { notif: Notif; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true))
    const auto = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(notif.id), 300)
    }, 5000)
    return () => {
      cancelAnimationFrame(show)
      clearTimeout(auto)
    }
  }, [notif.id, onDismiss])

  const dismiss = () => {
    stopAlarm()
    setVisible(false)
    setTimeout(() => onDismiss(notif.id), 300)
  }

  return (
    <div
      role="alert"
      className="pointer-events-auto flex items-start gap-3 border-[3px] border-ink bg-paper p-4 transition-all duration-300 ease-out"
      style={{
        boxShadow: `5px 5px 0 0 var(--color-ink)`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-140%)',
      }}
    >
      {/* color accent strip */}
      <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: notif.color }} />

      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-ink bg-[#2b2140]"
        aria-hidden
      >
        <PixelIcon name={PIXEL_FOR[notif.icon] ?? 'alarm'} size={28} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-display text-sm leading-tight">{notif.title}</p>
        <p className="mt-0.5 font-mono text-[11px] text-ink/65 leading-snug">{notif.body}</p>
      </div>

      <button
        onClick={dismiss}
        className="shrink-0 rounded-lg border border-ink/20 p-1 font-mono text-[10px] text-ink/50 transition-colors hover:bg-ink/5"
        aria-label="Tutup notifikasi"
      >
        ✕
      </button>
    </div>
  )
}
