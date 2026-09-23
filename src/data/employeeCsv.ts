import { EMPLOYEE_STATUS_LABELS } from '../domain/employeeStatus';
import type { EmployeeSummary, Stage } from '../domain/types';
import { toDayNumber } from '../utils/date';
import { parseCsv, toCsv } from '../utils/csv';

/** The columns of the Airtable "Onboarding Employees" table, in order. */
export const EMPLOYEE_CSV_COLUMNS = [
  'Employee ID',
  'Full Name',
  'Position',
  'Department',
  'Manager',
  'Start Date',
  'Stage',
  'Overdue Tasks',
  'Status',
] as const;

type Column = (typeof EMPLOYEE_CSV_COLUMNS)[number];

/** One employee row to write to Airtable, keyed by field name. Empty cells are left out. */
export type EmployeeImportRow = Partial<Record<Column, string | number>> & {
  'Employee ID': string;
  'Full Name'?: string;
};

export type ParsedEmployeeCsv =
  { ok: true; rows: EmployeeImportRow[] } | { ok: false; errors: string[] };

const REQUIRED: readonly Column[] = ['Employee ID', 'Full Name'];
const MAX_ERRORS = 5;

/** Reads a CSV file in the table's format and checks every row before anything is imported. */
export function parseEmployeeCsv(text: string): ParsedEmployeeCsv {
  const [header, ...lines] = parseCsv(text);
  if (!header) return { ok: false, errors: ['The file is empty.'] };

  const columns = header.map((name) => name.trim());
  const errors: string[] = [];
  const unknown = columns.filter(
    (name) => !(EMPLOYEE_CSV_COLUMNS as readonly string[]).includes(name),
  );
  if (unknown.length > 0) {
    errors.push(`Unknown columns: ${unknown.join(', ')}. Use: ${EMPLOYEE_CSV_COLUMNS.join(', ')}.`);
  }
  const missing = REQUIRED.filter((name) => !columns.includes(name));
  if (missing.length > 0) errors.push(`Missing columns: ${missing.join(', ')}.`);
  if (errors.length > 0) return { ok: false, errors };
  if (lines.length === 0) return { ok: false, errors: ['The file has no employee rows.'] };

  const rows: EmployeeImportRow[] = [];
  const seenIds = new Set<string>();
  lines.forEach((cells, index) => {
    const line = index + 2; // header is line 1
    const row: Partial<Record<Column, string | number>> = {};
    columns.forEach((column, i) => {
      const value = (cells[i] ?? '').trim();
      if (value !== '') row[column as Column] = value;
    });

    const id = row['Employee ID'];
    if (!id) errors.push(`Line ${line}: Employee ID is empty.`);
    else if (seenIds.has(String(id))) errors.push(`Line ${line}: Employee ID ${id} appears twice.`);
    else seenIds.add(String(id));

    if (row['Start Date'] !== undefined && toDayNumber(String(row['Start Date'])) === null) {
      errors.push(`Line ${line}: Start Date must look like 2026-09-23.`);
    }
    if (row['Overdue Tasks'] !== undefined) {
      const overdue = Number(row['Overdue Tasks']);
      if (!Number.isInteger(overdue) || overdue < 0) {
        errors.push(`Line ${line}: Overdue Tasks must be a whole number (0 or more).`);
      } else {
        row['Overdue Tasks'] = overdue;
      }
    }
    rows.push(row as EmployeeImportRow);
  });

  if (errors.length > MAX_ERRORS) {
    const more = errors.length - MAX_ERRORS;
    return { ok: false, errors: [...errors.slice(0, MAX_ERRORS), `…and ${more} more.`] };
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, rows };
}

const STAGE_NAMES: Record<Stage, string> = {
  'before-start': 'Before Start',
  'first-day': 'First Day',
  'first-week': 'First Week',
  'first-month': 'First Month',
  'end-of-period': 'End of Period',
};

/** Employees as CSV in the Airtable table's format, with stage and status as the dashboard shows them. */
export function employeesToCsv(summaries: readonly EmployeeSummary[]): string {
  const rows = summaries.map(({ employee, manager, currentStage, counts, status }) => [
    employee.id,
    employee.fullName,
    employee.position,
    employee.department,
    manager?.fullName ?? '',
    employee.startDate,
    status === 'completed' ? 'Completed' : currentStage ? STAGE_NAMES[currentStage] : '',
    String(counts.overdue),
    status === 'completed' ? 'Completed' : titleCase(EMPLOYEE_STATUS_LABELS[status]),
  ]);
  return toCsv([[...EMPLOYEE_CSV_COLUMNS], ...rows]);
}

/** "Needs attention" -> "Needs Attention", matching the Airtable option names. */
function titleCase(label: string): string {
  return label.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
