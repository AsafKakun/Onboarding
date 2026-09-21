import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DEFAULT_SORT,
  EMPTY_FILTERS,
  type FilterState,
  type SortDirection,
  type SortKey,
  type SortState,
} from '../domain/filters';
import { STAGE_IDS } from '../domain/stages';
import type { EmployeeStatus, Stage } from '../domain/types';

const PARAM_NAMES: Record<keyof FilterState, string> = {
  search: 'q',
  department: 'dept',
  manager: 'mgr',
  stage: 'stage',
  status: 'status',
  startFrom: 'from',
  startTo: 'to',
};

const STATUSES: readonly EmployeeStatus[] = ['completed', 'needs-attention', 'on-track'];
const SORT_KEYS: readonly SortKey[] = ['default', 'name', 'startDate', 'progress', 'status'];

/** Search, filter and sort state, kept in the URL query string so views can be shared. */
export function useUrlFilters() {
  const [params, setParams] = useSearchParams();

  const filters = useMemo<FilterState>(() => {
    const read = (key: keyof FilterState) => params.get(PARAM_NAMES[key]) ?? '';
    const stage = read('stage');
    const status = read('status');
    return {
      ...EMPTY_FILTERS,
      search: read('search'),
      department: read('department'),
      manager: read('manager'),
      stage: STAGE_IDS.includes(stage as Stage) ? (stage as Stage) : '',
      status: STATUSES.includes(status as EmployeeStatus) ? (status as EmployeeStatus) : '',
      startFrom: read('startFrom'),
      startTo: read('startTo'),
    };
  }, [params]);

  const sort = useMemo<SortState>(() => {
    const key = params.get('sort') as SortKey | null;
    const direction: SortDirection = params.get('dir') === 'desc' ? 'desc' : 'asc';
    return key && SORT_KEYS.includes(key) ? { key, direction } : DEFAULT_SORT;
  }, [params]);

  const setFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (value) next.set(PARAM_NAMES[key], value);
          else next.delete(PARAM_NAMES[key]);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const clearFilters = useCallback(() => {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        Object.values(PARAM_NAMES).forEach((name) => next.delete(name));
        return next;
      },
      { replace: true },
    );
  }, [setParams]);

  /** Clicking the active column flips the direction; clicking another column sorts it ascending. */
  const toggleSort = useCallback(
    (key: SortKey) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          const current = previous.get('sort');
          const flip = current === key && previous.get('dir') !== 'desc';
          next.set('sort', key);
          next.set('dir', flip ? 'desc' : 'asc');
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return { filters, sort, setFilter, clearFilters, toggleSort };
}
