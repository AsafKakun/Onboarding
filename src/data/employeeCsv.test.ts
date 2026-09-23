import { describe, expect, it, vi } from 'vitest';
import { buildSummaries } from '../domain/summarize';
import { parseCsv, toCsv } from '../utils/csv';
import { AirtableWriteError, upsertAirtableEmployees } from './airtableRepository';
import { employeesToCsv, EMPLOYEE_CSV_COLUMNS, parseEmployeeCsv } from './employeeCsv';
import { generateSampleData } from './sampleData';

const HEADER = EMPLOYEE_CSV_COLUMNS.join(',');
const CONFIG = { token: 'test-token', baseId: 'appTEST', table: 'Onboarding Employees' };

describe('parseCsv / toCsv', () => {
  it('handles quotes, commas, CRLF, a BOM and blank lines', () => {
    const text = '﻿a,b\r\n"x, y","say ""hi"""\r\n\r\nlast,\n';
    expect(parseCsv(text)).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"'],
      ['last', ''],
    ]);
  });

  it('round-trips', () => {
    const rows = [
      ['Name', 'Note'],
      ["Liam O'Connor", 'a, "b"\nc'],
    ];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});

describe('parseEmployeeCsv', () => {
  it('reads rows, skips empty cells and turns Overdue Tasks into a number', () => {
    const result = parseEmployeeCsv(
      `${HEADER}\ne-30,Test Person,,Sales,Priya Nair,2026-09-01,,3,\n`,
    );
    expect(result).toEqual({
      ok: true,
      rows: [
        {
          'Employee ID': 'e-30',
          'Full Name': 'Test Person',
          Department: 'Sales',
          Manager: 'Priya Nair',
          'Start Date': '2026-09-01',
          'Overdue Tasks': 3,
        },
      ],
    });
  });

  it('accepts a subset of the columns in any order', () => {
    const result = parseEmployeeCsv('Full Name,Employee ID\nA,e-1\n');
    expect(result.ok).toBe(true);
  });

  it('rejects unknown and missing columns', () => {
    const result = parseEmployeeCsv('Name,Team\nA,B\n');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toContain('Unknown columns: Name, Team');
      expect(result.errors[1]).toContain('Missing columns: Employee ID, Full Name');
    }
  });

  it('reports bad rows with their line numbers', () => {
    const result = parseEmployeeCsv(
      `${HEADER}\n,No Id,,,,,,,\ne-1,A,,,,23/09/2026,,x,\ne-2,B,,,,,,,\ne-2,C,,,,,,,\n`,
    );
    expect(result).toEqual({
      ok: false,
      errors: [
        'Line 2: Employee ID is empty.',
        'Line 3: Start Date must look like 2026-09-23.',
        'Line 3: Overdue Tasks must be a whole number (0 or more).',
        'Line 5: Employee ID e-2 appears twice.',
      ],
    });
  });

  it('rejects an empty file or a header without rows', () => {
    expect(parseEmployeeCsv('').ok).toBe(false);
    expect(parseEmployeeCsv(`${HEADER}\n`).ok).toBe(false);
  });
});

describe('employeesToCsv', () => {
  it('exports every employee in the table format, and can be imported again', () => {
    const today = '2026-09-23';
    const data = generateSampleData(today);
    const summaries = buildSummaries(data.employees, data.managers, data.tasks, today);
    const csv = employeesToCsv(summaries);
    const [header, first] = parseCsv(csv);

    expect(header).toEqual([...EMPLOYEE_CSV_COLUMNS]);
    expect(first).toEqual([
      'e-01',
      'Noa Friedman',
      'Frontend Developer',
      'Engineering',
      'Maya Cohen',
      '2026-09-26',
      'Before Start',
      '0',
      'On Track',
    ]);
    const reimported = parseEmployeeCsv(csv);
    expect(reimported.ok && reimported.rows).toHaveLength(18);
  });
});

describe('upsertAirtableEmployees', () => {
  it('writes in batches of 10, matching on Employee ID', async () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({ 'Employee ID': `e-${i}` }));
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ createdRecords: ['r1', 'r2'], updatedRecords: Array(8) })),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ createdRecords: ['r3', 'r4'] })));

    const result = await upsertAirtableEmployees(CONFIG, rows, fetchFn);

    expect(result).toEqual({ created: 4, updated: 8 });
    expect(fetchFn).toHaveBeenCalledTimes(2);
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe('https://api.airtable.com/v0/appTEST/Onboarding%20Employees');
    expect(init.method).toBe('PATCH');
    const body = JSON.parse(init.body);
    expect(body.performUpsert).toEqual({ fieldsToMergeOn: ['Employee ID'] });
    expect(body.typecast).toBe(true);
    expect(body.records).toHaveLength(10);
    expect(body.records[0]).toEqual({ fields: { 'Employee ID': 'e-0' } });
  });

  it('reports how many rows were saved before a failure', async () => {
    const rows = Array.from({ length: 12 }, (_, i) => ({ 'Employee ID': `e-${i}` }));
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ createdRecords: [] })))
      .mockResolvedValueOnce(new Response('{}', { status: 403 }));

    const error = await upsertAirtableEmployees(CONFIG, rows, fetchFn).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AirtableWriteError);
    expect(error).toMatchObject({ status: 403, saved: 10 });
  });
});
