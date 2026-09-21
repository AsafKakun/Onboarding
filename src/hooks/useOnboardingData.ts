import { useCallback, useEffect, useState } from 'react';
import type { Employee, Manager, OnboardingTask } from '../domain/types';
import { getToday } from '../utils/date';
import { useRepository } from './useRepository';

export type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; employees: Employee[]; managers: Manager[]; tasks: OnboardingTask[] };

/** Loads all onboarding data from the repository and exposes task updates. */
export function useOnboardingData() {
  const repository = useRepository();
  const [today] = useState(getToday);
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([repository.getEmployees(), repository.getManagers(), repository.getTasks()])
      .then(([employees, managers, tasks]) => {
        if (!cancelled) setState({ status: 'ready', employees, managers, tasks });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [repository, attempt]);

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((count) => count + 1);
  }, []);

  const setTaskCompleted = useCallback(
    async (taskId: string, completed: boolean) => {
      const updated = await repository.setTaskCompleted(taskId, completed);
      setState((previous) =>
        previous.status === 'ready'
          ? {
              ...previous,
              tasks: previous.tasks.map((task) => (task.id === updated.id ? updated : task)),
            }
          : previous,
      );
    },
    [repository],
  );

  return { state, today, reload, setTaskCompleted };
}
