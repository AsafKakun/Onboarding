import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: 'neutral' | 'success';
}

export function EmptyState({ title, description, action, tone = 'neutral' }: EmptyStateProps) {
  return (
    <div className={`empty-state empty-state--${tone}`}>
      <p className="empty-state__title">{title}</p>
      {description && <p className="empty-state__text">{description}</p>}
      {action}
    </div>
  );
}
