import { DAILY_GAMES } from '@/dailyGames.config'
import { DailyIndexRow } from '@/components/daily/DailyIndexRow'
import { AnimatedHeading } from '@/components/ui/AnimatedHeading'
import { puzzleNumber } from '@/lib/dailySeed'

export default function DailyHome() {
  return (
    <div className="flex flex-col pt-10 sm:pt-16">
      <section className="flex flex-col gap-6 sm:gap-8">
        <span className="font-mono text-xs font-medium tracking-[0.18em] text-text-dim uppercase sm:text-sm">
          Daily · puzzle #{puzzleNumber()}
        </span>

        <AnimatedHeading
          as="h1"
          text={'five short\npuzzles.'}
          className="max-w-3xl font-display text-hero font-semibold text-text"
          radius={220}
          hoverWeight={900}
        />

        <p className="max-w-sm text-base leading-relaxed text-text-muted">
          A new logic puzzle every day. Same board for everyone, no scrolling for hints.
        </p>
      </section>

      <section className="mt-12 flex flex-col sm:mt-16">
        {DAILY_GAMES.map((game) => (
          <DailyIndexRow key={game.id} game={game} />
        ))}
      </section>
    </div>
  )
}
