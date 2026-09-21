import type { ComponentType } from 'react'
import type { DailyGameId } from '@/lib/storage'
import { ZipPreview } from '@/components/daily/previews/ZipPreview'
import { TangoPreview } from '@/components/daily/previews/TangoPreview'
import { QueensPreview } from '@/components/daily/previews/QueensPreview'
import { PatchesPreview } from '@/components/daily/previews/PatchesPreview'
import { HardwordPreview } from '@/components/daily/previews/HardwordPreview'

export interface DailyGameConfig {
  id: DailyGameId
  name: string
  /** Lowercase, editorial fragment used as supporting copy. */
  blurb: string
  /** Small looping visual that gives the puzzle life in the index — not a static icon. */
  Preview: ComponentType
  accent: 'zip' | 'tango' | 'queens' | 'patches' | 'hardword'
}

export const DAILY_GAMES: DailyGameConfig[] = [
  {
    id: 'zip',
    name: 'Zip',
    blurb: 'Draw one path through every cell, in order.',
    Preview: ZipPreview,
    accent: 'zip',
  },
  {
    id: 'tango',
    name: 'Tango',
    blurb: 'Balance the sun and moons, no three in a row.',
    Preview: TangoPreview,
    accent: 'tango',
  },
  {
    id: 'queens',
    name: 'Queens',
    blurb: 'One crown per row, column, and color.',
    Preview: QueensPreview,
    accent: 'queens',
  },
  {
    id: 'patches',
    name: 'Patches',
    blurb: 'Carve the grid into rectangles that match their number.',
    Preview: PatchesPreview,
    accent: 'patches',
  },
  {
    id: 'hardword',
    name: 'Hardword',
    blurb: 'Guess the hidden word in eight tries.',
    Preview: HardwordPreview,
    accent: 'hardword',
  },
]

export const DAILY_GAME_MAP: Record<DailyGameId, DailyGameConfig> = Object.fromEntries(
  DAILY_GAMES.map((g) => [g.id, g]),
) as Record<DailyGameId, DailyGameConfig>

export function isDailyGameId(value: string): value is DailyGameId {
  return value in DAILY_GAME_MAP
}

interface AccentClasses {
  text: string
  bgDim: string
}

export const DAILY_ACCENT_CLASSES: Record<DailyGameConfig['accent'], AccentClasses> = {
  zip: { text: 'text-accent-zip', bgDim: 'bg-accent-zip-dim' },
  tango: { text: 'text-accent-tango', bgDim: 'bg-accent-tango-dim' },
  queens: { text: 'text-accent-queens', bgDim: 'bg-accent-queens-dim' },
  patches: { text: 'text-accent-patches', bgDim: 'bg-accent-patches-dim' },
  hardword: { text: 'text-accent-hardword', bgDim: 'bg-accent-hardword-dim' },
}
