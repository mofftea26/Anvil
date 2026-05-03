---
name: anvil-supabase-change
description: Walk through any Supabase schema, RPC, RLS, trigger, storage, or Edge Function change for the Anvil project. Use when the user asks to add or modify a table, column, index, RLS policy, RPC function, trigger, storage bucket, or Edge Function, or when they say "change the database", "migrate", "add a column", "fix the RLS", "deploy an Edge Function" in this project. Always uses the `plugin-supabase-supabase` MCP server.
---

# Anvil Supabase Change

Codifies the inspect → iterate → migrate → advise → document flow for any backend change. Active project: **Anvil** (`ekvwvxmpuwscqvfzlpek`, region `ap-south-1`, Postgres 17).

## Pre-flight

Before any tool call, read these:

- `/AGENTS.md`
- `/docs/supabase/how-to-change-the-schema.md` (the canonical runbook)
- `/docs/supabase/README.md` and any `/docs/supabase/<topic>.md` relevant to the change
- `.cursor/rules/20-supabase-mcp.mdc`

## Steps

### 1. Inspect the live database (read-only)

Use the `plugin-supabase-supabase` MCP server. Run these in parallel where possible:

| What | Tool |
| --- | --- |
| Tables | `list_tables` (schemas: `["public"]`) |
| Columns | `execute_sql` over `information_schema.columns` (filter to affected tables) |
| FKs | `execute_sql` joining `information_schema.table_constraints` and `key_column_usage` |
| Indexes | `execute_sql` over `pg_indexes` |
| RLS policies | `execute_sql` over `pg_policies` |
| Triggers | `execute_sql` over `pg_trigger` (filter `not tgisinternal`) |
| Functions | `execute_sql` over `pg_proc` joined to `pg_namespace` (`nspname='public'`) |
| Edge Functions | `list_edge_functions` then `get_edge_function` for each |
| Storage | `execute_sql` over `storage.buckets` and policies on `storage.objects` |
| Migrations registered | `list_migrations` |

If `list_migrations` is empty but `/supabase/migrations/` has files, **stop**. The migration ledger has drifted — log to `/docs/decisions/technical-debt.md` if not already and ask the user how to reconcile (`db push` vs `migration repair`).

### 2. Iterate via `execute_sql`

Use `execute_sql` to shape the change against the live DB. **Do not** call `apply_migration` repeatedly — every call writes to `supabase_migrations.schema_migrations` and breaks `db diff`.

Roll back manually if you wrote something you don't want.

### 3. Author one migration file

Once you're happy with the change:

```bash
supabase migration new <descriptive-name>
```

Author the migration. Conventions:

- One change per migration.
- Pin `search_path` on every function: `set search_path = public, pg_catalog`.
- Wrap `auth.uid()` as `(select auth.uid())` in any new RLS policy (we have 83 active `auth_rls_initplan` warnings — don't add more).
- For UPDATE policies, ensure a matching SELECT path exists (otherwise UPDATE silently affects 0 rows).
- Replicate the USING expression in WITH CHECK on UPDATE (don't ship `WITH CHECK true`).
- For `SECURITY DEFINER` functions, immediately `revoke execute on function ... from anon` unless intentionally public; `grant execute on function ... to authenticated`.
- Never use `user_metadata` for authorization. Use `app_metadata` or `users.role`.

### 4. (Edge Function only) Follow the JWT pattern

Canonical example: `supabase/functions/anvil-create-client/index.ts`. Any new Edge Function must:

1. Read `Authorization: Bearer <jwt>`.
2. Validate via `supabaseAdmin.auth.getUser(jwt)` (`401` on failure).
3. Re-check role from `public.users.role` (don't trust JWT claims).
4. Return JSON envelopes for success and error.
5. Keep `verify_jwt: true` unless an ADR justifies otherwise.

If you're adding a new Edge Function, also use the `anvil-edge-function` skill.

### 5. Apply

```bash
supabase db push --linked
```

Or, if you intentionally want to apply via MCP, use `apply_migration` **once**, with the final file's contents.

For Edge Functions:

```bash
supabase functions deploy <name> --project-ref ekvwvxmpuwscqvfzlpek
```

### 6. Run advisors

```
get_advisors(type: "security")
get_advisors(type: "performance")
```

Compare deltas. Either fix new findings or log them to `/docs/decisions/technical-debt.md`.

### 7. Document — in the same change set

Update each file that the change affects. Required:

- `/docs/supabase/tables.md` — every table touched.
- `/docs/supabase/relationships.md` — any FK added/changed.
- `/docs/supabase/rls-policies.md` — any policy added/changed.
- `/docs/supabase/rpc-functions.md` — any function added/changed (state security model + Called From).
- `/docs/supabase/edge-functions.md` — any Edge Function added/changed (use the function template in `/AGENTS.md`).
- `/docs/supabase/triggers.md` — any trigger added/changed.
- `/docs/supabase/storage.md` — any bucket / policy added/changed.
- `/docs/supabase/auth.md` — any change to auth flow or settings.
- `/docs/supabase/schema.md` — if the entity model itself shifted.
- `/docs/decisions/changelog.md` — append a dated entry.
- `/docs/decisions/technical-debt.md` — for any unfixed advisor warnings.
- `/docs/decisions/architecture-decisions.md` — write an ADR if the change reflects a design decision.

### 8. Run local checks

```
pnpm docs:lint
```

## What to NOT do

- Do not call `apply_migration` more than once for a change.
- Do not skip `get_advisors`.
- Do not put a service role key in any client code.
- Do not loosen RLS without a documented reason.
- Do not commit a function with mutable `search_path`.
- Do not commit a `SECURITY DEFINER` function executable by `anon` unless you say so explicitly in the doc.

## Done definition

The migration file is committed, advisors have been run, every affected `/docs/supabase/*.md` is updated, and the changelog has a dated entry citing the migration file.
