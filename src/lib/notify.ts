import { getAlarmSoundUrl, onAlarmSoundChange } from './alarmSound'

// Musik alarm: suara pilihan pengguna (dari penyimpanan HP) atau bawaan /public/notification.mp3.
// Diputar berulang (loop) sampai dimatikan; batas pengaman ALARM_MAX_MS agar tidak berbunyi selamanya.
const DEFAULT_SRC = '/notification.mp3'
const ALARM_MAX_MS = 5 * 60 * 1000
const MUSIC_KEY = 'agenda-alarm-music'
let alarm: HTMLAudioElement | null = null
let alarmTimer: ReturnType<typeof setTimeout> | undefined
let playing = false

const currentSrc = () => getAlarmSoundUrl() ?? DEFAULT_SRC

function getAudio() {
  const src = currentSrc()
  if (!alarm) {
    alarm = new Audio(src)
    alarm.loop = true
    alarm.preload = 'auto'
  } else if (alarm.src !== new URL(src, location.href).href) {
    alarm.src = src
  }
  return alarm
}

// Ganti sumber saat pengguna memilih suara baru (lanjut berbunyi jika sedang aktif)
onAlarmSoundChange(() => {
  if (!alarm) return
  const wasPlaying = playing
  stopAlarm()
  getAudio()
  if (wasPlaying) void startLoop(alarm.volume)
})

// Status alarm untuk UI (tombol "Matikan Alarm")
const playListeners = new Set<(on: boolean) => void>()
const setPlaying = (on: boolean) => { playing = on; playListeners.forEach((f) => f(on)) }
export const isAlarmPlaying = () => playing
export const onAlarmPlayingChange = (f: (on: boolean) => void) => { playListeners.add(f); return () => { playListeners.delete(f) } }

export const isAlarmMusicOn = () => localStorage.getItem(MUSIC_KEY) !== 'off'
export const setAlarmMusicOn = (on: boolean) => localStorage.setItem(MUSIC_KEY, on ? 'on' : 'off')

export function stopAlarm() {
  clearTimeout(alarmTimer)
  if (alarm) {
    alarm.pause()
    alarm.currentTime = 0
  }
  if (playing) setPlaying(false)
}

function startLoop(volume: number): Promise<boolean> {
  const a = getAudio()
  a.loop = true
  a.volume = volume
  a.currentTime = 0
  return a.play().then(
    () => {
      setPlaying(true)
      alarmTimer = setTimeout(stopAlarm, ALARM_MAX_MS)
      return true
    },
    () => false,
  )
}

export function playAlarm(type: 'warn' | 'urgent' = 'warn') {
  if (!isAlarmMusicOn()) return beep(type)
  try {
    stopAlarm()
    startLoop(type === 'urgent' ? 1 : 0.8).then((ok) => { if (!ok) beep(type) }) // diblokir browser -> nada bawaan
  } catch {
    beep(type)
  }
}

/** Uji coba suara alarm (tetap berbunyi meski "Musik Alarm" dimatikan). */
export function previewAlarm(): Promise<boolean> {
  stopAlarm()
  return startLoop(0.9)
}

// Browser memblokir audio sebelum ada interaksi; "buka kunci" musik alarm pada klik/sentuhan pertama
if (typeof window !== 'undefined') {
  const unlock = () => {
    const a = getAudio()
    if (playing) return
    a.muted = true
    a.play()
      .then(() => { if (!playing) { a.pause(); a.currentTime = 0 } })
      .catch(() => {})
      .finally(() => { a.muted = false })
  }
  window.addEventListener('pointerdown', unlock, { once: true })
  window.addEventListener('keydown', unlock, { once: true })
}

// Tetap dipakai pemanggil lama
export const playChime = playAlarm

function beep(type: 'warn' | 'urgent' = 'warn') {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const notes = type === 'urgent' ? [880, 1100, 880] : [660, 880]
    let t = ctx.currentTime
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.25, t + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
      osc.start(t)
      osc.stop(t + 0.4)
      t += i === notes.length - 1 ? 0 : 0.22
    })
  } catch {
    // AudioContext not available
  }
}

export async function requestNotifPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const perm = await Notification.requestPermission()
  return perm === 'granted'
}

export function showBrowserNotif(title: string, body: string) {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body, silent: true })
  }
}
