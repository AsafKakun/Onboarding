import { getCurrentStage } from './currentStage';
import { getEmployeeStatus } from './employeeStatus';
import { countTasks, progressPercent } from './progress';
import { STAGE_IDS } from './stages';
import type {
  Employee,
  EmployeeStatus,
  EmployeeSummary,
  Manager,
  OnboardingTask,
  Stage,
} from './types';

export function buildSummaries(
  employees: readonly Employee[],
  managers: readonly Manager[],
  tasks: readonly OnboardingTask[],
  today: string,
): EmployeeSummary[] {
  const managersById = new Map(managers.map((manager) => [manager.id, manager]));
  const tasksByEmployee = new Map<string, OnboardingTask[]>();
  for (const task of tasks) {
    const list = tasksByEmployee.get(task.employeeId);
    if (list) list.push(task);
    else tasksByEmployee.set(task.employeeId, [task]);
  }

  return employees.map((employee) => {
    const counts = countTasks(tasksByEmployee.get(employee.id) ?? [], today);
    return {
      employee,
      manager: managersById.get(employee.managerId) ?? null,
      currentStage: getCurrentStage(employee.startDate, today),
      counts,
      progress: progressPercent(counts),
      status: getEmployeeStatus(counts),
    };
  });
}

export interface Kpis {
  totalEmployees: number;
  inProgress: number;
  completed: number;
  openTasks: number;
  overdueTasks: number;
}

export function computeKpis(summaries: readonly EmployeeSummary[]): Kpis {
  const kpis: Kpis = {
    totalEmployees: summaries.length,
    inProgress: 0,
    completed: 0,
    openTasks: 0,
    overdueTasks: 0,
  };
  for (const summary of summaries) {
    if (summary.status === 'completed') kpis.completed += 1;
    else kpis.inProgress += 1;
    kpis.openTasks += summary.counts.open;
    kpis.overdueTasks += summary.counts.overdue;
  }
  return kpis;
}

export function countByStage(summaries: readonly EmployeeSummary[]): Record<Stage, number> {
  const counts = Object.fromEntries(STAGE_IDS.map((stage) => [stage, 0])) as Record<Stage, number>;
  for (const summary of summaries) {
    if (summary.currentStage) counts[summary.currentStage] += 1;
  }
  return counts;
}

export function countByStatus(
  summaries: readonly EmployeeSummary[],
): Record<EmployeeStatus, number> {
  const counts: Record<EmployeeStatus, number> = {
    completed: 0,
    'on-track': 0,
    'needs-attention': 0,
  };
  for (const summary of summaries) counts[summary.status] += 1;
  return counts;
}

/** Employees with the most overdue tasks (only those with at least one). */
export function topOverdue(
  summaries: readonly EmployeeSummary[],
  limit: number,
): EmployeeSummary[] {
  return summaries
    .filter((summary) => summary.counts.overdue > 0)
    .sort(
      (a, b) =>
        b.counts.overdue - a.counts.overdue ||
        a.employee.fullName.localeCompare(b.employee.fullName),
    )
    .slice(0, limit);
}
