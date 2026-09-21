const MS_PER_DAY = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Converts an ISO date ("YYYY-MM-DD") to a whole day number, or null if missing/invalid. */
export function toDayNumber(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const match = ISO_DATE.exec(iso);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const ms = Date.UTC(year, month - 1, day);
  const check = new Date(ms);
  const isRealDate =
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day;
  return isRealDate ? ms / MS_PER_DAY : null;
}

export function fromDayNumber(dayNumber: number): string {
  return new Date(dayNumber * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Adds days to a valid ISO date. Returns an empty string if the input is invalid. */
export function addDays(iso: string, days: number): string {
  const day = toDayNumber(iso);
  return day === null ? '' : fromDayNumber(day + days);
}

/** Whole days from `fromIso` to `toIso` (positive if `toIso` is later), or null if either is invalid. */
export function daysBetween(
  fromIso: string | null | undefined,
  toIso: string | null | undefined,
): number | null {
  const from = toDayNumber(fromIso);
  const to = toDayNumber(toIso);
  return from === null || to === null ? null : to - from;
}

/** The single source of "today" (local time zone, no time component). */
export function getToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** ISO date -> "DD/MM/YYYY". Returns an empty string for missing/invalid dates. */
export function formatDate(iso: string | null | undefined): string {
  if (toDayNumber(iso) === null) return '';
  const [year, month, day] = (iso as string).split('-');
  return `${day}/${month}/${year}`;
}
