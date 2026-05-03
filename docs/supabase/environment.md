# Environment

## Frontend env vars

The Expo client only needs the **publishable** Supabase URL + anon key. They are exposed to the bundle through Expo's `EXPO_PUBLIC_*` prefix.

| Var | Required | Where used | Notes |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | yes | `shared/supabase/client.ts` | e.g. `https://ekvwvxmpuwscqvfzlpek.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_KEY` | yes | `shared/supabase/client.ts` | The publishable (anon) key — **never** the service role |

Define them in:

```env
# .env (root)
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=<publishable-key>
```

Expo loads these via `babel-preset-expo`. Restart `pnpm start` after changes.

> **Security note**: `.env` is currently committed to the repo (`.gitignore` only ignores `.env*.local`). The values are publishable so this isn't catastrophic, but it's not a best practice. Tracked in [`technical-debt.md`](../decisions/technical-debt.md) — fix by either renaming to `.env.local` or adding `/.env` to `.gitignore` and providing a `.env.example`.

## Edge Function env vars (server-side only)

Edge Functions run in Deno on Supabase. They receive a default set of env vars from the platform:

| Var | Set by | Used by | Notes |
| --- | --- | --- | --- |
| `SUPABASE_URL` | platform | `anvil-create-client/index.ts` | Same URL the client uses |
| `SUPABASE_SERVICE_ROLE_KEY` | platform | `anvil-create-client/index.ts` | **Server-only**; never expose to the client |
| `SUPABASE_ANON_KEY` | platform | (not used in current functions) | Can be used for non-privileged calls |

Custom secrets can be set via:

```bash
supabase secrets set MY_KEY=value
# or via Supabase Dashboard → Project Settings → Edge Functions → Secrets
```

Currently no custom secrets are required.

## EAS Build

EAS profiles inherit `EXPO_PUBLIC_*` from `.env` automatically when running `eas build`. For per-profile overrides, use `eas.json`'s `env` block (currently none).

## Local Supabase

A local stack via `supabase start` is **not** wired into this repo (no `supabase/config.toml` review yet — **Needs verification**). Most development runs against the live project.

If you set up a local stack, override:

```env
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_KEY=<local-anon>
```

…and apply migrations from `supabase/migrations/` with `supabase db push`.

## Auth callback URLs

Supabase Auth → URL Configuration must allow:

- `anvil://` (PKCE deep link).
- `anvil://reset-password` (password recovery deep link target).
- For development with Expo Go: `exp://192.168.x.x:8081` (varies).

If a magic-link/recovery email comes back as an unknown URL, this is the first place to check.

## Last Updated

2026-05-03 — initial documentation generated.
