import type { Owner, Stage } from './types';

export interface TaskTemplate {
  stage: Stage;
  title: string;
  owner: Owner;
  /** Days relative to the employee's start date (negative = before). */
  dueOffsetDays: number;
}

const template = (
  stage: Stage,
  title: string,
  owner: Owner,
  dueOffsetDays: number,
): TaskTemplate => ({ stage, title, owner, dueOffsetDays });

export const TASK_TEMPLATES: readonly TaskTemplate[] = [
  // Before starting work
  template('before-start', 'Sign employment contract', 'Employee', -10),
  template('before-start', 'Fill out intake forms', 'Employee', -7),
  template('before-start', 'Collect employee details', 'HR', -7),
  template('before-start', 'Open employee in the HR system', 'HR', -5),
  template('before-start', 'Order computer and equipment', 'IT', -10),
  template('before-start', 'Prepare workstation', 'IT', -3),
  template('before-start', "Open user for the organization's systems", 'IT', -3),
  template('before-start', 'Prepare employee badge', 'HR', -2),
  template('before-start', 'Send first-day information', 'HR', -2),

  // First day
  template('first-day', 'Introductory meeting with HR', 'HR', 0),
  template('first-day', 'Meet the manager', 'Manager', 0),
  template('first-day', 'Office tour', 'HR', 0),
  template('first-day', 'Receive equipment', 'IT', 0),
  template('first-day', 'Open system permissions', 'IT', 0),
  template('first-day', 'Meet the team', 'Manager', 0),
  template('first-day', 'Go over procedures', 'HR', 0),
  template('first-day', 'Information security training', 'Employee', 0),

  // First week
  template('first-week', 'Professional training for the role', 'Manager', 5),
  template('first-week', 'Meetings with key people', 'Manager', 5),
  template('first-week', 'Learn the work processes', 'Employee', 5),
  template('first-week', 'Complete mandatory training', 'Employee', 7),
  template('first-week', 'Set initial goals', 'Manager', 5),
  template('first-week', 'First feedback meeting with the manager', 'Manager', 7),

  // First month
  template('first-month', 'Complete mandatory training', 'Employee', 30),
  template('first-month', 'Follow-up meeting with HR', 'HR', 21),
  template('first-month', 'Feedback meeting with the manager', 'Manager', 28),
  template('first-month', 'Check integration into the team', 'Manager', 28),
  template('first-month', 'Update goals', 'Manager', 30),
  template('first-month', 'Complete missing permissions and systems', 'IT', 21),

  // End of onboarding period
  template('end-of-period', 'Complete onboarding survey', 'Employee', 80),
  template('end-of-period', 'Final onboarding review with HR', 'HR', 85),
  template('end-of-period', 'Final feedback meeting with the manager', 'Manager', 85),
  template('end-of-period', 'Confirm goals for the next period', 'Manager', 90),
  template('end-of-period', 'Close onboarding file in the HR system', 'HR', 90),
];
