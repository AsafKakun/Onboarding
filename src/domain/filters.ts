import { toDayNumber } from '../utils/date';
import type { EmployeeStatus, EmployeeSummary, Stage } from './types';

/** Filter value meaning "employees without a resolvable manager". */
export const UNASSIGNED = 'unassigned';

export interface FilterState {
  search: string;
  department: string;
  /** Manager id, UNASSIGNED, or '' for all. */
  manager: string;
  stage: Stage | '';
  status: EmployeeStatus | '';
  /** ISO dates, '' = no limit */
  startFrom: string;
  startTo: string;
}

export const EMPTY_FILTERS: FilterState = {
  search: '',
  department: '',
  manager: '',
  stage: '',
  status: '',
  startFrom: '',
  startTo: '',
};

export type SortKey = 'default' | 'name' | 'startDate' | 'progress' | 'status';
export type SortDirection = 'asc' | 'desc';
export interface SortState {
  key: SortKey;
  direction: SortDirection;
}

export const DEFAULT_SORT: SortState = { key: 'default', direction: 'asc' };

export function hasActiveFilters(filters: FilterState): boolean {
  return Object.values(filters).some((value) => value !== '');
}

export function filterSummaries(
  summaries: readonly EmployeeSummary[],
  filters: FilterState,
): EmployeeSummary[] {
  const search = filters.search.trim().toLowerCase();
  const from = toDayNumber(filters.startFrom);
  const to = toDayNumber(filters.startTo);

  return summaries.filter(({ employee, manager, currentStage, status }) => {
    if (search && !employee.fullName.toLowerCase().includes(search)) return false;
    if (filters.department && employee.department !== filters.department) return false;
    if (filters.manager === UNASSIGNED && manager !== null) return false;
    if (filters.manager && filters.manager !== UNASSIGNED && manager?.id !== filters.manager) {
      return false;
    }
    if (filters.stage && currentStage !== filters.stage) return false;
    if (filters.status && status !== filters.status) return false;

    if (from !== null || to !== null) {
      const start = toDayNumber(employee.startDate);
      if (start === null) return false;
      if (from !== null && start < from) return false;
      if (to !== null && start > to) return false;
    }
    return true;
  });
}

const STATUS_RANK: Record<EmployeeStatus, number> = {
  'needs-attention': 0,
  'on-track': 1,
  completed: 2,
};

/** Compares start dates; missing/invalid dates always sort last. */
function compareStart(a: EmployeeSummary, b: EmployeeSummary, direction: number): number {
  const aStart = toDayNumber(a.employee.startDate);
  const bStart = toDayNumber(b.employee.startDate);
  if (aStart === null && bStart === null) return 0;
  if (aStart === null) return 1;
  if (bStart === null) return -1;
  return (aStart - bStart) * direction;
}

const byName = (a: EmployeeSummary, b: EmployeeSummary) =>
  a.employee.fullName.localeCompare(b.employee.fullName);

export function sortSummaries(
  summaries: readonly EmployeeSummary[],
  sort: SortState = DEFAULT_SORT,
): EmployeeSummary[] {
  const direction = sort.direction === 'asc' ? 1 : -1;
  const compare = (a: EmployeeSummary, b: EmployeeSummary): number => {
    switch (sort.key) {
      case 'name':
        return byName(a, b) * direction;
      case 'startDate':
        return compareStart(a, b, direction) || byName(a, b);
      case 'progress':
        return (a.progress - b.progress) * direction || byName(a, b);
      case 'status':
        return (STATUS_RANK[a.status] - STATUS_RANK[b.status]) * direction || byName(a, b);
      default:
        return (
          STATUS_RANK[a.status] - STATUS_RANK[b.status] || compareStart(a, b, 1) || byName(a, b)
        );
    }
  };
  return [...summaries].sort(compare);
}

export function uniqueDepartments(summaries: readonly EmployeeSummary[]): string[] {
  const departments = new Set(summaries.map((s) => s.employee.department).filter(Boolean));
  return [...departments].sort((a, b) => a.localeCompare(b));
}

export function uniqueManagers(
  summaries: readonly EmployeeSummary[],
): { id: string; name: string }[] {
  const managers = new Map<string, string>();
  for (const { manager } of summaries) if (manager) managers.set(manager.id, manager.fullName);
  return [...managers]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function hasUnassignedEmployees(summaries: readonly EmployeeSummary[]): boolean {
  return summaries.some((summary) => summary.manager === null);
}
