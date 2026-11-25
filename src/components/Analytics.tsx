import type { ReactNode } from 'react'
import HabitPixels from './HabitPixels'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const trend = [
  { w: 'M1', poin: 210 },
  { w: 'M2', poin: 260 },
  { w: 'M3', poin: 230 },
  { w: 'M4', poin: 300 },
  { w: 'M5', poin: 340 },
  { w: 'M6', poin: 320 },
  { w: 'M7', poin: 390 },
  { w: 'M8', poin: 430 },
]
const completion = [
  { d: 'Sen', rasio: 80 },
  { d: 'Sel', rasio: 100 },
  { d: 'Rab', rasio: 60 },
  { d: 'Kam', rasio: 90 },
  { d: 'Jum', rasio: 75 },
  { d: 'Sab', rasio: 40 },
  { d: 'Min', rasio: 55 },
]
const sks = [
  { d: 'Sen', jam: 3.5 },
  { d: 'Sel', jam: 4.2 },
  { d: 'Rab', jam: 2.1 },
  { d: 'Kam', jam: 3.8 },
  { d: 'Jum', jam: 1.5 },
  { d: 'Sab', jam: 0.8 },
  { d: 'Min', jam: 2.4 },
]

const tick = { fontFamily: 'DM Mono, monospace', fontSize: 11, fill: 'var(--color-ink)' }
const tipStyle = {
  border: '2px solid var(--color-ink)',
  borderRadius: 12,
  background: 'var(--color-paper)',
  fontFamily: 'DM Mono, monospace',
  fontSize: 12,
  color: 'var(--color-ink)',
}

function Panel({ title, tag, children }: { title: string; tag: string; children: ReactNode }) {
  return (
    <section className="card-brutal rounded-2xl bg-paper p-5 min-w-0 overflow-hidden">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg tracking-tight">{title}</h3>
        <span className="rounded-full border-2 border-ink bg-yellow px-2.5 py-0.5 font-mono text-[10px] text-ink">{tag}</span>
      </div>
      {children}
    </section>
  )
}

