import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectProgress } from '../features/projects/ProjectProgress';
import { calculateTaskProgress } from '../lib/taskProgress';
import { Task } from '../types/database.types';

const createTask = (id: string, status: Task['status']): Task => ({
  id,
  project_id: 'project-1',
  title: `Tarea ${id}`,
  description: null,
  status,
  priority: 'medium',
  assignee_id: null,
  created_by: 'user-1',
  due_date: null,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
});

describe('Project task progress', () => {
  it.each([
    { tasks: [], percentage: 0 },
    { tasks: [createTask('1', 'completed'), createTask('2', 'pending')], percentage: 50 },
    {
      tasks: [createTask('1', 'completed'), createTask('2', 'completed'), createTask('3', 'completed')],
      percentage: 100,
    },
  ])('calculates $percentage% for the task set', ({ tasks, percentage }) => {
    expect(calculateTaskProgress(tasks).percentage).toBe(percentage);
  });

  it('shows an informative empty state and the calculated progress width', () => {
    const progress = calculateTaskProgress([
      createTask('1', 'completed'),
      createTask('2', 'pending'),
    ]);

    render(<ProjectProgress progress={progress} />);

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('1 de 2 tareas completadas')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByRole('progressbar').firstElementChild).toHaveStyle({ width: '50%' });
  });

  it('shows an informative message when there are no tasks', () => {
    render(<ProjectProgress progress={calculateTaskProgress([])} />);

    expect(screen.getByText('Aún no hay tareas registradas.')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });
});
