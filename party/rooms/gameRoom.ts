import type * as Party from 'partykit/server'
import type { ClientMessage, ServerMessage } from '../../shared/protocol'
import type { GameId, GameResult, Player, RoomState } from '../../shared/types'
import { isGameAllowedForPlayers, scoreOf } from '../../shared/gameConfig'
import { generateRoundContent as reactionTimeContent } from '../games/reactionTime'
import { generateRoundContent as aimTrainerContent } from '../games/aimTrainer'
import { generateRoundContent as sequenceMemoryContent } from '../games/sequenceMemory'
import { generateRoundContent as numberMemoryContent } from '../games/numberMemory'
import { generateRoundContent as chimpTestContent } from '../games/chimpTest'
import { generateRoundContent as visualMemoryContent } from '../games/visualMemory'
import { generateRoundContent as verbalMemoryContent } from '../games/verbalMemory'
import { generateRoundContent as typingContent } from '../games/typing'

interface ConnState {
  clientPlayerId: string
}

const COUNTDOWN_MS = 3200
const DEFAULT_ROUND_TIME_LIMIT_MS = 90_000
const MIN_ROUND_TIME_LIMIT_MS = 15_000
const MAX_ROUND_TIME_LIMIT_MS = 180_000
const DEFAULT_MAX_PLAYERS = 8
const MIN_MAX_PLAYERS = 2
const MAX_MAX_PLAYERS = 12

function generateRoundContent(gameId: GameId): unknown {
  switch (gameId) {
    case 'reaction-time':
      return reactionTimeContent()
    case 'aim-trainer':
      return aimTrainerContent()
    case 'sequence-memory':
      return sequenceMemoryContent()
    case 'number-memory':
      return numberMemoryContent()
    case 'chimp-test':
      return chimpTestContent()
    case 'visual-memory':
      return visualMemoryContent()
    case 'verbal-memory':
      return verbalMemoryContent()
    case 'typing':
      return typingContent()
  }
}

export default class GameRoom implements Party.Server {
  state: RoomState
  private roundTimer: ReturnType<typeof setTimeout> | null = null

  constructor(readonly room: Party.Room) {
    this.state = {
      code: room.id,
      gameId: 'reaction-time',
      phase: 'lobby',
      players: [],
      round: 0,
      maxRounds: 5,
      maxPlayers: DEFAULT_MAX_PLAYERS,
      roundTimeLimitMs: DEFAULT_ROUND_TIME_LIMIT_MS,
      eliminationMode: false,
      roundResults: {},
      leaderboard: [],
    }
  }

  private send(connection: Party.Connection, message: ServerMessage) {
    connection.send(JSON.stringify(message))
  }

  private broadcast() {
    this.room.broadcast(JSON.stringify({ type: 'state', state: this.state } satisfies ServerMessage))
  }

  private getPlayer(clientPlayerId: string): Player | undefined {
    return this.state.players.find((p) => p.id === clientPlayerId)
  }

  private ensureHost() {
    const hasConnectedHost = this.state.players.some((p) => p.isHost && p.connected)
    if (hasConnectedHost) return
    const nextHost = this.state.players.find((p) => p.connected)
    this.state.players = this.state.players.map((p) => ({ ...p, isHost: p.id === nextHost?.id }))
  }

  private clearRoundTimer() {
    if (this.roundTimer) clearTimeout(this.roundTimer)
    this.roundTimer = null
  }

  private startCountdown() {
    this.state.roundContent = generateRoundContent(this.state.gameId)
    this.state.roundResults = {}
    this.state.round += 1
    this.state.phase = 'countdown'
    this.state.countdownEndsAt = Date.now() + COUNTDOWN_MS
    this.broadcast()

    this.clearRoundTimer()
    this.roundTimer = setTimeout(() => {
      this.state.phase = 'playing'
      this.broadcast()
      this.clearRoundTimer()
      this.roundTimer = setTimeout(() => this.finishRound(), this.state.roundTimeLimitMs)
    }, COUNTDOWN_MS)
  }

  /** Lowest scorer(s) of the round are cut. Stops short of eliminating everyone still active. */
  private applyElimination() {
    const active = this.state.players.filter((p) => !p.eliminated)
    if (active.length <= 1) return
    const scored = active.map((p) => ({
      id: p.id,
      points: this.state.roundResults[p.id] ? scoreOf(this.state.roundResults[p.id]) : -Infinity,
    }))
    const minPoints = Math.min(...scored.map((s) => s.points))
    const maxPoints = Math.max(...scored.map((s) => s.points))
    if (minPoints === maxPoints) return
    const cut = new Set(scored.filter((s) => s.points === minPoints).map((s) => s.id))
    if (cut.size >= active.length) return
    this.state.players = this.state.players.map((p) => (cut.has(p.id) ? { ...p, eliminated: true } : p))
  }

  private finishRound() {
    this.clearRoundTimer()
    if (this.state.phase !== 'playing') return
    if (this.state.eliminationMode) this.applyElimination()
    const activeCount = this.state.players.filter((p) => !p.eliminated).length
    const eliminationEnded = this.state.eliminationMode && activeCount <= 1
    this.state.phase = eliminationEnded || this.state.round >= this.state.maxRounds ? 'finished' : 'roundResult'
    this.broadcast()
  }

  private maybeFinishRoundEarly() {
    const connectedCount = this.state.players.filter((p) => p.connected && !p.eliminated).length
    if (connectedCount > 0 && Object.keys(this.state.roundResults).length >= connectedCount) {
      this.finishRound()
    }
  }

