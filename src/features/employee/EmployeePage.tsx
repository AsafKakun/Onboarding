import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { PageSkeleton } from '../../components/Skeleton';
import { buildSummaries } from '../../domain/summarize';
import { toTaskView } from '../../domain/taskStatus';
import { useOnboardingData } from '../../hooks/useOnboardingData';
import { EmployeeHeader } from './EmployeeHeader';
import { ProgressCard } from './ProgressCard';
import { StageStepper } from './StageStepper';
import { TaskList } from './TaskList';
import './employee.css';

const BackLink = () => (
  <Link to="/" className="back-link">
    ← Back to dashboard
  </Link>
);

export function EmployeePage() {
  const { id } = useParams();
  const { state, today, reload, setTaskCompleted } = useOnboardingData();

  const detail = useMemo(() => {
    if (state.status !== 'ready') return null;
    const employee = state.employees.find((candidate) => candidate.id === id);
    if (!employee) return null;
    const tasks = state.tasks.filter((task) => task.employeeId === employee.id);
    const [summary] = buildSummaries([employee], state.managers, tasks, today);
    return summary ? { summary, tasks: tasks.map((task) => toTaskView(task, today)) } : null;
  }, [state, id, today]);

  if (state.status === 'loading') return <PageSkeleton />;
  if (state.status === 'error') return <ErrorState onRetry={reload} />;

  if (!detail) {
    return (
      <>
        <BackLink />
        <div className="card">
          <EmptyState
            title="Employee not found"
            description="This employee doesn't exist or is no longer in onboarding."
            action={
              <Link to="/" className="button button--primary">
                Go to the dashboard
              </Link>
            }
          />
        </div>
      </>
    );
  }

  const { summary, tasks } = detail;

  return (
    <>
      <BackLink />
      <EmployeeHeader summary={summary} today={today} />
      <div className="employee-grid">
        <ProgressCard summary={summary} />
        <section className="card" aria-labelledby="stages-title">
          <h2 className="section-title" id="stages-title">
            Stages
          </h2>
          <StageStepper tasks={tasks} currentStage={summary.currentStage} />
        </section>
      </div>
      {summary.status === 'completed' && (
        <div className="success-banner" role="status">
          🎉 Onboarding complete — all {summary.counts.total} tasks are done.
        </div>
      )}
      <TaskList tasks={tasks} currentStage={summary.currentStage} onToggle={setTaskCompleted} />
    </>
  );
}
