import { getTaskStatus } from './taskStatus';
import type { OnboardingTask, TaskCounts } from './types';

export function countTasks(tasks: readonly OnboardingTask[], today: string): TaskCounts {
  const counts: TaskCounts = { total: tasks.length, completed: 0, open: 0, overdue: 0 };
  for (const task of tasks) counts[getTaskStatus(task, today)] += 1;
  return counts;
}

/** Whole-number percentage of completed tasks. 0 when there are no tasks. */
export function progressPercent(counts: Pick<TaskCounts, 'total' | 'completed'>): number {
  if (counts.total === 0) return 0;
  return Math.round((counts.completed / counts.total) * 100);
}
