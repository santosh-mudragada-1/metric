import { useCallback, useState } from 'react'
import { audioEngine } from '@/lib/sound/AudioEngine'
import { getMuted, setMuted as persistMuted } from '@/lib/storage'
import * as sfx from '@/lib/sound/sfx'

export function useSound() {
  const [muted, setMutedState] = useState(getMuted)

  const toggleMute = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev
      audioEngine.setMuted(next)
      persistMuted(next)
      return next
    })
  }, [])

  return { muted, toggleMute, sfx }
}
