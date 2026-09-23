import { describe, expect, it, vi } from 'vitest';
import { buildSummaries } from '../domain/summarize';
import {
  airtableConfigFromEnv,
  createAirtableRepository,
  createAirtableSnapshotRepository,
  fetchAirtableRecords,
  sampleDataFromAirtable,
  type AirtableRecord,
} from './airtableRepository';
import snapshot from './airtableSnapshot.json';

const TODAY = '2026-09-23';
const CONFIG = { token: 'test-token', baseId: 'appTEST', table: 'Onboarding Employees' };

const row = (id: string, fields: Record<string, unknown>): AirtableRecord => ({ id, fields });

const RECORDS: AirtableRecord[] = [
  row('rec1', {
    'Employee ID': 'e-01',
    'Full Name': 'Noa Friedman',
    Position: 'Frontend Developer',
    Department: 'Engineering',
    Manager: 'Maya Cohen',
    'Start Date': '2026-09-26',
    'Overdue Tasks': 0,
    Status: 'On Track',
  }),
  row('rec2', {
    'Employee ID': 'e-09',
    'Full Name': 'Aisha Rahman',
    Position: 'Sales Development Rep',
    Department: 'Sales',
    Manager: 'Priya Nair',
    'Start Date': '2026-09-05',
    'Overdue Tasks': 5,
    Status: 'Needs Attention',
  }),
  row('rec3', {
    'Full Name': 'Emma Dubois',
    Department: 'Product',
    Manager: 'Maya Cohen',
    'Start Date': '2026-04-26',
    Status: 'Completed',
  }),
  row('rec4', {}), // blank row
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('airtableConfigFromEnv', () => {
  it('needs a token and a base id', () => {
    expect(airtableConfigFromEnv({})).toBeNull();
    expect(airtableConfigFromEnv({ VITE_AIRTABLE_TOKEN: 'x' })).toBeNull();
    expect(
      airtableConfigFromEnv({ VITE_AIRTABLE_TOKEN: 'x', VITE_AIRTABLE_BASE_ID: 'app1' }),
    ).toEqual({
      token: 'x',
      baseId: 'app1',
      table: 'Onboarding Employees',
    });
  });
});

describe('sampleDataFromAirtable', () => {
  const data = sampleDataFromAirtable(RECORDS, TODAY);
  const summaries = buildSummaries(data.employees, data.managers, data.tasks, TODAY);
  const byName = new Map(summaries.map((s) => [s.employee.fullName, s]));

  it('maps employees, skips blank rows and falls back to the record id', () => {
    expect(data.employees.map((e) => e.id)).toEqual(['e-01', 'e-09', 'rec3']);
  });

  it('derives one manager per name', () => {
    expect(data.managers.map((m) => m.fullName)).toEqual(['Maya Cohen', 'Priya Nair']);
    expect(summaries.every((s) => s.manager !== null)).toBe(true);
  });

  it('keeps the overdue count and completed status from the table', () => {
    expect(byName.get('Aisha Rahman')?.counts.overdue).toBe(5);
    expect(byName.get('Noa Friedman')?.counts.overdue).toBe(0);
    expect(byName.get('Emma Dubois')?.status).toBe('completed');
  });
});

describe('fetchAirtableRecords', () => {
  it('sends the token and follows pagination', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ records: [RECORDS[0]], offset: 'next' }))
      .mockResolvedValueOnce(jsonResponse({ records: [RECORDS[1]] }));

    const records = await fetchAirtableRecords(CONFIG, fetchFn);

    expect(records).toHaveLength(2);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    const [firstUrl, init] = fetchFn.mock.calls[0]!;
    expect(firstUrl).toBe('https://api.airtable.com/v0/appTEST/Onboarding%20Employees');
    expect(init.headers.Authorization).toBe('Bearer test-token');
    expect(fetchFn.mock.calls[1]![0]).toContain('offset=next');
  });

  it('rejects when Airtable returns an error', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ error: 'AUTH' }, 401));
    await expect(fetchAirtableRecords(CONFIG, fetchFn)).rejects.toThrow('401');
  });
});

describe('createAirtableRepository', () => {
  it('retries after a failed load instead of caching the failure', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 500))
      .mockResolvedValueOnce(jsonResponse({ records: RECORDS }));
    const repository = createAirtableRepository(CONFIG, {
      fetchFn,
      today: () => TODAY,
      storage: null,
    });

    await expect(repository.getEmployees()).rejects.toThrow();
    await expect(repository.getEmployees()).resolves.toHaveLength(3);
  });

  it('has no demo reset', () => {
    const repository = createAirtableRepository(CONFIG, { storage: null });
    expect('resetDemoData' in repository).toBe(false);
  });
});

describe('saved Airtable snapshot', () => {
  it('holds only table data, never a token', () => {
    expect(JSON.stringify(snapshot)).not.toMatch(/pat[A-Za-z0-9]{14}\./);
  });

  it('loads every employee with a manager', async () => {
    const repository = createAirtableSnapshotRepository(snapshot, {
      today: () => TODAY,
      storage: null,
    });
    const [employees, managers, tasks] = await Promise.all([
      repository.getEmployees(),
      repository.getManagers(),
      repository.getTasks(),
    ]);
    expect(employees).toHaveLength(snapshot.records.length);
    const summaries = buildSummaries(employees, managers, tasks, TODAY);
    expect(summaries.every((s) => s.manager !== null)).toBe(true);
  });
});
