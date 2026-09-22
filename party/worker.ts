import { GameRoom } from './gameRoom'
import type { PostHogEnv } from './posthog'

export interface Env extends PostHogEnv {
  GAME_ROOM: DurableObjectNamespace
}

// Matches the URL shape the `partysocket` client builds by default: /parties/<party>/<room>.
const ROOM_PATH = /^\/parties\/[^/]+\/([^/]+)$/

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/') return new Response('ok', { status: 200 })

    const match = url.pathname.match(ROOM_PATH)
    if (!match) return new Response('Not found', { status: 404 })

    const roomId = match[1]
    const id = env.GAME_ROOM.idFromName(roomId)
    const stub = env.GAME_ROOM.get(id)
    return stub.fetch(request)
  },
}

export { GameRoom }
