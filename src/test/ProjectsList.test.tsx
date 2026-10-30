import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectsList } from '../features/projects/ProjectsList';
import { Project } from '../types/database.types';
import { formatDate } from '../lib/formatters';

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@syncboard.edu' },
    profile: { id: 'user-1', display_name: 'Usuario Test', created_at: '2026-10-01T00:00:00Z' },
    session: null,
    loading: false,
  }),
}));

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Proyecto Sistemas Distribuidos',
    description: 'Tablero del curso',
    owner_id: 'user-1',
    created_at: '2026-10-21T12:00:00Z',
    updated_at: '2026-10-21T12:00:00Z',
    deleted_at: null,
  },
  {
    id: 'proj-2',
    name: 'Proyecto Bases de Datos',
    description: null,
    owner_id: 'user-2',
    created_at: '2026-09-05T12:00:00Z',
    updated_at: '2026-09-05T12:00:00Z',
    deleted_at: null,
  },
];

describe('ProjectsList - Issue #29', () => {
  it('shows the empty state message when there are no projects', () => {
    render(
      <ProjectsList
        projects={[]}
        loading={false}
        onSelectProject={vi.fn()}
        onOpenCreateModal={vi.fn()}
      />
    );

    expect(screen.getByText('Aún no tienes proyectos activos')).toBeVisible();
    expect(screen.getByRole('button', { name: /crear mi primer proyecto/i })).toBeInTheDocument();
  });

  it('renders project names and formatted creation dates', () => {
    render(
      <ProjectsList
        projects={mockProjects}
        loading={false}
        onSelectProject={vi.fn()}
        onOpenCreateModal={vi.fn()}
      />
    );

    expect(screen.queryByText('Aún no tienes proyectos activos')).not.toBeInTheDocument();
    expect(screen.getByText('Proyecto Sistemas Distribuidos')).toBeInTheDocument();
    expect(screen.getByText('Proyecto Bases de Datos')).toBeInTheDocument();
    expect(screen.getByText(formatDate('2026-10-21T12:00:00Z'))).toBeInTheDocument();
    expect(screen.getByText(formatDate('2026-09-05T12:00:00Z'))).toBeInTheDocument();
  });

  it('calls onSelectProject with the project ID when a card is clicked', () => {
    const onSelectProject = vi.fn();
    render(
      <ProjectsList
        projects={mockProjects}
        loading={false}
        onSelectProject={onSelectProject}
        onOpenCreateModal={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Proyecto Bases de Datos'));

    expect(onSelectProject).toHaveBeenCalledTimes(1);
    expect(onSelectProject).toHaveBeenCalledWith('proj-2');
  });
});
