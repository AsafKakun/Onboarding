import { browserStorage, type KeyValueStorage } from './localTaskRepository';

/** The Airtable token pasted in the dashboard. It lives only in this browser. */
export const AIRTABLE_TOKEN_KEY = 'onboarding.airtable-token.v1';

/** A complete personal access token: "pat" + 14 characters, a dot, then 64 hex characters. */
const TOKEN_FORMAT = /^pat[A-Za-z0-9]{14}\.[a-f0-9]{64}$/;

export function isCompleteAirtableToken(token: string): boolean {
  return TOKEN_FORMAT.test(token.trim());
}

export function readStoredAirtableToken(
  storage: KeyValueStorage | null = browserStorage(),
): string | null {
  try {
    return storage?.getItem(AIRTABLE_TOKEN_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

/** Returns false when the browser does not allow saving (e.g. blocked storage). */
export function storeAirtableToken(
  token: string,
  storage: KeyValueStorage | null = browserStorage(),
): boolean {
  try {
    if (!storage) return false;
    storage.setItem(AIRTABLE_TOKEN_KEY, token.trim());
    return true;
  } catch {
    return false;
  }
}

export function clearStoredAirtableToken(storage: KeyValueStorage | null = browserStorage()): void {
  try {
    storage?.removeItem(AIRTABLE_TOKEN_KEY);
  } catch {
    // nothing to clear
  }
}
