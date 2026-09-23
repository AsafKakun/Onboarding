import { TASK_TEMPLATES } from '../domain/taskTemplates';
import type { Employee, Manager, OnboardingTask } from '../domain/types';
import { addDays, toDayNumber } from '../utils/date';

export interface SampleData {
  managers: Manager[];
  employees: Employee[];
  tasks: OnboardingTask[];
}

export const DEFAULT_SEED = 20260921;

const MANAGERS: Manager[] = [
  { id: 'm-eng', fullName: 'Maya Cohen', department: 'Engineering' },
  { id: 'm-prod', fullName: 'Daniel Weiss', department: 'Product' },
  { id: 'm-sales', fullName: 'Priya Nair', department: 'Sales' },
  { id: 'm-mkt', fullName: 'Tom Becker', department: 'Marketing' },
  { id: 'm-fin', fullName: 'Elena Rossi', department: 'Finance' },
  { id: 'm-support', fullName: 'Omar Haddad', department: 'Customer Support' },
];

interface EmployeeSpec {
  fullName: string;
  position: string;
  managerId: string;
  /** Start date relative to today, in days (negative = already started). */
  startOffsetDays: number;
  /** How many past-due tasks are left incomplete. Ignored for fully completed employees. */
  overdueTasks: number;
  fullyCompleted?: boolean;
}

// Spread of start dates so that every stage and status is represented.
const EMPLOYEE_SPECS: EmployeeSpec[] = [
  // Not started yet
  {
    fullName: 'Noa Friedman',
    position: 'Frontend Developer',
    managerId: 'm-eng',
    startOffsetDays: 3,
    overdueTasks: 0,
  },
  {
    fullName: 'Lucas Meyer',
    position: 'Account Executive',
    managerId: 'm-sales',
    startOffsetDays: 7,
    overdueTasks: 1,
  },
  {
    fullName: 'Amira Khalil',
    position: 'Financial Analyst',
    managerId: 'm-fin',
    startOffsetDays: 14,
    overdueTasks: 0,
  },
  // First day
  {
    fullName: 'Ethan Brooks',
    position: 'Support Specialist',
    managerId: 'm-support',
    startOffsetDays: 0,
    overdueTasks: 0,
  },
  // First week
  {
    fullName: 'Sofia Alvarez',
    position: 'Product Designer',
    managerId: 'm-prod',
    startOffsetDays: -2,
    overdueTasks: 0,
  },
  {
    fullName: 'Yuval Katz',
    position: 'Backend Developer',
    managerId: 'm-eng',
    startOffsetDays: -5,
    overdueTasks: 2,
  },
  {
    fullName: 'Hannah Schmidt',
    position: 'Content Specialist',
    managerId: 'm-mkt',
    startOffsetDays: -7,
    overdueTasks: 0,
  },
  // First month
  {
    fullName: "Liam O'Connor",
    position: 'QA Engineer',
    managerId: 'm-eng',
    startOffsetDays: -12,
    overdueTasks: 0,
  },
  {
    fullName: 'Aisha Rahman',
    position: 'Sales Development Rep',
    managerId: 'm-sales',
    startOffsetDays: -18,
    overdueTasks: 5,
  },
  {
    fullName: 'Tal Mizrahi',
    position: 'Growth Marketer',
    managerId: 'm-mkt',
    startOffsetDays: -24,
    overdueTasks: 0,
  },
  {
    fullName: 'Chen Wei',
    position: 'Payroll Accountant',
    managerId: 'm-fin',
    startOffsetDays: -29,
    overdueTasks: 2,
  },
  // End of onboarding period
  {
    fullName: 'Olivia Martin',
    position: 'Product Manager',
    managerId: 'm-prod',
    startOffsetDays: -35,
    overdueTasks: 0,
  },
  {
    fullName: 'Rami Nasser',
    position: 'Support Team Lead',
    managerId: 'm-support',
    startOffsetDays: -55,
    overdueTasks: 3,
  },
  {
    fullName: 'Grace Kim',
    position: 'Account Executive',
    managerId: 'm-sales',
    startOffsetDays: -80,
    overdueTasks: 0,
  },
  // Fully completed
  {
    fullName: 'Jonas Berg',
    position: 'Financial Analyst',
    managerId: 'm-fin',
    startOffsetDays: -95,
    overdueTasks: 0,
    fullyCompleted: true,
  },
  {
    fullName: 'Layla Hassan',
    position: 'Content Specialist',
    managerId: 'm-mkt',
    startOffsetDays: -110,
    overdueTasks: 0,
    fullyCompleted: true,
  },
  {
    fullName: 'Michael Ortiz',
    position: 'Frontend Developer',
    managerId: 'm-eng',
    startOffsetDays: -130,
    overdueTasks: 0,
    fullyCompleted: true,
  },
  {
    fullName: 'Emma Dubois',
    position: 'Product Designer',
    managerId: 'm-prod',
    startOffsetDays: -150,
    overdueTasks: 0,
    fullyCompleted: true,
  },
];

