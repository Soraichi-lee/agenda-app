import React, { useEffect, useRef, useState, type CSSProperties } from 'react'
import { THEMES } from './lib'
import Home, { type Task } from './components/Home'
import Store from './components/Store'
import Analytics from './components/Analytics'
import Login, { type User } from './components/Login'
import ProfileMenu from './components/ProfileMenu'
import FocusTimer from './components/FocusTimer'
import Settings from './components/Settings'
import NotificationStack, { type Notif } from './components/NotificationStack'
import AlarmStopBar from './components/AlarmStopBar'
import { navIcon, PixelIcon } from './assets/PixelIcons'
import { playChime, requestNotifPermission, showBrowserNotif } from './lib/notify'
import { usePersistentState } from './lib/usePersistentState'
import { useCloud } from './lib/cloud'
import { buyWithMoney } from './lib/payment'

// Pengguna baru mulai dari kosong: tidak ada tugas contoh.
const INITIAL_TASKS: Task[] = []

type View = 'home' | 'jadwal' | 'fokus' | 'store' | 'analytics'
const TABS: { id: View; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { id: 'home', label: 'Beranda', Icon: navIcon('home') },
  { id: 'jadwal', label: 'Jadwal', Icon: navIcon('jadwal') },
  { id: 'store', label: 'Toko', Icon: navIcon('store') },
  { id: 'analytics', label: 'Analitik', Icon: navIcon('analytics') },
]

