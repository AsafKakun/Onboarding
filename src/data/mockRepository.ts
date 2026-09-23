import { getToday } from '../utils/date';
import { browserStorage, LocalTaskRepository, type KeyValueStorage } from './localTaskRepository';
import { generateSampleData } from './sampleData';

export type { KeyValueStorage } from './localTaskRepository';

export const STORAGE_KEY = 'onboarding-demo.task-completions.v1';

/** In-memory demo data; task changes are kept in localStorage so they survive a refresh. */
export class MockRepository extends LocalTaskRepository {
  constructor(today: () => string = getToday, storage: KeyValueStorage | null = browserStorage()) {
    super((date) => generateSampleData(date), STORAGE_KEY, today, storage);
  }

  async resetDemoData(): Promise<void> {
    this.clearLocalChanges();
  }
}
