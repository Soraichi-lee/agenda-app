import { useEffect, useRef, useMemo, useState } from 'react'
import { usePersistentState } from '../lib/usePersistentState'
import type { Notif } from './NotificationStack'
import { toMin, fmt, SWATCH, type SwatchKey } from '../lib'
import { IconStreak } from '../assets/NavIcons'
import Blacksmith from './Blacksmith'
import { PixelIcon } from '../assets/PixelIcons'

type BlockKind = 'kelas' | 'tugas' | 'belajar' | 'organisasi' | 'kerja' | 'pribadi' | 'olahraga' | 'lainnya'

const KIND_LIST: { id: BlockKind; label: string; icon: string }[] = [
  { id: 'kelas', label: 'Kelas', icon: '🎓' },
  { id: 'tugas', label: 'Tugas', icon: '📝' },
  { id: 'belajar', label: 'Belajar', icon: '📚' },
  { id: 'organisasi', label: 'Organisasi', icon: '🤝' },
  { id: 'kerja', label: 'Kerja', icon: '💼' },
  { id: 'olahraga', label: 'Olahraga', icon: '🏃' },
  { id: 'pribadi', label: 'Pribadi', icon: '🏠' },
  { id: 'lainnya', label: 'Lainnya', icon: '📌' },
]

const KIND_PIXEL = { kelas: 'kelas', tugas: 'tugas', belajar: 'belajar', organisasi: 'organisasi', kerja: 'kerja', olahraga: 'olahraga', pribadi: 'home', lainnya: 'lainnya' } as const

type Block = {
  id: string
  day: number
  title: string
  room: string
  start: string
  end: string
  color: SwatchKey
  kind: BlockKind
}

// Tanggal acuan: hari ini menurut kalender perangkat. Block.day = selisih hari dari tanggal ini.
const TODAY = new Date()
const BASE = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate())
const DOW = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const dateOf = (off: number) => new Date(BASE.getFullYear(), BASE.getMonth(), BASE.getDate() + off)
const offOf = (d: Date) => Math.round((d.getTime() - BASE.getTime()) / 86400000)
const dayInfo = (off: number) => {
  const d = dateOf(off)
  return { off, dow: DOW[d.getDay()], date: d.getDate(), mon: MONTHS[d.getMonth()].slice(0, 3), month: d.getMonth(), year: d.getFullYear() }
}

const INITIAL_SCHEDULE: Block[] = [
  { id: 'b1', day: 0, title: 'Kalkulus II', room: 'Ruang A-201', start: '07:30', end: '09:00', color: 'teal', kind: 'kelas' },
  { id: 'b2', day: 0, title: 'Pemrograman Web', room: 'Lab Komputer 3', start: '09:30', end: '11:30', color: 'sky', kind: 'kelas' },
  { id: 'b3', day: 0, title: 'Basis Data', room: 'Ruang B-104', start: '11:00', end: '12:30', color: 'violet', kind: 'kelas' },
  { id: 'b4', day: 0, title: 'Kerjakan Mockup UI', room: 'Tugas mandiri', start: '13:00', end: '14:30', color: 'orange', kind: 'tugas' },
  { id: 'b5', day: 0, title: 'Struktur Data', room: 'Ruang A-108', start: '15:00', end: '16:30', color: 'berry', kind: 'kelas' },
  { id: 'b6', day: 0, title: 'Belajar Kuis SD', room: 'Perpustakaan', start: '19:00', end: '20:30', color: 'yellow', kind: 'belajar' },
  { id: 'b7', day: 1, title: 'Struktur Data', room: 'Ruang A-108', start: '08:00', end: '09:30', color: 'berry', kind: 'kelas' },
  { id: 'b8', day: 1, title: 'Kuis Struktur Data', room: 'Ruang A-108', start: '09:30', end: '10:30', color: 'orange', kind: 'tugas' },
  { id: 'b9', day: 1, title: 'Jaringan Komputer', room: 'Lab Jaringan', start: '13:00', end: '15:00', color: 'sky', kind: 'kelas' },
  { id: 'b10', day: 2, title: 'Kalkulus II', room: 'Ruang A-201', start: '07:30', end: '09:00', color: 'teal', kind: 'kelas' },
  { id: 'b11', day: 2, title: 'Kelompok UI', room: 'Kafetaria', start: '15:00', end: '17:00', color: 'violet', kind: 'belajar' },
  { id: 'b12', day: 3, title: 'Bimbingan skripsi', room: 'Ruang Dosen', start: '13:00', end: '14:00', color: 'berry', kind: 'kelas' },
  { id: 'b13', day: 4, title: 'Kerja proyek Web', room: 'Rumah', start: '10:00', end: '12:30', color: 'orange', kind: 'tugas' },
  { id: 'b14', day: 6, title: 'Review mingguan', room: 'Perpustakaan', start: '19:00', end: '20:00', color: 'yellow', kind: 'belajar' },
]

const DAY_START = toMin('00:00')
const DAY_END = toMin('24:00')
const PPM = 0.8

