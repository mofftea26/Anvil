---
name: anvil-i18n-sync
description: Diagnose and fix i18n key drift across en / fr / ar in the Anvil app. Use when `pnpm i18n:check` fails, when keys are added in only one locale, when the user asks to "translate", "sync i18n", "check translations", or to add a new feature's locale keys. Edits only `shared/i18n/resources/*.json` and the relevant feature doc.
---

# Anvil i18n Sync

Runs `scripts/i18n-check.js`, surfaces the drift, and walks through bringing `fr.json` and `ar.json` back to parity with `en.json`.

`en` is the source of truth. Adding a key only to `en` and shipping is a CI failure.

## When to use

- A PR fails `pnpm i18n:check` and you need to fix it.
- You're adding a feature and need to seed locale keys.
- You're auditing translation coverage.

## Steps

### 1. Run the check

```bash
pnpm i18n:check
```

Output groups missing keys per locale, and warns on empty string values.

### 2. For each missing key

You have three options. Pick deliberately:

**A. You can translate** — fill `fr.json` and `ar.json` with proper translations. Always preferred when the key is a UI string with clear context.

**B. You don't speak the language** — add the key with the English value as a placeholder **and** append the key path to a "Needs translation" section in the relevant feature doc and in `/docs/decisions/technical-debt.md`. Surface this to the user explicitly.

**C. The key is wrong** (typo, obsolete) — remove it from `en.json` and from `fr.json`/`ar.json`. Search the codebase for usages first (`grep -r "key.path"`) — do not delete keys still referenced in TS/TSX.

Never leave the key only in `en`.

### 3. Respect the namespace structure

Locale files are nested objects, not flat. Keep the same nesting in all three. If `library.programsScreen.title` exists in `en`, it must exist under `library.programsScreen.title` in `fr.json` and `ar.json`.

### 4. Arabic specifics

- `ar.json` triggers RTL via `applyRtlIfNeeded('ar')`.
- Translations should not pre-flip text direction. RN handles RTL layout when `I18nManager.isRTL` is true.
- Numerals: prefer Western Arabic numerals (`0–9`) unless the design explicitly calls for Eastern Arabic (`٠–٩`). Be consistent within a screen.
- Currency / date / unit formatting: do via `Intl.*` in code, not in the JSON.

### 5. French specifics

- Match tone with the English source (formal vs casual). The app is consumer-facing — informal "tu" is fine where the English uses "you", unless the screen is for a paying trainer-as-business surface where "vous" reads better.
- Watch for accented characters being mangled by encoding — save UTF-8 without BOM.

### 6. Re-run the check

```bash
pnpm i18n:check
```

Repeat until clean (or until every remaining gap is logged in tech-debt with rationale).

### 7. Document

- If you added a feature's keys, update that feature's doc with the i18n namespace.
- If you used option B above, append (or update) the entry in `/docs/decisions/technical-debt.md`.
- Append a dated entry to `/docs/decisions/changelog.md`.

## What to NOT do

- Do not auto-translate via a tool without flagging it for human review. Machine translation for product UI strings is acceptable as a placeholder, not as a final state.
- Do not commit a key in only `en`.
- Do not flip text direction inside the JSON values for Arabic — let RN's layout system do it.
- Do not mix flat and nested keys.

## Done definition

`pnpm i18n:check` exits 0, or every remaining gap is logged in `/docs/decisions/technical-debt.md` with a clear path to resolution. The changelog has a dated entry citing the locale files touched.
