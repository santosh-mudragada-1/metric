import { PATCHES_PALETTE } from '@/daily/patches/generatePatches'

// A wide block over two smaller ones — echoes the game's rectangle-carving mechanic.
const BLOCKS = [
  { color: PATCHES_PALETTE[4], span: 'col-span-2', delay: '0s' },
  { color: PATCHES_PALETTE[0], span: '', delay: '0.6s' },
  { color: PATCHES_PALETTE[5], span: '', delay: '1.2s' },
]

export function PatchesPreview() {
  return (
    <div className="grid h-8 w-8 grid-cols-2 grid-rows-2 gap-1 sm:h-10 sm:w-10">
      {BLOCKS.map((block, i) => (
        <div
          key={i}
          className={`live-loop rounded-sm ${block.span}`}
          style={{ backgroundColor: block.color, animation: `sequence-blink 2.4s ease-in-out ${block.delay} infinite` }}
        />
      ))}
    </div>
  )
}
