export type Stage = 'before-start' | 'first-day' | 'first-week' | 'first-month' | 'end-of-period';
export type Owner = 'HR' | 'Manager' | 'Employee' | 'IT';

export interface Manager {
  id: string;
  fullName: string;
  department: string;
}

export interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
  managerId: string;
  /** ISO date, "YYYY-MM-DD" */
  startDate: string;
}

export interface OnboardingTask {
  id: string;
  employeeId: string;
  stage: Stage;
  title: string;
  owner: Owner;
  /** ISO date */
  dueDate: string;
  /** ISO date; null = not completed */
  completedAt: string | null;
}

// --- Derived values (computed from the raw data above, never stored) ---

export type TaskStatus = 'completed' | 'open' | 'overdue';
export type EmployeeStatus = 'completed' | 'needs-attention' | 'on-track';

export interface TaskCounts {
  total: number;
  completed: number;
  open: number;
  overdue: number;
}

export interface EmployeeSummary {
  employee: Employee;
  manager: Manager | null;
  /** null when the start date is missing or invalid */
  currentStage: Stage | null;
  counts: TaskCounts;
  /** 0-100 */
  progress: number;
  status: EmployeeStatus;
}

export interface TaskView extends OnboardingTask {
  status: TaskStatus;
}
