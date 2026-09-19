import type { GameId, GameResult, RoomState } from './types'

export type ClientMessage =
  | { type: 'join'; clientPlayerId: string; name: string }
  | { type: 'setReady'; ready: boolean }
  | { type: 'hostChangeGame'; gameId: GameId }
  | { type: 'hostSetRounds'; maxRounds: number }
  | { type: 'hostStartRound' }
  | { type: 'submitResult'; result: GameResult }

export type ServerMessage = { type: 'state'; state: RoomState } | { type: 'error'; message: string }
