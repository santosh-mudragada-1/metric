import type { GameId } from '@shared/types'

export type MetricDirection = 'higher-better' | 'lower-better'

export interface ScoreMetricConfig {
  /** What the stored number represents, for the stats page. */
  label: string
  unit?: string
  direction: MetricDirection
  format: (value: number) => string
}

const round = (value: number) => `${Math.round(value)}`

export const SCORE_METRICS: Record<GameId, ScoreMetricConfig> = {
  'reaction-time': { label: 'Reaction time', unit: 'ms', direction: 'lower-better', format: round },
  'aim-trainer': { label: 'Targets hit', direction: 'higher-better', format: round },
  'sequence-memory': { label: 'Level reached', direction: 'higher-better', format: round },
  'number-memory': { label: 'Digits remembered', direction: 'higher-better', format: round },
  'chimp-test': { label: 'Level reached', direction: 'higher-better', format: round },
  'visual-memory': { label: 'Level reached', direction: 'higher-better', format: round },
  'verbal-memory': { label: 'Words scored', direction: 'higher-better', format: round },
  typing: { label: 'Words per minute', unit: 'wpm', direction: 'higher-better', format: round },
}
