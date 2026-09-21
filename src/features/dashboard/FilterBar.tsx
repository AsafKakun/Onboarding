import { hasActiveFilters, UNASSIGNED, type FilterState } from '../../domain/filters';
import { STAGES } from '../../domain/stages';
import { EMPLOYEE_STATUS_LABELS } from '../../domain/employeeStatus';
import type { EmployeeStatus, Stage } from '../../domain/types';

interface FilterBarProps {
  filters: FilterState;
  departments: string[];
  managers: { id: string; name: string }[];
  showUnassignedManager: boolean;
  onChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onClear: () => void;
}

export function FilterBar({
  filters,
  departments,
  managers,
  showUnassignedManager,
  onChange,
  onClear,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <div className="field field--search">
        <label htmlFor="filter-search">Search employee</label>
        <input
          id="filter-search"
          type="search"
          placeholder="Type a name…"
          value={filters.search}
          onChange={(event) => onChange('search', event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="filter-department">Department</label>
        <select
          id="filter-department"
          value={filters.department}
          onChange={(event) => onChange('department', event.target.value)}
        >
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="filter-manager">Manager</label>
        <select
          id="filter-manager"
          value={filters.manager}
          onChange={(event) => onChange('manager', event.target.value)}
        >
          <option value="">All managers</option>
          {managers.map((manager) => (
            <option key={manager.id} value={manager.id}>
              {manager.name}
            </option>
          ))}
          {showUnassignedManager && <option value={UNASSIGNED}>Unassigned</option>}
        </select>
      </div>

      <div className="field">
        <label htmlFor="filter-stage">Stage</label>
        <select
          id="filter-stage"
          value={filters.stage}
          onChange={(event) => onChange('stage', event.target.value as Stage | '')}
        >
          <option value="">All stages</option>
          {STAGES.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="filter-status">Status</label>
        <select
          id="filter-status"
          value={filters.status}
          onChange={(event) => onChange('status', event.target.value as EmployeeStatus | '')}
        >
          <option value="">All statuses</option>
          {(Object.keys(EMPLOYEE_STATUS_LABELS) as EmployeeStatus[]).map((status) => (
            <option key={status} value={status}>
              {EMPLOYEE_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="filter-from">Start date from</label>
        <input
          id="filter-from"
          type="date"
          value={filters.startFrom}
          max={filters.startTo || undefined}
          onChange={(event) => onChange('startFrom', event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="filter-to">Start date to</label>
        <input
          id="filter-to"
          type="date"
          value={filters.startTo}
          min={filters.startFrom || undefined}
          onChange={(event) => onChange('startTo', event.target.value)}
        />
      </div>

      {hasActiveFilters(filters) && (
        <button type="button" className="button button--ghost filter-bar__clear" onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  );
}
