import { describe, expect, it } from 'vitest';
import { addDays } from '../utils/date';
import { getCurrentStage } from './currentStage';
import { getEmployeeStatus } from './employeeStatus';
import {
  EMPTY_FILTERS,
  filterSummaries,
  hasActiveFilters,
  sortSummaries,
  UNASSIGNED,
} from './filters';
import { countTasks, progressPercent } from './progress';
import { ONBOARDING_PERIOD_DAYS } from './stages';
import { buildSummaries, computeKpis, countByStage, countByStatus, topOverdue } from './summarize';
import { TASK_TEMPLATES } from './taskTemplates';
import { getTaskStatus } from './taskStatus';
import type { Employee, Manager, OnboardingTask } from './types';

const TODAY = '2026-09-21';

const task = (overrides: Partial<OnboardingTask> = {}): OnboardingTask => ({
  id: 't1',
  employeeId: 'e1',
  stage: 'first-day',
  title: 'Task',
  owner: 'HR',
  dueDate: TODAY,
  completedAt: null,
  ...overrides,
});

describe('getTaskStatus', () => {
  it('is completed when a completion date exists, even if past due', () => {
    expect(getTaskStatus(task({ dueDate: '2026-09-01', completedAt: '2026-09-02' }), TODAY)).toBe(
      'completed',
    );
  });

  it('is open on the due date and overdue the day after', () => {
    expect(getTaskStatus(task({ dueDate: TODAY }), TODAY)).toBe('open');
    expect(getTaskStatus(task({ dueDate: '2026-09-20' }), TODAY)).toBe('overdue');
    expect(getTaskStatus(task({ dueDate: '2026-09-22' }), TODAY)).toBe('open');
  });

  it('treats a missing or invalid due date as open, never overdue', () => {
    expect(getTaskStatus(task({ dueDate: '' }), TODAY)).toBe('open');
    expect(getTaskStatus(task({ dueDate: 'not-a-date' }), TODAY)).toBe('open');
  });
});

describe('countTasks and progressPercent', () => {
  it('counts add up to the total', () => {
    const counts = countTasks(
      [
        task({ id: 'a', completedAt: '2026-09-10' }),
        task({ id: 'b', dueDate: '2026-09-25' }),
        task({ id: 'c', dueDate: '2026-09-01' }),
        task({ id: 'd', dueDate: '2026-09-02' }),
      ],
      TODAY,
    );
    expect(counts).toEqual({ total: 4, completed: 1, open: 1, overdue: 2 });
    expect(progressPercent(counts)).toBe(25);
  });

  it('returns 0% for an employee with no tasks', () => {
    expect(progressPercent(countTasks([], TODAY))).toBe(0);
  });

  it('rounds to a whole number', () => {
    expect(progressPercent({ total: 3, completed: 1 })).toBe(33);
    expect(progressPercent({ total: 3, completed: 2 })).toBe(67);
  });
});

describe('getCurrentStage', () => {
  const stageOn = (daysSinceStart: number) =>
    getCurrentStage(addDays(TODAY, -daysSinceStart), TODAY);

  it('follows the day boundaries from the spec', () => {
    expect(stageOn(-1)).toBe('before-start');
    expect(stageOn(0)).toBe('first-day');
    expect(stageOn(1)).toBe('first-week');
    expect(stageOn(7)).toBe('first-week');
    expect(stageOn(8)).toBe('first-month');
    expect(stageOn(30)).toBe('first-month');
    expect(stageOn(31)).toBe('end-of-period');
    expect(stageOn(200)).toBe('end-of-period');
  });

  it('returns null for a missing or invalid start date', () => {
    expect(getCurrentStage('', TODAY)).toBeNull();
    expect(getCurrentStage('2026-13-45', TODAY)).toBeNull();
  });
});

describe('getEmployeeStatus', () => {
  it('applies precedence: completed, then needs attention, then on track', () => {
    expect(getEmployeeStatus({ total: 3, completed: 3, open: 0, overdue: 0 })).toBe('completed');
    expect(getEmployeeStatus({ total: 3, completed: 1, open: 1, overdue: 1 })).toBe(
      'needs-attention',
    );
    expect(getEmployeeStatus({ total: 3, completed: 1, open: 2, overdue: 0 })).toBe('on-track');
  });

  it('is on track (not completed) when there are no tasks', () => {
    expect(getEmployeeStatus({ total: 0, completed: 0, open: 0, overdue: 0 })).toBe('on-track');
  });
});

describe('task templates', () => {
  it('contains the 34 tasks from the spec', () => {
    expect(TASK_TEMPLATES).toHaveLength(34);
  });

  it('never schedules a task after the onboarding period', () => {
    expect(Math.max(...TASK_TEMPLATES.map((t) => t.dueOffsetDays))).toBeLessThanOrEqual(
      ONBOARDING_PERIOD_DAYS,
    );
  });
});

