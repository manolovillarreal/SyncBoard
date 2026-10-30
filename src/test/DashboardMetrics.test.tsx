import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { DashboardPage } from '../pages/DashboardPage';

const mockInTasks = vi.fn();
const mockEqMembers = vi.fn();

const mockFrom = vi.fn((table: string) => {
  if (table === 'project_members') {
    return { select: () => ({ eq: (...args: unknown[]) => mockEqMembers(...args) }) };
  }
  if (table === 'tasks') {
    return { select: () => ({ in: (...args: unknown[]) => mockInTasks(...args) }) };
  }
  throw new Error(`Tabla inesperada: ${table}`);
});

vi.mock('../lib/supabase', () => ({
  supabase: { from: (table: string) => mockFrom(table) },
}));

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@syncboard.edu' },
    profile: { id: 'user-1', display_name: 'Usuario Test', created_at: '2026-10-01T00:00:00Z' },
    session: null,
    loading: false,
  }),
}));

const projectRow = (id: string, name: string, createdAt: string) => ({
  project_id: id,
  role: 'owner',
  projects: {
    id,
    name,
    description: null,
    owner_id: 'user-1',
    created_at: createdAt,
    updated_at: createdAt,
    deleted_at: null,
  },
});

const renderDashboard = () =>
  render(
    <DashboardPage
      onSelectProject={vi.fn()}
      pendingInvitationsCount={0}
      onOpenInvitations={vi.fn()}
    />
  );

describe('DashboardPage - Resumen de métricas de tareas por columna - Issue #36', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEqMembers.mockResolvedValue({
      data: [
        projectRow('proj-1', 'Proyecto Uno', '2026-10-02T00:00:00Z'),
        projectRow('proj-2', 'Proyecto Dos', '2026-10-01T00:00:00Z'),
      ],
      error: null,
    });
    mockInTasks.mockResolvedValue({
      data: [
        { project_id: 'proj-1', status: 'pending' },
        { project_id: 'proj-1', status: 'pending' },
        { project_id: 'proj-1', status: 'in_progress' },
        { project_id: 'proj-1', status: 'completed' },
      ],
      error: null,
    });
  });

  it('muestra en cada tarjeta el número de tareas por columna', async () => {
    renderDashboard();

    const metrics1 = await screen.findByTestId('project-metrics-proj-1');
    expect(within(metrics1).getByText('Pendiente').nextSibling).toHaveTextContent('2');
    expect(within(metrics1).getByText('En progreso').nextSibling).toHaveTextContent('1');
    expect(within(metrics1).getByText('Completada').nextSibling).toHaveTextContent('1');

    // Proyecto sin tareas: los tres contadores en cero
    const metrics2 = screen.getByTestId('project-metrics-proj-2');
    expect(within(metrics2).getByText('Pendiente').nextSibling).toHaveTextContent('0');
    expect(within(metrics2).getByText('En progreso').nextSibling).toHaveTextContent('0');
    expect(within(metrics2).getByText('Completada').nextSibling).toHaveTextContent('0');

    expect(mockInTasks).toHaveBeenCalledWith('project_id', ['proj-1', 'proj-2']);
  });

  it('si fallan las métricas, la lista de proyectos se sigue mostrando sin contadores', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockInTasks.mockResolvedValue({ data: null, error: new Error('fallo de red') });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Proyecto Uno')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('project-metrics-proj-1')).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
