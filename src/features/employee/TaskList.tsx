import { useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { SegmentedControl } from '../../components/SegmentedControl';
import { getStageIndex, STAGES } from '../../domain/stages';
import type { Stage, TaskStatus, TaskView } from '../../domain/types';
import { TaskRow } from './TaskRow';

type TaskFilter = 'all' | TaskStatus;

const EMPTY_MESSAGES: Record<Exclude<TaskFilter, 'all'>, string> = {
  open: 'No open tasks.',
  overdue: 'No overdue tasks.',
  completed: 'No completed tasks yet.',
};

interface TaskListProps {
  tasks: TaskView[];
  currentStage: Stage | null;
  onToggle: (taskId: string, completed: boolean) => Promise<void>;
}

export function TaskList({ tasks, currentStage, onToggle }: TaskListProps) {
  const [filter, setFilter] = useState<TaskFilter>('all');
  // Start with the current stage and any stage that still has overdue work.
  const [expanded, setExpanded] = useState<Set<Stage>>(() => {
    const initial = new Set<Stage>(currentStage ? [currentStage] : []);
    for (const task of tasks) if (task.status === 'overdue') initial.add(task.stage);
    return initial;
  });

  if (tasks.length === 0) {
    return <EmptyState title="No onboarding tasks assigned yet." />;
  }

  const countOf = (status: TaskStatus) => tasks.filter((task) => task.status === status).length;
  const options = [
    { value: 'all' as const, label: `All (${tasks.length})` },
    { value: 'open' as const, label: `Open (${countOf('open')})` },
    { value: 'overdue' as const, label: `Overdue (${countOf('overdue')})` },
    { value: 'completed' as const, label: `Completed (${countOf('completed')})` },
  ];

  const changeFilter = (next: TaskFilter) => {
    setFilter(next);
    // Make sure the matching tasks are visible when filtering.
    if (next !== 'all') {
      setExpanded(new Set(tasks.filter((task) => task.status === next).map((task) => task.stage)));
    }
  };

  const toggleStage = (stage: Stage) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });

  const visibleTasks = filter === 'all' ? tasks : tasks.filter((task) => task.status === filter);

  return (
    <section className="card" aria-labelledby="tasks-title">
      <div className="task-list__toolbar">
        <h2 className="section-title" id="tasks-title">
          Tasks
        </h2>
        <SegmentedControl
          label="Filter tasks"
          options={options}
          value={filter}
          onChange={changeFilter}
        />
      </div>

      {visibleTasks.length === 0 && filter !== 'all' ? (
        <EmptyState title={EMPTY_MESSAGES[filter]} />
      ) : (
        STAGES.map(({ id, label }) => {
          const stageTasks = tasks.filter((task) => task.stage === id);
          const shown = visibleTasks.filter((task) => task.stage === id);
          if (shown.length === 0) return null;

          const completed = stageTasks.filter((task) => task.status === 'completed').length;
          const isDone = stageTasks.length > 0 && completed === stageTasks.length;
          const isOpen = expanded.has(id);
          const isCurrent =
            currentStage !== null && getStageIndex(id) === getStageIndex(currentStage);

          return (
            <div key={id} className="task-group">
              <button
                type="button"
                className="task-group__header"
                aria-expanded={isOpen}
                aria-controls={`stage-${id}`}
                onClick={() => toggleStage(id)}
              >
                <span className="task-group__chevron" aria-hidden="true">
                  {isOpen ? '▾' : '▸'}
                </span>
                <span className="task-group__title">{label}</span>
                {isCurrent && <span className="chip chip--primary">Current stage</span>}
                {isDone && <span className="chip chip--success">Done</span>}
                <span className="task-group__count">
                  {completed}/{stageTasks.length} completed
                </span>
              </button>
              {isOpen && (
                <ul className="task-group__list" id={`stage-${id}`}>
                  {shown.map((task) => (
                    <TaskRow key={task.id} task={task} onToggle={onToggle} />
                  ))}
                </ul>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}
