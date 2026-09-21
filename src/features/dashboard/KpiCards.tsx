import type { Kpis } from '../../domain/summarize';

interface KpiCardProps {
  label: string;
  value: number;
  hint: string;
  tone?: 'default' | 'danger';
}

function KpiCard({ label, value, hint, tone = 'default' }: KpiCardProps) {
  return (
    <div className={`card kpi kpi--${tone}`}>
      <p className="kpi__label">{label}</p>
      <p className="kpi__value">{value}</p>
      <p className="kpi__hint">{hint}</p>
    </div>
  );
}

export function KpiCards({ kpis }: { kpis: Kpis }) {
  return (
    <section className="kpi-grid" aria-label="Onboarding summary">
      <KpiCard label="New employees" value={kpis.totalEmployees} hint="In the onboarding program" />
      <KpiCard label="In progress" value={kpis.inProgress} hint="Onboarding not finished yet" />
      <KpiCard label="Completed" value={kpis.completed} hint="All tasks done" />
      <KpiCard label="Open tasks" value={kpis.openTasks} hint="Not yet due" />
      <KpiCard
        label="Overdue tasks"
        value={kpis.overdueTasks}
        hint="Past their due date"
        tone={kpis.overdueTasks > 0 ? 'danger' : 'default'}
      />
    </section>
  );
}
