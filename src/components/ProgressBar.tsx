import type { Tone } from './Badge';

interface ProgressBarProps {
  /** 0-100 */
  value: number;
  label: string;
  tone?: Tone;
}

export function ProgressBar({ value, label, tone = 'info' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
    >
      <div className={`progress__fill progress__fill--${tone}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
