import { audioEngine } from './AudioEngine'

interface ToneOptions {
  freq: number
  type?: OscillatorType
  duration?: number
  attack?: number
  release?: number
  peakGain?: number
  delay?: number
  detune?: number
}

export function tone({
  freq,
  type = 'sine',
  duration = 0.15,
  attack = 0.005,
  release = 0.08,
  peakGain = 0.6,
  delay = 0,
  detune = 0,
}: ToneOptions): void {
  const ctx = audioEngine.ctx
  const out = audioEngine.output
  if (!ctx || !out) return

  const start = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  osc.detune.value = detune

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(peakGain, start + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration + release)

  osc.connect(gain)
  gain.connect(out)
  osc.start(start)
  osc.stop(start + duration + release + 0.02)
}

export function glide(freqFrom: number, freqTo: number, opts: Omit<ToneOptions, 'freq'> = {}): void {
  const ctx = audioEngine.ctx
  const out = audioEngine.output
  if (!ctx || !out) return

  const { type = 'sine', duration = 0.18, attack = 0.005, release = 0.06, peakGain = 0.6, delay = 0 } = opts
  const start = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freqFrom, start)
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqTo), start + duration)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(peakGain, start + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration + release)

  osc.connect(gain)
  gain.connect(out)
  osc.start(start)
  osc.stop(start + duration + release + 0.02)
}

interface NoiseOptions {
  duration?: number
  filterFreq?: number
  filterType?: BiquadFilterType
  peakGain?: number
  delay?: number
}

export function noiseBurst({
  duration = 0.18,
  filterFreq = 900,
  filterType = 'lowpass',
  peakGain = 0.5,
  delay = 0,
}: NoiseOptions = {}): void {
  const ctx = audioEngine.ctx
  const out = audioEngine.output
  if (!ctx || !out) return

  const start = ctx.currentTime + delay
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration))
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer

  const filter = ctx.createBiquadFilter()
  filter.type = filterType
  filter.frequency.value = filterFreq

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(peakGain, start)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(out)
  source.start(start)
  source.stop(start + duration + 0.02)
}

export function blip(freq = 1200, delay = 0): void {
  tone({ freq, type: 'square', duration: 0.03, attack: 0.001, release: 0.02, peakGain: 0.25, delay })
}
