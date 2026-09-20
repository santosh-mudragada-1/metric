import { audioEngine } from './AudioEngine'
import { blip, glide, noiseBurst, tone } from './synth'

function guarded(fn: () => void): void {
  if (audioEngine.isMuted()) return
  try {
    fn()
  } catch {
    // audio is a non-blocking enhancement — never let it throw into game logic
  }
}

export function playHover(): void {
  guarded(() => tone({ freq: 720, type: 'sine', duration: 0.04, peakGain: 0.24, release: 0.03 }))
}

export function playClick(): void {
  guarded(() => blip(1000))
}

export function playCountdownTick(): void {
  guarded(() => tone({ freq: 440, type: 'triangle', duration: 0.06, peakGain: 0.3, release: 0.04 }))
}

export function playCountdownGo(): void {
  guarded(() => {
    tone({ freq: 880, type: 'sawtooth', duration: 0.12, peakGain: 0.4, release: 0.15 })
    tone({ freq: 1320, type: 'sine', duration: 0.1, peakGain: 0.25, release: 0.12, delay: 0.02 })
  })
}

export function playSuccess(): void {
  guarded(() => {
    tone({ freq: 523.25, type: 'sine', duration: 0.09, peakGain: 0.35 })
    tone({ freq: 659.25, type: 'sine', duration: 0.09, peakGain: 0.35, delay: 0.07 })
    tone({ freq: 783.99, type: 'sine', duration: 0.14, peakGain: 0.4, delay: 0.14 })
  })
}

export function playFail(): void {
  guarded(() => {
    glide(320, 120, { type: 'sawtooth', duration: 0.22, peakGain: 0.35 })
    noiseBurst({ duration: 0.12, filterFreq: 500, peakGain: 0.2 })
  })
}

export function playStreak(comboLevel: number): void {
  guarded(() => {
    const freq = 700 + Math.min(comboLevel, 12) * 55
    tone({ freq, type: 'square', duration: 0.05, peakGain: 0.22, release: 0.05 })
  })
}

export function playReveal(): void {
  guarded(() => tone({ freq: 900, type: 'sine', duration: 0.04, peakGain: 0.2, release: 0.03 }))
}

export function playLevelUp(): void {
  guarded(() => {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) =>
      tone({ freq, type: 'triangle', duration: 0.1, peakGain: 0.35, delay: i * 0.06 }),
    )
  })
}

const TILE_BASE_FREQ = 220
const TILE_SEMITONE = Math.pow(2, 1 / 12)

export function playTile(index: number): void {
  guarded(() => tone({ freq: TILE_BASE_FREQ * Math.pow(TILE_SEMITONE, index * 2), type: 'sine', duration: 0.16, peakGain: 0.4, release: 0.1 }))
}

export function playCopy(): void {
  guarded(() => {
    tone({ freq: 1200, type: 'sine', duration: 0.05, peakGain: 0.25 })
    tone({ freq: 1600, type: 'sine', duration: 0.05, peakGain: 0.2, delay: 0.04 })
  })
}

export function playHeadingHover(): void {
  guarded(() => tone({ freq: 380, type: 'sine', duration: 0.12, peakGain: 0.16, release: 0.18 }))
}

const HEADING_BASE_FREQ = 520
const HEADING_SEMITONE = Math.pow(2, 1 / 12)
// Major pentatonic scale steps — keeps the letter-to-letter glide pleasant regardless of index.
const HEADING_SCALE_STEPS = [0, 2, 4, 7, 9]

export function playHeadingTick(index: number): void {
  guarded(() => {
    const step = HEADING_SCALE_STEPS[index % HEADING_SCALE_STEPS.length]
    const octave = Math.floor(index / HEADING_SCALE_STEPS.length) % 2
    const freq = HEADING_BASE_FREQ * Math.pow(HEADING_SEMITONE, step + octave * 12)
    tone({ freq, type: 'sine', duration: 0.03, peakGain: 0.13, release: 0.04 })
  })
}

export function playBack(): void {
  guarded(() => glide(700, 420, { type: 'sine', duration: 0.09, peakGain: 0.3, release: 0.06 }))
}

// A fast ascending shimmer + high sparkle overtone — pairs with the spinning rainbow-glow CTA.
const RAINBOW_STEPS = [0, 3, 5, 8, 10, 12]
const RAINBOW_BASE_FREQ = 640
const RAINBOW_SEMITONE = Math.pow(2, 1 / 12)

export function playRainbowHover(): void {
  guarded(() => {
    RAINBOW_STEPS.forEach((step, i) => {
      const freq = RAINBOW_BASE_FREQ * Math.pow(RAINBOW_SEMITONE, step)
      tone({ freq, type: 'sine', duration: 0.05, peakGain: 0.3 - i * 0.022, release: 0.06, delay: i * 0.016 })
    })
    tone({ freq: RAINBOW_BASE_FREQ * 4, type: 'triangle', duration: 0.09, peakGain: 0.18, release: 0.14, delay: 0.02 })
    noiseBurst({ duration: 0.07, filterFreq: 7000, filterType: 'highpass', peakGain: 0.1 })
  })
}
