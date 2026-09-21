/** Placeholder block shown while data loads. */
export function Skeleton({ height = 16, width = '100%' }: { height?: number; width?: string }) {
  return <div className="skeleton" style={{ height, width }} aria-hidden="true" />;
}

export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <div className="kpi-grid">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="card" key={index}>
            <Skeleton height={14} width="60%" />
            <div style={{ height: 12 }} />
            <Skeleton height={32} width="40%" />
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 24 }}>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} style={{ marginBottom: 14 }}>
            <Skeleton height={20} />
          </div>
        ))}
      </div>
    </div>
  );
}
