import { useEffect, useState } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { AppLoader } from '@/components/layout/AppLoader'
import { AppShell } from '@/components/layout/AppShell'
import { EntryGate } from '@/components/auth/EntryGate'
import DashboardHome from '@/routes/DashboardHome'
import GamePage from '@/routes/GamePage'
import MultiplayerLobby from '@/routes/MultiplayerLobby'
import MultiplayerRoom from '@/routes/MultiplayerRoom'
import StatsPage from '@/routes/StatsPage'
import DailyHome from '@/routes/DailyHome'
import DailyGamePage from '@/routes/DailyGamePage'
import NotFound from '@/routes/NotFound'
import { registerReducedMotion } from '@/lib/animation/gsapConfig'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { useAuth } from '@/hooks/useAuth'

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <DashboardHome /> },
      { path: '/play/:gameId', element: <GamePage /> },
      { path: '/daily', element: <DailyHome /> },
      { path: '/daily/:gameId', element: <DailyGamePage /> },
      { path: '/party', element: <MultiplayerLobby /> },
      { path: '/party/:roomCode', element: <MultiplayerRoom /> },
      { path: '/stats', element: <StatsPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

function AppContent() {
  const [booting, setBooting] = useState(true)
  const [entryResolved, setEntryResolved] = useState(false)
  const { user, loading } = useAuth()

  const showGate = !booting && !loading && !user && !entryResolved

  return (
    <>
      {booting && <AppLoader onDone={() => setBooting(false)} />}
      {showGate && <EntryGate onResolved={() => setEntryResolved(true)} />}
      <RouterProvider router={router} />
    </>
  )
}

function App() {
  useEffect(() => {
    registerReducedMotion()
  }, [])

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
