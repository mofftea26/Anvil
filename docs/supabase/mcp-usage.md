# Supabase MCP Usage

This project ships with the **Supabase MCP server** (`plugin-supabase-supabase`). Cursor agents (and Claude/Codex when configured) can use it to inspect or change the Anvil backend.

## Project ref

Always use:

```
project_id (a.k.a. project ref): ekvwvxmpuwscqvfzlpek
project name: Anvil
region: ap-south-1
```

If `list_projects` returns more than one project, Anvil is the one named **Anvil** with the ref above. Do **not** touch the other project (e.g. `FitFormulas` if visible) unless explicitly asked.

## Tool reference

Discover tools by listing `C:\Users\Moff\.cursor\projects\<this-project>\mcps\plugin-supabase-supabase\tools`. Always read the descriptor JSON before calling a tool. The most-used tools:

### Read-only inspection

| Tool | Purpose |
| --- | --- |
| `list_projects` | Find the Anvil project ref. |
| `get_project` | Project metadata. |
| `list_tables` ({ project_id, schemas }) | Tables + RLS state + row counts. |
| `execute_sql` ({ project_id, query }) | Arbitrary read SQL. Use this to query `pg_*`, `information_schema`, RLS policies, RPCs, triggers, indexes. |
| `list_extensions` | Installed extensions. |
| `list_edge_functions` | Edge Functions. |
| `get_edge_function` | One Edge Function source. |
| `list_migrations` | Server-side migration log (currently empty for Anvil). |
| `get_advisors` ({ type: 'security' \| 'performance' }) | Security/performance lint reports. |
| `get_logs` | Server logs. |
| `search_docs` | Search Supabase docs. |

### Mutations

| Tool | Purpose |
| --- | --- |
| `apply_migration` | Records and runs a migration on the live DB. **Only use when ready to commit a change.** Don't iterate with this. |
| `execute_sql` | One-shot SQL execution. Use for iteration during development. |
| `deploy_edge_function` | Deploy/update an Edge Function. |

### Branches (paid feature; **Needs verification** if enabled here)

`create_branch`, `list_branches`, `merge_branch`, `rebase_branch`, `reset_branch`, `delete_branch`. Treat as off-limits unless the user opts in.

## Workflow rules

1. **Always inspect before mutating.** Run `list_tables`, `pg_policies`, `pg_proc`, etc., before changing anything.
2. **Iterate with `execute_sql`.** Avoid `apply_migration` for exploration — it pollutes the migration log.
3. **Commit migrations as files.** When done iterating, write the final SQL into `supabase/migrations/<timestamp>_<name>.sql` and commit it alongside the code change. The CI / `supabase db push` flow applies them in order.
4. **Run advisors after changes.** `get_advisors({ type: 'security' })` and `get_advisors({ type: 'performance' })`. Triage every new warning into [`/docs/decisions/technical-debt.md`](../decisions/technical-debt.md) or fix on the spot.
5. **Don't drop or alter columns silently.** Each schema change must end up in a migration file under `supabase/migrations/`.
6. **Never expose secrets.** Don't paste the service role key into chat or logs.
7. **Never bypass RLS** unless the change is inside an Edge Function or `SECURITY DEFINER` RPC that validates the caller.

## Running SQL safely

When using `execute_sql`:

- Wrap multi-statement work in a transaction (`begin … commit`) when possible.
- Use `where false` test selects to validate column names before bulk updates.
- Prefer `select count(*) from … where …` before `update`/`delete` to confirm scope.

## Migration log mismatch

`list_migrations` returns an **empty list** for Anvil today, but the local `supabase/migrations/` folder contains:

- `20250126000000_program_templates_difficulty_state.sql`
- `20260503150000_security_contract_reconciliation.sql`
- `20260503165500_workout_assignment_schedule_time.sql` (**not yet applied**)

If you intend to operate the project via the migration system, decide on the recovery path:

- **Option A**: Run `supabase db push` to apply all local migrations now (will record them in the `supabase_migrations.schema_migrations` table).
- **Option B**: If the live DB is already in the post-migration state for the first two, mark them as applied via `supabase migration repair --status applied <version>` for each.

Either way, ship `20260503165500_workout_assignment_schedule_time.sql` deliberately or revert the front-end code that references `scheduledtime`.

Tracked in [`/docs/decisions/technical-debt.md`](../decisions/technical-debt.md).

## Last Updated

2026-05-03 — initial documentation generated.
