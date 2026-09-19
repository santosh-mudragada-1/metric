import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { usePartySocket } from 'partysocket/react'
import type { ClientMessage, ServerMessage } from '@shared/protocol'
import type { RoomState } from '@shared/types'
import { PARTY_HOST } from '@/lib/partyHost'
import { useProfile } from '@/hooks/useProfile'
import { PartyRoomContext } from './PartyRoomContext'

export function PartyProvider({ roomCode, children }: { roomCode: string; children: ReactNode }) {
  const { profile } = useProfile()
  const [state, setState] = useState<RoomState | null>(null)
  const [connected, setConnected] = useState(false)
  const profileRef = useRef(profile)
  profileRef.current = profile

  const socket = usePartySocket({
    host: PARTY_HOST,
    party: 'main',
    room: roomCode.toLowerCase(),
    onOpen: () => {
      setConnected(true)
      socket.send(
        JSON.stringify({
          type: 'join',
          clientPlayerId: profileRef.current.clientPlayerId,
          name: profileRef.current.name || 'Player',
        } satisfies ClientMessage),
      )
    },
    onClose: () => setConnected(false),
    onMessage: (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data)
        if (message.type === 'state') setState(message.state)
      } catch {
        // ignore malformed messages
      }
    },
  })

  const send = useCallback(
    (message: ClientMessage) => {
      socket.send(JSON.stringify(message))
    },
    [socket],
  )

  useEffect(() => {
    if (socket.readyState === WebSocket.OPEN && profile.name) {
      send({ type: 'join', clientPlayerId: profile.clientPlayerId, name: profile.name })
    }
  }, [profile.name, profile.clientPlayerId, socket, send])

  return <PartyRoomContext.Provider value={{ state, connected, send }}>{children}</PartyRoomContext.Provider>
}
