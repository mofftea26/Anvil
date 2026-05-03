#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * i18n-check: verifies key parity across en / fr / ar.
 *
 * - en is the source of truth.
 * - For every key present in en, fr.json and ar.json must also have it.
 * - Reports keys present in fr/ar but not in en (extras).
 * - Empty string values are flagged as warnings (likely untranslated).
 *
 * Exit code:
 *   0 — parity is exact (no missing keys, no extras)
 *   1 — at least one missing key in fr or ar
 *
 * Empty values produce warnings but do not fail.
 */

const fs = require("fs");
const path = require("path");

const I18N_DIR = path.resolve(__dirname, "..", "shared", "i18n", "resources");
const LOCALES = ["en", "fr", "ar"];

function load(locale) {
  const p = path.join(I18N_DIR, `${locale}.json`);
  if (!fs.existsSync(p)) {
    console.error(`i18n-check: missing locale file ${p}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function flatten(obj, prefix = "", out = {}) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      flatten(v, key, out);
    } else {
      out[key] = v;
    }
  }
  return out;
}

const flat = {};
for (const l of LOCALES) flat[l] = flatten(load(l));

const enKeys = new Set(Object.keys(flat.en));

let missingTotal = 0;
const missingByLocale = {};
const extrasByLocale = {};
const emptyByLocale = {};

for (const l of LOCALES) {
  const lk = new Set(Object.keys(flat[l]));
  if (l === "en") continue;
  const missing = [...enKeys].filter((k) => !lk.has(k));
  const extras = [...lk].filter((k) => !enKeys.has(k));
  const empty = [...lk].filter((k) => typeof flat[l][k] === "string" && flat[l][k].trim() === "");
  missingByLocale[l] = missing;
  extrasByLocale[l] = extras;
  emptyByLocale[l] = empty;
  missingTotal += missing.length;
}

const enEmpty = [...enKeys].filter((k) => typeof flat.en[k] === "string" && flat.en[k].trim() === "");
emptyByLocale.en = enEmpty;

console.log(`i18n-check: en=${enKeys.size} keys, fr=${Object.keys(flat.fr).length}, ar=${Object.keys(flat.ar).length}`);

let hadProblem = false;
for (const l of LOCALES.filter((x) => x !== "en")) {
  if (missingByLocale[l].length) {
    hadProblem = true;
    console.error(`\n${l}.json — ${missingByLocale[l].length} missing key(s):`);
    for (const k of missingByLocale[l]) console.error(`  - ${k}`);
  }
  if (extrasByLocale[l].length) {
    hadProblem = true;
    console.error(`\n${l}.json — ${extrasByLocale[l].length} key(s) not present in en.json:`);
    for (const k of extrasByLocale[l]) console.error(`  - ${k}`);
  }
}

for (const l of LOCALES) {
  if (emptyByLocale[l] && emptyByLocale[l].length) {
    console.warn(`\n${l}.json — ${emptyByLocale[l].length} empty string value(s) (warning only):`);
    for (const k of emptyByLocale[l].slice(0, 20)) console.warn(`  - ${k}`);
    if (emptyByLocale[l].length > 20) console.warn(`  … and ${emptyByLocale[l].length - 20} more.`);
  }
}

if (!hadProblem) {
  console.log("i18n-check: clean");
  process.exit(0);
}

console.error(`\ni18n-check: ${missingTotal} missing key(s) total. Add them to the locale file(s) above.`);
process.exit(1);
