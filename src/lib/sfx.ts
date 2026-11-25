// Efek suara serangan karakter Focus Timer (disintesis dengan Web Audio, tanpa file)
let ctx: AudioContext | null = null
const getCtx = () => {
  ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

const SFX_KEY = 'agenda-attack-sfx'
export const isAttackSfxOn = () => localStorage.getItem(SFX_KEY) !== 'off'
export const setAttackSfxOn = (on: boolean) => localStorage.setItem(SFX_KEY, on ? 'on' : 'off')

const VOL = 0.18

function tone(c: AudioContext, type: OscillatorType, f0: number, f1: number, t: number, dur: number, vol = VOL) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(f0, t)
  o.frequency.exponentialRampToValueAtTime(f1, t + dur)
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  o.connect(g).connect(c.destination)
  o.start(t)
  o.stop(t + dur)
}

function noise(c: AudioContext, t: number, dur: number, filter: BiquadFilterType, freq: number, vol = VOL) {
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const f = c.createBiquadFilter()
  f.type = filter
  f.frequency.value = freq
  const g = c.createGain()
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  src.connect(f).connect(g).connect(c.destination)
  src.start(t)
}

const SOUNDS: Record<string, (c: AudioContext, t: number) => void> = {
  // Penyihir: bola sihir "zwiing" naik + kilau
  wizard: (c, t) => {
    tone(c, 'sine', 500, 1800, t, 0.25)
    tone(c, 'triangle', 2400, 3200, t + 0.12, 0.15, VOL * 0.5)
  },
  // Pendekar pedang: tebasan "swish" + dentingan logam
  swordsman: (c, t) => {
    noise(c, t, 0.14, 'highpass', 3000)
    tone(c, 'triangle', 1400, 1250, t + 0.08, 0.25, VOL * 0.6)
  },
  // Ahli bela diri: pukulan "buk" berat
  fighter: (c, t) => {
    tone(c, 'sine', 180, 50, t, 0.18, VOL * 1.4)
    noise(c, t, 0.06, 'lowpass', 900, VOL * 0.8)
  },
  // Pemanah: senar busur "twang" + desing anak panah
  archer: (c, t) => {
    tone(c, 'sawtooth', 320, 300, t, 0.12, VOL * 0.5)
    noise(c, t + 0.05, 0.22, 'bandpass', 2200, VOL * 0.7)
  },
  // Raja Iblis: dengung gelap menurun + ledakan sihir darah
  demon: (c, t) => {
    tone(c, 'sawtooth', 220, 55, t, 0.35, VOL * 0.7)
    tone(c, 'square', 110, 40, t, 0.3, VOL * 0.4)
    noise(c, t + 0.08, 0.25, 'lowpass', 600, VOL * 0.9)
  },
}

export function playAttack(heroId: string) {
  if (!isAttackSfxOn()) return
  try {
    const c = getCtx()
    ;(SOUNDS[heroId] ?? SOUNDS.wizard)(c, c.currentTime + 0.01)
  } catch {
    // Web Audio tidak tersedia
  }
}

// Suara istirahat: kayu api unggun berderak pelan (beberapa letupan acak)
export function playRest() {
  if (!isAttackSfxOn()) return
  try {
    const c = getCtx()
    const t = c.currentTime + 0.01
    noise(c, t, 0.9, 'lowpass', 500, VOL * 0.25) // desis api
    const pops = 2 + Math.floor(Math.random() * 3)
    for (let i = 0; i < pops; i++) {
      noise(c, t + Math.random() * 0.8, 0.03, 'bandpass', 1500 + Math.random() * 2500, VOL * 0.9)
    }
  } catch {
    // Web Audio tidak tersedia
  }
}
