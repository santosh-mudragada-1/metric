import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@shared': path.resolve(import.meta.dirname, './shared'),
    },
  },
  server: {
    port: 5173,
    // Reachable from other devices on the LAN (e.g. a phone joining a party
    // created on desktop) — default Vite only binds to localhost.
    host: true,
  },
  build: {
    rollupOptions: {
      // Two HTML entries sharing one SPA bundle, so social crawlers (which don't
      // run JS) see route-appropriate og:image/description depending on which
      // file vercel.json routes them to — index.html for everything, daily.html
      // for /daily*. React Router still owns client-side navigation from either.
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        daily: path.resolve(import.meta.dirname, 'daily.html'),
      },
    },
  },
})
