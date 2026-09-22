import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PostHogProvider } from '@posthog/react'
import './index.css'
import App from './App.tsx'
import { initializePostHog } from '@/lib/analytics'

const posthog = initializePostHog()
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

createRoot(document.getElementById('root')!).render(
  posthog ? <PostHogProvider client={posthog}>{app}</PostHogProvider> : app,
)
