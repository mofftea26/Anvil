# How to Change the Schema, RPCs, or Edge Functions

The canonical workflow for any database, RPC, or Edge Function change. Follow it top-to-bottom.

> Optional shortcut: the `anvil-supabase-change` agent skill (`.agents/skills/anvil-supabase-change/SKILL.md`) walks through this end-to-end.

Active project: **Anvil** (`ekvwvxmpuwscqvfzlpek`, region `ap-south-1`, Postgres 17). Use the **`plugin-supabase-supabase` MCP server**.

---

## 0. Read first

- `/AGENTS.md`
- `/docs/supabase/README.md`
- `/docs/supabase/schema.md`, `tables.md`, `relationships.md`, `rls-policies.md`, `rpc-functions.md`, `edge-functions.md`, `triggers.md`, `storage.md`, `auth.md`.
- `/docs/decisions/architecture-decisions.md` — especially ADR-005 (JSONB `state` model) and ADR-006 (Edge Functions).
- `.cursor/rules/20-supabase-mcp.mdc`.

---

## 1. Inspect the live database

Run these via MCP (read-only). Do this **before** writing any SQL.

| What | Tool / query |
| --- | --- |
| Tables | `list_tables` (schemas: `["public"]`) |
| Columns | `execute_sql` over `information_schema.columns` |
| FKs | `execute_sql` joining `information_schema.table_constraints` and `key_column_usage` |
| Indexes | `execute_sql` over `pg_indexes` |
| RLS policies | `execute_sql` over `pg_policies` |
| Triggers | `execute_sql` over `pg_trigger` (filter `not tgisinternal`) |
| Functions | `execute_sql` over `pg_proc` joined to `pg_namespace` (`nspname='public'`) |
| Edge Functions | `list_edge_functions`, `get_edge_function` |
| Storage | `execute_sql` over `storage.buckets` and `storage.objects` policies |
| Migrations registered | `list_migrations` |

If `list_migrations` returns rows that don't match `/supabase/migrations/`, **stop and reconcile** before changing anything (see the migration-mismatch tech-debt entry).

---

## 2. Iterate with `execute_sql`

Use `execute_sql` to try changes against the live DB while you're shaping the design. Roll back manually if needed; nothing is "saved" to the migration ledger by `execute_sql`.

**Do not call `apply_migration` repeatedly during iteration.** Every call writes a migration row, and that breaks `db diff`. Use `execute_sql` for development, then write **one** migration file at the end.

---

## 3. Write the migration file

```bash
supabase migration new <descriptive-name>
```

The new file lands at `/supabase/migrations/<timestamp>_<name>.sql`. Author it as one self-contained migration. Conventions:

- One change per migration. If you can describe it in two sentences, it's one migration. If you can't, split it.
- Include the rollback (or note "no rollback by design") in a comment header.
- Wrap in a transaction by default; only step out if the change requires it (e.g., `CREATE INDEX CONCURRENTLY`).
- Use SQL-standard syntax. No `psql` meta-commands.
- Pin `search_path` on every function: `set search_path = public, pg_catalog`.

### RLS guardrails

- Wrap `auth.uid()` in `(select auth.uid())` so the planner can hoist it. We have 83 active `auth_rls_initplan` warnings — don't add to the pile.
- For UPDATE policies: the row must also be visible via SELECT. UPDATE policies need a matching SELECT path or the UPDATE silently affects 0 rows.
- Replicate the USING expression in WITH CHECK. `WITH CHECK true` on an authenticated UPDATE bypasses RLS post-write — we have 2 active warnings of this type already.
- Never use `user_metadata` for authorization. Use `app_metadata` or the `users.role` column.

### `SECURITY DEFINER` RPCs

- Default to `SECURITY INVOKER` unless you genuinely need elevated access.
- If `SECURITY DEFINER`, immediately `revoke execute on function ... from anon` (we have 53 active warnings here). Grant only what's needed (`grant execute on function ... to authenticated`).
- Document `Called From` in `/docs/supabase/rpc-functions.md`.

### Edge Functions

If the change is or includes an Edge Function:

1. The function must read `Authorization: Bearer <jwt>`.
2. Validate it via `supabaseAdmin.auth.getUser(jwt)` (`401` on failure).
3. Re-check the role from `public.users.role` (do not trust JWT claims).
4. Return JSON envelopes for success and error.
5. `verify_jwt: true` is the default; only opt out with an ADR.

Canonical example: `supabase/functions/anvil-create-client/index.ts`.

---

## 4. Apply the migration locally and to the live project

```bash
# Local dev DB
supabase db reset    # if running a local Supabase
# Live project
supabase db push --linked
```

Or, if you intentionally want to apply via MCP, use `apply_migration` **once**, with the final file's contents.

For Edge Functions:

```bash
supabase functions deploy <name> --project-ref ekvwvxmpuwscqvfzlpek
```

---

## 5. Run `get_advisors`

Run **both** kinds:

- `get_advisors(type: "security")`
- `get_advisors(type: "performance")`

Compare counts to the previous baseline (latest entry in `/docs/decisions/technical-debt.md` should reflect the last known total). Either fix new findings or log them in `technical-debt.md` using the format from `/AGENTS.md`.

---

## 6. Update the docs (same change set)

Update everything that the change affects. Required:

- `/docs/supabase/tables.md` — every table touched.
- `/docs/supabase/relationships.md` — any FK added/changed.
- `/docs/supabase/rls-policies.md` — any policy added/changed.
- `/docs/supabase/rpc-functions.md` — any function added/changed (state security model + Called From).
- `/docs/supabase/edge-functions.md` — any Edge Function added/changed.
- `/docs/supabase/triggers.md` — any trigger added/changed.
- `/docs/supabase/storage.md` — any bucket / storage policy added/changed.
- `/docs/supabase/auth.md` — any change to auth flow or settings.
- `/docs/supabase/schema.md` — if the entity model itself shifted.
- `/docs/decisions/changelog.md` — append a dated entry.
- `/docs/decisions/technical-debt.md` — append for any unfixed advisor warnings.
- `/docs/decisions/architecture-decisions.md` — write an ADR if the change reflects a design decision (e.g., new Edge Function, new bucket, schema validation strategy).

---

## 7. PR-time checklist

- [ ] Inspected via MCP before changing anything.
- [ ] Iterated with `execute_sql`, not repeated `apply_migration`.
- [ ] One self-contained migration file added under `/supabase/migrations/`.
- [ ] `auth.uid()` wrapped as `(select auth.uid())` in any new RLS policy.
- [ ] UPDATE policies have matching SELECT paths.
- [ ] `WITH CHECK` mirrors `USING` on every UPDATE policy.
- [ ] No `user_metadata` used for authorization.
- [ ] `search_path` pinned on every new function.
- [ ] `SECURITY DEFINER` functions revoke from `anon` unless intentionally public.
- [ ] Edge Function validates JWT via `supabaseAdmin.auth.getUser(jwt)` and re-checks role.
- [ ] No service role key in any client code.
- [ ] `get_advisors(security)` + `get_advisors(performance)` run; deltas logged.
- [ ] All affected `/docs/supabase/*.md` updated.
- [ ] `/docs/decisions/changelog.md` entry appended.

---

## Last Updated

2026-05-03 — initial runbook authored as part of the docs / rules / skills audit pass.
