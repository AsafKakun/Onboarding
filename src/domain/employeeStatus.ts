import type { EmployeeStatus, TaskCounts } from './types';

/** Precedence: Completed, then Needs attention, then On track. */
export function getEmployeeStatus(counts: TaskCounts): EmployeeStatus {
  if (counts.total > 0 && counts.completed === counts.total) return 'completed';
  if (counts.overdue > 0) return 'needs-attention';
  return 'on-track';
}

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  completed: 'Completed',
  'needs-attention': 'Needs attention',
  'on-track': 'On track',
};
