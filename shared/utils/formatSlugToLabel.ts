/**
 * Formats backend slug-like strings (camelCase, snake_case, lowercase) into
 * human-readable labels: "fatLoss" → "Fat loss", "gluteMax" → "Glute max",
 * "tricepLongHead" → "Tricep long head".
 *
 * Use wherever backend data (target muscles, equipment, etc.) is displayed to users.
 * Pure function – no provider; call at render time for maximum performance.
 */
export function formatSlugToLabel(slug: string): string {
  if (slug == null || typeof slug !== "string") return "";
  const trimmed = slug.trim();
  if (!trimmed) return "";

  // Insert space before capital letters (camelCase → words)
  const withSpaces = trimmed.replace(/([a-z\d])([A-Z])/g, "$1 $2");
  // Split on spaces/underscores/hyphens and filter empty
  const words = withSpaces.split(/[\s_\-]+/).filter(Boolean);
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
