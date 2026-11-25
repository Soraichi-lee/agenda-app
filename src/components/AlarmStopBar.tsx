import { useEffect, useState } from 'react'
import { isAlarmPlaying, onAlarmPlayingChange, stopAlarm } from '../lib/notify'

// Tombol mengambang "Matikan Alarm" yang muncul selama alarm berbunyi (alarm berulang sampai dimatikan)
export default function AlarmStopBar() {
  const [on, setOn] = useState(isAlarmPlaying())
  useEffect(() => onAlarmPlayingChange(setOn), [])
  if (!on) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4">
      <button
        onClick={stopAlarm}
        className="pointer-events-auto flex items-center gap-3 border-[3px] border-ink bg-berry px-5 py-3 font-pixel text-[11px] text-paper shadow-[4px_4px_0_0_var(--color-ink)] transition-transform hover:-translate-y-0.5"
      >
        <span className="anim-flicker inline-block">●</span> ALARM BERBUNYI · MATIKAN
      </button>
    </div>
  )
}
