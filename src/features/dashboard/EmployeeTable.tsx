import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { EmployeeStatusBadge } from '../../components/StatusBadges';
import { ProgressBar } from '../../components/ProgressBar';
import type { SortKey, SortState } from '../../domain/filters';
import { getStageLabel } from '../../domain/stages';
import type { EmployeeSummary } from '../../domain/types';
import { formatDate } from '../../utils/date';

interface EmployeeTableProps {
  summaries: EmployeeSummary[];
  sort: SortState;
  onSort: (key: SortKey) => void;
}

const Muted = ({ children }: { children: string }) => <span className="muted">{children}</span>;

function SortableHeader({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
}) {
  const active = sort.key === sortKey;
  const ariaSort = active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none';
  return (
    <th scope="col" aria-sort={ariaSort}>
      <button type="button" className="sort-button" onClick={() => onSort(sortKey)}>
        {label}
        <span className="sort-button__arrow" aria-hidden="true">
          {active ? (sort.direction === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  );
}

export function EmployeeTable({ summaries, sort, onSort }: EmployeeTableProps) {
  const navigate = useNavigate();

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <SortableHeader label="Employee" sortKey="name" sort={sort} onSort={onSort} />
            <th scope="col">Position</th>
            <th scope="col">Department</th>
            <th scope="col">Manager</th>
            <SortableHeader label="Start date" sortKey="startDate" sort={sort} onSort={onSort} />
            <th scope="col">Stage</th>
            <SortableHeader label="Progress" sortKey="progress" sort={sort} onSort={onSort} />
            <th scope="col">Tasks</th>
            <SortableHeader label="Status" sortKey="status" sort={sort} onSort={onSort} />
          </tr>
        </thead>
        <tbody>
          {summaries.map(({ employee, manager, currentStage, counts, progress, status }) => (
            <tr
              key={employee.id}
              className="table__row"
              onClick={(event) => {
                if (!(event.target as HTMLElement).closest('a')) {
                  navigate(`/employees/${employee.id}`);
                }
              }}
            >
              <td>
                <span className="person">
                  <Avatar name={employee.fullName} />
                  <Link
                    to={`/employees/${employee.id}`}
                    className="person__name truncate"
                    title={employee.fullName}
                  >
                    {employee.fullName}
                  </Link>
                </span>
              </td>
              <td className="truncate" title={employee.position}>
                {employee.position || <Muted>—</Muted>}
              </td>
              <td className="truncate" title={employee.department}>
                {employee.department || <Muted>—</Muted>}
              </td>
              <td className="truncate" title={manager?.fullName}>
                {manager ? manager.fullName : <Muted>Unassigned</Muted>}
              </td>
              <td>{formatDate(employee.startDate) || <Muted>Start date missing</Muted>}</td>
              <td>
                {currentStage ? (
                  <span className="chip">{getStageLabel(currentStage)}</span>
                ) : (
                  <Muted>—</Muted>
                )}
              </td>
              <td>
                <div className="progress-cell">
                  <ProgressBar
                    value={progress}
                    label={`${employee.fullName} progress`}
                    tone={status === 'completed' ? 'success' : 'info'}
                  />
                  <span className="progress-cell__value">{progress}%</span>
                </div>
              </td>
              <td>
                <span className="task-counts">
                  <span title="Completed tasks">✓ {counts.completed}</span>
                  <span title="Open tasks">○ {counts.open}</span>
                  <span
                    title="Overdue tasks"
                    className={counts.overdue > 0 ? 'task-counts__overdue' : 'muted'}
                  >
                    ! {counts.overdue}
                  </span>
                </span>
              </td>
              <td>
                <EmployeeStatusBadge status={status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
