import { useState, type FormEvent } from 'react';
import {
  clearStoredAirtableToken,
  isCompleteAirtableToken,
  storeAirtableToken,
} from '../data/airtableToken';
import type { DataSource } from '../data/repository';
import { formatDate } from '../utils/date';

const reloadPage = () => window.location.reload();

/** "DD/MM/YYYY HH:MM" in the viewer's time zone; the copy is refreshed every hour. */
function formatSyncTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  const day = formatDate(
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
  );
  return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Says where the data comes from and lets the viewer paste an Airtable token.
 * The token is kept in this browser only; with it, every page load reads Airtable live.
 */
export function DataSourceFooter({
  source,
  onResetDemo,
  onChange = reloadPage,
}: {
  source: DataSource;
  onResetDemo?: () => Promise<void>;
  /** Called after the token is saved or removed; reloads the page by default. */
  onChange?: () => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <AirtableTokenForm onCancel={() => setEditing(false)} onSaved={onChange} />;
  }

  const connectButton = (label: string) => (
    <button type="button" className="link-button" onClick={() => setEditing(true)}>
      {label}
    </button>
  );

  if (source.kind === 'airtable-live') {
    return (
      <p className="data-source">
        Live data from Airtable, loaded when the page opens. {connectButton('Change token')} ·{' '}
        <button
          type="button"
          className="link-button"
          onClick={() => {
            clearStoredAirtableToken();
            onChange();
          }}
        >
          Disconnect
        </button>
      </p>
    );
  }

  if (source.kind === 'airtable-snapshot') {
    return (
      <p className="data-source">
        Showing a saved copy of Airtable from {formatSyncTime(source.syncedAt)}.{' '}
        {connectButton('Connect Airtable for live data')}
      </p>
    );
  }

  return (
    <p className="data-source">
      Showing sample data.{' '}
      {onResetDemo && (
        <>
          <button
            type="button"
            className="link-button"
            onClick={() => void onResetDemo().then(onChange)}
          >
            Reset demo data
          </button>{' '}
          ·{' '}
        </>
      )}
      {connectButton('Connect Airtable')}
    </p>
  );
}

function AirtableTokenForm({ onCancel, onSaved }: { onCancel: () => void; onSaved: () => void }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!isCompleteAirtableToken(token)) {
      setError(
        'This is not a complete token. Copy the whole token: pat…, a dot, then 64 characters.',
      );
      return;
    }
    if (!storeAirtableToken(token)) {
      setError('This browser does not allow saving the token (private mode or blocked storage).');
      return;
    }
    onSaved();
  };

  return (
    <form className="token-form" onSubmit={submit}>
      <label className="token-form__label" htmlFor="airtable-token">
        Airtable personal access token
      </label>
      <p className="token-form__help">
        Create one at airtable.com/create/tokens with the <code>data.records:read</code> scope and
        access to the base. It is saved only in this browser, never on the site or in the code.
      </p>
      <div className="token-form__row">
        <input
          id="airtable-token"
          className="token-form__input"
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder="pat….…"
          value={token}
          onChange={(event) => {
            setToken(event.target.value);
            setError(null);
          }}
        />
        <button type="submit" className="button button--primary">
          Save and load
        </button>
        <button type="button" className="button button--ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
      {error && (
        <p className="token-form__error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
