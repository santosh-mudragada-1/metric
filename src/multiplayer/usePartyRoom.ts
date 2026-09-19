import { useContext } from 'react'
import { PartyRoomContext } from './PartyRoomContext'

export function usePartyRoom() {
  const ctx = useContext(PartyRoomContext)
  if (!ctx) throw new Error('usePartyRoom must be used within a PartyProvider')
  return ctx
}
