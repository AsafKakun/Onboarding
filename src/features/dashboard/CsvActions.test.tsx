import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AirtableWriteError } from '../../data/airtableRepository';
import { EMPLOYEE_CSV_COLUMNS } from '../../data/employeeCsv';
import { MockRepository } from '../../data/mockRepository';
import type { OnboardingRepository } from '../../data/repository';
import { CsvActions } from './CsvActions';

const CSV = `${EMPLOYEE_CSV_COLUMNS.join(',')}\ne-30,Test Person,Dev,Sales,Priya Nair,2026-09-01,,0,\n`;
const file = (text: string) => new File([text], 'new.csv', { type: 'text/csv' });

function writableRepository(importEmployees: OnboardingRepository['importEmployees']) {
  const repository = new MockRepository(() => '2026-09-23', null) as OnboardingRepository;
  repository.importEmployees = importEmployees;
  return repository;
}

describe('CsvActions', () => {
  it('disables import when the data cannot be written', () => {
    render(<CsvActions summaries={[]} repository={new MockRepository()} today="2026-09-23" />);
    expect(screen.getByRole('button', { name: 'Import CSV' })).toBeDisabled();
    expect(screen.getByText(/connect Airtable at the bottom/)).toBeInTheDocument();
  });

  it('checks the file, asks for confirmation, then imports and reloads', async () => {
    const user = userEvent.setup();
    const importEmployees = vi.fn().mockResolvedValue({ created: 1, updated: 0 });
    const onImported = vi.fn();
    render(
      <CsvActions
        summaries={[]}
        repository={writableRepository(importEmployees)}
        today="2026-09-23"
        onImported={onImported}
      />,
    );

    await user.upload(screen.getByTestId('csv-file-input'), file(CSV));
    expect(await screen.findByText('new.csv: 1 employees')).toBeInTheDocument();
    expect(importEmployees).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Import to Airtable' }));
    expect(importEmployees).toHaveBeenCalledWith([
      expect.objectContaining({ 'Employee ID': 'e-30', 'Full Name': 'Test Person' }),
    ]);
    expect(onImported).toHaveBeenCalledOnce();
  });

  it('shows what is wrong with an invalid file', async () => {
    const user = userEvent.setup();
    const importEmployees = vi.fn();
    render(
      <CsvActions
        summaries={[]}
        repository={writableRepository(importEmployees)}
        today="2026-09-23"
      />,
    );

    await user.upload(screen.getByTestId('csv-file-input'), file('Name\nA\n'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unknown columns: Name');
    expect(importEmployees).not.toHaveBeenCalled();
  });

  it('explains a read-only token', async () => {
    const user = userEvent.setup();
    const importEmployees = vi.fn().mockRejectedValue(new AirtableWriteError(403, 0));
    render(
      <CsvActions
        summaries={[]}
        repository={writableRepository(importEmployees)}
        today="2026-09-23"
      />,
    );

    await user.upload(screen.getByTestId('csv-file-input'), file(CSV));
    await user.click(await screen.findByRole('button', { name: 'Import to Airtable' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('the token can only read');
  });
});
