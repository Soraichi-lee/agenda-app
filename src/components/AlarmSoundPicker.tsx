import { useEffect, useRef, useState } from 'react'
import { PixelIcon } from '../assets/PixelIcons'
import { ALARM_ACCEPT, canDecode, clearAlarmSound, loadAlarmSound, onAlarmSoundChange, saveAlarmSound, validateAlarmFile } from '../lib/alarmSound'
import { isAlarmPlaying, onAlarmPlayingChange, previewAlarm, stopAlarm } from '../lib/notify'

type Meta = Awaited<ReturnType<typeof loadAlarmSound>>

const fmtSize = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)
const btn = 'flex items-center justify-center gap-2 border-[3px] border-ink px-3 py-2.5 font-display text-sm shadow-[3px_3px_0_0_var(--color-ink)] transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50'

// Pemilih suara alarm dari penyimpanan HP + uji coba & tombol matikan
export default function AlarmSoundPicker() {
  const input = useRef<HTMLInputElement>(null)
  const [meta, setMeta] = useState<Meta>(null)
  const [playing, setPlaying] = useState(isAlarmPlaying())
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    const refresh = () => loadAlarmSound().then(setMeta)
    refresh()
    const offA = onAlarmSoundChange(refresh)
    const offB = onAlarmPlayingChange(setPlaying)
    return () => { offA(); offB() }
  }, [])

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // agar file yang sama bisa dipilih ulang
    if (!file) return
    const err = validateAlarmFile(file)
    if (err) return setMsg({ ok: false, text: err })
    setBusy(true)
    setMsg(null)
    try {
      if (!(await canDecode(file))) return setMsg({ ok: false, text: 'File tidak bisa diputar di perangkat ini. Coba file lain.' })
      await saveAlarmSound(file)
      setMsg({ ok: true, text: 'Suara alarm disimpan. Tekan "Uji Suara" untuk mendengarkan.' })
    } catch {
      setMsg({ ok: false, text: 'Gagal menyimpan file. Pastikan ruang penyimpanan cukup.' })
    } finally {
      setBusy(false)
    }
  }

  const onPreview = async () => {
    if (playing) return stopAlarm()
    const ok = await previewAlarm()
    if (!ok) setMsg({ ok: false, text: 'Browser memblokir pemutaran. Ketuk layar sekali lalu coba lagi.' })
  }

  const onReset = async () => {
    await clearAlarmSound()
    setMsg({ ok: true, text: 'Kembali memakai suara alarm bawaan.' })
  }

  return (
    <div className="border-[3px] border-ink bg-paper p-4 shadow-[3px_3px_0_0_var(--color-ink)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="font-display text-sm">Suara Alarm</p>
          <p className="font-mono text-[11px] text-ink/60">Pilih file .mp3, .wav, atau .ogg dari HP. Diputar berulang sampai dimatikan.</p>
        </div>
        <PixelIcon name="bell" size={22} />
      </div>

      <div className="mb-3 flex items-center gap-3 border-[3px] border-ink bg-cream px-3 py-2">
        <span className={`grid h-8 w-8 shrink-0 place-items-center border-2 border-ink ${playing ? 'bg-orange anim-flicker' : 'bg-yellow'}`}>
          <span className="font-pixel text-[10px]">{playing ? '))' : '♪'}</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm" title={meta?.name}>{meta ? meta.name : 'Bawaan (notification.mp3)'}</p>
          <p className="font-mono text-[11px] text-ink/60">
            {meta ? `${fmtSize(meta.size)} · disimpan ${new Date(meta.savedAt).toLocaleDateString('id-ID')}` : 'Suara default aplikasi'}
            {playing && ' · sedang berbunyi'}
          </p>
        </div>
      </div>

      <input ref={input} type="file" accept={ALARM_ACCEPT} className="hidden" onChange={onPick} />
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => input.current?.click()} disabled={busy} className={`${btn} col-span-2 bg-violet text-paper`}>
          {busy ? 'Memeriksa file...' : meta ? 'Ganti Suara dari HP' : 'Pilih Suara dari HP'}
        </button>
        <button onClick={onPreview} className={`${btn} ${playing ? 'bg-cream' : 'bg-teal text-paper'}`}>
          {playing ? '■ Stop Uji' : '▶ Uji Suara'}
        </button>
        <button onClick={stopAlarm} disabled={!playing} className={`${btn} bg-berry text-paper`}>
          Matikan Alarm
        </button>
        {meta && (
          <button onClick={onReset} className={`${btn} col-span-2 bg-cream`}>
            Pakai Suara Bawaan
          </button>
        )}
      </div>

      {msg && (
        <p role="status" className={`mt-3 border-2 px-3 py-2 font-mono text-[11px] ${msg.ok ? 'border-teal text-teal' : 'border-berry text-berry'}`}>
          {msg.text}
        </p>
      )}
    </div>
  )
}
