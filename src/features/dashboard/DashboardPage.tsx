import { useMemo } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { PageSkeleton } from '../../components/Skeleton';
import {
  filterSummaries,
  hasUnassignedEmployees,
  sortSummaries,
  uniqueDepartments,
  uniqueManagers,
} from '../../domain/filters';
import {
  buildSummaries,
  computeKpis,
  countByStage,
  countByStatus,
  topOverdue,
} from '../../domain/summarize';
import { useOnboardingData } from '../../hooks/useOnboardingData';
import { useRepository } from '../../hooks/useRepository';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { CsvActions } from './CsvActions';
import { EmployeeTable } from './EmployeeTable';
import { FilterBar } from './FilterBar';
import { KpiCards } from './KpiCards';
import { NeedsAttention } from './NeedsAttention';
import { StageChart } from './StageChart';
import { StatusChart } from './StatusChart';
import './dashboard.css';

const EMPTY_KPIS = computeKpis([]);

export function DashboardPage() {
  const { state, today, reload } = useOnboardingData();
  const repository = useRepository();
  const { filters, sort, setFilter, clearFilters, toggleSort } = useUrlFilters();

  const summaries = useMemo(
    () =>
      state.status === 'ready'
        ? buildSummaries(state.employees, state.managers, state.tasks, today)
        : [],
    [state, today],
  );
  const visible = useMemo(
    () => sortSummaries(filterSummaries(summaries, filters), sort),
    [summaries, filters, sort],
  );

  if (state.status === 'loading') return <PageSkeleton />;
  if (state.status === 'error') return <ErrorState onRetry={reload} />;

  if (summaries.length === 0) {
    return (
      <>
        <PageHeading />
        <KpiCards kpis={EMPTY_KPIS} />
        <div className="card" style={{ marginTop: 24 }}>
          <EmptyState
            title="No employees in onboarding yet."
            description="New employees will appear here once they are added."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeading />
      <KpiCards kpis={computeKpis(summaries)} />

      <div className="dashboard-grid">
        <StageChart counts={countByStage(summaries)} />
        <StatusChart counts={countByStatus(summaries)} />
        <NeedsAttention items={topOverdue(summaries, 5)} />
      </div>

      <section className="card employees-card" aria-labelledby="employees-title">
        <div className="employees-card__header">
          <h2 className="section-title" id="employees-title">
            Employees
          </h2>
          <CsvActions summaries={summaries} repository={repository} today={today} />
        </div>
        <FilterBar
          filters={filters}
          departments={uniqueDepartments(summaries)}
          managers={uniqueManagers(summaries)}
          showUnassignedManager={hasUnassignedEmployees(summaries)}
          onChange={setFilter}
          onClear={clearFilters}
        />
        <p className="result-count" aria-live="polite">
          Showing {visible.length} of {summaries.length} employees
        </p>
        {visible.length === 0 ? (
          <EmptyState
            title="No employees match your filters"
            description="Try a different search or remove some filters."
            action={
              <button type="button" className="button button--primary" onClick={clearFilters}>
                Clear filters
              </button>
            }
          />
        ) : (
          <EmployeeTable summaries={visible} sort={sort} onSort={toggleSort} />
        )}
      </section>
    </>
  );
}

function PageHeading() {
  return (
    <div className="page-heading">
      <h1>Onboarding overview</h1>
      <p>Where every new employee stands, and what still needs attention.</p>
    </div>
  );
}
