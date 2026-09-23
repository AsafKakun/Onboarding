import type { Employee, Manager, OnboardingTask } from '../domain/types';
import { getToday } from '../utils/date';
import type { DataSource, OnboardingRepository } from './repository';
import type { SampleData } from './sampleData';

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Task id -> completion date (or null when re-opened). Only user changes are stored. */
type Overrides = Record<string, string | null>;

export function browserStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // storage blocked (e.g. private mode)
  }
}

/**
 * Loads employees, managers and tasks once from `loadData`, keeps them in memory,
 * and stores task changes in localStorage so they survive a refresh.
 */
export class LocalTaskRepository implements OnboardingRepository {
  private data: Promise<SampleData> | null = null;

  constructor(
    private readonly loadData: (today: string) => SampleData | Promise<SampleData>,
    private readonly storageKey: string,
    protected readonly today: () => string = getToday,
    protected readonly storage: KeyValueStorage | null = browserStorage(),
    readonly source: DataSource = { kind: 'sample' },
  ) {}

  async getEmployees(): Promise<Employee[]> {
    return (await this.load()).employees.map((employee) => ({ ...employee }));
  }

  async getManagers(): Promise<Manager[]> {
    return (await this.load()).managers.map((manager) => ({ ...manager }));
  }

  async getTasks(): Promise<OnboardingTask[]> {
    return (await this.load()).tasks.map((task) => ({ ...task }));
  }

  async getTasksForEmployee(employeeId: string): Promise<OnboardingTask[]> {
    return (await this.load()).tasks
      .filter((task) => task.employeeId === employeeId)
      .map((task) => ({ ...task }));
  }

  async setTaskCompleted(taskId: string, completed: boolean): Promise<OnboardingTask> {
    const task = (await this.load()).tasks.find((candidate) => candidate.id === taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    task.completedAt = completed ? this.today() : null;
    this.writeOverrides({ ...this.readOverrides(), [taskId]: task.completedAt });
    return { ...task };
  }

  /** Forgets local task changes and loads the data again on next access. */
  protected clearLocalChanges(): void {
    try {
      this.storage?.removeItem(this.storageKey);
    } catch {
      // nothing to clear
    }
    this.data = null;
  }

  private load(): Promise<SampleData> {
    if (!this.data) {
      const loading = Promise.resolve(this.loadData(this.today())).then((data) => {
        const overrides = this.readOverrides();
        for (const task of data.tasks) {
          if (task.id in overrides) task.completedAt = overrides[task.id] ?? null;
        }
        return data;
      });
      // A failed load is retried on the next call instead of being cached.
      loading.catch(() => {
        if (this.data === loading) this.data = null;
      });
      this.data = loading;
    }
    return this.data;
  }

  private readOverrides(): Overrides {
    try {
      const raw = this.storage?.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as Overrides) : {};
    } catch {
      return {};
    }
  }

  private writeOverrides(overrides: Overrides): void {
    try {
      this.storage?.setItem(this.storageKey, JSON.stringify(overrides));
    } catch {
      // storage full or blocked: changes stay in memory for this session
    }
  }
}
