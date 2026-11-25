import type { PixelIconName } from './assets/PixelIcons'
import demonImg from './assets/hero-demon.png'
import heroesImg from './assets/heroes.jpg'

export type HeroCrop = { x: number; y: number; w: number; h: number }

export type Hero = { id: string; sprite: PixelIconName; name: string; desc: string; price: number; color: string; image?: string; crop?: HeroCrop }

// Karakter pahlawan untuk Focus Timer (dibeli di Toko)
export const HEROES: Hero[] = [
  { id: 'wizard', sprite: 'wizard', name: 'Penyihir', desc: 'Pahlawan awal dengan tongkat kristal.', price: 0, color: 'var(--color-violet)', image: heroesImg, crop: { x: 0, y: 0, w: 925, h: 1075 } },
  { id: 'swordsman', sprite: 'swordsman', name: 'Pendekar Pedang', desc: 'Ksatria berzirah baja dan pedang panjang.', price: 150, color: 'var(--color-berry)', image: heroesImg, crop: { x: 930, y: 0, w: 1118, h: 1075 } },
  { id: 'fighter', sprite: 'fighter', name: 'Ahli Bela Diri', desc: 'Petarung tangan kosong berikat kepala merah.', price: 200, color: 'var(--color-orange)', image: heroesImg, crop: { x: 0, y: 1075, w: 1024, h: 973 } },
  { id: 'archer', sprite: 'archer', name: 'Pemanah', desc: 'Penembak jitu bertudung hijau dari hutan.', price: 250, color: 'var(--color-teal)', image: heroesImg, crop: { x: 1024, y: 1075, w: 1024, h: 973 } },
  { id: 'demon', sprite: 'wizard', image: demonImg, name: 'Raja Iblis', desc: 'Penguasa bersayap hitam dengan sihir darah merah.', price: 400, color: 'var(--color-berry)' },
]
