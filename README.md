# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Multiplayer (party rooms)

Party rooms run on [PartyKit](https://partykit.io) (`party/rooms/gameRoom.ts`). Locally:

```
npm run dev:all   # runs vite (5173) and `partykit dev` (1999) together
```

The client connects to `VITE_PARTYKIT_HOST`, falling back to the page's own hostname on port
1999 when that env var isn't set. That fallback is what makes **testing across devices** work
without config: open the app on your desktop via its LAN IP (e.g. `http://192.168.1.23:5173`,
not `http://localhost:5173`) and a phone on the same Wi-Fi joining that same URL will correctly
reach `192.168.1.23:1999` instead of hanging on "connecting to room" (which is what happens if
the phone tries to resolve `localhost:1999` against itself).

For production, deploy the party server (`npx partykit deploy`) and set `VITE_PARTYKIT_HOST` to
the deployed host (e.g. `metric.yourname.partykit.dev`) in `.env.local` and in Vercel's
environment variables — otherwise deployed clients will try to reach `localhost:1999` and never
connect.

## Setting up sign-in (Google, email OTP, passkeys)

Auth and per-player stats run on [Supabase](https://supabase.com). Without it configured, the app still works fully as a guest — sign-in UI shows "not configured yet" and games keep tracking local bests as before.

1. **Create a Supabase project** at [supabase.com](https://supabase.com/dashboard).
2. **Run the schema.** In the project's SQL Editor, run [`supabase/schema.sql`](./supabase/schema.sql) — it creates the `game_results` table (one row per completed game) with row-level security so players can only read/write their own rows.
3. **Set env vars.** In `.env.local`, fill in:
   ```
   VITE_SUPABASE_URL=https://<your-project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your anon/public key>
   ```
   (Both are under Project Settings -> API.) Add the same two vars to your Vercel project's environment variables for production.
4. **Google sign-in.** In Supabase, Authentication -> Providers -> Google. You'll need an OAuth client ID/secret from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (OAuth consent screen + Web application client), with the redirect URI Supabase gives you added to the client's allowed redirect URIs.
5. **Email sign-in.** Enabled by default under Authentication -> Providers -> Email. The app uses a magic-link flow (`supabase.auth.signInWithOtp`): players get an emailed link and are signed in the moment they open it, no typed code needed — this works out of the box on Supabase's free tier, which doesn't allow customizing the email template (typed-code OTP requires a custom template, which needs a paid plan or custom SMTP).
6. **Passkeys.** Authentication -> Passkeys (beta, opt-in). Set the Relying Party Display Name, Relying Party ID, and Relying Party Origins to your production domain. Note the RP ID's hostname must match the origin's hostname (or a parent of it) per the WebAuthn spec, so `localhost` can't share an RP ID with a production domain — passkeys can only be tested against the deployed site, not local dev.

Once configured, players sign in from the header, and `/stats` shows their average and best score for each of the eight games.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
