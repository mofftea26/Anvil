---
name: anvil-doc-lint
description: Diagnose and fix Anvil documentation drift. Use when the user asks to audit docs, when `pnpm docs:lint` fails, when feature docs are missing required sections or `Last Updated` lines, or when feature folders aren't covered by the README mapping table. Read-mostly; only edits docs.
---

# Anvil Doc Lint

Runs and interprets `scripts/docs-lint.js`, then fixes the drift it surfaces. Use this when:

- A PR fails `pnpm docs:lint` and you need to bring it to green.
- A feature was added/renamed and the docs haven't caught up.
- You're starting an audit pass and want a quick map of what's stale.

This skill **only edits documentation**. It does not modify feature code.

## What the linter checks

1. Every folder under `/features/` must be referenced in `/docs/frontend/features/README.md` (mapping table). Missing → error.
2. Every doc in `/docs/frontend/features/` (except `README.md`, `settings.md`, `notifications.md`) must include all 15 required sections from the template. Missing → error per section.
3. Every doc must have a non-empty `## Last Updated` section containing a `YYYY-MM-DD` date. Missing or undated → error.
4. `docs/decisions/changelog.md` modified more than 14 days ago → warning.

## Steps

### 1. Run the linter

```bash
pnpm docs:lint
```

If exit code is 0, you're done.

### 2. For each error, decide

- **Folder missing from README mapping**: open `/docs/frontend/features/README.md`, add a row that points at the doc that covers the folder (or write a new doc — see step 3).
- **Section missing**: open the offending doc and add the section. Either fill it with real content (read the feature's actual code first) or write `Needs verification: <what to check, where>`.
- **`Last Updated` empty / undated**: append today's date and a one-line summary.

### 3. Folder has no doc at all

Use the `anvil-feature-scaffolder` skill's step 7 (create the feature doc) — copy the template from `.cursor/rules/30-feature-docs.mdc`. Inspect actual code (`features/<name>/**`) to fill the sections. If something is unclear, mark `Needs verification`.

### 4. Re-run

```bash
pnpm docs:lint
```

Repeat until clean.

### 5. Append a changelog entry

Add a dated entry to `/docs/decisions/changelog.md` describing the docs cleanup. Include the affected files.

## What to NOT do

- Do not auto-edit feature code to match the docs. Trust the code, then update the docs.
- Do not guess at sections you can't verify. Use `Needs verification: <…>`.
- Do not mark the placeholders (`settings.md`, `notifications.md`) as full features — they are intentionally stubs.

## Done definition

`pnpm docs:lint` exits 0, the changelog has a new entry, every section that was previously missing now has either real content or a `Needs verification` note.
