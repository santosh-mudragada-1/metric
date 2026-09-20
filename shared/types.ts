export type GameId =
  | 'reaction-time'
  | 'aim-trainer'
  | 'sequence-memory'
  | 'number-memory'
  | 'chimp-test'
  | 'typing'
  | 'verbal-memory'
  | 'visual-memory'

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

export interface ChimpTestResult {
  gameId: 'chimp-test'
  levelReached: number
}

export interface TypingResult {
  gameId: 'typing'
  wpm: number
  accuracy: number
}

export interface VerbalMemoryResult {
  gameId: 'verbal-memory'
  score: number
}

export interface VisualMemoryResult {
  gameId: 'visual-memory'
  levelReached: number
}

export type GameResult =
  | ReactionTimeResult
  | AimTrainerResult
  | SequenceMemoryResult
  | NumberMemoryResult
  | ChimpTestResult
  | TypingResult
  | VerbalMemoryResult
  | VisualMemoryResult

export type DeviceType = 'desktop' | 'mobile' | 'tablet'

export interface Player {
  id: string
  name: string
  isHost: boolean
  ready: boolean
  connected: boolean
  eliminated: boolean
  device: DeviceType
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
  maxPlayers: number
  eliminationMode: boolean
  countdownEndsAt?: number
  /** When the current round entered `playing` — used to score how fast each player finished. */
  roundStartedAt?: number
  roundContent?: unknown
  roundResults: Record<string, GameResult>
  /** How long each player took to submit this round, in ms since `roundStartedAt` — see `scoreOf`. */
  roundElapsedMs: Record<string, number>
  leaderboard: LeaderboardEntry[]
}
