import type { Employee, Manager } from '../domain/types';
import { toDayNumber } from '../utils/date';
import type { EmployeeImportRow } from './employeeCsv';
import { LocalTaskRepository, type KeyValueStorage } from './localTaskRepository';
import type { ImportResult } from './repository';
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

type FetchLike = (
  url: string,
  init: { method?: string; headers: Record<string, string>; body?: string },
) => Promise<Response>;

/** The Airtable table the dashboard reads when nothing else is configured. */
export const DEFAULT_AIRTABLE_BASE_ID = 'appmsE2WLIFOSvh82';
export const DEFAULT_AIRTABLE_TABLE = 'Onboarding Employees';

/**
 * Builds the Airtable settings. The token pasted in the dashboard (`browserToken`) wins over
 * `VITE_AIRTABLE_TOKEN` from `.env.local`; null when there is no token at all.
 */
export function airtableConfigFromEnv(
  env: Record<string, string | undefined>,
  browserToken: string | null = null,
): AirtableConfig | null {
  const token = browserToken?.trim() || env.VITE_AIRTABLE_TOKEN?.trim();
  if (!token) return null;
  return {
    token,
    baseId: env.VITE_AIRTABLE_BASE_ID?.trim() || DEFAULT_AIRTABLE_BASE_ID,
    table: env.VITE_AIRTABLE_TABLE?.trim() || DEFAULT_AIRTABLE_TABLE,
  };
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

/** Airtable accepts at most 10 records per write request. */
const WRITE_BATCH_SIZE = 10;

/**
 * Adds or updates employees in Airtable, matching on "Employee ID": an existing ID is updated,
 * a new one is added. Select options that do not exist yet are created (typecast).
 */
export async function upsertAirtableEmployees(
  config: AirtableConfig,
  rows: readonly EmployeeImportRow[],
  fetchFn: FetchLike = fetch,
): Promise<ImportResult> {
  const url = `https://api.airtable.com/v0/${encodeURIComponent(config.baseId)}/${encodeURIComponent(config.table)}`;
  const result: ImportResult = { created: 0, updated: 0 };
  for (let start = 0; start < rows.length; start += WRITE_BATCH_SIZE) {
    const batch = rows.slice(start, start + WRITE_BATCH_SIZE);
    const response = await fetchFn(url, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        performUpsert: { fieldsToMergeOn: ['Employee ID'] },
        typecast: true,
        records: batch.map((fields) => ({ fields })),
      }),
    });
    if (!response.ok) throw new AirtableWriteError(response.status, start);
    const body = (await response.json()) as {
      createdRecords?: string[];
      updatedRecords?: string[];
    };
    result.created += body.createdRecords?.length ?? 0;
    result.updated += body.updatedRecords?.length ?? 0;
  }
  return result;
}

/** A failed write; `saved` rows (earlier batches) were already written. */
export class AirtableWriteError extends Error {
  constructor(
    readonly status: number,
    readonly saved: number,
  ) {
    super(`Airtable write failed: ${status}`);
  }
}

/** Live Airtable data that can also import employees back into the table. */
export class AirtableLiveRepository extends LocalTaskRepository {
  constructor(
    private readonly config: AirtableConfig,
    private readonly fetchFn: FetchLike = fetch,
    today?: () => string,
    storage?: KeyValueStorage | null,
  ) {
    super(
      async (date) => sampleDataFromAirtable(await fetchAirtableRecords(config, fetchFn), date),
      AIRTABLE_STORAGE_KEY,
      today,
      storage,
      { kind: 'airtable-live' },
    );
  }

  importEmployees(rows: readonly EmployeeImportRow[]): Promise<ImportResult> {
    return upsertAirtableEmployees(this.config, rows, this.fetchFn);
  }
}

/** Employees and managers from Airtable; task changes are kept in this browser only. */
export function createAirtableRepository(
  config: AirtableConfig,
  options: { fetchFn?: FetchLike; today?: () => string; storage?: KeyValueStorage | null } = {},
): AirtableLiveRepository {
  return new AirtableLiveRepository(config, options.fetchFn, options.today, options.storage);
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
    { kind: 'airtable-snapshot', syncedAt: snapshot.syncedAt },
  );
}
