import type { DeviceType, GameId, GameResult, RoomState } from './types'

export type ClientMessage =
  | { type: 'join'; clientPlayerId: string; name: string; device: DeviceType }
  | { type: 'setReady'; ready: boolean }
  | { type: 'hostChangeGame'; gameId: GameId }
  | { type: 'hostSetRounds'; maxRounds: number }
  | { type: 'hostSetMaxPlayers'; maxPlayers: number }
  | { type: 'hostSetElimination'; eliminationMode: boolean }
  | { type: 'hostStartRound' }
  | { type: 'hostKickPlayer'; playerId: string }
  | { type: 'submitResult'; result: GameResult }

export type ServerMessage = { type: 'state'; state: RoomState } | { type: 'error'; message: string }
