import { createContext } from 'react'
import type { ClientMessage } from '@shared/protocol'
import type { RoomState } from '@shared/types'

export interface PartyRoomContextValue {
  state: RoomState | null
  connected: boolean
  error: string | null
  send: (message: ClientMessage) => void
}

export const PartyRoomContext = createContext<PartyRoomContextValue | null>(null)
