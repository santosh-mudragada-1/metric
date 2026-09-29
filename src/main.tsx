import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PostHogProvider } from '@posthog/react'
import './index.css'
import App from './App.tsx'
import { AnalyticsProvider } from '@my-analytics/client/react'
import { initializePostHog } from '@/lib/analytics'

const posthog = initializePostHog()
const app = (
  <StrictMode>
    <AnalyticsProvider
      projectId={import.meta.env.VITE_ANALYTICS_PROJECT_ID}
      apiKey={import.meta.env.VITE_ANALYTICS_KEY}
      trackLocalhost={import.meta.env.VITE_ANALYTICS_TRACK_LOCALHOST === 'true'}
    >
      <App />
    </AnalyticsProvider>
  </StrictMode>
)

createRoot(document.getElementById('root')!).render(
  posthog ? <PostHogProvider client={posthog}>{app}</PostHogProvider> : app,
)
