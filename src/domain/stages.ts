import type { Stage } from './types';

/** Length of the whole onboarding period, in days after the start date. */
export const ONBOARDING_PERIOD_DAYS = 90;

export const STAGES: readonly { id: Stage; label: string }[] = [
  { id: 'before-start', label: 'Before starting work' },
  { id: 'first-day', label: 'First day' },
  { id: 'first-week', label: 'First week' },
  { id: 'first-month', label: 'First month' },
  { id: 'end-of-period', label: 'End of onboarding period' },
];

export const STAGE_IDS: readonly Stage[] = STAGES.map((stage) => stage.id);

export function getStageLabel(stage: Stage): string {
  return STAGES.find((s) => s.id === stage)?.label ?? stage;
}

export function getStageIndex(stage: Stage): number {
  return STAGE_IDS.indexOf(stage);
}
