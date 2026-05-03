#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * docs-lint: enforces documentation discipline for Anvil.
 *
 * Checks:
 *   1. Every feature folder under /features/ has a corresponding doc in
 *      /docs/frontend/features/, OR is explicitly listed in the README mapping
 *      as covered by another doc.
 *   2. Every feature doc has all required sections from the template in
 *      .cursor/rules/30-feature-docs.mdc.
 *   3. Every feature doc has a non-empty "## Last Updated" section.
 *   4. /docs/decisions/changelog.md has been touched in the last 14 days
 *      (warning, not an error).
 *
 * Exit code:
 *   0 — clean
 *   1 — at least one error
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const FEATURES_DIR = path.join(ROOT, "features");
const FEATURE_DOCS_DIR = path.join(ROOT, "docs", "frontend", "features");
const FEATURE_DOCS_README = path.join(FEATURE_DOCS_DIR, "README.md");
const CHANGELOG = path.join(ROOT, "docs", "decisions", "changelog.md");

const REQUIRED_SECTIONS = [
  "## Status",
  "## Purpose",
  "## User Flow",
  "## Main Files",
  "## Components",
  "## Hooks",
  "## State Management",
  "## API / Supabase Dependencies",
  "## Validation Rules",
  "## UI / UX Rules",
  "## iOS + Android Notes",
  "## SOLID / Architecture Notes",
  "## Performance Notes",
  "## Known Issues",
  "## Last Updated",
];

const PLACEHOLDER_DOCS = new Set(["settings.md", "notifications.md"]);

const errors = [];
const warnings = [];

function readFile(p) {
  return fs.readFileSync(p, "utf8");
}

function listDirs(p) {
  return fs
    .readdirSync(p, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function listFiles(p, ext) {
  return fs
    .readdirSync(p, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(ext))
    .map((d) => d.name);
}

// 1. README mapping coverage.
const readmeContent = fs.existsSync(FEATURE_DOCS_README) ? readFile(FEATURE_DOCS_README) : "";
const featureFolders = fs.existsSync(FEATURES_DIR) ? listDirs(FEATURES_DIR) : [];

for (const folder of featureFolders) {
  if (!readmeContent.includes(`features/${folder}/`) && !readmeContent.includes(`\`features/${folder}\``)) {
    errors.push(
      `feature folder "features/${folder}/" is not referenced in /docs/frontend/features/README.md mapping table`,
    );
  }
}

// 2. Required sections + 3. Last Updated content.
if (fs.existsSync(FEATURE_DOCS_DIR)) {
  const docFiles = listFiles(FEATURE_DOCS_DIR, ".md").filter((f) => f !== "README.md");
  for (const file of docFiles) {
    const filePath = path.join(FEATURE_DOCS_DIR, file);
    const content = readFile(filePath);

    const sectionsToCheck = PLACEHOLDER_DOCS.has(file)
      ? ["## Status", "## Last Updated"]
      : REQUIRED_SECTIONS;

    for (const section of sectionsToCheck) {
      if (!content.includes(section)) {
        errors.push(`${file}: missing required section "${section}"`);
      }
    }

    const lastUpdatedMatch = content.match(/##\s+Last Updated\s*\n+([^\n]+)/);
    if (!lastUpdatedMatch || !lastUpdatedMatch[1].trim()) {
      errors.push(`${file}: "## Last Updated" section is empty`);
    } else if (!/\d{4}-\d{2}-\d{2}/.test(lastUpdatedMatch[1])) {
      errors.push(`${file}: "## Last Updated" must contain a YYYY-MM-DD date`);
    }
  }
}

// 4. Changelog freshness (warn only).
if (fs.existsSync(CHANGELOG)) {
  const stat = fs.statSync(CHANGELOG);
  const ageDays = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60 * 24);
  if (ageDays > 14) {
    warnings.push(
      `changelog.md last modified ${ageDays.toFixed(1)} days ago — appending a dated entry per change is the contract`,
    );
  }
}

let exitCode = 0;
if (errors.length) {
  console.error(`docs-lint: ${errors.length} error(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  exitCode = 1;
}
if (warnings.length) {
  console.warn(`docs-lint: ${warnings.length} warning(s):`);
  for (const w of warnings) console.warn(`  - ${w}`);
}
if (!errors.length && !warnings.length) {
  console.log("docs-lint: clean");
}
process.exit(exitCode);
