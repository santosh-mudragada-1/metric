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
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.context = new Ctor()
    this.master = this.context.createGain()
    this.master.gain.value = this.mutedState ? 0 : 0.35
    this.master.connect(this.context.destination)
    this.unlocked = true
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
      this.master.gain.setTargetAtTime(muted ? 0 : 0.35, this.context.currentTime, 0.02)
    }
  }
}

export const audioEngine = new AudioEngine()
