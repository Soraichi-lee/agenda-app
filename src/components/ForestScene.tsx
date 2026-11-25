import { memo, useEffect, useRef, useState } from 'react'

// Latar arena Focus Timer: hutan malam pixel-art (langit, bulan, awan, gunung, pinus, padang rumput)
// Digambar di grid 256x160 "piksel" dengan crispEdges agar tetap tajam saat diperbesar.
const H = 160
const HORIZON = 98

type Px = [number, number]
const path = (px: Px[]) => px.map(([x, y]) => `M${x} ${y}h1v1h-1z`).join('')

// pseudo-random deterministik
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

function crescent(cx: number, cy: number, r: number): Px[] {
  const out: Px[] = []
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const inA = x * x + y * y <= r * r
    const inB = (x - r * 0.55) ** 2 + (y + r * 0.25) ** 2 <= (r * 0.85) ** 2
    if (inA && !inB) out.push([cx + x, cy + y])
  }
  return out
}

function cloud(cx: number, cy: number, s: number): Px[] {
  const out: Px[] = []
  const blobs = [[0, 0, 5], [6, -2, 6], [13, 0, 5], [-6, 1, 4], [19, 1, 4]].map(([x, y, r]) => [x * s, y * s, r * s])
  for (let y = -10; y <= 6; y++) for (let x = -14; x <= 30; x++) {
    if (y > 4 * s) continue
    if (blobs.some(([bx, by, br]) => (x - bx) ** 2 + (y - by) ** 2 <= br * br)) out.push([cx + x, cy + y])
  }
  return out
}

function ridge(W: number, base: number, amp: number, seed: number, freq: number): string {
  let d = `M0 ${H}`
  for (let x = 0; x <= W; x += 2) {
    const y = Math.round(base - amp * (0.5 + 0.5 * Math.sin(x * freq + seed)) - amp * 0.35 * Math.sin(x * freq * 2.7 + seed * 3))
    d += `L${x} ${y}h2`
  }
  return d + `L${W} ${H}z`
}

function pine(cx: number, baseY: number, h: number): Px[] {
  const out: Px[] = []
  for (let y = 0; y < h; y++) {
    const tier = (y % Math.max(4, (h / 4) | 0)) / Math.max(4, (h / 4) | 0)
    const half = Math.round((y / h) * (h * 0.32) * (0.6 + tier * 0.6)) + 0
    for (let x = -half; x <= half; x++) out.push([cx + x, baseY - h + y])
  }
  for (let y = 0; y < 3; y++) out.push([cx, baseY + y])
  return out
}

function forest(W: number, baseY: number, minH: number, maxH: number, step: number, seed: number): Px[] {
  const out: Px[] = []
  for (let x = -4, i = 0; x < W + 8; x += step, i++) {
    const h = Math.round(minH + rnd(i + seed) * (maxH - minH))
    out.push(...pine(x + Math.round(rnd(i * 3 + seed) * step * 0.5), baseY + Math.round(rnd(i + seed * 7) * 3), h))
  }
  // isi bawah agar tidak bolong
  for (let y = baseY; y < baseY + 6; y++) for (let x = 0; x < W; x++) out.push([x, y])
  return out
}

function bush(cx: number, cy: number, r: number): Px[] {
  const out: Px[] = []
  for (let y = -r; y <= 0; y++) for (let x = -r * 2; x <= r * 2; x++) {
    const a = (x + r) ** 2 + y * y <= r * r, b = (x - r) ** 2 + y * y <= r * r, c = x * x + (y + r * 0.4) ** 2 <= r * r
    if (a || b || c) out.push([cx + x, cy + y])
  }
  return out
}

function rock(cx: number, cy: number, w: number, h: number): { body: Px[]; hi: Px[] } {
  const body: Px[] = [], hi: Px[] = []
  for (let y = -h; y <= 0; y++) for (let x = -w; x <= w; x++) {
    if ((x * x) / (w * w) + (y * y) / (h * h) <= 1) (y < -h * 0.4 && x < 0 ? hi : body).push([cx + x, cy + y])
  }
  return { body, hi }
}

const SKY = ['#0f1030', '#16163f', '#1e1c4f', '#28225e', '#33296b', '#3f2f76', '#4b357f']

