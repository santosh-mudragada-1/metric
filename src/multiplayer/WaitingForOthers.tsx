import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { usePartyRoom } from './usePartyRoom'

export function WaitingForOthers() {
  const { state } = usePartyRoom()
  const total = state?.players.filter((p) => p.connected).length ?? 0
  const submitted = Object.keys(state?.roundResults ?? {}).length

  return (
    <div className="relative flex h-[65vh] min-h-96 max-h-[38rem] flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border border-border bg-surface text-center">
      <div className="absolute top-5 left-5 flex items-center gap-2 sm:top-7 sm:left-7">
        <span className="live-loop h-2 w-2 rounded-full bg-success shadow-[0_0_10px_1px_var(--color-success)]" />
        <span className="font-mono text-[0.6875rem] tracking-[0.14em] text-text-dim uppercase">submitted</span>
      </div>
      <CheckCircleIcon className="h-9 w-9 text-success" />
      <p className="font-display text-2xl font-semibold lowercase tracking-tight text-text">result submitted</p>
      <p className="font-mono text-sm tabular-nums text-text-muted">
        waiting for other players — {submitted}/{total}
      </p>
    </div>
  )
}