describe('summaries, filters and sorting', () => {
  const managers: Manager[] = [
    { id: 'm1', fullName: 'Ann Manager', department: 'Sales' },
    { id: 'm2', fullName: 'Bob Manager', department: 'Finance' },
  ];
  const employee = (overrides: Partial<Employee>): Employee => ({
    id: 'e1',
    fullName: 'Employee',
    position: 'Role',
    department: 'Sales',
    managerId: 'm1',
    startDate: '2026-09-10',
    ...overrides,
  });
  const employees = [
    employee({ id: 'e1', fullName: 'Dana Late', startDate: '2026-09-10' }),
    employee({
      id: 'e2',
      fullName: 'Eli Done',
      department: 'Finance',
      managerId: 'm2',
      startDate: '2026-06-01',
    }),
    employee({ id: 'e3', fullName: 'Fay Ok', startDate: '2026-09-28' }),
    employee({
      id: 'e4',
      fullName: 'Gil Orphan',
      department: '',
      managerId: 'gone',
      startDate: '',
    }),
  ];
  const tasks = [
    task({ id: 'a', employeeId: 'e1', dueDate: '2026-09-12' }), // overdue
    task({ id: 'b', employeeId: 'e2', completedAt: '2026-06-02' }), // completed
    task({ id: 'c', employeeId: 'e3', dueDate: '2026-09-25' }), // open
  ];
  const summaries = buildSummaries(employees, managers, tasks, TODAY);
  const names = (list: typeof summaries) => list.map((s) => s.employee.fullName);

  it('derives status, stage and progress per employee', () => {
    const byId = Object.fromEntries(summaries.map((s) => [s.employee.id, s]));
    expect(byId.e1?.status).toBe('needs-attention');
    expect(byId.e2?.status).toBe('completed');
    expect(byId.e2?.progress).toBe(100);
    expect(byId.e3?.currentStage).toBe('before-start');
    expect(byId.e4?.manager).toBeNull();
    expect(byId.e4?.currentStage).toBeNull();
    expect(byId.e4?.counts.total).toBe(0);
  });

  it('computes KPIs and chart counts', () => {
    expect(computeKpis(summaries)).toEqual({
      totalEmployees: 4,
      inProgress: 3,
      completed: 1,
      openTasks: 1,
      overdueTasks: 1,
    });
    expect(countByStatus(summaries)).toEqual({ completed: 1, 'on-track': 2, 'needs-attention': 1 });
    expect(countByStage(summaries)['before-start']).toBe(1);
    expect(names(topOverdue(summaries, 5))).toEqual(['Dana Late']);
  });

  it('searches by partial, case-insensitive name', () => {
    expect(names(filterSummaries(summaries, { ...EMPTY_FILTERS, search: ' DONE ' }))).toEqual([
      'Eli Done',
    ]);
  });

  it('combines filters with AND', () => {
    expect(
      names(
        filterSummaries(summaries, { ...EMPTY_FILTERS, department: 'Sales', status: 'on-track' }),
      ),
    ).toEqual(['Fay Ok']);
    expect(
      names(
        filterSummaries(summaries, { ...EMPTY_FILTERS, manager: 'm2', stage: 'end-of-period' }),
      ),
    ).toEqual(['Eli Done']);
  });

  it('filters by unassigned manager and by start date range', () => {
    expect(names(filterSummaries(summaries, { ...EMPTY_FILTERS, manager: UNASSIGNED }))).toEqual([
      'Gil Orphan',
    ]);
    const inRange = filterSummaries(summaries, {
      ...EMPTY_FILTERS,
      startFrom: '2026-09-01',
      startTo: '2026-09-30',
    });
    expect(names(inRange)).toEqual(['Dana Late', 'Fay Ok']); // missing start date is excluded
  });

  it('returns nothing when no employee matches', () => {
    expect(filterSummaries(summaries, { ...EMPTY_FILTERS, search: 'zzz' })).toEqual([]);
  });

  it('knows when filters are active', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, status: 'completed' })).toBe(true);
  });

  it('sorts needs-attention first by default, with missing start dates last', () => {
    expect(names(sortSummaries(summaries))).toEqual([
      'Dana Late',
      'Fay Ok',
      'Gil Orphan',
      'Eli Done',
    ]);
  });

  it('sorts by start date in both directions, keeping missing dates last', () => {
    expect(names(sortSummaries(summaries, { key: 'startDate', direction: 'asc' }))).toEqual([
      'Eli Done',
      'Dana Late',
      'Fay Ok',
      'Gil Orphan',
    ]);
    expect(names(sortSummaries(summaries, { key: 'startDate', direction: 'desc' }))).toEqual([
      'Fay Ok',
      'Dana Late',
      'Eli Done',
      'Gil Orphan',
    ]);
  });
});
