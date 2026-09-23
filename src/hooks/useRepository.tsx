import { createContext, useContext, type ReactNode } from 'react';
import { airtableConfigFromEnv, createAirtableRepository } from '../data/airtableRepository';
import { MockRepository } from '../data/mockRepository';
import type { OnboardingRepository } from '../data/repository';

/**
 * The one place that decides where data comes from: Airtable when it is configured
 * in `.env.local` (see README), otherwise the generated sample data.
 */
const airtableConfig = airtableConfigFromEnv(import.meta.env);
const defaultRepository: OnboardingRepository = airtableConfig
  ? createAirtableRepository(airtableConfig)
  : new MockRepository();

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
