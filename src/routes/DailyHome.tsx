import { useNavigate } from 'react-router'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { DAILY_GAMES } from '@/dailyGames.config'
import { DailyIndexRow } from '@/components/daily/DailyIndexRow'
import { AnimatedHeading } from '@/components/ui/AnimatedHeading'
import { useAnimation } from '@/hooks/useAnimation'
import { heroHoverIn, heroHoverOut, pressDown, pressUp } from '@/lib/animation/presets'
import { playClick, playRainbowHover } from '@/lib/sound/sfx'
import { withViewTransition } from '@/lib/viewTransition'
import { getDailyProgress } from '@/lib/storage'
import { puzzleNumber, todayKey } from '@/lib/dailySeed'

export default function DailyHome() {
  const navigate = useNavigate()
  const { scope, run } = useAnimation<HTMLButtonElement>()

  const goToRandom = () => {
    playClick()
    const today = todayKey()
    const unplayed = DAILY_GAMES.filter((g) => getDailyProgress(g.id).lastCompletedDate !== today)
    const pool = unplayed.length > 0 ? unplayed : DAILY_GAMES
    const game = pool[Math.floor(Math.random() * pool.length)]
    withViewTransition(() => navigate(`/daily/${game.id}`))
  }

  return (
    <div className="flex flex-col pt-10 sm:pt-16">
      <section className="flex flex-col gap-8 sm:gap-10">
        <span className="font-mono text-xs font-medium tracking-[0.18em] text-text-dim uppercase sm:text-sm">
          Daily · day {puzzleNumber()}
        </span>

        <AnimatedHeading
          as="h1"
          text={'five short\npuzzles.'}
          className="max-w-3xl font-display text-hero font-semibold text-text"
          radius={220}
          hoverWeight={900}
        />

        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-sm text-base leading-relaxed text-text-muted">
            A new logic puzzle every day. Same board for everyone, no scrolling for hints.
          </p>
          <button
            ref={scope}
            onClick={goToRandom}
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
            Play a random puzzle
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      <section className="mt-16 flex flex-col sm:mt-20">
        {DAILY_GAMES.map((game, i) => (
          <DailyIndexRow key={game.id} game={game} index={i + 1} />
        ))}
      </section>
    </div>
  )
}
