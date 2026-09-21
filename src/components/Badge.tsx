import type { ReactNode } from 'react';

export type Tone = 'success' | 'info' | 'danger' | 'neutral';

interface BadgeProps {
  tone: Tone;
  children: ReactNode;
  /** Small symbol shown before the text, so color is never the only signal. */
  icon?: string;
}

export function Badge({ tone, children, icon }: BadgeProps) {
  return (
    <span className={`badge badge--${tone}`}>
      {icon && (
        <span className="badge__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
