import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import ForestScene from './ForestScene'
import { HeroSprite, CleanSprite, type Crop } from './HeroSprite'
import monstersImg from '../assets/monsters.png'
import goblinImg from '../assets/monster-goblin.jpg'
import campfireImg from '../assets/campfire.png'

// Potongan sprite sheet monster (assets/monsters.png, 1024x339)
const MONSTER_CROPS: Record<'goblin' | 'dragon' | 'wolf', Crop | null> = {
  goblin: null, // gambar terpisah (assets/monster-goblin.jpg)
  dragon: { x: 335, y: 10, w: 355, h: 325 },
  wolf: { x: 690, y: 10, w: 334, h: 325 },
}
import type { Notif } from './NotificationStack'
import { PixelIcon } from '../assets/PixelIcons'
import { HEROES } from '../heroes'
import { isAttackSfxOn, playAttack, playRest, setAttackSfxOn } from '../lib/sfx'

type Phase = 'fokus' | 'istirahat'

const PRESETS = [
  { label: 'Pomodoro', focus: 25, rest: 5, monster: 'goblin' as const, foe: 'Goblin Malas', stars: 2 },
  { label: 'Deep Work', focus: 50, rest: 10, monster: 'dragon' as const, foe: 'Iblis Distraksi', stars: 3 },
  { label: 'Singkat', focus: 15, rest: 3, monster: 'wolf' as const, foe: 'Serigala Ngantuk', stars: 1 },
]

const XP_PER_LEVEL = 25
const HERO_ATTACK = new Set(['wizard', 'swordsman', 'fighter', 'archer'])

function Bar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between font-pixel text-[8px] text-cream" style={{ textShadow: '2px 2px 0 var(--color-ink)' }}>
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="metal-frame h-5 p-[3px]">
        <div className="h-full transition-[width] duration-1000 ease-linear" style={{ width: `${value * 100}%`, background: color, boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.25)' }} />
      </div>
    </div>
  )
}

