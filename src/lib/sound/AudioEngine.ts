import { getMuted } from '@/lib/storage'

class AudioEngine {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private created = false
  private mutedState = false

  constructor() {
    this.mutedState = typeof window !== 'undefined' ? getMuted() : false
    if (typeof window !== 'undefined') {
      // Some browsers (notably iOS Safari) only honor `resume()` when it's called
      // synchronously inside a real user gesture — a resume requested later from a
      // timer/animation-frame callback is silently ignored if the context fell back
      // to 'suspended'. So this can't just run once on the first tap: it re-attempts
      // the resume on every gesture for the life of the page, which is what actually
      // keeps sounds triggered from timers/animations (not direct taps) audible.
      document.addEventListener('pointerdown', this.unlock, { passive: true })
      document.addEventListener('keydown', this.unlock)
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
    }

    const context = this.context
    if (context && context.state === 'suspended') {
      void context.resume().then(() => {
        if (context.state !== 'running') return
        const primer = context.createBufferSource()
        primer.buffer = context.createBuffer(1, 1, context.sampleRate)
        primer.connect(context.destination)
        primer.start()
      })
    }
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
