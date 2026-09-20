import type { ClientMessage, ServerMessage } from '../shared/protocol'
import type { GameId, GameResult, Player, RoomState } from '../shared/types'
import { isGameAllowedForPlayers, scoreOf } from '../shared/gameConfig'
import { generateRoundContent as reactionTimeContent } from './games/reactionTime'
import { generateRoundContent as aimTrainerContent } from './games/aimTrainer'
import { generateRoundContent as sequenceMemoryContent } from './games/sequenceMemory'
import { generateRoundContent as numberMemoryContent } from './games/numberMemory'
import { generateRoundContent as chimpTestContent } from './games/chimpTest'
import { generateRoundContent as visualMemoryContent } from './games/visualMemory'
import { generateRoundContent as verbalMemoryContent } from './games/verbalMemory'
import { generateRoundContent as typingContent } from './games/typing'

interface ConnAttachment {
  clientPlayerId: string
}

const COUNTDOWN_MS = 3200
const DEFAULT_MAX_PLAYERS = 8
const MIN_MAX_PLAYERS = 2
const MAX_MAX_PLAYERS = 12
const STATE_STORAGE_KEY = 'roomState'

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

function initialState(code: string): RoomState {
  return {
    code,
    gameId: 'reaction-time',
    phase: 'lobby',
    players: [],
    round: 0,
    maxRounds: 5,
    maxPlayers: DEFAULT_MAX_PLAYERS,
    eliminationMode: false,
    roundResults: {},
    roundElapsedMs: {},
    leaderboard: [],
  }
}

/**
 * One party room, one Durable Object instance (keyed by room code — see `worker.ts`).
 *
 * Cloudflare hibernates idle Durable Objects to save resources, which evicts everything on the
 * class instance except attached WebSockets. Two things that PartyKit's hosted runtime handled
 * for free now have to be explicit:
 *  - `this.state` is persisted to `ctx.storage` after every mutation and reloaded in the
 *    constructor, instead of just living in memory.
 *  - Countdown/round timing uses the Alarms API (`ctx.storage.setAlarm`) instead of
 *    `setTimeout`, since a plain timer is dropped the moment the object hibernates.
 */
export class GameRoom implements DurableObject {
  private state: RoomState
  private ready: Promise<void>

