import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KanbanBoard } from '../features/tasks/KanbanBoard';
import { ProjectMember, Task } from '../types/database.types';

const mockRemoveChannel = vi.fn();
const mockSubscribe = vi.fn().mockReturnValue({ id: 'mock-channel' });
const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe });
const mockChannel = vi.fn().mockReturnValue({ on: mockOn });

const mockOrder = vi.fn();
const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@syncboard.edu' },
    profile: { id: 'user-1', display_name: 'Usuario Test', created_at: '2026-10-01T00:00:00Z' },
    session: null,
    loading: false,
  }),
}));

const buildTask = (overrides: Partial<Task>): Task => ({
  id: 'task-x',
  project_id: 'proj-1',
  title: 'Tarea',
  description: null,
  status: 'pending',
  priority: 'medium',
  assignee_id: null,
  created_by: 'user-1',
  due_date: null,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
  ...overrides,
});

const mockTasks: Task[] = [
  buildTask({ id: 't1', title: 'Tarea mía pendiente', assignee_id: 'user-1', status: 'pending' }),
  buildTask({ id: 't2', title: 'Tarea de otro integrante', assignee_id: 'user-2', status: 'in_progress' }),
  buildTask({ id: 't3', title: 'Tarea sin asignar', assignee_id: null, status: 'pending' }),
  buildTask({ id: 't4', title: 'Tarea mía completada', assignee_id: 'user-1', status: 'completed' }),
];

const mockMembers: ProjectMember[] = [
  {
    project_id: 'proj-1',
    user_id: 'user-1',
    role: 'owner',
    joined_at: '2026-10-01T00:00:00Z',
    profiles: { id: 'user-1', display_name: 'Usuario Test', created_at: '2026-10-01T00:00:00Z' },
  },
  {
    project_id: 'proj-1',
    user_id: 'user-2',
    role: 'member',
    joined_at: '2026-10-01T00:00:00Z',
    profiles: { id: 'user-2', display_name: 'Otro Integrante', created_at: '2026-10-01T00:00:00Z' },
  },
];

describe('KanbanBoard - Contador y filtro rápido "Mis tareas" - Issue #44', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrder.mockResolvedValue({ data: mockTasks, error: null });
  });

  it('muestra el contador con las tareas asignadas al usuario actual', async () => {
    render(<KanbanBoard projectId="proj-1" members={mockMembers} />);

    await waitFor(() => {
      expect(screen.getByText('Tarea mía pendiente')).toBeInTheDocument();
    });

    expect(screen.getByTestId('my-tasks-count')).toHaveTextContent('2');
  });

  it('al activar el filtro solo muestra las tareas del usuario y al desactivarlo las restaura', async () => {
    render(<KanbanBoard projectId="proj-1" members={mockMembers} />);

    await waitFor(() => {
      expect(screen.getByText('Tarea mía pendiente')).toBeInTheDocument();
    });

    const toggle = screen.getByRole('button', { name: /mis tareas/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Tarea mía pendiente')).toBeInTheDocument();
    expect(screen.getByText('Tarea mía completada')).toBeInTheDocument();
    expect(screen.queryByText('Tarea de otro integrante')).not.toBeInTheDocument();
    expect(screen.queryByText('Tarea sin asignar')).not.toBeInTheDocument();
    // El contador refleja siempre el total de tareas del usuario, no el resultado filtrado
    expect(screen.getByTestId('my-tasks-count')).toHaveTextContent('2');

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Tarea de otro integrante')).toBeInTheDocument();
    expect(screen.getByText('Tarea sin asignar')).toBeInTheDocument();
  });

  it('"Limpiar filtros" desactiva el filtro Mis tareas', async () => {
    render(<KanbanBoard projectId="proj-1" members={mockMembers} />);

    await waitFor(() => {
      expect(screen.getByText('Tarea mía pendiente')).toBeInTheDocument();
    });

    expect(screen.queryByText(/limpiar filtros/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /mis tareas/i }));
    expect(screen.queryByText('Tarea sin asignar')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/limpiar filtros/i));

    expect(screen.getByRole('button', { name: /mis tareas/i })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Tarea sin asignar')).toBeInTheDocument();
    expect(screen.queryByText(/limpiar filtros/i)).not.toBeInTheDocument();
  });
});
