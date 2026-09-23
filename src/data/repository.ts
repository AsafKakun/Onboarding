import type { Employee, Manager, OnboardingTask } from '../domain/types';
import type { EmployeeImportRow } from './employeeCsv';

export interface ImportResult {
  created: number;
  updated: number;
}

/** Where the data shown on the dashboard comes from (shown in the footer). */
export type DataSource =
  { kind: 'sample' } | { kind: 'airtable-live' } | { kind: 'airtable-snapshot'; syncedAt: string };

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
  /** Where the data comes from; used by the footer. */
  readonly source?: DataSource;
  /** Adds or updates employees at the source; only when the source can be written (live Airtable). */
  importEmployees?(rows: readonly EmployeeImportRow[]): Promise<ImportResult>;
  /** Only implemented by the demo repository; clears local changes and regenerates sample data. */
  resetDemoData?(): Promise<void>;
}
