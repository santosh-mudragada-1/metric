import { Link, Outlet } from 'react-router'
import { SignalIcon } from '@heroicons/react/24/solid'
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline'
import { IconButton } from '@/components/ui/IconButton'
import { useSound } from '@/hooks/useSound'

export function AppShell() {
  const { muted, toggleMute } = useSound()

  return (
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col px-4 sm:px-6">
      <header className="flex items-center justify-between border-b border-border py-5">
        <Link to="/" className="flex items-center gap-2.5 text-text">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-chalk">
            <SignalIcon className="h-5 w-5 text-ink" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">Reflex Arena</span>
        </Link>
        <IconButton label={muted ? 'Unmute sound' : 'Mute sound'} silent onClick={toggleMute}>
          {muted ? <SpeakerXMarkIcon className="h-5 w-5" /> : <SpeakerWaveIcon className="h-5 w-5" />}
        </IconButton>
      </header>
      <main className="flex flex-1 flex-col pb-16">
        <Outlet />
      </main>
    </div>
  )
}
