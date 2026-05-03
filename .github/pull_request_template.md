<!--
Anvil PR template. The contract: every change touches docs in the same PR.
See /AGENTS.md and /docs/decisions/changelog.md.
-->

## What & why

<!-- One paragraph: what this PR does and why. Link the issue / ticket if any. -->

## How

<!-- Implementation summary. Call out any non-obvious decisions. -->

## Testing

- [ ] iOS simulator (or device)
- [ ] Android emulator (or device)
- [ ] Web (only if web is part of the change)
- [ ] Edge cases / error states

## Documentation (must)

- [ ] `/docs/decisions/changelog.md` updated with a dated entry.
- [ ] Touched feature doc(s) under `/docs/frontend/features/` updated (or created).
- [ ] `/docs/frontend/features/README.md` mapping table updated if a feature was added / renamed / changed status.
- [ ] `/docs/frontend/architecture.md` and `tech-stack.md` updated if structure / libraries changed.
- [ ] `/docs/decisions/technical-debt.md` updated for any issue found and not fixed in this PR.

## Frontend checklist

- [ ] No business logic in `/app/` route shells.
- [ ] No `supabase.from(...)` in screens or presentational components.
- [ ] All user-visible strings go through `useAppTranslation()`.
- [ ] `pnpm i18n:check` passes (en / fr / ar parity).
- [ ] `pnpm docs:lint` passes (feature-doc structure + `Last Updated` lines).
- [ ] `pnpm lint` passes.
- [ ] No new `any` (or it's documented and justified).
- [ ] No FlashList introduced (FlatList only — see ADR-008-adjacent guidance in `AGENTS.md`).
- [ ] Theme colors come from `useTheme()` only (no hex literals in feature code).
- [ ] Touch targets ≥ 44pt; status bar `light`.

## Supabase checklist (only if backend touched)

- [ ] Inspected via `plugin-supabase-supabase` MCP before changing.
- [ ] Iterated with `execute_sql`, **not** repeated `apply_migration`.
- [ ] One self-contained migration file added under `/supabase/migrations/`.
- [ ] `auth.uid()` wrapped as `(select auth.uid())` in any new RLS policy.
- [ ] UPDATE policies have matching SELECT paths.
- [ ] `WITH CHECK` mirrors `USING` on every UPDATE policy.
- [ ] No `user_metadata` used for authorization.
- [ ] `search_path` pinned on every new function.
- [ ] `SECURITY DEFINER` functions revoke from `anon` unless intentionally public.
- [ ] Edge Function (if added) validates JWT via `supabaseAdmin.auth.getUser(jwt)` and re-checks role.
- [ ] No service role key in any client code.
- [ ] `get_advisors(security)` and `get_advisors(performance)` run; deltas logged in `technical-debt.md`.
- [ ] `/docs/supabase/*.md` files updated for every touched table / RPC / Edge Function / RLS policy / trigger / bucket.

## Notes for the reviewer

<!-- Anything unusual: a flag flip you decided not to do, a temporary fallback, etc. -->
