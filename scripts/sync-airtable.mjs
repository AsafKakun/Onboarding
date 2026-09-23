// Copies the Airtable employees table into src/data/airtableSnapshot.json, which the
// published dashboard shows to visitors without a token. The token is never written to
// the snapshot.
//
// Usage: npm run sync:airtable (token from .env.local), or with VITE_AIRTABLE_TOKEN set
// in the environment (the hourly GitHub Pages build).
import { writeFile } from 'node:fs/promises';

const token = process.env.VITE_AIRTABLE_TOKEN?.trim();
const baseId = process.env.VITE_AIRTABLE_BASE_ID?.trim() || 'appmsE2WLIFOSvh82';
const table = process.env.VITE_AIRTABLE_TABLE?.trim() || 'Onboarding Employees';

if (!token) {
  console.error('Missing VITE_AIRTABLE_TOKEN (in .env.local or the environment)');
  process.exit(1);
}

const records = [];
let offset;
do {
  const url = new URL(
    `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}`,
  );
  if (offset) url.searchParams.set('offset', offset);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    console.error(`Airtable request failed: ${response.status} ${await response.text()}`);
    process.exit(1);
  }
  const page = await response.json();
  records.push(...page.records.map(({ id, fields }) => ({ id, fields })));
  offset = page.offset;
} while (offset);

records.sort((a, b) =>
  String(a.fields['Employee ID'] ?? a.id).localeCompare(String(b.fields['Employee ID'] ?? b.id)),
);

const snapshot = { syncedAt: new Date().toISOString(), records };
await writeFile(
  new URL('../src/data/airtableSnapshot.json', import.meta.url),
  `${JSON.stringify(snapshot, null, 2)}\n`,
);
console.log(`Saved ${records.length} employees to src/data/airtableSnapshot.json`);
