import { useState } from 'react';
import { Badge } from '../../components/Badge';
import { TaskStatusBadge } from '../../components/StatusBadges';
import type { TaskView } from '../../domain/types';
import { formatDate } from '../../utils/date';

interface TaskRowProps {
  task: TaskView;
  onToggle: (taskId: string, completed: boolean) => Promise<void>;
}

export function TaskRow({ task, onToggle }: TaskRowProps) {
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const toggle = async (completed: boolean) => {
    setSaving(true);
    setFailed(false);
    try {
      await onToggle(task.id, completed);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className={`task task--${task.status}`}>
      <input
        type="checkbox"
        className="task__check"
        checked={task.status === 'completed'}
        disabled={saving}
        onChange={(event) => void toggle(event.target.checked)}
        aria-label={`Mark "${task.title}" as completed`}
      />
      <span className="task__title">{task.title}</span>
      <span className="task__owner">
        <span className="task__field-label">Responsible</span>
        <Badge tone="neutral">{task.owner}</Badge>
      </span>
      <span className="task__due">
        <span className="task__field-label">Due</span>
        {formatDate(task.dueDate) || <span className="muted">No due date</span>}
      </span>
      <span className="task__status">
        <TaskStatusBadge status={task.status} />
      </span>
      {failed && (
        <span className="task__error" role="alert">
          Couldn't save this change. Please try again.
        </span>
      )}
    </li>
  );
}