export default function FocusTimer({
  onNotify,
  ownedHeroes,
  activeHero,
  onSelectHero,
  onGoStore,
  sessions,
  setSessions,
  minutes,
  setMinutes,
}: {
  sessions: number
  setSessions: Dispatch<SetStateAction<number>>
  minutes: number
  setMinutes: Dispatch<SetStateAction<number>>
  onNotify: (n: Notif) => void
  ownedHeroes: string[]
  activeHero: string
  onSelectHero: (id: string) => void
  onGoStore: () => void
}) {
  const hero = HEROES.find((h) => h.id === activeHero) ?? HEROES[0]
  const [preset, setPreset] = useState(0)
  const [phase, setPhase] = useState<Phase>('fokus')
  const [left, setLeft] = useState(PRESETS[0].focus * 60)
  const [running, setRunning] = useState(false)
  const [subject, setSubject] = useState('')
  const endRef = useRef(false)

  const p = PRESETS[preset]
  const [restMin, setRestMin] = useState(15)
  const [sfxOn, setSfxOn] = useState(isAttackSfxOn())

  // Suara serangan tiap detik selama sesi fokus berjalan (selaras dengan animasi serangan 1 detik)
  useEffect(() => {
    if (!running || left <= 0) return
    if (phase === 'fokus') playAttack(hero.id)
    else playRest()
  }, [left, running, phase, hero.id])
  const total = (phase === 'fokus' ? p.focus : restMin) * 60
  const chooseRest = (m: number) => {
    setRestMin(m)
    if (phase === 'istirahat') {
      setRunning(false)
      setLeft(m * 60)
    }
  }

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          endRef.current = true
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  // Hitung menit fokus setiap kali satu menit penuh berlalu
  useEffect(() => {
    if (running && phase === 'fokus' && left > 0 && left < total && left % 60 === 0) setMinutes((m) => m + 1)
  }, [left, running, phase, total])

  useEffect(() => {
    if (left !== 0 || !endRef.current) return
    endRef.current = false
    setRunning(false)
    if (phase === 'fokus') {
      setSessions((n) => n + 1)
      setMinutes((m) => m + 1)
      onNotify({
        id: `f${Date.now()}`,
        title: 'Sesi fokus selesai!',
        body: `Kerja bagus${subject ? ` belajar ${subject}` : ''}. Saatnya istirahat ${restMin >= 60 ? '1 jam' : `${restMin} menit`}.`,
        icon: '🎯',
        color: 'var(--color-teal)',
      })
      setPhase('istirahat')
      setLeft(restMin * 60)
    } else {
      onNotify({ id: `f${Date.now()}`, title: 'Istirahat selesai', body: 'Ayo lanjut fokus belajar lagi.', icon: '⏰', color: 'var(--color-orange)' })
      setPhase('fokus')
      setLeft(p.focus * 60)
    }
  }, [left, phase, p, restMin, subject, onNotify])

  const choose = (i: number) => {
    setPreset(i)
    setRunning(false)
    setPhase('fokus')
    setLeft(PRESETS[i].focus * 60)
  }
  const reset = () => {
    setRunning(false)
    setLeft(total)
  }
  const skip = () => {
    endRef.current = true
    setLeft(0)
  }

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const remaining = left / total
  const fighting = phase === 'fokus'
  const level = Math.floor(minutes / XP_PER_LEVEL) + 1
  const xp = (minutes % XP_PER_LEVEL) / XP_PER_LEVEL

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {/* ARENA */}
      <section className="pixel-frame overflow-hidden rounded-none bg-[#2b2140]">
        {/* HUD */}
        <div className="flex items-center justify-between gap-3 border-b-4 border-ink bg-[#1d1630] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center border-[3px] border-ink bg-yellow"><HeroSprite hero={hero} size={32} /></div>
            <div>
              <div className="font-pixel text-[10px] text-yellow">{hero.name.toUpperCase()} · LV {level}</div>
              <div className="mt-1.5 h-2.5 w-28 border-2 border-ink bg-ink/60 sm:w-40">
                <div className="h-full bg-sky transition-[width] duration-700" style={{ width: `${xp * 100}%` }} />
              </div>
              <div className="mt-1 font-pixel text-[7px] text-cream/60">
                XP {minutes % XP_PER_LEVEL}/{XP_PER_LEVEL}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSfxOn(!sfxOn)
              setAttackSfxOn(!sfxOn)
            }}
            aria-label={sfxOn ? 'Matikan efek suara' : 'Nyalakan efek suara'}
            title={sfxOn ? 'Efek suara: nyala' : 'Efek suara: mati'}
            className="border-[3px] border-ink bg-[#3b2d63] px-2 py-1 font-pixel text-[8px] text-cream"
          >
            {sfxOn ? '♪ ON' : '♪ OFF'}
          </button>
          <span className="border-[3px] border-ink px-2 py-1 font-pixel text-[8px] text-ink" style={{ background: fighting ? 'var(--color-orange)' : 'var(--color-teal)' }}>
            {fighting ? '⚔ PERTEMPURAN' : '🏕 PERKEMAHAN'}
          </span>
          </div>
        </div>

        {/* SCENE */}
        <div className="relative h-64 overflow-hidden sm:h-72">
          <ForestScene dim={!fighting} />

          {/* timer */}
          <div className="absolute inset-x-0 top-4 text-center">
            <div className="wood-panel relative inline-block px-5 py-2 font-pixel text-3xl tabular-nums text-yellow sm:text-4xl" style={{ textShadow: '3px 3px 0 var(--color-ink)' }}>
              <span className="rivet left-1 top-1" /><span className="rivet right-1 top-1" /><span className="rivet bottom-1 left-1" /><span className="rivet bottom-1 right-1" />
              {mm}:{ss}
            </div>
            <div className="mt-2 font-pixel text-[8px] text-cream" style={{ textShadow: '2px 2px 0 var(--color-ink)' }}>MISI: {(subject || 'Belajar').toUpperCase()}</div>
          </div>

          {/* hero */}
          <div className={`absolute bottom-[30%] left-[12%] ${running && fighting ? (hero.id === 'demon' ? 'anim-demon-attack' : HERO_ATTACK.has(hero.id) ? `atk-${hero.id}` : 'anim-attack') : 'anim-bob'}`}><HeroSprite hero={hero} size={84} /></div>

          {/* Efek serangan per pahlawan */}
          {running && fighting && hero.id === 'wizard' && (
            <>
              <div className="fx-bolt pointer-events-none absolute bottom-[42%]" />
              <div className="fx-sparkle pointer-events-none absolute bottom-[34%] right-[16%]" />
            </>
          )}
          {running && fighting && hero.id === 'archer' && <div className="fx-arrow pointer-events-none absolute bottom-[40%]" />}
          {running && fighting && hero.id === 'swordsman' && <div className="fx-slash pointer-events-none absolute bottom-[34%] right-[15%]" />}
          {running && fighting && hero.id === 'fighter' && <div className="fx-fire pointer-events-none absolute bottom-[34%] right-[16%]" />}

          {/* Raja Iblis: bola sihir darah melesat ke monster + ledakan */}
          {running && fighting && hero.id === 'demon' && (
            <>
              <div className="demon-orb pointer-events-none absolute bottom-[38%]" />
              <div className="demon-burst pointer-events-none absolute bottom-[34%] right-[16%]" />
            </>
          )}

          {fighting ? (
            <div className="absolute bottom-[30%] right-[12%] text-center">
              {running && <div className="anim-dmg absolute -top-6 left-1/2 -translate-x-1/2 font-pixel text-[10px] text-yellow">-1</div>}
              <div className={running ? `hurt-${p.monster} ${hero.id === 'demon' ? 'hurt-demon-sync' : ''}` : 'monster-idle'}>
                <CleanSprite src={p.monster === 'goblin' ? goblinImg : monstersImg} crop={MONSTER_CROPS[p.monster]} size={92} className={running ? 'hurt-flash' : ''} />
              </div>
            </div>
          ) : (
            <div className="campfire absolute bottom-[26%] right-[13%]">
              <div className="campfire-glow" />
              {running && [0, 1, 2, 3, 4, 5].map((i) => <span key={i} className="campfire-ember" style={{ left: `${30 + ((i * 37) % 40)}%`, animationDelay: `${i * 0.35}s` }} />)}
              <CleanSprite src={campfireImg} size={96} className="campfire-flame" />
            </div>
          )}

          {/* HP bar */}
          <div className="absolute inset-x-4 bottom-3">
            <Bar
              label={fighting ? `HP ${p.foe.toUpperCase()}` : 'ISTIRAHAT'}
              value={fighting ? remaining : 1 - remaining}
              color={fighting ? 'var(--color-berry)' : 'var(--color-teal)'}
            />
          </div>
        </div>

        {/* CONTROLS */}
        <div className="space-y-4 border-t-4 border-ink bg-[#1d1630] p-4">
          <div>
            <div className="mb-2 flex items-center justify-between font-pixel text-[9px] text-cream/70">
              <span>PILIH PAHLAWAN</span>
              <button onClick={onGoStore} className="text-yellow underline">+ REKRUT DI TOKO</button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {HEROES.map((h) => {
                const owned = ownedHeroes.includes(h.id)
                const active = h.id === hero.id
                return (
                  <button
                    key={h.id}
                    onClick={() => (owned ? onSelectHero(h.id) : onGoStore())}
                    title={owned ? h.name : `${h.name} · beli di Toko (◆ ${h.price})`}
                    className="relative flex flex-col items-center border-[3px] border-ink px-1 py-1.5 transition-transform hover:-translate-y-0.5"
                    style={{
                      background: active ? 'var(--color-yellow)' : '#3b2d63',
                      boxShadow: active ? 'none' : '3px 3px 0 0 var(--color-ink)',
                    }}
                  >
                    <span className={owned ? '' : 'opacity-40 grayscale'}>
                      <HeroSprite hero={h} size={36} />
                    </span>
                    <span className="mt-1 font-pixel text-[6px] leading-tight" style={{ color: active ? 'var(--color-ink)' : 'var(--color-cream)' }}>
                      {owned ? h.name.split(' ')[0].toUpperCase() : `◆ ${h.price}`}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 font-pixel text-[9px] text-cream/70">PILIH QUEST</div>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((x, i) => (
                <button
                  key={x.label}
                  onClick={() => choose(i)}
                  className="border-[3px] border-ink px-1.5 py-2 text-center transition-transform hover:-translate-y-0.5"
                  style={{
                    background: preset === i ? 'var(--color-yellow)' : '#3b2d63',
                    color: preset === i ? 'var(--color-ink)' : 'var(--color-cream)',
                    boxShadow: preset === i ? 'none' : '3px 3px 0 0 var(--color-ink)',
                  }}
                >
                  <div className="flex justify-center"><CleanSprite src={x.monster === 'goblin' ? goblinImg : monstersImg} crop={MONSTER_CROPS[x.monster]} size={40} /></div>
                  <div className="mt-1 font-pixel text-[8px] leading-tight">{x.label}</div>
                  <div className="mt-1 text-[10px] tracking-tighter">{'★'.repeat(x.stars)}{'☆'.repeat(3 - x.stars)}</div>
                  <div className="font-pixel text-[7px] opacity-70">
                    FOKUS {x.focus} MNT
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 font-pixel text-[9px] text-cream/70">LAMA ISTIRAHAT</div>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map((m) => {
                const active = restMin === m
                return (
                  <button
                    key={m}
                    onClick={() => chooseRest(m)}
                    className="flex items-center justify-center gap-1.5 border-[3px] border-ink px-1.5 py-2 font-pixel text-[9px] transition-transform hover:-translate-y-0.5"
                    style={{
                      background: active ? 'var(--color-teal)' : '#3b2d63',
                      color: active ? 'var(--color-ink)' : 'var(--color-cream)',
                      boxShadow: active ? 'none' : '3px 3px 0 0 var(--color-ink)',
                    }}
                  >
                    <CleanSprite src={campfireImg} size={18} />
                    {m === 60 ? '1 JAM' : `${m} MNT`}
                  </button>
                )
              })}
            </div>
          </div>

          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Nama misi... (mis. Basis Data)"
            className="w-full border-[3px] border-ink bg-cream px-3 py-2.5 font-pixel text-[10px] text-ink outline-none placeholder:text-ink/40"
          />

          <div className="flex gap-2">
            <button onClick={reset} className="border-[3px] border-ink bg-cream px-3 py-2.5 font-pixel text-[9px] shadow-[3px_3px_0_0_var(--color-ink)] active:translate-y-0.5 active:shadow-none">
              ↺ ULANG
            </button>
            <button
              onClick={() => setRunning((r) => !r)}
              className="flex-1 border-[3px] border-ink px-3 py-2.5 font-pixel text-xs text-ink shadow-[3px_3px_0_0_var(--color-ink)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
              style={{ background: fighting ? 'var(--color-orange)' : 'var(--color-teal)' }}
            >
              {running ? '❚❚ JEDA' : left === total ? (fighting ? '⚔ SERANG!' : '▶ ISTIRAHAT') : '▶ LANJUTKAN'}
            </button>
            <button onClick={skip} className="border-[3px] border-ink bg-cream px-3 py-2.5 font-pixel text-[9px] shadow-[3px_3px_0_0_var(--color-ink)] active:translate-y-0.5 active:shadow-none">
              LEWATI »
            </button>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-6">
        {/* LOOT */}
        <section className="pixel-frame bg-[#2b2140] p-5 text-cream">
          <h3 className="mb-4 flex items-center gap-2 font-pixel text-[11px] text-yellow"><PixelIcon name="backpack" size={20} /> RAMPASAN HARI INI</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="border-[3px] border-ink bg-yellow p-3 text-ink">
              <div className="font-pixel text-xl">{sessions}</div>
              <div className="mt-1.5 font-pixel text-[7px] leading-relaxed">MONSTER DIKALAHKAN</div>
            </div>
            <div className="border-[3px] border-ink bg-sky p-3 text-ink">
              <div className="font-pixel text-xl">{minutes}</div>
              <div className="mt-1.5 font-pixel text-[7px] leading-relaxed">MENIT FOKUS (XP)</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 border-2 border-ink bg-[#1d1630] px-2.5 py-2">
            <PixelIcon name="belajar" size={18} />
            <span className="font-pixel text-[7px] leading-relaxed text-cream/80">
              TERSAMBUNG KE HABIT PIXELS · BELAJAR RUTIN{minutes > 0 ? ' ✓ HARI INI TERCATAT' : ''}
            </span>
          </div>
          <div className="mt-4 font-pixel text-[8px] text-cream/70">TARGET HARIAN · {Math.min(sessions, 8)}/8</div>
          <div className="mt-2 grid grid-cols-8 gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="grid aspect-square place-items-center border-[3px] border-ink text-xs" style={{ background: i < sessions ? 'var(--color-orange)' : '#1d1630' }}>
                {i < sessions && <PixelIcon name="skull" size={18} />}
              </span>
            ))}
          </div>
        </section>

        {/* SCROLL OF TIPS */}
        <section className="pixel-frame bg-[#f3dfb5] p-5 text-ink">
          <h3 className="mb-3 flex items-center gap-2 font-pixel text-[11px]"><PixelIcon name="tugas" size={20} /> GULUNGAN BIJAK</h3>
          <ul className="flex flex-col gap-2 font-mono text-[12px]">
            <li className="flex items-center gap-2.5 border-2 border-ink bg-cream px-3 py-2"><PixelIcon name="shield" size={18} /> Simpan ponsel jauh dari jangkauan.</li>
            <li className="flex items-center gap-2.5 border-2 border-ink bg-cream px-3 py-2"><PixelIcon name="target" size={18} /> Tentukan satu topik per sesi.</li>
            <li className="flex items-center gap-2.5 border-2 border-ink bg-cream px-3 py-2"><PixelIcon name="potion" size={18} /> Saat istirahat, berdiri & minum air.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
