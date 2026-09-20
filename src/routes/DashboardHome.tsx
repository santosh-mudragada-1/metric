import { useNavigate } from 'react-router'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { GAMES } from '@/games.config'
import { GameIndexRow } from '@/components/layout/GameIndexRow'
import { AnimatedHeading } from '@/components/ui/AnimatedHeading'
import { useAnimation } from '@/hooks/useAnimation'
import { heroHoverIn, heroHoverOut, pressDown, pressUp } from '@/lib/animation/presets'
import { playClick, playRainbowHover } from '@/lib/sound/sfx'
import { withViewTransition } from '@/lib/viewTransition'

export default function DashboardHome() {
  const navigate = useNavigate()
  const { scope, run } = useAnimation<HTMLButtonElement>()

  const goToFlagship = () => {
    playClick()
    const game = GAMES[Math.floor(Math.random() * GAMES.length)]
    withViewTransition(() => navigate(`/play/${game.id}`))
  }

  const goToParty = () => {
    playClick()
    withViewTransition(() => navigate('/party'))
  }

  return (
    <div className="flex flex-col pt-10 sm:pt-16">
      <section className="flex flex-col gap-8 sm:gap-10">
        <span className="font-mono text-xs font-medium tracking-[0.18em] text-text-dim uppercase sm:text-sm">
          Metric · eight tests
        </span>

        <AnimatedHeading
          as="h1"
          text={'measure your\nmind.'}
          className="max-w-3xl font-display text-hero font-semibold text-text"
          radius={220}
          hoverWeight={900}
        />

        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-sm text-base leading-relaxed text-text-muted">
            How fast you react, how much you remember, how steady your hands are — timed down to
            the millisecond, tracked run after run.
          </p>
          <button
            ref={scope}
            onClick={goToFlagship}
            onMouseEnter={run(() => {
              heroHoverIn(scope.current)
              playRainbowHover()
            })}
            onMouseLeave={run(() => heroHoverOut(scope.current))}
            onPointerDown={run(() => pressDown(scope.current))}
            onPointerUp={run(() => pressUp(scope.current))}
            onPointerLeave={run(() => pressUp(scope.current))}
            className="group rainbow-cta relative inline-flex shrink-0 cursor-pointer items-center gap-3 rounded-full
              bg-invert px-7 py-4 font-display text-base font-semibold text-on-invert shadow-[var(--shadow-invert)]"
          >
            Play a random test
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
          <AnimatedHeading
            as="h2"
            text="play with friends"
            className="font-display text-2xl font-semibold lowercase tracking-tight text-text sm:text-3xl"
          />
          <p className="mt-1.5 text-sm text-text-muted sm:text-base">Create a room, share the code, compete live.</p>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border-strong px-6 py-3.5
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
