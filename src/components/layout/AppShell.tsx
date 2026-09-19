import { useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useGSAP } from '@gsap/react'
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline'
import { IconButton } from '@/components/ui/IconButton'
import { useSound } from '@/hooks/useSound'
import { enterMode } from '@/lib/animation/presets'

const NAV_ITEMS = [
  { to: '/', label: 'Play', end: true },
  { to: '/party', label: 'Party', end: false },
]

export function AppShell() {
  const { muted, toggleMute } = useSound()
  const location = useLocation()
  const outletRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    enterMode(outletRef.current)
  }, [location.pathname])

  return (
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col px-4 sm:px-6">
      <header className="flex items-center justify-between py-6 sm:py-8">
        <div className="flex items-center gap-8 sm:gap-10">
          <Link to="/" className="font-display text-base font-semibold tracking-tight text-text">
            reflex<span className="text-text-dim">/</span>arena
          </Link>
          <nav className="hidden items-center gap-6 sm:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative py-1 font-mono text-xs font-medium tracking-[0.14em] uppercase transition-colors duration-150
                  ${isActive ? 'text-text' : 'text-text-dim hover:text-text-muted'}`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    <span
                      className={`absolute -bottom-1.5 left-0 h-px w-full bg-signal transition-transform duration-200
                        ${isActive ? 'scale-x-100' : 'scale-x-0'}`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        <IconButton label={muted ? 'Unmute sound' : 'Mute sound'} silent onClick={toggleMute}>
          {muted ? <SpeakerXMarkIcon className="h-5 w-5" /> : <SpeakerWaveIcon className="h-5 w-5" />}
        </IconButton>
      </header>
      <main ref={outletRef} className="flex flex-1 flex-col pb-20 sm:pb-24">
        <Outlet />
      </main>
    </div>
  )
}
