export type GameId = 'reaction-time' | 'aim-trainer' | 'sequence-memory' | 'number-memory'

export interface ReactionTimeResult {
  gameId: 'reaction-time'
  attempts: number[]
  averageMs: number
}

export interface AimTrainerResult {
  gameId: 'aim-trainer'
  hits: number
  misses: number
  accuracy: number
  avgHitMs: number
  bestStreak: number
}

export interface SequenceMemoryResult {
  gameId: 'sequence-memory'
  levelReached: number
}

export interface NumberMemoryResult {
  gameId: 'number-memory'
  digitsReached: number
}

export type GameResult =
  | ReactionTimeResult
  | AimTrainerResult
  | SequenceMemoryResult
  | NumberMemoryResult

export interface Player {
  id: string
  name: string
  isHost: boolean
  ready: boolean
  connected: boolean
}

export type RoomPhase = 'lobby' | 'countdown' | 'playing' | 'roundResult' | 'finished'

export interface LeaderboardEntry {
  playerId: string
  name: string
  totalScore: number
  roundsPlayed: number
}

export interface RoomState {
  code: string
  gameId: GameId
  phase: RoomPhase
  players: Player[]
  round: number
  maxRounds: number
  countdownEndsAt?: number
  roundContent?: unknown
  roundResults: Record<string, GameResult>
  leaderboard: LeaderboardEntry[]
}
