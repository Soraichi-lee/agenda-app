import { useEffect, useState } from 'react'
import { PixelIcon } from '../assets/PixelIcons'
import type { Hero } from '../heroes'

export type Crop = { x: number; y: number; w: number; h: number }
const cache = new Map<string, Promise<string>>()

// Hapus latar putih: flood-fill dari tepi gambar, piksel hampir-putih yang terhubung dibuat transparan
export function removeBg(src: string, crop?: Crop, trim = !!crop): Promise<string> {
  const key = (crop ? `${src}#${crop.x},${crop.y},${crop.w},${crop.h}` : src) + (trim ? '#t' : '')
  if (!cache.has(key))
    cache.set(key, new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const c = crop ?? { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight }
        const w = c.w, h = c.h
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h
        const ctx = cv.getContext('2d')!; ctx.drawImage(img, c.x, c.y, w, h, 0, 0, w, h)
        const d = ctx.getImageData(0, 0, w, h), p = d.data
        const N = w * h
        const sat = (i: number) => Math.max(p[i], p[i + 1], p[i + 2]) - Math.min(p[i], p[i + 1], p[i + 2])
        const lum = (i: number) => (p[i] * 3 + p[i + 1] * 6 + p[i + 2]) / 10
        // Putih/abu sangat terang & hampir tanpa warna = latar
        const isBg = (k: number) => { const i = k * 4; return lum(i) > 205 && sat(i) < 40 }
        const nb = (k: number, f: (n: number) => void) => {
          const x = k % w
          if (x > 0) f(k - 1); if (x < w - 1) f(k + 1); if (k >= w) f(k - w); if (k < N - w) f(k + w)
        }
        const clear = new Uint8Array(N)
        // 1) flood-fill dari tepi
        const seen = new Uint8Array(N), stack: number[] = []
        for (let x = 0; x < w; x++) stack.push(x, N - w + x)
        for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1)
        while (stack.length) {
          const k = stack.pop()!
          if (seen[k]) continue
          seen[k] = 1
          if (!isBg(k)) continue
          clear[k] = 1
          nb(k, (n) => { if (!seen[n]) stack.push(n) })
        }
        // 2) kantong putih tertutup (mis. celah lengan-badan): hapus jika cukup besar; kilau mata kecil tetap
        const minPocket = Math.max(40, (N * 0.0006) | 0)
        for (let k0 = 0; k0 < N; k0++) {
          if (seen[k0] || !isBg(k0)) continue
          const comp: number[] = [], st = [k0]; seen[k0] = 1
          while (st.length) {
            const k = st.pop()!; comp.push(k)
            nb(k, (n) => { if (!seen[n] && isBg(n)) { seen[n] = 1; st.push(n) } })
          }
          if (comp.length >= minPocket) for (const k of comp) clear[k] = 1
        }
        // 2b) celah kecil putih murni di antara garis (mis. sela jari/kaki) juga latar
        const pureWhite = (k: number) => { const i = k * 4; return lum(i) > 236 && sat(i) < 20 }
        for (let k0 = 0; k0 < N; k0++) {
          if (clear[k0] || !pureWhite(k0)) continue
          const comp: number[] = [k0], st = [k0]; clear[k0] = 2
          while (st.length) { const k = st.pop()!; nb(k, (n) => { if (!clear[n] && pureWhite(n)) { clear[n] = 2; st.push(n); comp.push(n) } }) }
          if (comp.length < 4) for (const k of comp) clear[k] = 0
        }
        // 3) tepi anti-alias: pisahkan campuran putih dari warna asli (un-premultiply terhadap putih)
        //    sehingga pinggiran jadi semi-transparan dengan warna aslinya, tanpa halo putih.
        const dist = new Uint8Array(N)
        let front: number[] = []
        for (let k = 0; k < N; k++) if (clear[k]) { dist[k] = 1; front.push(k) }
        for (let r = 2; r <= 4 && front.length; r++) {
          const nx: number[] = []
          for (const k of front) nb(k, (n) => { if (!dist[n]) { dist[n] = r; nx.push(n) } })
          front = nx
        }
        for (let k = 0; k < N; k++) {
          const i = k * 4
          if (clear[k]) { p[i + 3] = 0; continue }
          if (!dist[k]) continue
          const a = Math.max(255 - p[i], 255 - p[i + 1], 255 - p[i + 2]) / 255
          if (a < 0.12) { p[i + 3] = 0; continue }
          for (let c = 0; c < 3; c++) p[i + c] = Math.max(0, Math.min(255, Math.round(255 - (255 - p[i + c]) / a)))
          p[i + 3] = Math.round(Math.min(1, a * 1.15) * 255)
        }
        ctx.putImageData(d, 0, 0)
        if (!trim) return resolve(cv.toDataURL('image/png'))
        // Potongan sprite sheet: trim ke area karakter lalu letakkan di kanvas persegi (rata bawah)
        let x0 = w, y0 = h, x1 = 0, y1 = 0
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (p[(y * w + x) * 4 + 3] > 40) {
          if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
        }
        const tw = x1 - x0 + 1, th = y1 - y0 + 1, side = Math.max(tw, th)
        const out = document.createElement('canvas'); out.width = side; out.height = side
        out.getContext('2d')!.drawImage(cv, x0, y0, tw, th, (side - tw) >> 1, side - th, tw, th)
        resolve(out.toDataURL('image/png'))
      }
      img.onerror = () => resolve(src)
      img.src = src
    }))
  return cache.get(key)!
}

// Menampilkan sprite pahlawan: gambar pixel-art (jika ada) atau ikon pixel bawaan
export function HeroSprite({ hero, size }: { hero: Hero; size: number }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => { if (hero.image) removeBg(hero.image, hero.crop).then(setSrc) }, [hero.image, hero.crop])
  if (hero.image)
    return (
      <span className="hero-img-wrap" style={{ width: size, height: size }}>
        {src && <img src={src} alt="" draggable={false} className={`hero-img-anim idle-${hero.id}`} />}
      </span>
    )
  return <PixelIcon name={hero.sprite} size={size} />
}

// Sprite gambar bebas (mis. monster dari sprite sheet) dengan latar dihapus
export function CleanSprite({ src, crop, size, className }: { src: string; crop?: Crop | null; size: number; className?: string }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => { removeBg(src, crop ?? undefined, true).then(setUrl) }, [src, crop])
  return (
    <span style={{ display: 'inline-block', width: size, height: size }}>
      {url && <img src={url} alt="" draggable={false} className={className} style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'auto' }} />}
    </span>
  )
}
