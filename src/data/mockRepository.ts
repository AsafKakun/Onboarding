import type { Employee, Manager, OnboardingTask } from '../domain/types';
import { getToday } from '../utils/date';
import type { OnboardingRepository } from './repository';
import { generateSampleData, type SampleData } from './sampleData';

export const STORAGE_KEY = 'onboarding-demo.task-completions.v1';

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Task id -> completion date (or null when re-opened). Only user changes are stored. */
type Overrides = Record<string, string | null>;

function browserStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // storage blocked (e.g. private mode)
  }
}

/** In-memory demo data; task changes are kept in localStorage so they survive a refresh. */
export class MockRepository implements OnboardingRepository {
  private data: SampleData | null = null;

  constructor(
    private readonly today: () => string = getToday,
    private readonly storage: KeyValueStorage | null = browserStorage(),
  ) {}

  async getEmployees(): Promise<Employee[]> {
    return this.load().employees.map((employee) => ({ ...employee }));
  }

  async getManagers(): Promise<Manager[]> {
    return this.load().managers.map((manager) => ({ ...manager }));
  }

  async getTasks(): Promise<OnboardingTask[]> {
    return this.load().tasks.map((task) => ({ ...task }));
  }

  async getTasksForEmployee(employeeId: string): Promise<OnboardingTask[]> {
    return this.load()
      .tasks.filter((task) => task.employeeId === employeeId)
      .map((task) => ({ ...task }));
  }

  async setTaskCompleted(taskId: string, completed: boolean): Promise<OnboardingTask> {
    const task = this.load().tasks.find((candidate) => candidate.id === taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    task.completedAt = completed ? this.today() : null;
    this.writeOverrides({ ...this.readOverrides(), [taskId]: task.completedAt });
    return { ...task };
  }

  async resetDemoData(): Promise<void> {
    try {
      this.storage?.removeItem(STORAGE_KEY);
    } catch {
      // nothing to clear
    }
    this.data = null;
  }

  private load(): SampleData {
    if (this.data) return this.data;
    const data = generateSampleData(this.today());
    const overrides = this.readOverrides();
    for (const task of data.tasks) {
      if (task.id in overrides) task.completedAt = overrides[task.id] ?? null;
    }
    this.data = data;
    return data;
  }

  private readOverrides(): Overrides {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Overrides) : {};
    } catch {
      return {};
    }
  }

  private writeOverrides(overrides: Overrides): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch {
      // storage full or blocked: changes stay in memory for this session
    }
  }
}
