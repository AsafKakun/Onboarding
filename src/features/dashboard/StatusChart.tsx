import { EMPLOYEE_STATUS_LABELS } from '../../domain/employeeStatus';
import type { EmployeeStatus } from '../../domain/types';

const SEGMENTS: { status: EmployeeStatus; color: string }[] = [
  { status: 'completed', color: 'var(--color-success)' },
  { status: 'on-track', color: 'var(--color-info)' },
  { status: 'needs-attention', color: 'var(--color-danger)' },
];

export function StatusChart({ counts }: { counts: Record<EmployeeStatus, number> }) {
  const total = SEGMENTS.reduce((sum, { status }) => sum + counts[status], 0);

  let offset = 0;
  const stops = SEGMENTS.filter(({ status }) => counts[status] > 0).map(({ status, color }) => {
    const start = (offset / total) * 100;
    offset += counts[status];
    return `${color} ${start}% ${(offset / total) * 100}%`;
  });
  const gradient = total > 0 ? `conic-gradient(${stops.join(', ')})` : 'var(--color-neutral-bg)';

  const summary = SEGMENTS.map(
    ({ status }) => `${counts[status]} ${EMPLOYEE_STATUS_LABELS[status]}`,
  ).join(', ');

  return (
    <div className="card">
      <h2 className="section-title">Employees by status</h2>
      <div className="donut-wrap">
        <div className="donut" style={{ background: gradient }} role="img" aria-label={summary}>
          <div className="donut__hole">
            <span className="donut__total">{total}</span>
            <span className="donut__caption">employees</span>
          </div>
        </div>
        <ul className="legend">
          {SEGMENTS.map(({ status, color }) => (
            <li key={status} className="legend__item">
              <span className="legend__dot" style={{ background: color }} aria-hidden="true" />
              <span className="legend__label">{EMPLOYEE_STATUS_LABELS[status]}</span>
              <span className="legend__value">{counts[status]}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
