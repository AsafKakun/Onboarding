import { EmptyState } from './EmptyState';

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      title="We couldn't load the onboarding data"
      description="Please check your connection and try again."
      action={
        <button type="button" className="button button--primary" onClick={onRetry}>
          Try again
        </button>
      }
    />
  );
}
