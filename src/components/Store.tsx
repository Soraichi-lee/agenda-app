import { HEROES, type Hero } from '../heroes'
import { HeroSprite } from './HeroSprite'
import { PixelIcon } from '../assets/PixelIcons'
import { useState } from 'react'
import { THEMES, type Theme } from '../lib'
import { useCloud } from '../lib/cloud'
import { buyWithMoney, type ItemType } from '../lib/payment'

type PowerUp = {
  id: string
  emoji: string
  name: string
  desc: string
  price: number
  color: string
}
const POWERUPS: PowerUp[] = [
  { id: 'freeze', emoji: '🧊', name: 'Streak Freeze', desc: 'Selamatkan streak-mu 1 hari saat lupa. Poin tidak hangus.', price: 80, color: 'var(--color-sky)' },
  { id: 'double', emoji: '⚡', name: 'Double Poin 1 Tugas', desc: 'Tugas berikutnya yang kamu selesaikan memberikan 10 poin (2×).', price: 70, color: 'var(--color-yellow)' },
]

function Toast({ msg }: { msg: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-bounce rounded-full border-[3px] border-ink bg-teal px-5 py-2.5 font-display text-sm text-paper shadow-[4px_4px_0_0_var(--color-ink)]">
      {msg}
    </div>
  )
}

// Harga uang asli (simulasi): 1 poin = Rp100
const rupiah = (pts: number) => `Rp${(pts * 100).toLocaleString('id-ID')}`

