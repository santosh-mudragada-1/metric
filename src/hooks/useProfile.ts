import { useState } from 'react'
import { nanoid } from 'nanoid'
import { getProfile, setProfile, type Profile } from '@/lib/storage'

function loadOrCreateProfile(): Profile {
  const existing = getProfile()
  if (existing) return existing
  const created: Profile = { clientPlayerId: nanoid(10), name: '' }
  setProfile(created)
  return created
}

export function useProfile() {
  const [profile, setProfileState] = useState<Profile>(loadOrCreateProfile)

  const updateName = (name: string) => {
    const next = { ...profile, name }
    setProfile(next)
    setProfileState(next)
  }

  return { profile, updateName }
}
