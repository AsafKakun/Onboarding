import { Avatar } from '../../components/Avatar';
import { EmployeeStatusBadge } from '../../components/StatusBadges';
import type { EmployeeSummary } from '../../domain/types';
import { daysBetween, formatDate } from '../../utils/date';

function describeStart(startDate: string, today: string): string {
  const days = daysBetween(today, startDate); // positive = starts in the future
  if (days === null) return 'Start date missing';
  if (days > 1) return `Starts in ${days} days`;
  if (days === 1) return 'Starts tomorrow';
  if (days === 0) return 'Started today';
  return `Started ${-days} ${days === -1 ? 'day' : 'days'} ago`;
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="detail">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function EmployeeHeader({ summary, today }: { summary: EmployeeSummary; today: string }) {
  const { employee, manager, status } = summary;
  const muted = (text: string) => <span className="muted">{text}</span>;

  return (
    <section className="card employee-header">
      <Avatar name={employee.fullName} size="lg" />
      <div className="employee-header__main">
        <div className="employee-header__title">
          <h1>{employee.fullName}</h1>
          <EmployeeStatusBadge status={status} />
        </div>
        <dl className="details">
          <Detail label="Position">{employee.position || muted('—')}</Detail>
          <Detail label="Department">{employee.department || muted('—')}</Detail>
          <Detail label="Direct manager">{manager ? manager.fullName : muted('Unassigned')}</Detail>
          <Detail label="Start date">
            {formatDate(employee.startDate) || muted('Start date missing')}
            <span className="detail__sub">{describeStart(employee.startDate, today)}</span>
          </Detail>
        </dl>
      </div>
    </section>
  );
}
