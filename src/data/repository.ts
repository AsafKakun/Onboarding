import type { Employee, Manager, OnboardingTask } from '../domain/types';

/**
 * The only thing the UI knows about where data comes from.
 * To connect a real source, implement this interface and swap it in `hooks/useRepository.tsx`.
 */
export interface OnboardingRepository {
  getEmployees(): Promise<Employee[]>;
  getManagers(): Promise<Manager[]>;
  /** All tasks of all employees. */
  getTasks(): Promise<OnboardingTask[]>;
  getTasksForEmployee(employeeId: string): Promise<OnboardingTask[]>;
  /** Marks a task completed (today) or open again, and returns the updated task. */
  setTaskCompleted(taskId: string, completed: boolean): Promise<OnboardingTask>;
  /** Only implemented by the demo repository; clears local changes and regenerates sample data. */
  resetDemoData?(): Promise<void>;
}
