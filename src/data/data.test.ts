import { beforeEach, describe, expect, it } from 'vitest';
import { buildSummaries } from '../domain/summarize';
import { toDayNumber } from '../utils/date';
import { MockRepository, STORAGE_KEY, type KeyValueStorage } from './mockRepository';
import { generateSampleData } from './sampleData';

const TODAY = '2026-09-21';

function memoryStorage(): KeyValueStorage & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
    removeItem: (key) => void store.delete(key),
  };
}

describe('generateSampleData', () => {
  const data = generateSampleData(TODAY);
  const summaries = buildSummaries(data.employees, data.managers, data.tasks, TODAY);

  it('is deterministic for the same date and seed', () => {
    expect(generateSampleData(TODAY)).toEqual(data);
  });

  it('creates 18 employees, 6 departments, 6 managers and 34 tasks each', () => {
    expect(data.employees).toHaveLength(18);
    expect(new Set(data.employees.map((e) => e.department)).size).toBe(6);
    expect(data.managers).toHaveLength(6);
    expect(data.tasks).toHaveLength(18 * 34);
  });

  it('gives every employee a manager that exists', () => {
    expect(summaries.every((s) => s.manager !== null)).toBe(true);
  });

  it('represents every stage and every status', () => {
    const stages = new Set(summaries.map((s) => s.currentStage));
    expect(stages).toEqual(
      new Set(['before-start', 'first-day', 'first-week', 'first-month', 'end-of-period']),
    );
    const statuses = new Set(summaries.map((s) => s.status));
    expect(statuses).toEqual(new Set(['completed', 'needs-attention', 'on-track']));
  });

  it('includes the required spread: 4 completed, one with 5+ overdue, one mid-process with none', () => {
    expect(summaries.filter((s) => s.status === 'completed')).toHaveLength(4);
    expect(summaries.some((s) => s.counts.overdue >= 5)).toBe(true);
    expect(
      summaries.some(
        (s) =>
          s.status === 'on-track' &&
          (s.currentStage === 'first-week' || s.currentStage === 'first-month'),
      ),
    ).toBe(true);
  });

  it('never has a completion date in the future', () => {
    const today = toDayNumber(TODAY) as number;
    for (const task of data.tasks) {
      if (task.completedAt)
        expect(toDayNumber(task.completedAt) as number).toBeLessThanOrEqual(today);
    }
  });
});

describe('MockRepository', () => {
  let storage: ReturnType<typeof memoryStorage>;
  let repository: MockRepository;

  beforeEach(() => {
    storage = memoryStorage();
    repository = new MockRepository(() => TODAY, storage);
  });

  it('returns tasks for a single employee only', async () => {
    const tasks = await repository.getTasksForEmployee('e-01');
    expect(tasks).toHaveLength(34);
    expect(tasks.every((t) => t.employeeId === 'e-01')).toBe(true);
  });

  it('marks a task completed today and re-opens it', async () => {
    const [first] = await repository.getTasksForEmployee('e-05');
    const done = await repository.setTaskCompleted(first!.id, true);
    expect(done.completedAt).toBe(TODAY);
    const reopened = await repository.setTaskCompleted(first!.id, false);
    expect(reopened.completedAt).toBeNull();
  });

  it('persists changes and restores them in a new instance', async () => {
    const [first] = await repository.getTasksForEmployee('e-05');
    await repository.setTaskCompleted(first!.id, true);
    expect(storage.store.has(STORAGE_KEY)).toBe(true);

    const fresh = new MockRepository(() => TODAY, storage);
    const tasks = await fresh.getTasksForEmployee('e-05');
    expect(tasks.find((t) => t.id === first!.id)?.completedAt).toBe(TODAY);
  });

  it('resets demo data', async () => {
    const before = await repository.getTasks();
    const target = before.find((t) => t.completedAt === null)!;
    await repository.setTaskCompleted(target.id, true);
    await repository.resetDemoData();
    const after = await repository.getTasks();
    expect(after.find((t) => t.id === target.id)?.completedAt).toBeNull();
  });

  it('rejects an unknown task id', async () => {
    await expect(repository.setTaskCompleted('nope', true)).rejects.toThrow();
  });

  it('works without storage available', async () => {
    const noStorage = new MockRepository(() => TODAY, null);
    const [first] = await noStorage.getTasksForEmployee('e-01');
    await expect(noStorage.setTaskCompleted(first!.id, true)).resolves.toBeDefined();
  });
});
