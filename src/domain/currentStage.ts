import { daysBetween } from '../utils/date';
import type { Stage } from './types';

/** Current stage from the start date. Null when the start date is missing or invalid. */
export function getCurrentStage(startDate: string | null | undefined, today: string): Stage | null {
  const daysSinceStart = daysBetween(startDate, today);
  if (daysSinceStart === null) return null;
  if (daysSinceStart < 0) return 'before-start';
  if (daysSinceStart === 0) return 'first-day';
  if (daysSinceStart <= 7) return 'first-week';
  if (daysSinceStart <= 30) return 'first-month';
  return 'end-of-period';
}
