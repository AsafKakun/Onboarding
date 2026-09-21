import { Link, Outlet, Route, Routes } from 'react-router-dom';
import { EmptyState } from './components/EmptyState';
import { useRepository } from './hooks/useRepository';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { EmployeePage } from './features/employee/EmployeePage';

function Layout() {
  const repository = useRepository();
  const resetDemoData = repository.resetDemoData?.bind(repository);

  return (
    <div className="app">
      <header className="app-header">
        <div className="container app-header__inner">
          <Link to="/" className="brand">
            <span className="brand__mark" aria-hidden="true">
              ✓
            </span>
            Onboarding
          </Link>
        </div>
      </header>
      <main className="container app-main">
        <Outlet />
      </main>
      {resetDemoData && (
        <footer className="container app-footer">
          Showing sample data.{' '}
          <button
            type="button"
            className="link-button"
            onClick={() => void resetDemoData().then(() => window.location.reload())}
          >
            Reset demo data
          </button>
        </footer>
      )}
    </div>
  );
}

function NotFound() {
  return (
    <div className="card">
      <EmptyState
        title="Page not found"
        action={
          <Link to="/" className="button button--primary">
            Go to the dashboard
          </Link>
        }
      />
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="employees/:id" element={<EmployeePage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