  onConnect(connection: Party.Connection<ConnState>) {
    this.send(connection, { type: 'state', state: this.state })
  }

  onMessage(raw: string | ArrayBuffer | ArrayBufferView, sender: Party.Connection<ConnState>) {
    if (typeof raw !== 'string') return
    let message: ClientMessage
    try {
      message = JSON.parse(raw)
    } catch {
      return
    }

    switch (message.type) {
      case 'join': {
        sender.setState({ clientPlayerId: message.clientPlayerId })
        const existing = this.getPlayer(message.clientPlayerId)
        if (existing) {
          existing.connected = true
          existing.name = message.name || existing.name
          existing.device = message.device
        } else {
          if (this.state.players.length >= this.state.maxPlayers) {
            this.send(sender, { type: 'error', message: 'This room is full.' })
            return
          }
          const isFirst = this.state.players.length === 0
          this.state.players.push({
            id: message.clientPlayerId,
            name: message.name || 'Player',
            isHost: isFirst,
            ready: false,
            connected: true,
            eliminated: false,
            device: message.device,
          })
        }
        this.ensureHost()
        this.broadcast()
        break
      }

      case 'setReady': {
        const clientPlayerId = sender.state?.clientPlayerId
        const player = clientPlayerId ? this.getPlayer(clientPlayerId) : undefined
        if (!player) return
        player.ready = message.ready
        this.broadcast()
        break
      }

      case 'hostChangeGame': {
        const player = sender.state && this.getPlayer(sender.state.clientPlayerId)
        if (!player?.isHost || !['lobby', 'finished'].includes(this.state.phase)) return
        if (!isGameAllowedForPlayers(message.gameId, this.state.players)) {
          this.send(sender, {
            type: 'error',
            message: 'That game is disabled — players joined from different device types.',
          })
          return
        }
        this.state.gameId = message.gameId
        this.broadcast()
        break
      }

      case 'hostSetRounds': {
        const player = sender.state && this.getPlayer(sender.state.clientPlayerId)
        if (!player?.isHost || !['lobby', 'finished'].includes(this.state.phase)) return
        this.state.maxRounds = Math.max(1, Math.min(10, message.maxRounds))
        this.broadcast()
        break
      }

      case 'hostSetMaxPlayers': {
        const player = sender.state && this.getPlayer(sender.state.clientPlayerId)
        if (!player?.isHost || !['lobby', 'finished'].includes(this.state.phase)) return
        this.state.maxPlayers = Math.max(MIN_MAX_PLAYERS, Math.min(MAX_MAX_PLAYERS, message.maxPlayers))
        this.broadcast()
        break
      }

      case 'hostSetRoundTimer': {
        const player = sender.state && this.getPlayer(sender.state.clientPlayerId)
        if (!player?.isHost || !['lobby', 'finished'].includes(this.state.phase)) return
        this.state.roundTimeLimitMs = Math.max(
          MIN_ROUND_TIME_LIMIT_MS,
          Math.min(MAX_ROUND_TIME_LIMIT_MS, message.roundTimeLimitMs),
        )
        this.broadcast()
        break
      }

      case 'hostSetElimination': {
        const player = sender.state && this.getPlayer(sender.state.clientPlayerId)
        if (!player?.isHost || !['lobby', 'finished'].includes(this.state.phase)) return
        this.state.eliminationMode = message.eliminationMode
        this.broadcast()
        break
      }

      case 'hostStartRound': {
        const player = sender.state && this.getPlayer(sender.state.clientPlayerId)
        if (!player?.isHost) return
        if (!['lobby', 'roundResult', 'finished'].includes(this.state.phase)) return
        if (
          (this.state.phase === 'lobby' || this.state.phase === 'finished') &&
          !isGameAllowedForPlayers(this.state.gameId, this.state.players)
        ) {
          this.send(sender, {
            type: 'error',
            message: 'That game is disabled — players joined from different device types. Pick another game.',
          })
          return
        }
        if (this.state.phase === 'lobby' || this.state.phase === 'finished') {
          this.state.round = 0
          this.state.leaderboard = []
          this.state.players = this.state.players.map((p) => ({ ...p, eliminated: false }))
        }
        this.startCountdown()
        break
      }

      case 'submitResult': {
        const clientPlayerId = sender.state?.clientPlayerId
        const player = clientPlayerId ? this.getPlayer(clientPlayerId) : undefined
        if (!player || player.eliminated || this.state.phase !== 'playing') return
        this.state.roundResults[player.id] = message.result
        this.applyLeaderboard(player.id, message.result)
        this.broadcast()
        this.maybeFinishRoundEarly()
        break
      }
    }
  }

  private applyLeaderboard(playerId: string, result: GameResult) {
    const player = this.getPlayer(playerId)
    if (!player) return
    const points = scoreOf(result)
    const existing = this.state.leaderboard.find((e) => e.playerId === playerId)
    if (existing) {
      existing.totalScore += points
      existing.roundsPlayed += 1
      existing.name = player.name
    } else {
      this.state.leaderboard.push({ playerId, name: player.name, totalScore: points, roundsPlayed: 1 })
    }
    this.state.leaderboard.sort((a, b) => b.totalScore - a.totalScore)
  }

  onClose(connection: Party.Connection<ConnState>) {
    const clientPlayerId = connection.state?.clientPlayerId
    const player = clientPlayerId ? this.getPlayer(clientPlayerId) : undefined
    if (!player) return
    player.connected = false
    this.ensureHost()
    this.broadcast()
    this.maybeFinishRoundEarly()
  }
}
