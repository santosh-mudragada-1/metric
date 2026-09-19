import type { GameId } from '@shared/types'
import type { ComponentType } from 'react'
import { ReactionPreview } from '@/components/previews/ReactionPreview'
import { AimPreview } from '@/components/previews/AimPreview'
import { SequencePreview } from '@/components/previews/SequencePreview'
import { NumberPreview } from '@/components/previews/NumberPreview'

export interface GameConfig {
  id: GameId
  name: string
  /** Lowercase, editorial fragment used as supporting copy — not a marketing tagline. */
  blurb: string
  /** Small looping visual that gives the game life in the index — not a static icon. */
  Preview: ComponentType
  accent: 'reaction' | 'aim' | 'sequence' | 'number'
}

export const GAMES: GameConfig[] = [
  {
    id: 'reaction-time',
    name: 'Reaction Time',
    blurb: 'Wait for green. Click.',
    Preview: ReactionPreview,
    accent: 'reaction',
  },
  {
    id: 'aim-trainer',
    name: 'Aim Trainer',
    blurb: 'Hit all 30 targets.',
    Preview: AimPreview,
    accent: 'aim',
  },
  {
    id: 'sequence-memory',
    name: 'Sequence Memory',
    blurb: 'Repeat the pattern.',
    Preview: SequencePreview,
    accent: 'sequence',
  },
  {
    id: 'number-memory',
    name: 'Number Memory',
    blurb: 'Remember the number.',
    Preview: NumberPreview,
    accent: 'number',
  },
]

export const GAME_MAP: Record<GameId, GameConfig> = Object.fromEntries(GAMES.map((g) => [g.id, g])) as Record<
  GameId,
  GameConfig
>

export function isGameId(value: string): value is GameId {
  return value in GAME_MAP
}

interface AccentClasses {
  /** Text colored in the accent, for readouts/highlights on a dark surface */
  text: string
  /** Low-opacity accent wash, for subtle highlighted surfaces */
  bgDim: string
}

export const ACCENT_CLASSES: Record<GameConfig['accent'], AccentClasses> = {
  reaction: { text: 'text-accent-reaction', bgDim: 'bg-accent-reaction-dim' },
  aim: { text: 'text-accent-aim', bgDim: 'bg-accent-aim-dim' },
  sequence: { text: 'text-accent-sequence', bgDim: 'bg-accent-sequence-dim' },
  number: { text: 'text-accent-number', bgDim: 'bg-accent-number-dim' },
}