export default function App() {
  const cloud = useCloud()
  // Pengguna berasal dari sesi Supabase + tabel profiles, bukan lagi dari localStorage.
  const user: User | null =
    cloud.profile && cloud.session
      ? {
          name: cloud.profile.name,
          nim: cloud.profile.nim,
          jurusan: cloud.profile.jurusan,
          email: cloud.session.user.email ?? '',
          avatarColor: cloud.profile.avatar_color,
        }
      : null
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [view, setView] = useState<View>('home')
  const [tasks, setTasks] = usePersistentState<Task[]>('tasks', INITIAL_TASKS)
  const [points, setPoints] = usePersistentState('points', 0)
  const [freezes, setFreezes] = usePersistentState('freezes', 0)
  const [doubleActive, setDoubleActive] = usePersistentState('doubleActive', false)
  const [ownedThemes, setOwnedThemes] = usePersistentState<string[]>('ownedThemes', ['classic'])
  const [activeTheme, setActiveTheme] = usePersistentState('activeTheme', 'classic')
  const [ownedHeroes, setOwnedHeroes] = usePersistentState<string[]>('ownedHeroes', ['wizard'])
  const [activeHero, setActiveHero] = usePersistentState('activeHero', 'wizard')
  // Progres Focus Timer hari ini (dipakai juga oleh Habit Pixels 'Belajar Rutin')
  const today = new Date().toDateString()
  const [focusSessions, setFocusSessions] = usePersistentState(`focusSessions:${today}`, 0)
  const [focusMinutes, setFocusMinutes] = usePersistentState(`focusMinutes:${today}`, 0)
  const premium = cloud.premium // diisi server setelah pembayaran lunas
  const [streak, setStreak] = usePersistentState('streak', 0)
  const [lastStreakDate, setLastStreakDate] = usePersistentState('lastStreakDate', '')
  const [dailyTaskPoints, setDailyTaskPoints] = usePersistentState('dailyTaskPoints', { date: '', earned: 0 })

  const [notifs, setNotifs] = useState<Notif[]>([])
  const shownNotifs = useRef<Set<string>>(new Set())

  const pushNotif = (n: Notif) => {
    setNotifs((prev) => [...prev.slice(-4), n])
    playChime(n.urgent ? 'urgent' : 'warn')
    showBrowserNotif(n.title, n.body)
  }

  const dismissNotif = (id: string) => setNotifs((prev) => prev.filter((n) => n.id !== id))

  // Request browser notification permission once user is logged in
  useEffect(() => { if (user) requestNotifPermission() }, [user])

  // Poll task deadlines every 60 seconds
  useEffect(() => {
    if (!user) return
    const check = () => {
      const now = new Date()
      tasks.forEach((t) => {
        if (t.done || !t.deadline) return
        const deadline = new Date(t.deadline)
        const minsLeft = Math.round((deadline.getTime() - now.getTime()) / 60000)
        const key30 = `task-30-${t.id}`
        const key10 = `task-10-${t.id}`
        const key0 = `task-0-${t.id}`
        if (minsLeft <= 0 && minsLeft > -1 && !shownNotifs.current.has(key0)) {
          shownNotifs.current.add(key0)
          pushNotif({
            id: `${key0}-${Date.now()}`,
            title: '⏰ Tenggat tiba sekarang!',
            body: `"${t.label}" sudah mencapai batas waktu`,
            icon: '⏰',
            color: 'var(--color-berry)',
            urgent: true,
          })
        }
        if (minsLeft > 0 && minsLeft <= 30 && !shownNotifs.current.has(key30)) {
          shownNotifs.current.add(key30)
          pushNotif({
            id: `${key30}-${Date.now()}`,
            title: '⏰ Tenggat mendekat!',
            body: `"${t.label}" — ${minsLeft} menit lagi`,
            icon: '📋',
            color: 'var(--color-orange)',
          })
        }
        if (minsLeft > 0 && minsLeft <= 10 && !shownNotifs.current.has(key10)) {
          shownNotifs.current.add(key10)
          pushNotif({
            id: `${key10}-${Date.now()}`,
            title: '🚨 Tenggat hampir lewat!',
            body: `"${t.label}" — hanya ${minsLeft} menit tersisa`,
            icon: '📋',
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
  }, [user, tasks])

  const toggleTask = (id: string, willComplete: boolean) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: willComplete } : t)))
    const t = tasks.find((x) => x.id === id)
    if (!t) return
    const late = willComplete && !!t.deadline && new Date() > new Date(t.deadline)
    const today = new Date().toDateString()

    if (willComplete && !late) {
      const todayEarned = dailyTaskPoints.date === today ? dailyTaskPoints.earned : 0
      const basePoints = doubleActive ? t.points * 2 : t.points
      const canEarn = Math.max(0, 40 - todayEarned)
      const gain = Math.min(basePoints, canEarn)
      if (gain > 0) setPoints((p) => p + gain)
      setDailyTaskPoints({ date: today, earned: todayEarned + gain })
      if (doubleActive) setDoubleActive(false)

      if (lastStreakDate !== today) {
        setStreak((s) => s + 1)
        setLastStreakDate(today)
      }
    } else if (!willComplete) {
      // unchecking: refund only if not late
      const wasLate = !!t.deadline && new Date() > new Date(t.deadline)
      if (!wasLate) setPoints((p) => p - t.points)
    }
  }

  const subscribePremium = async () => {
    const r = await buyWithMoney('premium', 'premium_monthly')
    if (r === 'paid') {
      await cloud.refresh()
      setView('analytics')
    } else if (r === 'pending') {
      pushNotif({ id: `pay-${Date.now()}`, title: 'Menunggu pembayaran', body: 'Premium aktif otomatis setelah pembayaranmu terkonfirmasi.', icon: '⏳', color: 'var(--color-orange)' })
    } else if (r === 'error') {
      pushNotif({ id: `pay-${Date.now()}`, title: 'Pembayaran gagal', body: 'Terjadi kendala saat membuka pembayaran. Coba lagi.', icon: '⚠️', color: 'var(--color-berry)', urgent: true })
    }
  }

  const themeVars = (THEMES.find((t) => t.id === activeTheme)?.vars ?? {}) as CSSProperties

  if (cloud.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream text-ink" style={themeVars}>
        <p className="font-mono text-sm">Memuat Agenda…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={themeVars}>
        <Login />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream text-ink transition-colors" style={themeVars}>
      {/* HEADER — logo + stats + profile */}
      <header className="sticky top-0 z-30 border-b-4 border-ink bg-paper shadow-[0_4px_0_0_rgba(23,19,16,0.15)]">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <div
            role="img"
            aria-label="Logo aplikasi Agenda: huruf A dengan tanda plus"
            className="h-11 w-11 shrink-0 overflow-hidden border-[3px] border-ink"
            style={{ boxShadow: '3px 3px 0 0 var(--color-ink)' }}
          >
            <PixelIcon name="logo" size={38} />
          </div>
          <div className="mr-auto">
            <p className="font-bungee text-xl leading-none tracking-tight">Agenda</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-yellow px-3 py-1 font-mono text-xs font-medium text-ink">
            ◆ {points}
          </span>
          <ProfileMenu
            user={user}
            points={points}
            streak={streak}
            premium={premium}
            onOpenSettings={() => setSettingsOpen(true)}
            onGoAnalytics={() => setView('analytics')}
            onSubscribe={subscribePremium}
            onLogout={() => void cloud.signOut()}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6">
        {(view === 'home' || view === 'jadwal') && (
          <Home
          mode={view === 'jadwal' ? 'jadwal' : 'home'}
          onNavigate={setView}
          userName={user.name}
          tasks={tasks}
          onToggle={toggleTask}
          onAddTask={(t) => setTasks((prev) => [...prev, t])}
          points={points}
          streak={streak}
          freezes={freezes}
          doubleActive={doubleActive}
          onUseFreeze={() => setFreezes((f) => Math.max(0, f - 1))}
          onNotify={pushNotif}
        />
        )}
        {view === 'store' && (
          <Store
            points={points}
            onSpend={(n) => setPoints((p) => p - n)}
            freezes={freezes}
            onBuyFreeze={() => setFreezes((f) => f + 1)}
            onUseFreeze={() => setFreezes((f) => Math.max(0, f - 1))}
            doubleActive={doubleActive}
            onBuyDouble={() => setDoubleActive(true)}
            ownedThemes={ownedThemes}
            onBuyTheme={(id) => setOwnedThemes((o) => (o.includes(id) ? o : [...o, id]))}
            activeTheme={activeTheme}
            onEquipTheme={setActiveTheme}
            ownedHeroes={ownedHeroes}
            onBuyHero={(id) => setOwnedHeroes((o) => (o.includes(id) ? o : [...o, id]))}
            activeHero={activeHero}
            onEquipHero={setActiveHero}
          />
        )}
        {view === 'fokus' && <FocusTimer onNotify={pushNotif} ownedHeroes={ownedHeroes} activeHero={activeHero} onSelectHero={setActiveHero} onGoStore={() => setView('store')} sessions={focusSessions} setSessions={setFocusSessions} minutes={focusMinutes} setMinutes={setFocusMinutes} />}
        {view === 'analytics' && <Analytics premium={premium} onSubscribe={subscribePremium} studyMinutesToday={focusMinutes} />}
      </main>

      <NotificationStack items={notifs} onDismiss={dismissNotif} />
      <AlarmStopBar />

      {/* BOTTOM NAV */}
      <nav
        className="fixed bottom-0 inset-x-0 z-30 border-t-4 border-ink bg-paper shadow-[0_-4px_0_0_rgba(23,19,16,0.15)]"
      >
        <div className="mx-auto flex max-w-6xl">
          {TABS.map(({ id, label, Icon }) => {
            const active = view === id
            return (
              <button
                key={id}
                onClick={() => setView(id)}
                className="flex flex-1 flex-col items-center gap-1 py-3 transition-colors relative"
                style={{ color: active ? 'var(--color-orange)' : 'var(--color-ink)' }}
              >
                {active && (
                  <span
                    className="absolute top-0 inset-x-6 h-[3px] rounded-b-full"
                    style={{ background: 'var(--color-orange)' }}
                  />
                )}
                <Icon size={22} />
                <span className="font-mono text-[10px] font-medium leading-none flex items-center gap-0.5">
                  {label}
                  {id === 'analytics' && !premium && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-label="Premium" style={{ display: 'inline' }}>
                      <path d="M16 12H17.4C17.7314 12 18 12.2686 18 12.6V19.4C18 19.7314 17.7314 20 17.4 20H6.6C6.26863 20 6 19.7314 6 19.4V12.6C6 12.2686 6.26863 12 6.6 12H8M16 12V8C16 6.66667 15.2 4 12 4C8.8 4 8 6.66667 8 8V12M16 12H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              </button>
            )
          })}
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex flex-1 flex-col items-center gap-1 py-3 transition-colors relative"
            style={{ color: settingsOpen ? 'var(--color-orange)' : 'var(--color-ink)' }}
          >
            {settingsOpen && (
              <span className="absolute top-0 inset-x-6 h-[3px] rounded-b-full" style={{ background: 'var(--color-orange)' }} />
            )}
            <PixelIcon name="settings" size={22} />
            <span className="font-mono text-[10px] font-medium leading-none">Pengaturan</span>
          </button>
        </div>
      </nav>

      {settingsOpen && (
        <Settings
          user={user}
          onUpdate={(u) => void cloud.updateProfile(u)}
          onClose={() => setSettingsOpen(false)}
          onLogout={() => { setSettingsOpen(false); void cloud.signOut() }}
        />
      )}
    </div>
  )
}
