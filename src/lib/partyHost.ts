/**
 * `localhost:1999` only resolves for whoever's browser it is — a phone joining over the
 * LAN would resolve "localhost" to itself, not the machine running `wrangler dev`, and hang
 * forever trying to connect. Falling back to the page's own hostname makes cross-device dev
 * testing (desktop creates a room, phone joins via the desktop's LAN IP) work without config.
 * Production should still set VITE_PARTYKIT_HOST to the deployed Worker's host.
 */
function defaultPartyHost(): string {
  if (typeof window === 'undefined') return 'localhost:1999'
  return `${window.location.hostname}:1999`
}

export const PARTY_HOST: string = import.meta.env.VITE_PARTYKIT_HOST || defaultPartyHost()