const Scene = memo(function Scene({ dim, W: rawW }: { dim: boolean; W?: number }) {
  const W = rawW && Number.isFinite(rawW) ? rawW : 256
  const fx = (f: number) => Math.round(W * f)
  const stars: Px[] = Array.from({ length: Math.round(W / 6) }, (_, i) => [Math.round(rnd(i) * W), Math.round(rnd(i + 99) * 60)])
  const bigStars: Px[] = [[fx(.08), 12], [fx(.27), 26], [fx(.58), 8], [fx(.7), 30], [fx(.94), 50], [fx(.14), 58]]
  const grassTufts: Px[] = []
  for (let i = 0; i < W * 0.7; i++) {
    const x = Math.round(rnd(i * 5) * W), y = HORIZON + 8 + Math.round(rnd(i * 9) * (H - HORIZON - 10))
    grassTufts.push([x, y], [x + 1, y - 1], [x + 2, y])
  }
  const dirt: Px[] = []
  ;[[fx(.23), 128], [fx(.32), 135], [fx(.58), 124], [fx(.8), 140], [fx(.47), 146]].forEach(([x, y], i) => {
    for (let k = 0; k < 6 + (i % 3) * 2; k++) dirt.push([x + k, y + (k % 3 === 0 ? 1 : 0)])
  })
  const flowers: { x: number; y: number; c: string }[] = [
    { x: 10, y: 132, c: '#5b7cfa' }, { x: 18, y: 138, c: '#7a5cff' }, { x: 30, y: 128, c: '#5b7cfa' },
    { x: W - 20, y: 134, c: '#e3a7ff' }, { x: fx(.7), y: 150, c: '#7a5cff' }, { x: fx(.4), y: 152, c: '#5b7cfa' },
  ]
  const r1 = rock(W - 24, 140, 14, 8), r2 = rock(fx(.7), 142, 8, 5), r3 = rock(40, 118, 4, 2), r4 = rock(fx(.84), 120, 4, 2)
  const fireflies = Array.from({ length: 12 }, (_, i) => ({ x: Math.round(rnd(i + 7) * W), y: 58 + Math.round(rnd(i + 31) * 52), d: (rnd(i + 3) * 3).toFixed(2) }))

  return (
    <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges" aria-hidden>
      {/* langit berlapis (gradasi bertingkat ala pixel) */}
      {SKY.map((c, i) => <rect key={c} x={0} y={i * 14} width={W} height={i === SKY.length - 1 ? HORIZON : 14} fill={c} />)}
      <path d={path(stars)} fill="#cfd3ff" opacity={0.75} />
      {bigStars.map(([x, y], i) => (
        <path key={i} className="scene-twinkle" style={{ animationDelay: `${i * 0.4}s` }} d={path([[x, y - 1], [x - 1, y], [x, y], [x + 1, y], [x, y + 1]])} fill="#fff6d8" />
      ))}
      {/* bulan sabit + cahaya */}
      <circle cx={W - 32} cy={24} r={18} fill="#fff3c4" opacity={0.08} />
      <path d={path(crescent(W - 32, 24, 11))} fill="#fff1b8" />
      {/* awan */}
      <g className="scene-cloud"><path d={path(cloud(30, 46, 1))} fill="#3c4a8f" /><path d={path(cloud(31, 44, 0.8))} fill="#5163a8" /></g>
      <g className="scene-cloud" style={{ animationDelay: '-6s' }}><path d={path(cloud(W - 50, 52, 1))} fill="#3c4a8f" /><path d={path(cloud(W - 49, 50, 0.8))} fill="#5163a8" /></g>
      <g className="scene-cloud" style={{ animationDelay: '-3s' }}><path d={path(cloud(fx(.47), 30, 0.6))} fill="#36407d" opacity={0.8} /></g>
      {/* gunung jauh */}
      <path d={ridge(W, HORIZON - 6, 26, 1.3, 0.025)} fill="#3a2f6e" />
      <path d={ridge(W, HORIZON - 2, 14, 4.1, 0.05)} fill="#2d2a5c" />
      {/* hutan pinus jauh & dekat */}
      <path d={path(forest(W, HORIZON, 16, 30, 9, 3))} fill="#1d2550" />
      <path d={path(forest(W, HORIZON + 4, 26, 46, 14, 11).filter(([x]) => x < fx(.27) || x > fx(.73)))} fill="#121a3a" />
      {/* padang rumput */}
      <rect x={0} y={HORIZON + 4} width={W} height={H - HORIZON} fill="#2f6b3c" />
      <rect x={0} y={HORIZON + 4} width={W} height={3} fill="#3d8248" />
      <rect x={0} y={HORIZON + 26} width={W} height={H} fill="#2a6036" />
      <rect x={0} y={HORIZON + 46} width={W} height={H} fill="#23522e" />
      {/* semak kiri & kanan */}
      <path d={path(bush(14, HORIZON + 12, 10))} fill="#2a5a2f" />
      <path d={path(bush(14, HORIZON + 10, 7))} fill="#3a7a3c" />
      <path d={path(bush(W - 12, HORIZON + 16, 11))} fill="#2a5a2f" />
      <path d={path(bush(W - 10, HORIZON + 13, 7))} fill="#3a7a3c" />
      <path d={path(grassTufts)} fill="#4d9a52" />
      <path d={path(dirt)} fill="#5a4636" />
      {/* batu */}
      {[r1, r2, r3, r4].map((r, i) => (
        <g key={i}><path d={path(r.body)} fill="#5d5868" /><path d={path(r.hi)} fill="#857f91" /></g>
      ))}
      {/* bunga */}
      {flowers.map((f, i) => (
        <g key={i}>
          <path d={path([[f.x, f.y + 1], [f.x, f.y + 2], [f.x, f.y + 3], [f.x - 1, f.y + 2]])} fill="#2f7a36" />
          <path d={path([[f.x, f.y - 1], [f.x - 1, f.y], [f.x + 1, f.y], [f.x, f.y + 1]])} fill={f.c} />
          <path d={path([[f.x, f.y]])} fill="#ffe27a" />
        </g>
      ))}
      {/* kunang-kunang */}
      {fireflies.map((f, i) => (
        <rect key={i} className="scene-firefly" style={{ animationDelay: `${f.d}s` }} x={f.x} y={f.y} width={1} height={1} fill="#e8ff6a" />
      ))}
      {/* fase istirahat: lebih gelap & biru */}
      {dim && <rect x={0} y={0} width={W} height={H} fill="#06102a" opacity={0.35} />}
    </svg>
  )
})

// Lebar viewBox mengikuti rasio arena agar pemandangan tidak terpotong/terdistorsi
export default function ForestScene({ dim }: { dim: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(256)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      const next = Math.round((width / height) * H / 4) * 4
      if (height > 0 && Number.isFinite(next)) setW(Math.max(200, Math.min(640, next)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return <div ref={ref} className="absolute inset-0"><Scene dim={dim} W={W} /></div>
}
