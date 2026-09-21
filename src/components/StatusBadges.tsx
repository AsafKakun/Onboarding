import { EMPLOYEE_STATUS_LABELS } from '../domain/employeeStatus';
import type { EmployeeStatus, TaskStatus } from '../domain/types';
import { Badge, type Tone } from './Badge';

const TASK_STATUS: Record<TaskStatus, { label: string; tone: Tone; icon: string }> = {
  completed: { label: 'Completed', tone: 'success', icon: '✓' },
  open: { label: 'Open', tone: 'info', icon: '○' },
  overdue: { label: 'Overdue', tone: 'danger', icon: '!' },
};

const EMPLOYEE_STATUS: Record<EmployeeStatus, { tone: Tone; icon: string }> = {
  completed: { tone: 'success', icon: '✓' },
  'on-track': { tone: 'info', icon: '●' },
  'needs-attention': { tone: 'danger', icon: '!' },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const { label, tone, icon } = TASK_STATUS[status];
  return (
    <Badge tone={tone} icon={icon}>
      {label}
    </Badge>
  );
}

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  const { tone, icon } = EMPLOYEE_STATUS[status];
  return (
    <Badge tone={tone} icon={icon}>
      {EMPLOYEE_STATUS_LABELS[status]}
    </Badge>
  );
}
