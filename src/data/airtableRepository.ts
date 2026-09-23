import type { Employee, Manager } from '../domain/types';
import { toDayNumber } from '../utils/date';
import { LocalTaskRepository, type KeyValueStorage } from './localTaskRepository';
import { buildEmployeeTasks, createRandom, DEFAULT_SEED, type SampleData } from './sampleData';

export const AIRTABLE_STORAGE_KEY = 'onboarding-airtable.task-completions.v1';

export interface AirtableConfig {
  token: string;
  baseId: string;
  /** Table name or id. */
  table: string;
}

/** One row of the Airtable employees table, keyed by field name. */
export interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

type FetchLike = (url: string, init: { headers: Record<string, string> }) => Promise<Response>;

/** Reads the Airtable settings from Vite env vars; null when no token/base is configured. */
export function airtableConfigFromEnv(
  env: Record<string, string | undefined>,
): AirtableConfig | null {
  const token = env.VITE_AIRTABLE_TOKEN?.trim();
  const baseId = env.VITE_AIRTABLE_BASE_ID?.trim();
  if (!token || !baseId) return null;
  return { token, baseId, table: env.VITE_AIRTABLE_TABLE?.trim() || 'Onboarding Employees' };
}

/** Fetches every record of the table, following Airtable's pagination. */
export async function fetchAirtableRecords(
  config: AirtableConfig,
  fetchFn: FetchLike = fetch,
): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(
      `https://api.airtable.com/v0/${encodeURIComponent(config.baseId)}/${encodeURIComponent(config.table)}`,
    );
    if (offset) url.searchParams.set('offset', offset);
    const response = await fetchFn(url.toString(), {
      headers: { Authorization: `Bearer ${config.token}` },
    });
    if (!response.ok) throw new Error(`Airtable request failed: ${response.status}`);
    const page = (await response.json()) as { records: AirtableRecord[]; offset?: string };
    records.push(...page.records);
    offset = page.offset;
  } while (offset);
  return records;
}

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Turns rows of the "Onboarding Employees" table into dashboard data.
 * Employees and managers come from the table; tasks are generated from the standard
 * templates so that each employee has exactly "Overdue Tasks" overdue tasks.
 * Stage and status are not read: the dashboard always computes them.
 */
export function sampleDataFromAirtable(records: AirtableRecord[], today: string): SampleData {
  const random = createRandom(DEFAULT_SEED);
  const managers = new Map<string, Manager>();
  const employees: Employee[] = [];
  const tasks: SampleData['tasks'] = [];

  for (const record of records) {
    const fullName = text(record.fields['Full Name']);
    if (!fullName) continue; // skip blank rows

    const department = text(record.fields['Department']);
    const managerName = text(record.fields['Manager']);
    const managerId = managerName ? `m-${slug(managerName)}` : '';
    if (managerId && !managers.has(managerId)) {
      managers.set(managerId, { id: managerId, fullName: managerName, department });
    }

    const startDate = text(record.fields['Start Date']);
    const employee: Employee = {
      id: text(record.fields['Employee ID']) || record.id,
      fullName,
      position: text(record.fields['Position']),
      department,
      managerId,
      startDate,
    };
    employees.push(employee);

    // Without a valid start date there is nothing to schedule.
    if (toDayNumber(startDate) === null) continue;
    const overdue = Number(record.fields['Overdue Tasks']);
    tasks.push(
      ...buildEmployeeTasks(employee, today, random, {
        overdueTasks: Number.isFinite(overdue) && overdue > 0 ? Math.floor(overdue) : 0,
        fullyCompleted: text(record.fields['Status']) === 'Completed',
      }),
    );
  }

  return { managers: [...managers.values()], employees, tasks };
}

/** Employees and managers from Airtable; task changes are kept in this browser only. */
export function createAirtableRepository(
  config: AirtableConfig,
  options: { fetchFn?: FetchLike; today?: () => string; storage?: KeyValueStorage | null } = {},
): LocalTaskRepository {
  return new LocalTaskRepository(
    async (today) =>
      sampleDataFromAirtable(await fetchAirtableRecords(config, options.fetchFn), today),
    AIRTABLE_STORAGE_KEY,
    options.today,
    options.storage,
  );
}

/** A copy of the Airtable table saved by `npm run sync:airtable` (contains no token). */
export interface AirtableSnapshot {
  syncedAt: string;
  records: AirtableRecord[];
}

/** Employees from a saved Airtable snapshot; used by the published site, which has no token. */
export function createAirtableSnapshotRepository(
  snapshot: AirtableSnapshot,
  options: { today?: () => string; storage?: KeyValueStorage | null } = {},
): LocalTaskRepository {
  return new LocalTaskRepository(
    (today) => sampleDataFromAirtable(snapshot.records, today),
    AIRTABLE_STORAGE_KEY,
    options.today,
    options.storage,
  );
}
