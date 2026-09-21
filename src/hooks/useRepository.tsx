import { createContext, useContext, type ReactNode } from 'react';
import { MockRepository } from '../data/mockRepository';
import type { OnboardingRepository } from '../data/repository';

/**
 * The one place that decides where data comes from.
 * To use a real data source, replace `new MockRepository()` with your own implementation
 * of `OnboardingRepository`.
 */
const defaultRepository: OnboardingRepository = new MockRepository();

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
