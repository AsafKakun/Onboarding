import { getStageIndex, STAGES } from '../../domain/stages';
import type { Stage, TaskView } from '../../domain/types';

type StepState = 'done' | 'current' | 'upcoming';

function getStepState(stage: Stage, currentStage: Stage | null): StepState {
  if (currentStage === null) return 'upcoming';
  const diff = getStageIndex(stage) - getStageIndex(currentStage);
  return diff < 0 ? 'done' : diff === 0 ? 'current' : 'upcoming';
}

const STATE_LABEL: Record<StepState, string> = {
  done: 'Done',
  current: 'Current',
  upcoming: 'Upcoming',
};

export function StageStepper({
  tasks,
  currentStage,
}: {
  tasks: TaskView[];
  currentStage: Stage | null;
}) {
  return (
    <ol className="stepper" aria-label="Onboarding stages">
      {STAGES.map(({ id, label }, index) => {
        const stageTasks = tasks.filter((task) => task.stage === id);
        const completed = stageTasks.filter((task) => task.status === 'completed').length;
        const state = getStepState(id, currentStage);
        const hasLeftovers = state === 'done' && completed < stageTasks.length;

        return (
          <li
            key={id}
            className={`step step--${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="step__marker" aria-hidden="true">
              {state === 'done' && !hasLeftovers ? '✓' : hasLeftovers ? '!' : index + 1}
            </span>
            <span className="step__label">{label}</span>
            <span className="step__count">
              {stageTasks.length === 0 ? 'No tasks' : `${completed}/${stageTasks.length} tasks`}
            </span>
            <span className="step__state">
              {STATE_LABEL[state]}
              {hasLeftovers && ' · tasks left'}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
