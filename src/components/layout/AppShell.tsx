import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useGSAP } from '@gsap/react'
import { Bars3Icon, MoonIcon, SpeakerWaveIcon, SpeakerXMarkIcon, SunIcon } from '@heroicons/react/24/outline'
import { IconButton } from '@/components/ui/IconButton'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { AccountMenu } from '@/components/auth/AccountMenu'
import { AddPasskeyPrompt } from '@/components/auth/AddPasskeyPrompt'
import { AuthModal } from '@/components/auth/AuthModal'
import { NamePrompt } from '@/components/auth/NamePrompt'
import { useAuth } from '@/hooks/useAuth'
import { useSound } from '@/hooks/useSound'
import { useTheme } from '@/hooks/useTheme'
import { enterMode } from '@/lib/animation/presets'
import { trackPageView } from '@/lib/analytics'

const NAV_ITEMS = [
  { to: '/', label: 'Play', end: true },
  { to: '/daily', label: 'Daily', end: false },
  { to: '/party', label: 'Party', end: false },
  { to: '/stats', label: 'Stats', end: false },
]

export function AppShell() {
  const { muted, toggleMute } = useSound()
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [nameResolved, setNameResolved] = useState(false)
  const location = useLocation()
  const outletRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    enterMode(outletRef.current)
  }, [location.pathname])

  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location.pathname, location.search])

  return (
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col px-4 sm:px-6">
      <header className="flex items-center justify-between py-6 sm:py-8">
        <div className="flex items-center gap-8 sm:gap-10">
          <Link to="/" className="logo-mark font-display text-[33px] sm:text-[42px] leading-none tracking-tight text-text">
            metric
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
        <div className="flex items-center gap-2">
          <IconButton
            label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            silent
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </IconButton>
          <IconButton label={muted ? 'Unmute sound' : 'Mute sound'} silent onClick={toggleMute}>
            {muted ? <SpeakerXMarkIcon className="h-5 w-5" /> : <SpeakerWaveIcon className="h-5 w-5" />}
          </IconButton>
          {user ? (
            <AccountMenu />
          ) : (
            <Button variant="ghost" onClick={() => setAuthOpen(true)}>
              Sign in
            </Button>
          )}
          <IconButton label="Open menu" silent onClick={() => setNavOpen(true)} className="sm:hidden">
            <Bars3Icon className="h-5 w-5" />
          </IconButton>
        </div>
      </header>
      <main ref={outletRef} className="flex flex-1 flex-col pb-20 sm:pb-24">
        <Outlet />
      </main>
      <Modal open={navOpen} onClose={() => setNavOpen(false)} title="Menu">
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setNavOpen(false)}
              className={({ isActive }) =>
                `rounded-lg px-3 py-3 font-display text-base font-semibold transition-colors duration-150
                ${isActive ? 'bg-surface-hover text-text' : 'text-text-muted hover:bg-surface-hover hover:text-text'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </Modal>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <NamePrompt onResolved={() => setNameResolved(true)} />
      {nameResolved && <AddPasskeyPrompt />}
    </div>
  )
}
