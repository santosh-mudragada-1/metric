import { getMuted } from '@/lib/storage'

class AudioEngine {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private unlocked = false
  private mutedState = false

  constructor() {
    this.mutedState = typeof window !== 'undefined' ? getMuted() : false
    if (typeof window !== 'undefined') {
      document.addEventListener('pointerdown', this.unlock, { once: false, passive: true })
    }
  }

  private unlock = () => {
    if (this.unlocked) return
    this.unlocked = true
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const context = new Ctor()
    const master = context.createGain()
    master.gain.value = this.mutedState ? 0 : 0.6
    master.connect(context.destination)
    this.context = context
    this.master = master

    // Acquiring the real audio output stream has startup latency on a fresh page
    // load; without this, the first short one-shot sfx get scheduled and elapse
    // before the audio thread is actually producing samples, so they play silently.
    // Playing a silent buffer immediately forces the stream to spin up right away.
    void context.resume().then(() => {
      const primer = context.createBufferSource()
      primer.buffer = context.createBuffer(1, 1, context.sampleRate)
      primer.connect(context.destination)
      primer.start()
    })
  }

  get ctx(): AudioContext | null {
    if (this.context?.state === 'suspended') void this.context.resume()
    return this.context
  }

  get output(): GainNode | null {
    return this.master
  }

  get ready(): boolean {
    return this.unlocked && !!this.context
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
