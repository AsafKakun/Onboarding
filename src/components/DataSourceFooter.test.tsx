import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AIRTABLE_TOKEN_KEY, readStoredAirtableToken } from '../data/airtableToken';
import { DataSourceFooter } from './DataSourceFooter';

const TOKEN = `patJXrPLo9oqEdyOa.${'a1'.repeat(32)}`;

describe('DataSourceFooter', () => {
  beforeEach(() => localStorage.clear());

  it('saves a complete token in this browser and reloads', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DataSourceFooter source={{ kind: 'sample' }} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Connect Airtable' }));
    await user.type(screen.getByLabelText('Airtable personal access token'), TOKEN);
    await user.click(screen.getByRole('button', { name: 'Save and load' }));

    expect(readStoredAirtableToken()).toBe(TOKEN);
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('rejects a token without its secret part', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DataSourceFooter source={{ kind: 'sample' }} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Connect Airtable' }));
    await user.type(screen.getByLabelText('Airtable personal access token'), 'patJXrPLo9oqEdyOa');
    await user.click(screen.getByRole('button', { name: 'Save and load' }));

    expect(screen.getByRole('alert')).toHaveTextContent('not a complete token');
    expect(readStoredAirtableToken()).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows the snapshot date', () => {
    render(
      <DataSourceFooter source={{ kind: 'airtable-snapshot', syncedAt: '2026-09-23T17:40:00Z' }} />,
    );
    expect(screen.getByText(/saved copy of Airtable from 23\/09\/2026/)).toBeInTheDocument();
  });

  it('disconnects a live connection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    localStorage.setItem(AIRTABLE_TOKEN_KEY, TOKEN);
    render(<DataSourceFooter source={{ kind: 'airtable-live' }} onChange={onChange} />);

    expect(screen.getByText(/Live data from Airtable/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Disconnect' }));

    expect(readStoredAirtableToken()).toBeNull();
    expect(onChange).toHaveBeenCalledOnce();
  });
});
