import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { MockRepository } from './data/mockRepository';
import type { OnboardingRepository } from './data/repository';
import { RepositoryProvider } from './hooks/useRepository';
import { getToday } from './utils/date';

function renderApp(route: string, repository: OnboardingRepository) {
  return render(
    <RepositoryProvider repository={repository}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </RepositoryProvider>,
  );
}

const demoRepository = () => new MockRepository(getToday, null);

const emptyRepository: OnboardingRepository = {
  getEmployees: async () => [],
  getManagers: async () => [],
  getTasks: async () => [],
  getTasksForEmployee: async () => [],
  setTaskCompleted: async () => {
    throw new Error('no tasks');
  },
};

const failingRepository: OnboardingRepository = {
  ...emptyRepository,
  getEmployees: async () => {
    throw new Error('offline');
  },
};

describe('Dashboard', () => {
  it('shows the KPI cards and the employee table', async () => {
    renderApp('/', demoRepository());
    expect(await screen.findByText('Onboarding overview')).toBeInTheDocument();
    expect(screen.getByText('Showing 18 of 18 employees')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Noa Friedman' })).toBeInTheDocument();
  });

  it('shows an empty state when there are no employees', async () => {
    renderApp('/', emptyRepository);
    expect(await screen.findByText('No employees in onboarding yet.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows a friendly message when filters match nobody, and clears them', async () => {
    const user = userEvent.setup();
    renderApp('/?q=zzzz', demoRepository());
    expect(await screen.findByText('No employees match your filters')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Clear filters' })[0]!);
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('filters the table by search text', async () => {
    const user = userEvent.setup();
    renderApp('/', demoRepository());
    await user.type(await screen.findByLabelText('Search employee'), 'liam');
    expect(screen.getByText('Showing 1 of 18 employees')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Liam O'Connor" })).toBeInTheDocument();
  });

  it('offers a retry when data fails to load', async () => {
    renderApp('/', failingRepository);
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('Employee page', () => {
  it('shows details, stages and tasks', async () => {
    renderApp('/employees/e-05', demoRepository());
    expect(await screen.findByRole('heading', { name: 'Sofia Alvarez' })).toBeInTheDocument();
    expect(screen.getByLabelText('Onboarding stages')).toBeInTheDocument();
    expect(screen.getByText('Professional training for the role')).toBeInTheDocument();
  });

  it('updates progress when a task is marked completed', async () => {
    const user = userEvent.setup();
    renderApp('/employees/e-05', demoRepository());
    const progress = await screen.findByRole('progressbar', {
      name: 'Overall onboarding progress',
    });
    const before = Number(progress.getAttribute('aria-valuenow'));

    const unchecked = screen
      .getAllByRole<HTMLInputElement>('checkbox')
      .find((checkbox) => !checkbox.checked);
    await user.click(unchecked!);

    await waitFor(() =>
      expect(
        Number(
          screen
            .getByRole('progressbar', { name: 'Overall onboarding progress' })
            .getAttribute('aria-valuenow'),
        ),
      ).toBeGreaterThan(before),
    );
  });

  it('shows "Employee not found" for an unknown id', async () => {
    renderApp('/employees/does-not-exist', demoRepository());
    expect(await screen.findByText('Employee not found')).toBeInTheDocument();
  });

  it('shows a message when the employee has no tasks', async () => {
    const demo = demoRepository();
    const noTasks: OnboardingRepository = {
      ...emptyRepository,
      getEmployees: () => demo.getEmployees(),
      getManagers: () => demo.getManagers(),
    };
    renderApp('/employees/e-05', noTasks);
    expect(await screen.findByText('No onboarding tasks assigned yet.')).toBeInTheDocument();
  });
});