  constructor(
    private readonly ctx: DurableObjectState,
    _env: unknown,
  ) {
    this.state = initialState(ctx.id.name ?? ctx.id.toString())
    this.ready = ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get<RoomState>(STATE_STORAGE_KEY)
      if (stored) this.state = stored
    })
  }

  private async persist(): Promise<void> {
    await this.ctx.storage.put(STATE_STORAGE_KEY, this.state)
  }

  private send(ws: WebSocket, message: ServerMessage): void {
    ws.send(JSON.stringify(message))
  }

  private broadcast(): void {
    const payload = JSON.stringify({ type: 'state', state: this.state } satisfies ServerMessage)
    for (const ws of this.ctx.getWebSockets()) ws.send(payload)
  }

  private attachmentOf(ws: WebSocket): ConnAttachment | null {
    return (ws.deserializeAttachment() as ConnAttachment | null) ?? null
  }

  private getPlayer(clientPlayerId: string): Player | undefined {
    return this.state.players.find((p) => p.id === clientPlayerId)
  }

  private ensureHost(): void {
    const hasConnectedHost = this.state.players.some((p) => p.isHost && p.connected)
    if (hasConnectedHost) return
    const nextHost = this.state.players.find((p) => p.connected)
    this.state.players = this.state.players.map((p) => ({ ...p, isHost: p.id === nextHost?.id }))
  }

  private async startCountdown(): Promise<void> {
    this.state.roundContent = generateRoundContent(this.state.gameId)
    this.state.roundResults = {}
    this.state.roundElapsedMs = {}
    this.state.roundStartedAt = undefined
    this.state.round += 1
    this.state.phase = 'countdown'
    this.state.countdownEndsAt = Date.now() + COUNTDOWN_MS
    await this.persist()
    this.broadcast()
    await this.ctx.storage.setAlarm(Date.now() + COUNTDOWN_MS)
  }

  /** Lowest scorer(s) of the round are cut. Stops short of eliminating everyone still active. */
  private applyElimination(): void {
    const active = this.state.players.filter((p) => !p.eliminated)
    if (active.length <= 1) return
    const scored = active.map((p) => ({
      id: p.id,
      points: this.state.roundResults[p.id]
        ? scoreOf(this.state.roundResults[p.id], this.state.roundElapsedMs[p.id])
        : -Infinity,
    }))
    const minPoints = Math.min(...scored.map((s) => s.points))
    const maxPoints = Math.max(...scored.map((s) => s.points))
    if (minPoints === maxPoints) return
    const cut = new Set(scored.filter((s) => s.points === minPoints).map((s) => s.id))
    if (cut.size >= active.length) return
    this.state.players = this.state.players.map((p) => (cut.has(p.id) ? { ...p, eliminated: true } : p))
  }

  private async finishRound(): Promise<void> {
    if (this.state.phase !== 'playing') return
    if (this.state.eliminationMode) this.applyElimination()
    const activeCount = this.state.players.filter((p) => !p.eliminated).length
    const eliminationEnded = this.state.eliminationMode && activeCount <= 1
    this.state.phase = eliminationEnded || this.state.round >= this.state.maxRounds ? 'finished' : 'roundResult'
    await this.persist()
    this.broadcast()
  }

  /** There's no round timer — a round only ends once every connected, non-eliminated player has submitted. */
  private async maybeFinishRoundEarly(): Promise<void> {
    const connectedCount = this.state.players.filter((p) => p.connected && !p.eliminated).length
    if (connectedCount > 0 && Object.keys(this.state.roundResults).length >= connectedCount) {
      await this.finishRound()
    }
  }

  /** Fires when the countdown scheduled in `startCountdown` elapses. */
  async alarm(): Promise<void> {
    await this.ready
    if (this.state.phase !== 'countdown') return
    this.state.phase = 'playing'
    this.state.roundStartedAt = Date.now()
    await this.persist()
    this.broadcast()
  }

  async fetch(request: Request): Promise<Response> {
    await this.ready
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected a WebSocket upgrade request', { status: 426 })
    }
    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)
    this.ctx.acceptWebSocket(server)
    this.send(server, { type: 'state', state: this.state })
    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    await this.ready
    if (typeof raw !== 'string') return
    let message: ClientMessage
    try {
      message = JSON.parse(raw)
    } catch {
      return
    }

    switch (message.type) {
      case 'join': {
        ws.serializeAttachment({ clientPlayerId: message.clientPlayerId } satisfies ConnAttachment)
        const existing = this.getPlayer(message.clientPlayerId)
        if (existing) {
          existing.connected = true
          existing.name = message.name || existing.name
          existing.device = message.device
        } else {
          if (this.state.players.length >= this.state.maxPlayers) {
            this.send(ws, { type: 'error', message: 'This room is full.' })
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
        await this.persist()
        this.broadcast()
        break
      }

      case 'setReady': {
        const clientPlayerId = this.attachmentOf(ws)?.clientPlayerId
        const player = clientPlayerId ? this.getPlayer(clientPlayerId) : undefined
        if (!player) return
        player.ready = message.ready
        await this.persist()
        this.broadcast()
        break
      }

      case 'hostChangeGame': {
        const player = this.playerFor(ws)
        if (!player?.isHost || !['lobby', 'finished'].includes(this.state.phase)) return
        if (!isGameAllowedForPlayers(message.gameId, this.state.players)) {
          this.send(ws, {
            type: 'error',
            message: 'That game is disabled — players joined from different device types.',
          })
          return
        }
        this.state.gameId = message.gameId
        await this.persist()
        this.broadcast()
        break
      }

      case 'hostSetRounds': {
        const player = this.playerFor(ws)
        if (!player?.isHost || !['lobby', 'finished'].includes(this.state.phase)) return
        this.state.maxRounds = Math.max(1, Math.min(10, message.maxRounds))
        await this.persist()
        this.broadcast()
        break
      }

      case 'hostSetMaxPlayers': {
        const player = this.playerFor(ws)
        if (!player?.isHost || !['lobby', 'finished'].includes(this.state.phase)) return
        this.state.maxPlayers = Math.max(MIN_MAX_PLAYERS, Math.min(MAX_MAX_PLAYERS, message.maxPlayers))
        await this.persist()
        this.broadcast()
        break
      }

      case 'hostSetElimination': {
        const player = this.playerFor(ws)
        if (!player?.isHost || !['lobby', 'finished'].includes(this.state.phase)) return
        this.state.eliminationMode = message.eliminationMode
        await this.persist()
        this.broadcast()
        break
      }

      case 'hostStartRound': {
        const player = this.playerFor(ws)
        if (!player?.isHost) return
        if (!['lobby', 'roundResult', 'finished'].includes(this.state.phase)) return
        const isFreshStart = this.state.phase === 'lobby' || this.state.phase === 'finished'
        if (isFreshStart && !isGameAllowedForPlayers(this.state.gameId, this.state.players)) {
          this.send(ws, {
            type: 'error',
            message: 'That game is disabled — players joined from different device types. Pick another game.',
          })
          return
        }
        if (isFreshStart && !this.nonHostPlayersReady()) {
          this.send(ws, { type: 'error', message: "Not everyone's ready yet." })
          return
        }
        if (isFreshStart) {
          this.state.round = 0
          this.state.leaderboard = []
          this.state.players = this.state.players.map((p) => ({ ...p, eliminated: false }))
        }
        await this.startCountdown()
        break
      }

      case 'hostKickPlayer': {
        const player = this.playerFor(ws)
        const target = this.getPlayer(message.playerId)
        if (!player?.isHost || !target || target.isHost) return
        this.state.players = this.state.players.filter((p) => p.id !== message.playerId)
        for (const socket of this.ctx.getWebSockets()) {
          if (this.attachmentOf(socket)?.clientPlayerId !== message.playerId) continue
          this.send(socket, { type: 'error', message: 'You were removed from the room by the host.' })
          socket.close(4001, 'Kicked from room')
        }
        await this.persist()
        this.broadcast()
        await this.maybeFinishRoundEarly()
        break
      }

      case 'submitResult': {
        const clientPlayerId = this.attachmentOf(ws)?.clientPlayerId
        const player = clientPlayerId ? this.getPlayer(clientPlayerId) : undefined
        if (!player || player.eliminated || this.state.phase !== 'playing') return
        this.state.roundResults[player.id] = message.result
        const elapsedMs = this.state.roundStartedAt ? Date.now() - this.state.roundStartedAt : undefined
        if (elapsedMs !== undefined) this.state.roundElapsedMs[player.id] = elapsedMs
        this.applyLeaderboard(player.id, message.result, elapsedMs)
        await this.persist()
        this.broadcast()
        await this.maybeFinishRoundEarly()
        break
      }
    }
  }

  /** The host doesn't toggle ready themselves — only connected non-host players need to be (if there are any). */
  private nonHostPlayersReady(): boolean {
    const nonHost = this.state.players.filter((p) => p.connected && !p.isHost)
    return nonHost.every((p) => p.ready)
  }

  private playerFor(ws: WebSocket): Player | undefined {
    const clientPlayerId = this.attachmentOf(ws)?.clientPlayerId
    return clientPlayerId ? this.getPlayer(clientPlayerId) : undefined
  }

  private applyLeaderboard(playerId: string, result: GameResult, elapsedMs?: number): void {
    const player = this.getPlayer(playerId)
    if (!player) return
    const points = scoreOf(result, elapsedMs)
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

  async webSocketClose(ws: WebSocket): Promise<void> {
    await this.ready
    const clientPlayerId = this.attachmentOf(ws)?.clientPlayerId
    const player = clientPlayerId ? this.getPlayer(clientPlayerId) : undefined
    if (!player) return
    player.connected = false
    this.ensureHost()
    await this.persist()
    this.broadcast()
    await this.maybeFinishRoundEarly()
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws)
  }
}
