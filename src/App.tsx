import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import DashboardHome from '@/routes/DashboardHome'
import GamePage from '@/routes/GamePage'
import MultiplayerLobby from '@/routes/MultiplayerLobby'
import MultiplayerRoom from '@/routes/MultiplayerRoom'
import NotFound from '@/routes/NotFound'
import { registerReducedMotion } from '@/lib/animation/gsapConfig'

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <DashboardHome /> },
      { path: '/play/:gameId', element: <GamePage /> },
      { path: '/party', element: <MultiplayerLobby /> },
      { path: '/party/:roomCode', element: <MultiplayerRoom /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

function App() {
  useEffect(() => {
    registerReducedMotion()
  }, [])

  return <RouterProvider router={router} />
}

export default App