/** Small deterministic random number generator (mulberry32). */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}

/**
 * Builds realistic sample data. The output is deterministic for a given `today` and `seed`,
 * and all dates are relative to `today` so there are always some overdue tasks.
 */
export function generateSampleData(today: string, seed: number = DEFAULT_SEED): SampleData {
  const random = createRandom(seed);
  const departmentByManager = new Map(MANAGERS.map((m) => [m.id, m.department]));

  const employees: Employee[] = [];
  const tasks: OnboardingTask[] = [];

  EMPLOYEE_SPECS.forEach((spec, index) => {
    const employee: Employee = {
      id: `e-${String(index + 1).padStart(2, '0')}`,
      fullName: spec.fullName,
      position: spec.position,
      department: departmentByManager.get(spec.managerId) ?? '',
      managerId: spec.managerId,
      startDate: addDays(today, spec.startOffsetDays),
    };
    employees.push(employee);
    tasks.push(
      ...buildEmployeeTasks(employee, today, random, {
        overdueTasks: spec.overdueTasks,
        fullyCompleted: spec.fullyCompleted ?? false,
      }),
    );
  });

  return { managers: MANAGERS.map((m) => ({ ...m })), employees, tasks };
}

/**
 * Creates the standard onboarding tasks for one employee, completed realistically up to `today`:
 * every past-due task is done except `overdueTasks` of them; with `fullyCompleted` every task is done.
 */
export function buildEmployeeTasks(
  employee: Employee,
  today: string,
  random: () => number,
  { overdueTasks, fullyCompleted }: { overdueTasks: number; fullyCompleted: boolean },
): OnboardingTask[] {
  const todayNumber = toDayNumber(today) as number;
  // Nobody completes something more than two weeks before they start.
  const earliestCompletion = (toDayNumber(employee.startDate) ?? todayNumber) - 14;

  const tasks: OnboardingTask[] = TASK_TEMPLATES.map((template, taskIndex) => ({
    id: `${employee.id}-t${String(taskIndex + 1).padStart(2, '0')}`,
    employeeId: employee.id,
    stage: template.stage,
    title: template.title,
    owner: template.owner,
    dueDate: addDays(employee.startDate, template.dueOffsetDays),
    completedAt: null,
  }));

  const completeOn = (task: OnboardingTask, completedNumber: number) => {
    const day = Math.min(todayNumber, Math.max(earliestCompletion, completedNumber));
    task.completedAt = addDays(today, day - todayNumber);
  };

  const pastDue = tasks.filter((task) => (toDayNumber(task.dueDate) ?? todayNumber) < todayNumber);
  const leftOverdue = new Set(
    fullyCompleted ? [] : shuffle(pastDue, random).slice(0, overdueTasks),
  );

  for (const task of tasks) {
    const due = toDayNumber(task.dueDate);
    if (due === null) continue;
    if (due < todayNumber || fullyCompleted) {
      if (!leftOverdue.has(task)) completeOn(task, due - Math.floor(random() * 3));
    } else if (due <= todayNumber + 3 && random() < 0.2) {
      completeOn(task, todayNumber); // finished a little early
    }
  }
  return tasks;
}
