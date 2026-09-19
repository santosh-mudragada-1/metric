import { useNavigate } from 'react-router'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { GAMES } from '@/games.config'
import { GameIndexRow } from '@/components/layout/GameIndexRow'
import { playClick } from '@/lib/sound/sfx'
import { withViewTransition } from '@/lib/viewTransition'

export default function DashboardHome() {
  const navigate = useNavigate()

  const goToFlagship = () => {
    playClick()
    withViewTransition(() => navigate('/play/reaction-time'))
  }

  const goToParty = () => {
    playClick()
    withViewTransition(() => navigate('/party'))
  }

  return (
    <div className="flex flex-col pt-10 sm:pt-16">
      <section className="flex flex-col gap-8 sm:gap-10">
        <span className="font-mono text-xs font-medium tracking-[0.18em] text-text-dim uppercase sm:text-sm">
          Reflex Arena — four tests
        </span>

        <h1 className="max-w-3xl font-display text-hero font-semibold text-text">
          know your
          <br />
          numbers.
        </h1>

        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-sm text-base leading-relaxed text-text-muted">
            Reaction, aim, memory, and recall — measured in milliseconds. Beat your best, or challenge a friend live.
          </p>
          <button
            onClick={goToFlagship}
            className="group inline-flex shrink-0 cursor-pointer items-center gap-3 rounded-lg bg-chalk px-7 py-4
              font-display text-base font-semibold text-ink shadow-[var(--shadow-chalk)] transition-transform
              duration-150 hover:scale-[1.02] active:scale-[0.98]"
          >
            Play reaction time
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      <section className="mt-16 flex flex-col sm:mt-20">
        {GAMES.map((game, i) => (
          <GameIndexRow key={game.id} game={game} index={i + 1} />
        ))}
      </section>

      <section
        onClick={goToParty}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && goToParty()}
        className="group mt-2 flex cursor-pointer flex-col items-start gap-5 border-t border-border py-8
          outline-none transition-colors duration-200 hover:bg-surface/60 focus-visible:bg-surface-hover
          sm:flex-row sm:items-center sm:justify-between sm:py-10"
      >
        <div>
          <h2 className="font-display text-2xl font-semibold lowercase tracking-tight text-text sm:text-3xl">
            play with friends
          </h2>
          <p className="mt-1.5 text-sm text-text-muted sm:text-base">Create a room, share the code, compete live.</p>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border-strong px-6 py-3.5
            font-display text-sm font-medium text-text transition-colors duration-150 group-hover:border-text-muted
            group-hover:bg-surface-hover"
        >
          Start a room
          <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      </section>
    </div>
  )
}
