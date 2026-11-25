const MONTHS = ['OKT', 'NOV', 'DES', 'JAN', 'FEB', 'MAR']
const ROWS = 7
const COLS = 26 // ~6 bulan dalam minggu

type Habit = {
  id: string
  icon: string
  title: string
  subtitle: string
  streak: number
  color: string
  seed: number
  density: number // 0..1 peluang sel terisi
}

const HABITS: Habit[] = [
  { id: 'study', icon: '📚', title: 'BELAJAR RUTIN', subtitle: 'Sedikit tiap hari, lulus tepat waktu', streak: 12, color: 'var(--color-violet)', seed: 7, density: 0.72 },
  { id: 'sleep', icon: '🌙', title: 'TIDUR TERATUR', subtitle: 'Mimpi besar, tidur lebih besar', streak: 5, color: 'var(--color-teal)', seed: 42, density: 0.66 },
]

const ALPHA = [0.09, 0.32, 0.55, 0.78, 1]
const LEVEL_LABEL = ['Tidak ada', 'Sedikit', 'Cukup', 'Baik', 'Luar biasa']

// PRNG deterministik agar grid stabil antar render
function makeGrid(seed: number, density: number) {
  let s = seed * 9301 + 49297
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  const cells: number[] = []
  for (let i = 0; i < ROWS * COLS; i++) {
    const r = rnd()
    cells.push(r > density ? 0 : Math.min(4, 1 + Math.floor(rnd() * 4)))
  }
  return cells
}

// Level pixel hari ini dari menit fokus di Focus Timer
const levelFromMinutes = (m: number) => (m <= 0 ? 0 : m < 25 ? 1 : m < 50 ? 2 : m < 100 ? 3 : 4)

function HabitCard({ h, todayMinutes }: { h: Habit; todayMinutes?: number }) {
  const cells = makeGrid(h.seed, h.density)
  const linked = todayMinutes !== undefined
  const todayIdx = cells.length - 1
  if (linked) cells[todayIdx] = levelFromMinutes(todayMinutes)
  return (
    <div className="card-brutal-sm rounded-2xl bg-paper p-4 overflow-hidden">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-ink text-lg" style={{ background: h.color }}>
          {h.icon}
        </span>
        <div className="mr-auto min-w-0">
          <p className="font-display text-sm leading-tight tracking-tight">{h.title}</p>
          <p className="truncate font-mono text-[11px] text-ink/55">{h.subtitle}</p>
        </div>
      </div>
      {linked && (
        <p className="mb-3 border-2 border-ink bg-cream px-2.5 py-1.5 font-mono text-[11px]">
          ⏱ Tersambung ke Focus Timer · hari ini <b>{todayMinutes} menit</b> fokus ({LEVEL_LABEL[levelFromMinutes(todayMinutes)]})
        </p>
      )}

      {/* PIXEL GRID — scroll horizontal di dalam kartu */}
      <div className="overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: COLS * 12 }}>
          <div
            className="grid gap-[3px]"
            style={{
              gridTemplateColumns: `repeat(${COLS}, 10px)`,
              gridTemplateRows: `repeat(${ROWS}, 10px)`,
              gridAutoFlow: 'column',
              width: COLS * 13,
            }}
          >
            {cells.map((v, i) => (
              <span
                key={i}
                title={linked && i === todayIdx ? `Hari ini · ${todayMinutes} menit · ${LEVEL_LABEL[v]}` : LEVEL_LABEL[v]}
                className="rounded-[2px] cursor-default transition-transform hover:scale-125 hover:z-10"
                style={{
                  background: h.color,
                  opacity: ALPHA[v],
                  outline: linked && i === todayIdx ? '2px solid var(--color-ink)' : v === 0 ? '1px solid rgba(23,19,16,0.06)' : 'none',
                  outlineOffset: linked && i === todayIdx ? '0px' : '-1px',
                }}
              />
            ))}
          </div>

          {/* month labels */}
          <div className="mt-2 flex justify-between font-mono text-[10px] text-ink/45" style={{ width: COLS * 13 }}>
            {MONTHS.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HabitPixels({ studyMinutesToday = 0 }: { studyMinutesToday?: number }) {
  return (
    <section className="card-brutal rounded-2xl bg-paper p-5 lg:col-span-2 min-w-0">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h3 className="font-display text-lg tracking-tight mr-auto">🌱 Habit Pixels</h3>
        <span className="rounded-full border-2 border-ink bg-yellow px-2.5 py-0.5 font-mono text-[10px] text-ink">6 bulan</span>
      </div>
      {/* LEGENDA */}
      <div className="mb-5 flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[10px] text-ink/50">Aktivitas:</span>
        <span className="font-mono text-[10px] text-ink/40">Rendah</span>
        {[0.09, 0.32, 0.55, 0.78, 1].map((alpha, i) => (
          <span
            key={i}
            title={LEVEL_LABEL[i === 0 ? 0 : i]}
            className="inline-block h-3.5 w-3.5 rounded-[3px] border border-ink/10"
            style={{ background: 'var(--color-violet)', opacity: alpha }}
          />
        ))}
        <span className="font-mono text-[10px] text-ink/40">Tinggi</span>
        <span className="font-mono text-[10px] text-ink/35 ml-1">· arahkan kursor ke pixel untuk detail</span>
      </div>
      <div className="grid gap-4">
        {HABITS.map((h) => (
          <HabitCard key={h.id} h={h} todayMinutes={h.id === 'study' ? studyMinutesToday : undefined} />
        ))}
      </div>
    </section>
  )
}
