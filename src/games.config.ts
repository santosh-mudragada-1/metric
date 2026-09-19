import { BoltIcon, HashtagIcon, Squares2X2Icon, ViewfinderCircleIcon } from '@heroicons/react/24/outline'
import type { GameId } from '@shared/types'
import type { ComponentType, SVGProps } from 'react'
import { ReactionPreview } from '@/components/previews/ReactionPreview'
import { AimPreview } from '@/components/previews/AimPreview'
import { SequencePreview } from '@/components/previews/SequencePreview'
import { NumberPreview } from '@/components/previews/NumberPreview'

export interface GameConfig {
  id: GameId
  name: string
  /** Lowercase, editorial fragment used as supporting copy — not a marketing tagline. */
  blurb: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Small looping visual that gives the game life in the index — not a static icon. */
  Preview: ComponentType
  accent: 'reaction' | 'aim' | 'sequence' | 'number'
}

export const GAMES: GameConfig[] = [
  {
    id: 'reaction-time',
    name: 'Reaction Time',
    blurb: 'Wait for green. Click.',
    Icon: BoltIcon,
    Preview: ReactionPreview,
    accent: 'reaction',
  },
  {
    id: 'aim-trainer',
    name: 'Aim Trainer',
    blurb: 'Hit all 30 targets.',
    Icon: ViewfinderCircleIcon,
    Preview: AimPreview,
    accent: 'aim',
  },
  {
    id: 'sequence-memory',
    name: 'Sequence Memory',
    blurb: 'Repeat the pattern.',
    Icon: Squares2X2Icon,
    Preview: SequencePreview,
    accent: 'sequence',
  },
  {
    id: 'number-memory',
    name: 'Number Memory',
    blurb: 'Remember the number.',
    Icon: HashtagIcon,
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
  /** Solid accent fill, for badges/pills that need to read as this game's identity color */
  bg: string
  /** Low-opacity accent wash, for subtle highlighted surfaces */
  bgDim: string
  /** Accent-colored border */
  border: string
  /** Text/icon color that sits on top of a solid `bg` fill, chosen per-accent for contrast */
  onBg: string
  /** Soft glow shadow in the accent color, for hover/active states */
  glow: string
}

export const ACCENT_CLASSES: Record<GameConfig['accent'], AccentClasses> = {
  reaction: {
    text: 'text-accent-reaction',
    bg: 'bg-accent-reaction',
    bgDim: 'bg-accent-reaction-dim',
    border: 'border-accent-reaction',
    onBg: 'text-chalk',
    glow: 'shadow-[0_8px_24px_-8px_var(--color-accent-reaction)]',
  },
  aim: {
    text: 'text-accent-aim',
    bg: 'bg-accent-aim',
    bgDim: 'bg-accent-aim-dim',
    border: 'border-accent-aim',
    onBg: 'text-ink',
    glow: 'shadow-[0_8px_24px_-8px_var(--color-accent-aim)]',
  },
  sequence: {
    text: 'text-accent-sequence',
    bg: 'bg-accent-sequence',
    bgDim: 'bg-accent-sequence-dim',
    border: 'border-accent-sequence',
    onBg: 'text-chalk',
    glow: 'shadow-[0_8px_24px_-8px_var(--color-accent-sequence)]',
  },
  number: {
    text: 'text-accent-number',
    bg: 'bg-accent-number',
    bgDim: 'bg-accent-number-dim',
    border: 'border-accent-number',
    onBg: 'text-ink',
    glow: 'shadow-[0_8px_24px_-8px_var(--color-accent-number)]',
  },
}
