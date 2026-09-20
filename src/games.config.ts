import type { GameId } from '@shared/types'
import type { ComponentType } from 'react'
import { ReactionPreview } from '@/components/previews/ReactionPreview'
import { AimPreview } from '@/components/previews/AimPreview'
import { SequencePreview } from '@/components/previews/SequencePreview'
import { NumberPreview } from '@/components/previews/NumberPreview'
import { ChimpPreview } from '@/components/previews/ChimpPreview'
import { VisualPreview } from '@/components/previews/VisualPreview'
import { VerbalPreview } from '@/components/previews/VerbalPreview'
import { TypingPreview } from '@/components/previews/TypingPreview'

export interface GameConfig {
  id: GameId
  name: string
  /** Lowercase, editorial fragment used as supporting copy — not a marketing tagline. */
  blurb: string
  /** Small looping visual that gives the game life in the index — not a static icon. */
  Preview: ComponentType
  accent: 'reaction' | 'aim' | 'sequence' | 'number' | 'chimp' | 'visual' | 'verbal' | 'typing'
}

export const GAMES: GameConfig[] = [
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
  {
    id: 'chimp-test',
    name: 'Chimp Test',
    blurb: 'Tap the numbers in order.',
    Preview: ChimpPreview,
    accent: 'chimp',
  },
  {
    id: 'visual-memory',
    name: 'Visual Memory',
    blurb: 'Recall the lit tiles.',
    Preview: VisualPreview,
    accent: 'visual',
  },
  {
    id: 'verbal-memory',
    name: 'Verbal Memory',
    blurb: 'Spot the repeat word.',
    Preview: VerbalPreview,
    accent: 'verbal',
  },
  {
    id: 'typing',
    name: 'Typing',
    blurb: 'Type the passage fast.',
    Preview: TypingPreview,
    accent: 'typing',
  },
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
  chimp: { text: 'text-accent-chimp', bgDim: 'bg-accent-chimp-dim' },
  visual: { text: 'text-accent-visual', bgDim: 'bg-accent-visual-dim' },
  verbal: { text: 'text-accent-verbal', bgDim: 'bg-accent-verbal-dim' },
  typing: { text: 'text-accent-typing', bgDim: 'bg-accent-typing-dim' },
}
