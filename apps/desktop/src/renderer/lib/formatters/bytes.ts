/** Binary units (1024-based), consistent precision, per Spec.md §11. */
const UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const;

export interface FormatBytesOptions {
  /** Maximum fractional digits. Defaults to 1 (0 for bytes). */
  precision?: number;
  /** Output unit explicitly instead of auto-scaling. */
  unit?: (typeof UNITS)[number];
}

/** Format a byte count, e.g. 1536 -> "1.5 KB". */
export function formatBytes(bytes: number, options: FormatBytesOptions = {}): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";

  const { unit, precision } = options;

  if (unit) {
    const index = UNITS.indexOf(unit);
    if (index < 0) return "—";
    const value = bytes / 1024 ** index;
    const digits = precision ?? (index === 0 ? 0 : 1);
    return `${value.toFixed(digits)} ${unit}`;
  }

  if (bytes < 1024) return `${Math.round(bytes)} B`;

  let index = 0;
  let value = bytes;
  while (value >= 1024 && index < UNITS.length - 1) {
    value /= 1024;
    index += 1;
  }

  const digits = precision ?? 1;
  return `${value.toFixed(digits)} ${UNITS[index]}`;
}