export default function Analytics({ premium, onSubscribe, studyMinutesToday = 0 }: { premium: boolean; onSubscribe: () => void; studyMinutesToday?: number }) {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Advanced Performance Report</h1>
        </div>
        {premium && (
          <span className="rounded-full border-2 border-ink bg-teal px-3 py-1 font-mono text-xs font-medium text-paper">
            ✓ Langganan aktif
          </span>
        )}
      </div>

      {/* stat row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { k: 'Poin/minggu', v: '+18%', c: 'var(--color-teal)' },
          { k: 'Rasio tugas', v: '71%', c: 'var(--color-sky)' },
          { k: 'Jam belajar', v: '18.3', c: 'var(--color-violet)' },
          { k: 'Streak terbaik', v: '21 hr', c: 'var(--color-orange)' },
        ].map((s) => (
          <div key={s.k} className="card-brutal-sm rounded-xl bg-paper p-4">
            <p className="font-mono text-[11px] text-ink/55">{s.k}</p>
            <p className="font-display text-2xl" style={{ color: s.c }}>
              {s.v}
            </p>
          </div>
        ))}
      </div>

      <div className={premium ? 'relative' : 'relative overflow-hidden'}>
        {/* Saat belum berlangganan: konten buram jadi latar saja, tinggi area mengikuti kartu paywall */}
        <div className={`grid gap-6 lg:grid-cols-2 min-w-0 w-full ${premium ? '' : 'pointer-events-none absolute inset-x-0 top-0 select-none blur-[24px]'}`}>
          <Panel title="Tren Produktivitas" tag="8 minggu">
            <div className="overflow-x-auto">
            <div style={{ minWidth: 320 }}>
            <ResponsiveContainer width="99%" height={220}>
              <AreaChart data={trend} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPoin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-orange)" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="var(--color-orange)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink)" strokeOpacity={0.12} />
                <XAxis dataKey="w" tick={tick} axisLine={{ stroke: 'var(--color-ink)' }} tickLine={false} />
                <YAxis tick={tick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tipStyle} cursor={{ stroke: 'var(--color-ink)', strokeOpacity: 0.3 }} />
                <Area type="monotone" dataKey="poin" stroke="var(--color-ink)" strokeWidth={2.5} fill="url(#gPoin)" />
              </AreaChart>
            </ResponsiveContainer>
            </div></div>
          </Panel>

          <Panel title="Rasio Penyelesaian Tugas" tag="minggu ini">
            <div className="overflow-x-auto">
            <div style={{ minWidth: 320 }}>
            <ResponsiveContainer width="99%" height={220}>
              <BarChart data={completion} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink)" strokeOpacity={0.12} vertical={false} />
                <XAxis dataKey="d" tick={tick} axisLine={{ stroke: 'var(--color-ink)' }} tickLine={false} />
                <YAxis tick={tick} axisLine={false} tickLine={false} unit="%" />
                <Tooltip contentStyle={tipStyle} cursor={{ fill: 'var(--color-ink)', fillOpacity: 0.06 }} />
                <Bar dataKey="rasio" radius={[6, 6, 0, 0]} stroke="var(--color-ink)" strokeWidth={2}>
                  {completion.map((c, i) => (
                    <Cell key={i} fill={c.rasio >= 80 ? 'var(--color-teal)' : c.rasio >= 60 ? 'var(--color-sky)' : 'var(--color-berry)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div></div>
          </Panel>

          <Panel title="Evaluasi Kebiasaan SKS" tag="jam/hari">
            <div className="overflow-x-auto">
            <div style={{ minWidth: 320 }}>
            <ResponsiveContainer width="99%" height={220}>
              <BarChart data={sks} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink)" strokeOpacity={0.12} vertical={false} />
                <XAxis dataKey="d" tick={tick} axisLine={{ stroke: 'var(--color-ink)' }} tickLine={false} />
                <YAxis tick={tick} axisLine={false} tickLine={false} unit="j" />
                <Tooltip contentStyle={tipStyle} cursor={{ fill: 'var(--color-ink)', fillOpacity: 0.06 }} />
                <Bar dataKey="jam" radius={[6, 6, 0, 0]} fill="var(--color-violet)" stroke="var(--color-ink)" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
            </div></div>
          </Panel>
          <HabitPixels studyMinutesToday={studyMinutesToday} />
        </div>

        {/* PAYWALL */}
        {!premium && (
          <div className="relative flex items-start justify-center p-4 pt-6">
            <div className="w-full max-w-md rounded-2xl border-[3px] border-ink bg-ink p-7 text-cream shadow-[6px_6px_0_0_var(--color-orange)]">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-cream/30 px-3 py-1 font-mono text-[11px] text-cream/70">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M16 12H17.4C17.7314 12 18 12.2686 18 12.6V19.4C18 19.7314 17.7314 20 17.4 20H6.6C6.26863 20 6 19.7314 6 19.4V12.6C6 12.2686 6.26863 12 6.6 12H8M16 12V8C16 6.66667 15.2 4 12 4C8.8 4 8 6.66667 8 8V12M16 12H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Konten Premium
              </span>
              <h2 className="mt-4 font-display text-3xl leading-tight">Buka laporan performa lengkap.</h2>
              <p className="mt-2 text-sm text-cream/70">
                Grafik tren, rasio tugas, evaluasi SKS, dan insight otomatis diperbarui tiap hari.
              </p>
              <div className="mt-5 flex items-end gap-2">
                <span className="font-display text-4xl">Rp15.000</span>
                <span className="mb-1 font-mono text-sm text-cream/60">/bulan</span>
              </div>
              <ul className="mt-4 flex flex-col gap-1.5 font-mono text-[12px] text-cream/70">
                <li>✓ Analitik statistik mendalam</li>
                <li>✓ Riwayat tak terbatas</li>
                <li>✓ Insight & rekomendasi AI</li>
                <li>✓ Ekspor laporan PDF</li>
              </ul>
              <button
                onClick={onSubscribe}
                className="mt-6 w-full rounded-xl border-[3px] border-cream bg-orange px-4 py-3 font-display text-base text-paper transition-transform hover:-translate-y-0.5"
              >
                Berlangganan Sekarang
              </button>
              <p className="mt-3 text-center font-mono text-[10px] text-cream/40">Batalkan kapan saja · tanpa komitmen</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
