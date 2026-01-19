export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "").trim();
  const hasAlpha = h.length === 8;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = hasAlpha ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  const finalA = Math.max(0, Math.min(1, alpha * a));
  return `rgba(${r},${g},${b},${finalA})`;
}

export function getInitials(
  firstName: string | null | undefined,
  lastName: string | null | undefined
): string | null {
  const a = (firstName ?? "").trim();
  const b = (lastName ?? "").trim();
  const s = `${a} ${b}`.trim();
  if (!s) return null;
  const parts = s.split(/\s+/g).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  const initials = (first + second).toUpperCase();
  return initials || null;
}

export function pickAvatarBg(seed: string): string {
  const palette = [
    "#7C3AED",
    "#38BDF8",
    "#22C55E",
    "#F97316",
    "#F43F5E",
    "#A855F7",
    "#06B6D4",
  ];

  const idx = hashStringToInt(seed) % palette.length;
  return palette[idx];
}

export function formatDatePretty(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

function hashStringToInt(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
