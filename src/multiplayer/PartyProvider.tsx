import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { usePartySocket } from 'partysocket/react'
import type { ClientMessage, ServerMessage } from '@shared/protocol'
import type { RoomState } from '@shared/types'
import { PARTY_HOST } from '@/lib/partyHost'
import { useProfile } from '@/hooks/useProfile'
import { detectDeviceType } from '@/lib/device'
import { PartyRoomContext } from './PartyRoomContext'

const CONNECT_TIMEOUT_MS = 10_000

export function PartyProvider({ roomCode, children }: { roomCode: string; children: ReactNode }) {
  const { profile } = useProfile()
  const [state, setState] = useState<RoomState | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
          device: detectDeviceType(),
        } satisfies ClientMessage),
      )
    },
    onClose: () => setConnected(false),
    onError: () => setError(`Couldn't reach the party server at ${PARTY_HOST}. Make sure it's running and reachable from this device.`),
    onMessage: (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data)
        if (message.type === 'state') setState(message.state)
        else if (message.type === 'error') setError(message.message)
      } catch {
        // ignore malformed messages
      }
    },
  })

  useEffect(() => {
    if (connected) return
    const timer = setTimeout(() => {
      setError((current) =>
        current ??
        `Couldn't connect to the party server at ${PARTY_HOST}. If you're testing across devices, make sure they're on the same network and the party server is reachable.`,
      )
    }, CONNECT_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [connected])

  const send = useCallback(
    (message: ClientMessage) => {
      socket.send(JSON.stringify(message))
    },
    [socket],
  )

  useEffect(() => {
    if (socket.readyState === WebSocket.OPEN && profile.name) {
      send({ type: 'join', clientPlayerId: profile.clientPlayerId, name: profile.name, device: detectDeviceType() })
    }
  }, [profile.name, profile.clientPlayerId, socket, send])

  return <PartyRoomContext.Provider value={{ state, connected, error, send }}>{children}</PartyRoomContext.Provider>
}