function layoutBlocks(blocks: Block[]) {
  const sorted = [...blocks].sort((a, b) => toMin(a.start) - toMin(b.start))
  const lanes: number[] = []
  const placed = sorted.map((b) => {
    const s = toMin(b.start)
    const e = toMin(b.end)
    let lane = lanes.findIndex((end) => end <= s)
    if (lane === -1) {
      lane = lanes.length
      lanes.push(e)
    } else {
      lanes[lane] = e
    }
    return { block: b, s, e, lane }
  })
  const laneCount = Math.max(1, lanes.length)
  const conflict = new Set<string>()
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      if (placed[i].s < placed[j].e && placed[j].s < placed[i].e) {
        conflict.add(placed[i].block.id)
        conflict.add(placed[j].block.id)
      }
    }
  }
  return { placed, laneCount, conflict }
}

export type Task = { id: string; label: string; sub: string; points: number; done: boolean; deadline?: string }

type Reminder = { id: string; at: Date; end?: Date; text: string; tone: SwatchKey; kind: 'jadwal' | 'tugas' }

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

// Label waktu relatif terhadap jam sekarang
function whenLabel(r: Reminder, now: Date) {
  const mins = Math.round((r.at.getTime() - now.getTime()) / 60000)
  if (r.end && now >= r.at && now < r.end) return `Sedang berlangsung · s/d ${hhmm(r.end)}`
  if (mins <= 0) return 'Sekarang'
  if (mins < 60) return `${mins} mnt lagi`
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  if (sameDay(r.at, now)) return `Hari ini ${hhmm(r.at)} · ${Math.floor(mins / 60)} jam lagi`
  if (sameDay(r.at, tomorrow)) return `Besok ${hhmm(r.at)}`
  return `${HARI[r.at.getDay()]}, ${r.at.getDate()}/${r.at.getMonth() + 1} ${hhmm(r.at)}`
}

const MENU: { id: 'tugas' | 'jadwal' | 'tambah' | 'store' | 'analytics' | 'fokus'; label: string; icon: string; color: string }[] = [
  { id: 'tugas', label: 'Tugas', icon: '📝', color: 'teal' },
  { id: 'jadwal', label: 'Jadwal', icon: '📅', color: 'sky' },
  { id: 'fokus', label: 'Focus Timer', icon: '⏱️', color: 'violet' },
  { id: 'store', label: 'Toko', icon: '🛒', color: 'yellow' },
  { id: 'analytics', label: 'Analitik', icon: '📊', color: 'berry' },
]

