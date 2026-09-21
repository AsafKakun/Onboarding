import { toDayNumber } from '../utils/date';
import type { OnboardingTask, TaskStatus, TaskView } from './types';

/**
 * Completed: has a completion date.
 * Overdue: not completed and due before today.
 * Open: everything else (including tasks with a missing due date).
 */
export function getTaskStatus(
  task: Pick<OnboardingTask, 'dueDate' | 'completedAt'>,
  today: string,
): TaskStatus {
  if (task.completedAt) return 'completed';
  const due = toDayNumber(task.dueDate);
  const now = toDayNumber(today);
  if (due === null || now === null) return 'open';
  return due < now ? 'overdue' : 'open';
}

export function toTaskView(task: OnboardingTask, today: string): TaskView {
  return { ...task, status: getTaskStatus(task, today) };
}
