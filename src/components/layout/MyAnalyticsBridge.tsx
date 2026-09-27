import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { FeedbackButton } from '@my-analytics/client/react'

const GAME_SCREEN = /^\/(play|daily)\/[^/]+|^\/party\/[^/]+/

/** Floating 💬 Feedback button in Metric's style. Hidden on phone-sized game screens so it never covers a board. */
export function MetricFeedbackButton() {
  const theme = useDocumentTheme()
  const { pathname } = useLocation()
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 639px)').matches)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)')
    const onChange = (e: MediaQueryListEvent) => setNarrow(e.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  if (narrow && GAME_SCREEN.test(pathname)) return null
  return <FeedbackButton accentColor="#ff5a1f" theme={theme} fontFamily="'Google Sans Flex', ui-sans-serif, system-ui, sans-serif" />
}

/** Follows the data-theme attribute that useTheme() writes, without creating a second theme state. */
function useDocumentTheme() {
  const read = () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark')
  const [theme, setTheme] = useState<'light' | 'dark'>(read)
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(read()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  return theme
}
