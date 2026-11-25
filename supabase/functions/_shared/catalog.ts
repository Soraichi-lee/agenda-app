// Katalog harga di SERVER. Harga tidak pernah diambil dari browser.
// Harus sama dengan harga di aplikasi (1 poin = Rp100) di src/lib.ts, src/heroes.ts, Store.tsx.
export type ItemType = 'premium' | 'theme' | 'hero' | 'freeze' | 'double'
export type Item = { type: ItemType; id: string; name: string; amount: number }

const ITEMS: Item[] = [
  { type: 'premium', id: 'premium_monthly', name: 'Agenda Premium 30 hari', amount: 15000 },

  { type: 'theme', id: 'mint', name: 'Tema Mint', amount: 12000 },
  { type: 'theme', id: 'berry', name: 'Tema Berry', amount: 20000 },
  { type: 'theme', id: 'midnight', name: 'Tema Midnight', amount: 35000 },

  { type: 'hero', id: 'swordsman', name: 'Hero Pendekar Pedang', amount: 15000 },
  { type: 'hero', id: 'fighter', name: 'Hero Ahli Bela Diri', amount: 20000 },
  { type: 'hero', id: 'archer', name: 'Hero Pemanah', amount: 25000 },
  { type: 'hero', id: 'demon', name: 'Hero Raja Iblis', amount: 40000 },

  { type: 'freeze', id: 'freeze', name: 'Streak Freeze', amount: 8000 },
  { type: 'double', id: 'double', name: 'Double Poin 1 Tugas', amount: 7000 },
]

export function findItem(type: string, id: string): Item | null {
  return ITEMS.find((i) => i.type === type && i.id === id) ?? null
}
