import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { EmptyState } from '../../components/EmptyState';
import type { EmployeeSummary } from '../../domain/types';

export function NeedsAttention({ items }: { items: EmployeeSummary[] }) {
  return (
    <section className="card" aria-labelledby="needs-attention-title">
      <h2 className="section-title" id="needs-attention-title">
        Needs attention
      </h2>
      {items.length === 0 ? (
        <EmptyState tone="success" title="Nothing overdue — great work." />
      ) : (
        <ul className="attention-list">
          {items.map(({ employee, counts }) => (
            <li key={employee.id}>
              <Link to={`/employees/${employee.id}`} className="attention-item">
                <Avatar name={employee.fullName} />
                <span className="attention-item__text">
                  <span className="attention-item__name">{employee.fullName}</span>
                  <span className="attention-item__meta">{employee.department || '—'}</span>
                </span>
                <span className="attention-item__count">{counts.overdue} overdue</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
