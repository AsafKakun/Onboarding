import { createContext, useContext, type ReactNode } from 'react';
import {
  airtableConfigFromEnv,
  createAirtableRepository,
  createAirtableSnapshotRepository,
  type AirtableSnapshot,
} from '../data/airtableRepository';
import { readStoredAirtableToken } from '../data/airtableToken';
import { MockRepository } from '../data/mockRepository';
import type { OnboardingRepository } from '../data/repository';

/**
 * The one place that decides where data comes from (see README, "Connecting Airtable"):
 * 1. live Airtable, when a token was pasted in the dashboard (kept in this browser only)
 *    or set in `.env.local` (local development);
 * 2. the saved Airtable snapshot `src/data/airtableSnapshot.json` (the published site);
 * 3. otherwise the generated sample data.
 */
const airtableConfig = airtableConfigFromEnv(import.meta.env, readStoredAirtableToken());
// A glob, so the app still builds if the snapshot file is deleted.
const [airtableSnapshot] = Object.values(
  import.meta.glob<AirtableSnapshot>('../data/airtableSnapshot.json', {
    eager: true,
    import: 'default',
  }),
);

function createDefaultRepository(): OnboardingRepository {
  if (airtableConfig) return createAirtableRepository(airtableConfig);
  if (airtableSnapshot) return createAirtableSnapshotRepository(airtableSnapshot);
  return new MockRepository();
}

const defaultRepository = createDefaultRepository();

const RepositoryContext = createContext<OnboardingRepository>(defaultRepository);

export function RepositoryProvider({
  repository,
  children,
}: {
  repository: OnboardingRepository;
  children: ReactNode;
}) {
  return <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>;
}

export function useRepository(): OnboardingRepository {
  return useContext(RepositoryContext);
}
