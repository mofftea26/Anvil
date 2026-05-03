# Supabase Backend

The backend for Anvil is a Supabase project named **Anvil** (project ref `ekvwvxmpuwscqvfzlpek`, region `ap-south-1`, Postgres 17). All schema, auth, storage, and serverless logic lives there.

> When inspecting or modifying anything backend-related, use the **Supabase MCP server** (`plugin-supabase-supabase`). See [`mcp-usage.md`](./mcp-usage.md).

## Read in this order

1. [environment.md](./environment.md) — env vars and secrets.
2. [auth.md](./auth.md) — Supabase Auth setup and assumptions.
3. [schema.md](./schema.md) — high-level schema overview & ERD.
4. [tables.md](./tables.md) — every table, columns, FKs, indexes.
5. [relationships.md](./relationships.md) — FK map & cardinality.
6. [rls-policies.md](./rls-policies.md) — every RLS policy.
7. [rpc-functions.md](./rpc-functions.md) — every RPC, with security model.
8. [triggers.md](./triggers.md) — every trigger.
9. [edge-functions.md](./edge-functions.md) — every Edge Function.
10. [storage.md](./storage.md) — buckets and storage RLS.
11. [mcp-usage.md](./mcp-usage.md) — how to safely use the MCP server.

## Project Facts

| Item | Value |
| --- | --- |
| Project name | Anvil |
| Project ref | `ekvwvxmpuwscqvfzlpek` |
| Region | `ap-south-1` |
| Postgres version | 17.6.1.063 |
| GraphQL | enabled (pg_graphql 1.5.11) — used implicitly by some advisors; the app uses PostgREST + RPCs |
| Realtime | available (not yet wired in the app) |
| Storage | `avatars`, `exercises`, `logos` (public), `pdfs` (private) |
| Edge Functions | `anvil-create-client` |

## Conventions

- Table names are `camelCase` (e.g. `programTemplates`, `clientWorkoutAssignments`). Postgres preserves case via double-quoting.
- Column names mix `camelCase` (older code) and lowercase (newer assignments tables — `clientid`, `trainerid`, `scheduledfor`). Treat the case carefully when writing SQL.
- Every public table has RLS enabled (verified via `list_tables`).
- Every privileged write goes through a `SECURITY DEFINER` RPC (`anvil_*`, `assign_*`, `archive_*`, etc.) — see [`rpc-functions.md`](./rpc-functions.md).
- Triggers handle audit fields, updatedAt bumps, and lockdown of immutable fields (creator/owner).

## Security Posture (May 2026 snapshot)

Run `get_advisors` (`security` and `performance`) regularly. Current outstanding warnings (see [`/docs/decisions/technical-debt.md`](../decisions/technical-debt.md) for full triage):

- 15 functions with mutable `search_path` (security `WARN`).
- 53 `SECURITY DEFINER` RPCs callable by `anon` and 53 by `authenticated` — by design for some, but each should be reviewed.
- 2 RLS policies with `WITH CHECK true` (`exercises_update`, `programtemplates_update`).
- 2 public buckets allow listing (`avatars`, `logos`).
- Auth leaked-password protection is **disabled**.
- 83 `auth_rls_initplan` performance warnings (RLS policies re-evaluating `auth.uid()` per row).
- 35 unused indexes, 41 multiple permissive policies, 1 duplicate index.

These are tracked, not blocking.