export default function Home({
  userName,
  tasks,
  onToggle,
  onAddTask,
  points,
  streak,
  freezes,
  doubleActive,
  onUseFreeze,
  onNotify,
  mode = 'home',
  onNavigate,
}: {
  mode?: 'home' | 'jadwal'
  onNavigate?: (v: 'jadwal' | 'store' | 'analytics' | 'fokus') => void
  userName: string
  tasks: Task[]
  onToggle: (id: string, willComplete: boolean) => void
  onAddTask: (t: Task) => void
  points: number
  streak: number
  freezes: number
  doubleActive: boolean
  onUseFreeze: () => void
  onNotify: (n: Notif) => void
}) {
  const [burst, setBurst] = useState<string | null>(null)
  // Disimpan bersama tanggal acuan agar posisi hari tetap benar setelah berganti hari
  const [storedSchedule, setStoredSchedule] = usePersistentState<{ base: string; blocks: Block[] }>('schedule', () => ({ base: BASE.toDateString(), blocks: INITIAL_SCHEDULE }))
  const schedule = useMemo(() => {
    const shift = offOf(new Date(storedSchedule.base))
    return shift ? storedSchedule.blocks.map((b) => ({ ...b, day: b.day + shift })) : storedSchedule.blocks
  }, [storedSchedule])
  const setSchedule = (update: Block[] | ((prev: Block[]) => Block[])) =>
    setStoredSchedule((prev) => {
      const shift = offOf(new Date(prev.base))
      const current = shift ? prev.blocks.map((b) => ({ ...b, day: b.day + shift })) : prev.blocks
      return { base: BASE.toDateString(), blocks: typeof update === 'function' ? update(current) : update }
    })
  // Jam langsung untuk Smart Reminder
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const nowMinute = Math.floor(now.getTime() / 60000)
  const reminders = useMemo(() => {
    const ref = new Date(nowMinute * 60000)
    const list: Reminder[] = []
    // Jadwal pada tanggal kalender sebenarnya; yang sudah selesai dilewati
    schedule.forEach((b) => {
      const d = dateOf(b.day)
      const [sh, sm] = b.start.split(':').map(Number)
      const [eh, em] = b.end.split(':').map(Number)
      const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), sh, sm)
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), eh, em)
      if (end <= ref) return
      list.push({ id: b.id, at, end, text: `${b.title} — ${b.room}`, tone: b.color, kind: 'jadwal' })
    })
    tasks.forEach((t) => {
      if (t.done || !t.deadline) return
      const at = new Date(t.deadline)
      if (at > ref) list.push({ id: t.id, at, text: `Tenggat: ${t.label}`, tone: 'berry', kind: 'tugas' })
    })
    return list.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 4)
  }, [schedule, tasks, nowMinute])
  const [selectedDay, setSelectedDay] = useState(0)
  const [weekStart, setWeekStart] = useState(0)
  const WEEK = Array.from({ length: 7 }, (_, i) => dayInfo(weekStart + i))
  const sel = dayInfo(selectedDay)
  const goWeek = (n: number) => {
    setWeekStart((w) => w + n * 7)
    setSelectedDay((d) => d + n * 7)
  }
  const goMonth = (n: number) => {
    const first = offOf(new Date(sel.year, sel.month + n, 1))
    setWeekStart(first)
    setSelectedDay(first)
  }
  const goToday = () => {
    setWeekStart(0)
    setSelectedDay(0)
  }
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<'jadwal' | 'tugas'>('jadwal')
  const [draft, setDraft] = useState({
    day: 0,
    title: '',
    room: '',
    start: '13:00',
    end: '14:00',
    color: 'orange' as SwatchKey,
    kind: 'kelas' as Block['kind'],
  })
  const [taskDraft, setTaskDraft] = useState({ label: '', sub: '', deadline: '' })

  const shownSchedNotifs = useRef<Set<string>>(new Set())

  // Poll schedule start times every 60 seconds
  useEffect(() => {
    const KIND_ICONS: Record<string, string> = {
      kelas: '🎓', tugas: '📝', belajar: '📚', organisasi: '🤝',
      kerja: '💼', olahraga: '🏃', pribadi: '🏠', lainnya: '📌',
    }
    const check = () => {
      const now = new Date()
      schedule.forEach((b) => {
        // Hanya jadwal yang tanggalnya hari ini
        if (dateOf(b.day).toDateString() !== now.toDateString()) return
        const [bH, bM] = b.start.split(':').map(Number)
        const startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), bH, bM).getTime()
        const minsLeft = Math.round((startMs - now.getTime()) / 60000)
        const key15 = `sched-15-${b.id}`
        const key5 = `sched-5-${b.id}`
        if (minsLeft > 0 && minsLeft <= 15 && !shownSchedNotifs.current.has(key15)) {
          shownSchedNotifs.current.add(key15)
          onNotify({
            id: `${key15}-${Date.now()}`,
            title: '📅 Jadwal segera dimulai',
            body: `"${b.title}" pukul ${b.start} — ${minsLeft} menit lagi${b.room ? ` · ${b.room}` : ''}`,
            icon: KIND_ICONS[b.kind] ?? '📌',
            color: 'var(--color-sky)',
          })
        }
        const key0 = `sched-0-${b.id}-${now.toDateString()}`
        if (minsLeft === 0 && !shownSchedNotifs.current.has(key0)) {
          shownSchedNotifs.current.add(key0)
          onNotify({
            id: `${key0}-${Date.now()}`,
            title: '📅 Jadwal dimulai sekarang',
            body: `"${b.title}" pukul ${b.start}${b.room ? ` · ${b.room}` : ''}`,
            icon: KIND_ICONS[b.kind] ?? '📌',
            color: 'var(--color-teal)',
            urgent: true,
          })
        }
        if (minsLeft > 0 && minsLeft <= 5 && !shownSchedNotifs.current.has(key5)) {
          shownSchedNotifs.current.add(key5)
          onNotify({
            id: `${key5}-${Date.now()}`,
            title: '🚨 Jadwal hampir mulai!',
            body: `"${b.title}" pukul ${b.start} — ${minsLeft} menit lagi`,
            icon: KIND_ICONS[b.kind] ?? '📌',
            color: 'var(--color-berry)',
            urgent: true,
          })
        }
      })
    }
    check()
    const interval = setInterval(check, 15000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule])

  const daySchedule = schedule.filter((b) => b.day === selectedDay)

  const draftClash =
    draft.title.trim() &&
    toMin(draft.end) > toMin(draft.start) &&
    schedule.some(
      (b) => b.day === draft.day && toMin(draft.start) < toMin(b.end) && toMin(b.start) < toMin(draft.end),
    )

  const draftValid = draft.title.trim() && toMin(draft.end) > toMin(draft.start)

  const openForm = (mode: 'jadwal' | 'tugas' = 'jadwal') => {
    setFormMode(mode)
    setDraft({ day: selectedDay, title: '', room: '', start: '08:00', end: '09:30', color: 'orange', kind: 'kelas' })
    setTaskDraft({ label: '', sub: '', deadline: '' })
    setShowForm(true)
  }

  const addTask = () => {
    if (!taskDraft.label.trim()) return
    onAddTask({
      id: `t${Date.now()}`,
      label: taskDraft.label.trim(),
      sub: taskDraft.sub.trim() || 'Tugas baru',
      points: 5,
      done: false,
      deadline: taskDraft.deadline || undefined,
    })
    setShowForm(false)
  }

  const isLate = (t: Task) => !!t.deadline && new Date() > new Date(t.deadline)

  const addBlock = () => {
    if (!draftValid) return
    setSchedule((prev) => [
      ...prev,
      { ...draft, id: `u${Date.now()}`, room: draft.room.trim() || 'Tanpa lokasi', title: draft.title.trim() },
    ])
    setSelectedDay(draft.day)
    setShowForm(false)
  }

  const deleteBlock = (id: string) => setSchedule((prev) => prev.filter((b) => b.id !== id))

  const perDayCount = (d: number) => schedule.filter((b) => b.day === d).length

  const earned = useMemo(() => tasks.filter((t) => t.done).reduce((s, t) => s + t.points, 0), [tasks])
  const doneCount = tasks.filter((t) => t.done).length
  const pct = Math.round((doneCount / tasks.length) * 100)

  const { placed, laneCount, conflict } = useMemo(() => layoutBlocks(daySchedule), [daySchedule])
  const conflictPairs = Math.ceil(conflict.size / 2)
  const timelineHeight = (DAY_END - DAY_START) * PPM

  const toggle = (t: Task) => {
    onToggle(t.id, !t.done)
    if (!t.done) {
      setBurst(t.id)
      setTimeout(() => setBurst((b) => (b === t.id ? null : b)), 900)
    }
  }

  const hours: number[] = []
  for (let m = DAY_START; m <= DAY_END; m += 60) hours.push(m)

  return (
    <>
      {mode === 'home' && <section className="card-brutal mb-8 rounded-2xl bg-orange p-4 text-paper sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl leading-none tracking-tight sm:text-4xl">
              Halo, {userName}
            </h1>
            <p className="mt-1.5 font-mono text-[11px] text-paper/80">Semangat selesaikan agenda hari ini.</p>
          </div>
          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border-[3px] border-ink bg-yellow text-ink">
            <span className="font-display text-2xl leading-none">{streak}</span>
            <span className="inline-flex items-center gap-1 font-mono text-[9px]">
              hari <IconStreak size={11} />
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-end gap-4">
          <div className="shrink-0">
            <p className="font-display text-2xl leading-none">{points}</p>
            <p className="mt-1 font-mono text-[10px] text-paper/80">poin · +{earned} hari ini</p>
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex justify-between font-mono text-[10px] text-paper/80">
              <span>Tugas harian</span>
              <span>
                {doneCount}/{tasks.length} · {pct}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full border-2 border-ink bg-paper">
              <div className="h-full rounded-full bg-teal transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {(doubleActive || freezes > 0) && <div className="mt-3 flex flex-wrap gap-2">
          {doubleActive && (
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-yellow px-3 py-1 font-mono text-[11px] font-medium text-ink">
              ⚡ Double Poin siap — selesaikan 1 tugas
            </div>
          )}
          {freezes > 0 && (
            <button
              onClick={onUseFreeze}
              className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-sky px-3 py-1 font-mono text-[11px] font-medium text-paper transition-transform hover:-translate-y-0.5 active:translate-y-0"
              title="Pakai 1 Streak Freeze untuk melindungi streak hari ini"
            >
              🧊 {freezes}× Freeze · Gunakan
            </button>
          )}
        </div>}
      </section>}

      <div className={mode === 'jadwal' ? '' : 'grid gap-6 lg:grid-cols-[1.55fr_1fr]'}>
        {/* TIME-BLOCKING */}
        {mode === 'jadwal' ? (
        <>
        {/* GAME BANNER: karakter penjelajah jadwal */}
        {(() => {
          const quests = [...daySchedule].sort((a, b) => toMin(a.start) - toMin(b.start))
          const next = quests[0]
          return (
            <section className="pixel-frame relative mb-6 overflow-hidden bg-[#2b2140]">
              <div
                className="relative h-44 sm:h-48"
                style={{ background: 'linear-gradient(#3b2d63 0%, #5b3f8c 58%, #2f6b4f 58%, #255640 100%)' }}
              >
                {Array.from({ length: 16 }).map((_, i) => (
                  <span key={i} className="absolute h-1.5 w-1.5 bg-cream/70" style={{ left: `${(i * 41) % 100}%`, top: `${(i * 17) % 50}%` }} />
                ))}
                {/* jalan setapak pixel */}
                <div className="absolute inset-x-0 bottom-[22%] h-2 bg-[repeating-linear-gradient(90deg,#f3dfb5_0_16px,transparent_16px_28px)] opacity-60" />

                <Blacksmith className="absolute bottom-[3%] left-[3%] h-24 w-28 sm:left-[8%] sm:h-28 sm:w-32" />
                <div className="anim-flicker absolute bottom-[34%] left-[38%] hidden text-3xl sm:block">🔥</div>
                

                {/* papan quest */}
                <div className="absolute right-[20%] top-4 max-w-[58%] border-4 border-ink bg-[#f3dfb5] p-3 text-ink shadow-[4px_4px_0_0_var(--color-ink)] sm:right-[18%] sm:max-w-xs">
                  <div className="font-pixel text-[8px] leading-relaxed">📜 PAPAN QUEST · {sel.dow.toUpperCase()} {sel.date} {sel.mon.toUpperCase()}</div>
                  {next ? (
                    <>
                      <div className="mt-2 font-display text-sm leading-tight">{next.title}</div>
                      <div className="font-mono text-[12px] text-ink/70">
                        {next.start}–{next.end} · {next.room}
                      </div>
                    </>
                  ) : (
                    <div className="mt-2 font-mono text-[13px]">Belum ada quest. Tambahkan jadwal untuk memulai petualangan!</div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t-4 border-ink bg-[#1d1630] px-4 py-2.5">
                <span className="font-pixel text-[9px] text-yellow">⚔ {quests.length} QUEST HARI INI</span>
                <span className="font-pixel text-[8px] text-cream/70">{conflictPairs > 0 ? `⚠ ${conflictPairs} BENTROK` : '✓ JALUR AMAN'}</span>
              </div>
            </section>
          )
        })()}
        <section className="card-brutal rounded-2xl bg-paper p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl tracking-tight">Time-Blocking Visual</h2>
            </div>
            <div className="order-3 flex gap-2 w-full sm:order-none sm:w-auto">
              <button
                onClick={() => openForm('jadwal')}
                className="flex-1 rounded-full border-2 border-ink bg-ink px-4 py-1.5 font-display text-sm text-cream transition-transform hover:-translate-y-0.5 sm:flex-none"
              >
                + Jadwal
              </button>
              <button
                onClick={() => openForm('tugas')}
                className="flex-1 rounded-full border-2 border-ink bg-orange px-4 py-1.5 font-display text-sm text-paper transition-transform hover:-translate-y-0.5 sm:flex-none"
                style={{ boxShadow: '2px 2px 0 0 var(--color-ink)' }}
              >
                + Tugas
              </button>
            </div>
            {conflictPairs > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-berry px-3 py-1 font-mono text-xs font-medium text-paper">
                <span aria-hidden>⚠</span> {conflictPairs} bentrok terdeteksi
              </span>
            ) : (
              <span className="rounded-full border-2 border-ink bg-teal px-3 py-1 font-mono text-xs font-medium text-paper">
                Bebas bentrok ✓
              </span>
            )}
          </div>

          {/* WEEK SELECTOR */}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button onClick={() => goMonth(-1)} aria-label="Bulan sebelumnya" className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-cream font-display transition-transform hover:-translate-y-0.5">‹</button>
              <span className="min-w-[10.5rem] rounded-full border-2 border-ink bg-yellow px-3 py-1 text-center font-display text-sm tracking-tight">
                📅 {MONTHS[sel.month]} {sel.year}
              </span>
              <button onClick={() => goMonth(1)} aria-label="Bulan berikutnya" className="grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-cream font-display transition-transform hover:-translate-y-0.5">›</button>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => goWeek(-1)} className="rounded-full border-2 border-ink bg-cream px-2.5 py-1 font-mono text-[11px] transition-transform hover:-translate-y-0.5">‹ Minggu</button>
              <button onClick={goToday} className="rounded-full border-2 border-ink bg-ink px-2.5 py-1 font-mono text-[11px] text-cream transition-transform hover:-translate-y-0.5">Hari ini</button>
              <button onClick={() => goWeek(1)} className="rounded-full border-2 border-ink bg-cream px-2.5 py-1 font-mono text-[11px] transition-transform hover:-translate-y-0.5">Minggu ›</button>
            </div>
          </div>
          <p className="mb-2 font-mono text-[11px] text-ink/60">
            {sel.dow}, {sel.date} {MONTHS[sel.month]} {sel.year}
          </p>
          <div className="mb-4 grid grid-cols-7 gap-1.5">
            {WEEK.map((d) => {
              const active = selectedDay === d.off
              const count = perDayCount(d.off)
              return (
                <button
                  key={d.off}
                  onClick={() => setSelectedDay(d.off)}
                  className="flex flex-col items-center gap-0.5 rounded-xl border-2 border-ink py-2 transition-transform hover:-translate-y-0.5"
                  style={{
                    background: active ? 'var(--color-ink)' : 'var(--color-cream)',
                    color: active ? 'var(--color-cream)' : 'var(--color-ink)',
                    boxShadow: active ? 'none' : '2px 2px 0 0 var(--color-ink)',
                  }}
                >
                  <span className="font-mono text-[10px] opacity-70">{d.dow}</span>
                  <span className="font-display text-base leading-none">{d.date}</span>
                  <span className="font-mono text-[9px] uppercase opacity-70">{d.mon}</span>
                  <span
                    className="mt-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[9px]"
                    style={{
                      background: count ? 'var(--color-orange)' : 'transparent',
                      color: count ? 'var(--color-paper)' : 'transparent',
                    }}
                  >
                    {count || '·'}
                  </span>
                </button>
              )
            })}
          </div>

          {daySchedule.length === 0 && (
            <div className="mb-4 flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-ink/40 py-10 text-center">
              <PixelIcon name="cuaca" size={44} />
              <p className="text-sm text-ink/60">Belum ada jadwal di hari ini.</p>
              <button onClick={() => openForm('jadwal')} className="font-display text-sm text-orange underline">
                + Tambah sekarang
              </button>
            </div>
          )}

          {daySchedule.length > 0 && (
          <ul className="flex flex-col gap-2.5">
            {[...placed].sort((a, b) => a.s - b.s).map(({ block, s, e }) => {
              const isConflict = conflict.has(block.id)
              return (
                <li key={block.id} className="flex items-stretch gap-3">
                  <div className="w-12 shrink-0 pt-2 text-right font-mono text-[12px] leading-tight text-ink/60">
                    <div className="font-medium text-ink">{fmt(s)}</div>
                    <div>{fmt(e)}</div>
                  </div>
                  <div
                    className="group relative flex-1 border-[3px] border-ink px-3 py-2.5 pr-9 transition-transform hover:-translate-y-0.5"
                    style={{
                      background: SWATCH[block.color],
                      boxShadow: isConflict ? '0 0 0 3px var(--color-paper), 0 0 0 6px var(--color-berry)' : '3px 3px 0 0 var(--color-ink)',
                      color: block.color === 'yellow' ? 'var(--color-ink)' : 'var(--color-paper)',
                    }}
                  >
                    <p className="font-display text-sm leading-tight">
                      <span className="mr-1.5 inline-block align-[-3px]">
                        <PixelIcon name={({ kelas: 'kelas', tugas: 'tugas', belajar: 'belajar', organisasi: 'organisasi', kerja: 'kerja', olahraga: 'olahraga', pribadi: 'home', lainnya: 'lainnya' } as const)[block.kind]} size={18} />
                      </span>
                      {block.title}
                    </p>
                    <p className="truncate text-[12px] opacity-90">{block.room}</p>
                    {isConflict && (
                      <span className="mt-1 inline-block bg-paper px-1.5 py-0.5 font-mono text-[9px] font-bold text-berry">BENTROK</span>
                    )}
                    <button
                      onClick={() => deleteBlock(block.id)}
                      aria-label="Hapus jadwal"
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center border border-current text-[10px] font-bold opacity-60 transition-opacity group-hover:opacity-100"
                      style={{ background: 'rgba(0,0,0,0.25)' }}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
          )}

        </section>
        </>
        ) : (
        <section className="card-brutal rounded-2xl bg-paper p-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl tracking-tight">Menu Utama</h2>
              <p className="font-mono text-[11px] text-ink/60">Akses fitur Agenda dengan cepat</p>
            </div>
            <span className="rounded-full border-2 border-ink bg-cream px-3 py-1 font-mono text-[11px] font-medium">{MENU.length} Fitur</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {MENU.map((m) => (
              <button
                key={m.id}
                onClick={() => (m.id === 'tugas' ? document.getElementById('tugas-hari-ini')?.scrollIntoView({ behavior: 'smooth' }) : m.id === 'tambah' ? openForm('jadwal') : onNavigate?.(m.id))}
                className="flex flex-col items-center gap-3 rounded-2xl border-2 border-ink bg-cream px-2 py-5 shadow-[3px_3px_0_0_var(--color-ink)] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
              >
                <span className="grid h-16 w-16 place-items-center border-[3px] border-ink bg-[#2b2140]" style={{ boxShadow: `inset 0 -4px 0 0 var(--color-${m.color}), inset 3px 3px 0 0 rgba(255,255,255,.12)` }}>
                  <PixelIcon name={m.id} size={40} />
                </span>
                <span className="font-display text-sm tracking-tight">{m.label}</span>
              </button>
            ))}
          </div>
        </section>
        )}

        {/* RIGHT COLUMN */}
        {mode === 'home' && (
        <div className="flex flex-col gap-6">
          {/* TASKS */}
          <section className="card-brutal rounded-2xl bg-paper p-5">
            <h3 id="tugas-hari-ini" className="mb-3 scroll-mt-24 font-display text-lg tracking-tight">Tugas hari ini</h3>
            <ul className="flex flex-col gap-2.5">
              {tasks.map((t) => (
                <li key={t.id} className="relative">
                  <button
                    onClick={() => toggle(t)}
                    className="flex w-full items-center gap-3 rounded-xl border-2 border-ink px-3 py-2.5 text-left transition-all hover:-translate-y-0.5"
                    style={{
                      background: t.done ? 'var(--color-teal)' : 'var(--color-cream)',
                      color: t.done ? 'var(--color-paper)' : 'var(--color-ink)',
                      boxShadow: t.done ? 'none' : '2px 2px 0 0 var(--color-ink)',
                    }}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-ink font-bold"
                      style={{ background: t.done ? 'var(--color-yellow)' : 'var(--color-paper)', color: 'var(--color-ink)' }}
                    >
                      {t.done ? '✓' : ''}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm font-semibold ${t.done ? 'line-through opacity-80' : ''}`}>
                        {t.label}
                      </span>
                      <span className="block font-mono text-[11px] opacity-70">{t.sub}</span>
                      {t.deadline && !t.done && (
                        <span
                          className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] font-medium"
                          style={{ color: isLate(t) ? 'var(--color-berry)' : 'var(--color-teal)' }}
                        >
                          {isLate(t) ? '⚠ Terlambat' : '⏰'}
                          {' '}
                          {new Date(t.deadline).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      )}
                    </span>
                    <span
                      className="shrink-0 rounded-full border-2 border-ink px-2 py-0.5 font-mono text-[11px] font-medium"
                      style={{
                        background: isLate(t) && !t.done ? 'var(--color-ink)' : doubleActive && !t.done ? 'var(--color-orange)' : 'var(--color-yellow)',
                        color: isLate(t) && !t.done ? 'var(--color-cream)' : doubleActive && !t.done ? 'var(--color-paper)' : 'var(--color-ink)',
                        textDecoration: isLate(t) && !t.done ? 'line-through' : 'none',
                      }}
                      title={isLate(t) && !t.done ? 'Tenggat lewat — poin hangus' : doubleActive && !t.done ? 'Double Poin aktif — selesaikan untuk 2× poin!' : undefined}
                    >
                      {doubleActive && !t.done ? `⚡ +${t.points * 2}` : `+${t.points}`}
                    </span>
                  </button>
                  {burst === t.id && (
                    <span className="pointer-events-none absolute -top-2 right-2 animate-bounce font-display text-sm text-orange">
                      +{t.points}!
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* SMART REMINDER */}
          <section className="card-brutal rounded-2xl bg-ink p-5 text-cream">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-2xl tracking-tight">Smart Reminder</h2>
              <div className="shrink-0 border-2 border-cream/30 px-2 py-1 text-right">
                <div className="font-pixel text-[11px] tabular-nums text-yellow">
                  {hhmm(now).replace('.', ':')}
                  <span className="text-cream/50">:{String(now.getSeconds()).padStart(2, '0')}</span>
                </div>
                <div className="font-mono text-[10px] text-cream/50">
                  {HARI[now.getDay()]}, {now.getDate()}/{now.getMonth() + 1}
                </div>
              </div>
            </div>
            <p className="mt-1 mb-4 font-mono text-[11px] text-cream/60">Terhubung ke jam perangkat · diperbarui otomatis.</p>
            {reminders.length === 0 ? (
              <p className="border-2 border-cream/20 px-3 py-3 font-mono text-[12px] text-cream/60">Tidak ada jadwal atau tenggat mendatang.</p>
            ) : (
            <ul className="flex flex-col gap-2.5">
              {reminders.map((r) => {
                const mins = (r.at.getTime() - now.getTime()) / 60000
                const live = !!r.end && now >= r.at && now < r.end
                const urgent = live || mins <= 60
                return (
                <li
                  key={r.id}
                  className="flex items-start gap-3 border-2 px-3 py-2.5"
                  style={{ borderColor: SWATCH[r.tone], background: 'rgba(253,243,227,0.04)' }}
                >
                  <span className="mt-0.5 shrink-0">
                    <PixelIcon name={r.kind === 'tugas' ? 'alarm' : 'jadwal'} size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug">{r.text}</span>
                    <span className="font-mono text-[11px] text-cream/55">{whenLabel(r, now)}</span>
                  </span>
                  {urgent && (
                    <span className="shrink-0 px-2 py-0.5 font-mono text-[10px] font-medium text-paper" style={{ background: live ? 'var(--color-teal)' : 'var(--color-orange)' }}>
                      {live ? 'berlangsung' : 'segera'}
                    </span>
                  )}
                </li>
                )
              })}
            </ul>
            )}
          </section>
        </div>
        )}
      </div>

      {/* ADD MODAL */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setShowForm(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border-[3px] border-ink bg-paper p-6 shadow-[6px_6px_0_0_var(--color-ink)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header + mode toggle */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex rounded-xl border-2 border-ink overflow-hidden">
                {(['jadwal', 'tugas'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setFormMode(m)}
                    className="px-4 py-1.5 font-display text-sm transition-colors"
                    style={{
                      background: formMode === m ? 'var(--color-ink)' : 'var(--color-paper)',
                      color: formMode === m ? 'var(--color-cream)' : 'var(--color-ink)',
                    }}
                  >
                    {m === 'jadwal' ? '🗓 Jadwal' : '✅ Tugas'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink font-display hover:bg-cream"
              >
                ✕
              </button>
            </div>

            {formMode === 'jadwal' ? (
              <>
                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-ink/60">Hari</label>
                <div className="mb-3 grid grid-cols-7 gap-1">
                  {WEEK.map((d) => {
                    const active = draft.day === d.off
                    return (
                      <button
                        key={d.off}
                        onClick={() => setDraft({ ...draft, day: d.off })}
                        className="flex flex-col items-center rounded-lg border-2 border-ink py-1.5 transition-transform hover:-translate-y-0.5"
                        style={{
                          background: active ? 'var(--color-orange)' : 'var(--color-cream)',
                          color: active ? 'var(--color-paper)' : 'var(--color-ink)',
                        }}
                      >
                        <span className="font-mono text-[9px] opacity-70">{d.dow}</span>
                        <span className="font-display text-sm leading-none">{d.date}</span>
                      </button>
                    )
                  })}
                </div>

                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink/60">Judul</label>
                <input
                  autoFocus
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="mis. Jaringan Komputer"
                  className="mb-3 w-full rounded-xl border-2 border-ink bg-cream px-3 py-2 text-sm outline-none focus:bg-paper"
                />

                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink/60">Kategori</label>
                <div className="mb-3 grid grid-cols-4 gap-1.5">
                  {KIND_LIST.filter((k) => k.id !== 'tugas').map((k) => {
                    const active = draft.kind === k.id
                    return (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => setDraft({ ...draft, kind: k.id })}
                        className="flex flex-col items-center gap-1 border-2 border-ink px-1 py-2 transition-transform hover:-translate-y-0.5"
                        style={{
                          background: active ? 'var(--color-ink)' : 'var(--color-cream)',
                          color: active ? 'var(--color-cream)' : 'var(--color-ink)',
                          boxShadow: active ? 'none' : '2px 2px 0 0 var(--color-ink)',
                        }}
                      >
                        <PixelIcon name={KIND_PIXEL[k.id]} size={20} />
                        <span className="font-mono text-[10px] leading-none">{k.label}</span>
                      </button>
                    )
                  })}
                </div>

                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink/60">Lokasi</label>
                <input
                  value={draft.room}
                  onChange={(e) => setDraft({ ...draft, room: e.target.value })}
                  placeholder="mis. Ruang C-303"
                  className="mb-3 w-full rounded-xl border-2 border-ink bg-cream px-3 py-2 text-sm outline-none focus:bg-paper"
                />

                <div className="mb-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink/60">Mulai</label>
                    <input
                      type="time"
                      value={draft.start}
                      onChange={(e) => setDraft({ ...draft, start: e.target.value })}
                      className="w-full rounded-xl border-2 border-ink bg-cream px-3 py-2 font-mono text-sm outline-none focus:bg-paper"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink/60">Selesai</label>
                    <input
                      type="time"
                      value={draft.end}
                      onChange={(e) => setDraft({ ...draft, end: e.target.value })}
                      className="w-full rounded-xl border-2 border-ink bg-cream px-3 py-2 font-mono text-sm outline-none focus:bg-paper"
                    />
                  </div>
                </div>

                <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-ink/60">Warna</label>
                <div className="mb-4 flex gap-2">
                  {(Object.keys(SWATCH) as SwatchKey[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setDraft({ ...draft, color: c })}
                      aria-label={c}
                      className="h-8 w-8 rounded-lg border-2 border-ink transition-transform hover:-translate-y-0.5"
                      style={{
                        background: SWATCH[c],
                        outline: draft.color === c ? '2px solid var(--color-ink)' : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>

                {draftClash ? (
                  <p className="mb-3 rounded-xl border-2 border-ink bg-berry px-3 py-2 font-mono text-[12px] text-paper">
                    ⚠ Bentrok dengan jadwal lain. Tetap simpan? akan ditandai BENTROK.
                  </p>
                ) : draftValid ? (
                  <p className="mb-3 rounded-xl border-2 border-ink bg-teal px-3 py-2 font-mono text-[12px] text-paper">
                    ✓ Waktu bebas bentrok.
                  </p>
                ) : (
                  <p className="mb-3 font-mono text-[12px] text-ink/50">Isi judul & pastikan waktu selesai setelah mulai.</p>
                )}

                <button
                  onClick={addBlock}
                  disabled={!draftValid}
                  className="w-full rounded-xl border-2 border-ink bg-orange px-4 py-3 font-display text-base text-paper transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-45"
                >
                  Simpan ke jadwal
                </button>
              </>
            ) : (
              <>
                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink/60">Nama tugas</label>
                <input
                  autoFocus
                  value={taskDraft.label}
                  onChange={(e) => setTaskDraft({ ...taskDraft, label: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  placeholder="mis. Kumpulkan laporan Basis Data"
                  className="mb-3 w-full rounded-xl border-2 border-ink bg-cream px-3 py-2 text-sm outline-none focus:bg-paper"
                />

                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink/60">Keterangan</label>
                <input
                  value={taskDraft.sub}
                  onChange={(e) => setTaskDraft({ ...taskDraft, sub: e.target.value })}
                  placeholder="mis. Upload ke e-learning"
                  className="mb-3 w-full rounded-xl border-2 border-ink bg-cream px-3 py-2 text-sm outline-none focus:bg-paper"
                />

                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink/60">
                  Tenggat waktu <span className="normal-case text-ink/40">(opsional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={taskDraft.deadline}
                  onChange={(e) => setTaskDraft({ ...taskDraft, deadline: e.target.value })}
                  className="mb-3 w-full rounded-xl border-2 border-ink bg-cream px-3 py-2 font-mono text-sm outline-none focus:bg-paper"
                />
                {taskDraft.deadline && new Date() > new Date(taskDraft.deadline) && (
                  <p className="mb-2 rounded-lg border-2 border-berry bg-berry/10 px-3 py-1.5 font-mono text-[11px] text-berry">
                    ⚠ Tenggat ini sudah lewat — tugas tidak akan memberi poin jika diselesaikan terlambat.
                  </p>
                )}

                <div className="mb-4 flex items-center gap-2 rounded-xl border-2 border-ink/20 px-3 py-2" style={{ background: 'var(--color-cream)' }}>
                  <span className="font-mono text-[11px] text-ink/60">Poin per tugas</span>
                  <span
                    className="ml-auto rounded-full border-2 border-ink px-3 py-0.5 font-mono text-sm font-medium"
                    style={{ background: 'var(--color-yellow)', color: 'var(--color-ink)' }}
                  >
                    ◆ 5
                  </span>
                  <span className="font-mono text-[10px] text-ink/40">· maks 40/hari</span>
                </div>

                {taskDraft.label.trim() ? (
                  <p className="mb-3 rounded-xl border-2 border-ink bg-teal px-3 py-2 font-mono text-[12px] text-paper">
                    ✓ Siap ditambahkan ke daftar tugas.
                  </p>
                ) : (
                  <p className="mb-3 font-mono text-[12px] text-ink/50">Isi nama tugas terlebih dahulu.</p>
                )}

                <button
                  onClick={addTask}
                  disabled={!taskDraft.label.trim()}
                  className="w-full rounded-xl border-2 border-ink bg-orange px-4 py-3 font-display text-base text-paper transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-45"
                >
                  Tambah ke daftar tugas
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
