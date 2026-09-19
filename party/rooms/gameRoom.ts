import type * as Party from 'partykit/server'
import type { ClientMessage, ServerMessage } from '../../shared/protocol'
import type { GameId, GameResult, Player, RoomState } from '../../shared/types'
import { scoreOf } from '../../shared/gameConfig'
import { generateRoundContent as reactionTimeContent } from '../games/reactionTime'
import { generateRoundContent as aimTrainerContent } from '../games/aimTrainer'
import { generateRoundContent as sequenceMemoryContent } from '../games/sequenceMemory'
import { generateRoundContent as numberMemoryContent } from '../games/numberMemory'

interface ConnState {
  clientPlayerId: string
}

const COUNTDOWN_MS = 3200
const ROUND_TIMEOUT_MS = 90_000

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
      this.roundTimer = setTimeout(() => this.finishRound(), ROUND_TIMEOUT_MS)
    }, COUNTDOWN_MS)
  }

  private finishRound() {
    this.clearRoundTimer()
    if (this.state.phase !== 'playing') return
    this.state.phase = this.state.round >= this.state.maxRounds ? 'finished' : 'roundResult'
    this.broadcast()
  }

  private maybeFinishRoundEarly() {
    const connectedCount = this.state.players.filter((p) => p.connected).length
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
        } else {
          const isFirst = this.state.players.length === 0
          this.state.players.push({
            id: message.clientPlayerId,
            name: message.name || 'Player',
            isHost: isFirst,
            ready: false,
            connected: true,
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

      case 'hostStartRound': {
        const player = sender.state && this.getPlayer(sender.state.clientPlayerId)
        if (!player?.isHost) return
        if (!['lobby', 'roundResult', 'finished'].includes(this.state.phase)) return
        if (this.state.phase === 'lobby' || this.state.phase === 'finished') {
          this.state.round = 0
          this.state.leaderboard = []
        }
        this.startCountdown()
        break
      }

      case 'submitResult': {
        const clientPlayerId = sender.state?.clientPlayerId
        const player = clientPlayerId ? this.getPlayer(clientPlayerId) : undefined
        if (!player || this.state.phase !== 'playing') return
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
