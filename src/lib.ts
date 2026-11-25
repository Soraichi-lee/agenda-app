export const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
export const fmt = (min: number) => {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}.${String(m).padStart(2, '0')}`
}

export type SwatchKey = 'teal' | 'sky' | 'violet' | 'orange' | 'berry' | 'yellow'
export const SWATCH: Record<SwatchKey, string> = {
  teal: 'var(--color-teal)',
  sky: 'var(--color-sky)',
  violet: 'var(--color-violet)',
  orange: 'var(--color-orange)',
  berry: 'var(--color-berry)',
  yellow: 'var(--color-yellow)',
}

/* ---- themes (override CSS vars on the app wrapper) ---- */
export type Theme = {
  id: string
  name: string
  price: number
  swatch: string
  vars: Record<string, string>
}
export const THEMES: Theme[] = [
  { id: 'classic', name: 'Klasik Oranye', price: 0, swatch: '#f26522', vars: {} },
  {
    id: 'mint',
    name: 'Hutan Mint',
    price: 120,
    swatch: '#1f9e8f',
    vars: {
      '--color-cream': '#e8f7ef',
      '--color-paper': '#ffffff',
      '--color-orange': '#1f9e8f',
      '--color-orange-deep': '#177a6e',
      '--color-yellow': '#bff0d4',
    },
  },
  {
    id: 'berry',
    name: 'Senja Berry',
    price: 200,
    swatch: '#e0457b',
    vars: {
      '--color-cream': '#fdedf3',
      '--color-paper': '#fffafc',
      '--color-orange': '#e0457b',
      '--color-orange-deep': '#b8305f',
      '--color-yellow': '#ffd6e6',
    },
  },
  {
    id: 'midnight',
    name: 'Malam Ungu',
    price: 350,
    swatch: '#7c5cd6',
    vars: {
      '--color-cream': '#211d2b',
      '--color-paper': '#2c2739',
      '--color-ink': '#f3ede2',
      '--color-orange': '#a586f0',
      '--color-orange-deep': '#7c5cd6',
      '--color-yellow': '#ffc93c',
    },
  },
]
