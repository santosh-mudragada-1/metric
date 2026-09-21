import { getMuted } from '@/lib/storage'

class AudioEngine {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private scratchBuffer: AudioBuffer | null = null
  private created = false
  private mutedState = false

  constructor() {
    this.mutedState = typeof window !== 'undefined' ? getMuted() : false
    if (typeof window !== 'undefined') {
      // Browsers gate audio on a real sound having been *started* synchronously
      // inside a user gesture's own call stack — calling resume(), or starting a
      // node inside a resume().then() callback, happens on a later microtask and
      // doesn't count. That's why timer/animation-triggered sfx (countdown ticks,
      // sequence flashes) stayed silent while direct-tap sfx worked: the old code
      // only ever played its priming buffer *after* resume() resolved. Every
      // gesture below now starts a real (silent) buffer synchronously, first,
      // before anything async — matching how Howler.js et al. unlock audio.
      document.addEventListener('pointerdown', this.unlock, { passive: true })
      document.addEventListener('keydown', this.unlock)
      document.addEventListener('touchend', this.unlock, { passive: true })
    }
  }

  private unlock = () => {
    if (!this.created) {
      this.created = true
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const context = new Ctor()
      const master = context.createGain()
      master.gain.value = this.mutedState ? 0 : 0.6
      master.connect(context.destination)
      this.context = context
      this.master = master
      this.scratchBuffer = context.createBuffer(1, 1, context.sampleRate)
    }

    const context = this.context
    if (!context || !this.scratchBuffer) return

    const primer = context.createBufferSource()
    primer.buffer = this.scratchBuffer
    primer.connect(context.destination)
    primer.start(0)

    if (context.state === 'suspended') void context.resume()
  }

  get ctx(): AudioContext | null {
    if (this.context?.state === 'suspended') void this.context.resume()
    return this.context
  }

  get output(): GainNode | null {
    return this.master
  }

  get ready(): boolean {
    return this.created && !!this.context
  }

  isMuted(): boolean {
    return this.mutedState
  }

  setMuted(muted: boolean): void {
    this.mutedState = muted
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.6, this.context.currentTime, 0.02)
    }
  }
}

export const audioEngine = new AudioEngine()
