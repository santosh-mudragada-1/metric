import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { usePartyRoom } from './usePartyRoom'

export function WaitingForOthers() {
  const { state } = usePartyRoom()
  const total = state?.players.filter((p) => p.connected).length ?? 0
  const submitted = Object.keys(state?.roundResults ?? {}).length

  return (
    <div className="flex h-96 flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-surface-raised p-6 text-center">
      <CheckCircleIcon className="h-10 w-10 text-success" />
      <p className="font-display text-lg font-semibold tracking-tight text-text">Result submitted</p>
      <p className="font-mono text-sm text-text-muted">
        waiting for other players — {submitted}/{total}
      </p>
    </div>
  )
}
