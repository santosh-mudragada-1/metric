import { SunIcon, MoonIcon } from '@heroicons/react/24/solid'

// Both icons share one keyframe; offsetting the moon's delay by half the duration makes
// them crossfade in alternation without needing two separate animations.
export function TangoPreview() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <SunIcon
        className="live-loop absolute h-6 w-6 text-accent-tango sm:h-7 sm:w-7"
        style={{ animation: 'tango-swap 2.6s ease-in-out infinite' }}
      />
      <MoonIcon
        className="live-loop absolute h-6 w-6 text-text sm:h-7 sm:w-7"
        style={{ animation: 'tango-swap 2.6s ease-in-out 1.3s infinite' }}
      />
    </div>
  )
}
