import { createContext } from 'react'
import type { ClientMessage } from '@shared/protocol'
import type { RoomState } from '@shared/types'

export interface PartyRoomContextValue {
  state: RoomState | null
  connected: boolean
  error: string | null
  send: (message: ClientMessage) => void
  /** Player ids to shake, most recent request first — e.g. the host trying to start before everyone's ready. */
  nudge: { playerIds: string[]; at: number } | null
  nudgePlayers: (playerIds: string[]) => void
}

export const PartyRoomContext = createContext<PartyRoomContextValue | null>(null)