export default function Store({
  points,
  onSpend,
  freezes,
  onBuyFreeze,
  onUseFreeze,
  doubleActive,
  onBuyDouble,
  ownedThemes,
  onBuyTheme,
  activeTheme,
  onEquipTheme,
  ownedHeroes,
  onBuyHero,
  activeHero,
  onEquipHero,
}: {
  ownedHeroes: string[]
  onBuyHero: (id: string) => void
  activeHero: string
  onEquipHero: (id: string) => void
  points: number
  onSpend: (n: number) => void
  freezes: number
  onBuyFreeze: () => void
  onUseFreeze: () => void
  doubleActive: boolean
  onBuyDouble: () => void
  ownedThemes: string[]
  onBuyTheme: (id: string) => void
  activeTheme: string
  onEquipTheme: (id: string) => void
}) {
  const [toast, setToast] = useState<string | null>(null)
  const cloud = useCloud()
  const [paying, setPaying] = useState(false)
  // Pembayaran sungguhan: item baru diberikan server setelah Midtrans mengonfirmasi lunas.
  const payWithMoney = async (name: string, itemType: ItemType, itemId: string) => {
    if (paying) return
    setPaying(true)
    const r = await buyWithMoney(itemType, itemId)
    if (r === 'paid') {
      await cloud.refresh() // ambil item/poin terbaru dari database
      flash(`${name} berhasil dibeli! 🎉`)
    } else if (r === 'pending') {
      flash('Menunggu konfirmasi pembayaran…')
    } else if (r === 'error') {
      flash('Pembayaran gagal, coba lagi')
    }
    setPaying(false)
  }
  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast((t) => (t === m ? null : t)), 1500)
  }

  const buyPower = (p: PowerUp, money = false) => {
    if (!money && points < p.price) return flash('Poin belum cukup 😅')
    if (p.id === 'double' && doubleActive) return flash('⚡ Double Poin sudah aktif!')
    if (!money) onSpend(p.price)
    if (p.id === 'freeze') onBuyFreeze()
    if (p.id === 'double') onBuyDouble()
    flash(`${p.emoji} ${p.name} dibeli!`)
  }

  const handleHero = (h: Hero, money = false) => {
    if (ownedHeroes.includes(h.id)) {
      onEquipHero(h.id)
      flash(`${h.name} siap bertarung di Focus Timer!`)
      return
    }
    if (!money && points < h.price) return flash('Poin belum cukup 😅')
    if (!money) onSpend(h.price)
    onBuyHero(h.id)
    onEquipHero(h.id)
    flash(`${h.name} bergabung & dipakai!`)
  }

  const handleTheme = (t: Theme, money = false) => {
    if (ownedThemes.includes(t.id)) {
      onEquipTheme(t.id)
      flash(`Tema "${t.name}" dipakai 🎨`)
      return
    }
    if (!money && points < t.price) return flash('Poin belum cukup 😅')
    if (!money) onSpend(t.price)
    onBuyTheme(t.id)
    onEquipTheme(t.id)
    flash(`Tema "${t.name}" terbuka & dipakai!`)
  }

  return (
    <div>
      {toast && <Toast msg={toast} />}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/50"> </p>
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Virtual Store</h1>
          <p className="mt-1 max-w-md text-sm text-ink/70">
            Tukar poin hasil produktivitasmu jadi power-up & tema. Bikin app tetap seru, bukan kaku.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border-[3px] border-ink bg-yellow px-5 py-3 shadow-[4px_4px_0_0_var(--color-ink)]">
          <span className="text-2xl" aria-hidden>◆</span>
          <div>
            <p className="font-display text-2xl leading-none">{points}</p>
            <p className="font-mono text-[11px] text-ink/70">saldo poin</p>
          </div>
        </div>
      </div>

      {/* POWER-UPS */}
      <h2 className="mb-3 font-display text-xl tracking-tight">Power-Up Insentif</h2>
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {POWERUPS.map((p) => {
          const affordable = points >= p.price
          return (
            <div
              key={p.id}
              className="flex flex-col rounded-2xl border-[3px] border-ink bg-paper p-5 shadow-[5px_5px_0_0_var(--color-ink)]"
            >
              <span
                className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink text-2xl"
                style={{ background: p.color }}
              >
                {p.emoji}
              </span>
              <h3 className="font-display text-lg leading-tight">{p.name}</h3>
              <p className="mt-1 mb-4 flex-1 text-sm text-ink/70">{p.desc}</p>
              {p.id === 'freeze' && freezes > 0 && (
                <div className="mb-3 flex items-center justify-between rounded-xl border-2 border-sky/40 bg-sky/10 px-3 py-2">
                  <span className="font-mono text-[11px] text-sky font-medium">🧊 Dimiliki: {freezes}×</span>
                  <button
                    onClick={() => { onUseFreeze(); flash('🧊 Streak Freeze digunakan! Streak aman 1 hari.') }}
                    className="rounded-lg border-2 border-ink bg-sky px-3 py-1 font-display text-xs text-paper transition-transform hover:-translate-y-0.5 active:translate-y-0"
                    style={{ boxShadow: '2px 2px 0 0 var(--color-ink)' }}
                  >
                    Gunakan
                  </button>
                </div>
              )}
              {p.id === 'double' && doubleActive && (
                <div className="mb-3 rounded-xl border-2 border-orange/40 bg-orange/10 px-3 py-2">
                  <p className="font-mono text-[11px] text-orange font-medium">⚡ Aktif — berlaku untuk 1 tugas berikutnya</p>
                  <p className="font-mono text-[10px] text-ink/50 mt-0.5">Selesaikan tugas di Beranda untuk menggunakannya</p>
                </div>
              )}
              <button
                onClick={() => buyPower(p)}
                disabled={!affordable || (p.id === 'double' && doubleActive)}
                className="flex items-center justify-between rounded-xl border-2 border-ink px-4 py-2.5 font-display text-sm transition-all enabled:hover:-translate-y-0.5 disabled:opacity-45"
                style={{ background: affordable && !(p.id === 'double' && doubleActive) ? 'var(--color-orange)' : 'var(--color-cream)', color: affordable && !(p.id === 'double' && doubleActive) ? 'var(--color-paper)' : 'var(--color-ink)' }}
              >
                <span>{p.id === 'double' && doubleActive ? 'Sedang aktif' : affordable ? 'Beli lagi' : 'Kurang poin'}</span>
                <span className="font-mono">◆ {p.price}</span>
              </button>
              {!(p.id === 'double' && doubleActive) && (
                <button
                  onClick={() => payWithMoney(p.name, p.id === 'freeze' ? 'freeze' : 'double', p.id)}
                  className="mt-2 flex w-full items-center justify-between border-2 border-ink bg-paper px-3 py-2 font-display text-sm text-ink transition-all hover:-translate-y-0.5"
                >
                  <span>{paying ? 'Memproses…' : 'Beli pakai uang'}</span>
                  <span className="font-mono">{rupiah(p.price)}</span>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* KARAKTER */}
      <h2 className="mb-1 font-display text-xl tracking-tight">Karakter Pahlawan</h2>
      <p className="mb-4 text-sm text-ink/70">Rekrut pahlawan baru untuk melawan monster di Focus Timer.</p>
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {HEROES.map((h) => {
          const owned = ownedHeroes.includes(h.id)
          const active = activeHero === h.id
          return (
            <div key={h.id} className="overflow-hidden border-[3px] border-ink shadow-[5px_5px_0_0_var(--color-ink)]">
              <div
                className="relative flex h-28 items-end justify-center pb-2"
                style={{ background: 'linear-gradient(#3b2d63 0%, #5b3f8c 62%, #2f6b4f 62%, #255640 100%)' }}
              >
                <div className={owned ? 'anim-bob' : 'opacity-60 grayscale'}>
                  <HeroSprite hero={h} size={80} />
                </div>
                {!owned && (
                  <span className="absolute right-2 top-2 border-2 border-ink bg-yellow px-1.5 py-0.5 font-pixel text-[7px] text-ink">TERKUNCI</span>
                )}
              </div>
              <div className="border-t-[3px] border-ink bg-paper p-4" style={{ boxShadow: `inset 0 4px 0 0 ${h.color}` }}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h3 className="font-display text-base leading-tight">{h.name}</h3>
                  {active && <span className="border-2 border-ink bg-teal px-2 py-0.5 font-mono text-[10px] font-medium text-paper">dipakai</span>}
                </div>
                <p className="mb-3 text-[13px] leading-snug text-ink/65">{h.desc}</p>
                <button
                  onClick={() => handleHero(h)}
                  disabled={active}
                  className="w-full border-2 border-ink px-3 py-2 font-display text-sm transition-all enabled:hover:-translate-y-0.5 disabled:opacity-50"
                  style={{
                    background: active ? 'var(--color-cream)' : owned ? 'var(--color-sky)' : 'var(--color-orange)',
                    color: active ? 'var(--color-ink)' : 'var(--color-paper)',
                  }}
                >
                  {active ? 'Aktif' : owned ? 'Pakai' : `Rekrut · ◆ ${h.price}`}
                </button>
                {!owned && h.price > 0 && (
                  <button
                  onClick={() => payWithMoney(h.name, 'hero', h.id)}
                  className="mt-2 flex w-full items-center justify-between border-2 border-ink bg-paper px-3 py-2 font-display text-sm text-ink transition-all hover:-translate-y-0.5"
                >
                  <span>{paying ? 'Memproses…' : 'Beli pakai uang'}</span>
                  <span className="font-mono">{rupiah(h.price)}</span>
                </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* THEMES */}
      <h2 className="mb-1 font-display text-xl tracking-tight">Tema Tampilan</h2>
      <p className="mb-4 text-sm text-ink/70">Ganti nuansa app secara instan. Beli sekali, pakai kapan saja.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {THEMES.map((t) => {
          const owned = ownedThemes.includes(t.id)
          const active = activeTheme === t.id
          const bg = t.vars['--color-cream'] ?? '#fdf3e3'
          const ink = t.vars['--color-ink'] ?? '#171310'
          return (
            <div
              key={t.id}
              className="overflow-hidden rounded-2xl border-[3px] border-ink shadow-[5px_5px_0_0_var(--color-ink)]"
            >
              {/* preview swatch */}
              <div className="flex h-24 items-center justify-center gap-2" style={{ background: bg }}>
                <span className="h-8 w-8 rounded-lg border-2" style={{ background: t.swatch, borderColor: ink }} />
                <span className="h-8 w-5 rounded-lg border-2" style={{ background: t.vars['--color-yellow'] ?? '#ffc93c', borderColor: ink }} />
                <span className="font-display text-lg" style={{ color: ink }}>Aa</span>
              </div>
              <div className="border-t-[3px] border-ink bg-paper p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-base leading-tight">{t.name}</h3>
                  {active && (
                    <span className="rounded-full border-2 border-ink bg-teal px-2 py-0.5 font-mono text-[10px] font-medium text-paper">
                      dipakai
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleTheme(t)}
                  disabled={active}
                  className="w-full rounded-xl border-2 border-ink px-3 py-2 font-display text-sm transition-all enabled:hover:-translate-y-0.5 disabled:opacity-50"
                  style={{
                    background: active ? 'var(--color-cream)' : owned ? 'var(--color-sky)' : 'var(--color-orange)',
                    color: active ? 'var(--color-ink)' : 'var(--color-paper)',
                  }}
                >
                  {active ? 'Aktif' : owned ? 'Pakai' : t.price === 0 ? 'Gratis' : `Beli · ◆ ${t.price}`}
                </button>
                {!owned && t.price > 0 && (
                  <button
                  onClick={() => payWithMoney(`Tema ${t.name}`, 'theme', t.id)}
                  className="mt-2 flex w-full items-center justify-between border-2 border-ink bg-paper px-3 py-2 font-display text-sm text-ink transition-all hover:-translate-y-0.5"
                >
                  <span>{paying ? 'Memproses…' : 'Beli pakai uang'}</span>
                  <span className="font-mono">{rupiah(t.price)}</span>
                </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
