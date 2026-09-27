// My Analytics (https://my-analytics-ruby.vercel.app/p/metric) — runs alongside PostHog/GA, doesn't replace them.
// Page views, sessions and uncaught errors are automatic; this file adds Metric's product events.
// Every call is fail-silent: analytics can never break a game.
import { initAnalytics, track } from '@my-analytics/client'

export { captureError, identify, reset, showFeedback, track } from '@my-analytics/client'

export function initMyAnalytics() {
  initAnalytics({
    projectId: import.meta.env.VITE_ANALYTICS_PROJECT_ID,
    apiKey: import.meta.env.VITE_ANALYTICS_KEY,
    // Localhost traffic is ignored unless you opt in (handy when testing the integration).
    trackLocalhost: import.meta.env.VITE_ANALYTICS_TRACK_LOCALHOST === 'true',
  })
}

type Mode = 'practice' | 'daily'

// ── Game lifecycle ─────────────────────────────────────────────
// One active game at a time. Starting again before finishing = restart; leaving the page = abandoned.
let active: { game: string; mode: Mode; startedAt: number } | null = null

const elapsed = () => (active ? Math.round((Date.now() - active.startedAt) / 1000) : undefined)

export function gameStarted(game: string, mode: Mode) {
  if (active) {
    if (active.game === game) track('game_restarted', { game, mode, after_s: elapsed() })
    else track('game_abandoned', { game: active.game, mode: active.mode, after_s: elapsed() })
  }
  active = { game, mode, startedAt: Date.now() }
  track('game_started', { game, mode })
  if (mode === 'daily') track('daily_challenge_started', { game })
}

export function gameCompleted(game: string, mode: Mode, props: Record<string, number | string | undefined> = {}) {
  track('game_completed', { game, mode, ...props })
  if (mode === 'daily') track('daily_challenge_completed', { game, ...props })
  if (active?.game === game) active = null
}

export function gameFailed(game: string, mode: Mode, props: Record<string, number | string | undefined> = {}) {
  track('game_failed', { game, mode, ...props })
  if (active?.game === game) active = null
}

/** Call when a game screen unmounts: an unfinished game counts as abandoned. */
export function gameScreenLeft() {
  if (!active) return
  track('game_abandoned', { game: active.game, mode: active.mode, after_s: elapsed() })
  active = null
}

if (typeof window !== 'undefined') {
  // Closing the tab mid-game is an abandon too (flushed by the SDK via sendBeacon).
  window.addEventListener('pagehide', gameScreenLeft)
}

// ── Party rooms ───────────────────────────────────────────────
// party_joined fires from the room itself so invite links count, not just the "Join" button.
let createdRoom: string | null = null

export function partyCreated(roomCode: string) {
  createdRoom = roomCode.toLowerCase()
  track('party_created')
}

export function partyEntered(roomCode: string) {
  if (createdRoom === roomCode.toLowerCase()) return // the host's own room isn't a "join"
  track('party_joined')
}

export function partyLeft(seconds: number) {
  track('party_left', { duration_s: seconds })
}
