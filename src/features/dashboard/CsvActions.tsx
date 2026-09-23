import { useRef, useState, type ChangeEvent } from 'react';
import { AirtableWriteError } from '../../data/airtableRepository';
import { employeesToCsv, parseEmployeeCsv, type EmployeeImportRow } from '../../data/employeeCsv';
import type { OnboardingRepository } from '../../data/repository';
import type { EmployeeSummary } from '../../domain/types';

type ImportState =
  | { step: 'idle' }
  | { step: 'invalid'; fileName: string; errors: string[] }
  | { step: 'confirm'; fileName: string; rows: EmployeeImportRow[] }
  | { step: 'saving'; count: number }
  | { step: 'failed'; message: string };

const reloadPage = () => window.location.reload();

/** Export the employees as CSV, and import a CSV into Airtable (when connected live). */
export function CsvActions({
  summaries,
  repository,
  today,
  onImported = reloadPage,
}: {
  summaries: readonly EmployeeSummary[];
  repository: OnboardingRepository;
  today: string;
  /** Called after a successful import; reloads the page by default so the new data is read. */
  onImported?: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>({ step: 'idle' });
  const canImport = typeof repository.importEmployees === 'function';

  const exportCsv = () => {
    const blob = new Blob([employeesToCsv(summaries)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `onboarding-employees-${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // choosing the same file again should work
    if (!file) return;
    const parsed = parseEmployeeCsv(await file.text());
    setState(
      parsed.ok
        ? { step: 'confirm', fileName: file.name, rows: parsed.rows }
        : { step: 'invalid', fileName: file.name, errors: parsed.errors },
    );
  };

  const runImport = async (rows: EmployeeImportRow[]) => {
    setState({ step: 'saving', count: rows.length });
    try {
      await repository.importEmployees?.(rows);
      onImported();
    } catch (error) {
      setState({ step: 'failed', message: importErrorMessage(error) });
    }
  };

  return (
    <div className="csv-actions">
      <div className="csv-actions__buttons">
        <button type="button" className="button button--ghost" onClick={exportCsv}>
          Export CSV
        </button>
        <button
          type="button"
          className="button button--ghost"
          disabled={!canImport || state.step === 'saving'}
          title={canImport ? undefined : 'Connect Airtable (at the bottom of the page) to import'}
          onClick={() => fileInput.current?.click()}
        >
          Import CSV
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".csv,text/csv"
          hidden
          data-testid="csv-file-input"
          onChange={(event) => void readFile(event)}
        />
      </div>
      {!canImport && (
        <p className="csv-actions__hint">To import, connect Airtable at the bottom of the page.</p>
      )}

      {state.step === 'invalid' && (
        <div className="csv-panel csv-panel--error" role="alert">
          <p className="csv-panel__title">{state.fileName} can't be imported:</p>
          <ul>
            {state.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
          <button type="button" className="link-button" onClick={() => setState({ step: 'idle' })}>
            Close
          </button>
        </div>
      )}

      {state.step === 'confirm' && (
        <div className="csv-panel">
          <p className="csv-panel__title">
            {state.fileName}: {state.rows.length} employees
          </p>
          <p>
            They will be saved to Airtable. Employees whose Employee ID already exists are updated;
            the rest are added.
          </p>
          <div className="csv-panel__buttons">
            <button
              type="button"
              className="button button--primary"
              onClick={() => void runImport(state.rows)}
            >
              Import to Airtable
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setState({ step: 'idle' })}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {state.step === 'saving' && (
        <p className="csv-panel" aria-live="polite">
          Saving {state.count} employees to Airtable…
        </p>
      )}

      {state.step === 'failed' && (
        <div className="csv-panel csv-panel--error" role="alert">
          <p>{state.message}</p>
          <button type="button" className="link-button" onClick={() => setState({ step: 'idle' })}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}

function importErrorMessage(error: unknown): string {
  const saved =
    error instanceof AirtableWriteError && error.saved > 0
      ? ` The first ${error.saved} employees were already saved.`
      : '';
  if (error instanceof AirtableWriteError && (error.status === 401 || error.status === 403)) {
    return `Airtable refused the change: the token can only read. Create a token with the data.records:write scope and paste it with "Change token" at the bottom of the page.${saved}`;
  }
  if (error instanceof AirtableWriteError && error.status === 422) {
    return `Airtable rejected the data. Check that the column names match the table.${saved}`;
  }
  return `The import failed. Check your connection and try again.${saved}`;
}
