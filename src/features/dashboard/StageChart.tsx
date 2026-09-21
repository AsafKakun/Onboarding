import { STAGES } from '../../domain/stages';
import type { Stage } from '../../domain/types';

export function StageChart({ counts }: { counts: Record<Stage, number> }) {
  const max = Math.max(1, ...Object.values(counts));
  return (
    <div className="card">
      <h2 className="section-title">Employees by stage</h2>
      <ul className="bar-chart">
        {STAGES.map(({ id, label }) => (
          <li key={id} className="bar-chart__row">
            <span className="bar-chart__label">{label}</span>
            <span className="bar-chart__track">
              <span className="bar-chart__bar" style={{ width: `${(counts[id] / max) * 100}%` }} />
            </span>
            <span className="bar-chart__value">{counts[id]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
