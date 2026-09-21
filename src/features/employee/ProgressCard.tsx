import { ProgressBar } from '../../components/ProgressBar';
import type { EmployeeSummary } from '../../domain/types';

export function ProgressCard({ summary }: { summary: EmployeeSummary }) {
  const { counts, progress, status } = summary;
  return (
    <section className="card progress-card" aria-label="Onboarding progress">
      <div className="progress-card__top">
        <span className="progress-card__value">{progress}%</span>
        <span className="progress-card__caption">
          {counts.total === 0 ? 'No tasks' : `${counts.completed} of ${counts.total} tasks done`}
        </span>
      </div>
      <ProgressBar
        value={progress}
        label="Overall onboarding progress"
        tone={status === 'completed' ? 'success' : status === 'needs-attention' ? 'danger' : 'info'}
      />
      <dl className="count-row">
        <div className="count count--success">
          <dt>Completed</dt>
          <dd>{counts.completed}</dd>
        </div>
        <div className="count count--info">
          <dt>Open</dt>
          <dd>{counts.open}</dd>
        </div>
        <div className={`count ${counts.overdue > 0 ? 'count--danger' : 'count--muted'}`}>
          <dt>Overdue</dt>
          <dd>{counts.overdue}</dd>
        </div>
      </dl>
    </section>
  );
}
