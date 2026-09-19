import { BoltIcon, HashtagIcon, Squares2X2Icon, ViewfinderCircleIcon } from '@heroicons/react/24/outline'
import type { GameId } from '@shared/types'
import type { ComponentType, SVGProps } from 'react'

export interface GameConfig {
  id: GameId
  name: string
  blurb: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  accent: 'reaction' | 'aim' | 'sequence' | 'number'
}

export const GAMES: GameConfig[] = [
  {
    id: 'reaction-time',
    name: 'Reaction Time',
    blurb: 'Click the instant the screen turns green.',
    Icon: BoltIcon,
    accent: 'reaction',
  },
  {
    id: 'aim-trainer',
    name: 'Aim Trainer',
    blurb: 'Hit 30 targets as fast as you can.',
    Icon: ViewfinderCircleIcon,
    accent: 'aim',
  },
  {
    id: 'sequence-memory',
    name: 'Sequence Memory',
    blurb: 'Repeat the growing pattern of tiles.',
    Icon: Squares2X2Icon,
    accent: 'sequence',
  },
  {
    id: 'number-memory',
    name: 'Number Memory',
    blurb: 'Memorize the number before it disappears.',
    Icon: HashtagIcon,
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
