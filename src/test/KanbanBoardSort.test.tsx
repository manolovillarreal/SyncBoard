import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

const mockMembers: ProjectMember[] = [
  {
    project_id: 'proj-1',
    user_id: 'user-1',
    role: 'owner',
    joined_at: '2026-10-01T00:00:00Z',
    profiles: { id: 'user-1', display_name: 'Usuario Test', created_at: '2026-10-01T00:00:00Z' },
  },
];

const makeTask = (id: string, overrides: Partial<Task>): Task => ({
  id,
  project_id: 'proj-1',
  title: `Tarea ${id}`,
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

// Llegan ordenadas por created_at descendente, como las devuelve Supabase.
const mockTasks: Task[] = [
  makeTask('A', { priority: 'low', due_date: '2026-11-03', created_at: '2026-10-03T00:00:00Z' }),
  makeTask('B', { priority: 'medium', due_date: null, created_at: '2026-10-02T00:00:00Z' }),
  makeTask('C', { priority: 'high', due_date: '2026-11-05', created_at: '2026-10-01T00:00:00Z' }),
];

// Todas las tareas de prueba están en la columna "Pendiente".
const getPendingTitles = () => screen.getAllByText(/^Tarea [ABC]$/).map((el) => el.textContent);

describe('KanbanBoard selector de ordenamiento - Issue #8', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrder.mockResolvedValue({ data: mockTasks, error: null });
  });

  it('muestra las tres opciones de ordenamiento', async () => {
    render(<KanbanBoard projectId="proj-1" members={mockMembers} />);
    const select = await screen.findByRole('combobox', { name: /ordenar tareas/i });
    const labels = Array.from((select as HTMLSelectElement).options).map((o) => o.textContent);
    expect(labels).toEqual(['Más recientes', 'Mayor prioridad', 'Fecha límite más próxima']);
  });

  it('actualiza el orden visual de las tarjetas al cambiar la opción', async () => {
    render(<KanbanBoard projectId="proj-1" members={mockMembers} />);

    await waitFor(() => {
      expect(getPendingTitles()).toEqual(['Tarea A', 'Tarea B', 'Tarea C']);
    });

    const select = screen.getByRole('combobox', { name: /ordenar tareas/i });

    fireEvent.change(select, { target: { value: 'priority' } });
    expect(getPendingTitles()).toEqual(['Tarea C', 'Tarea B', 'Tarea A']);

    fireEvent.change(select, { target: { value: 'due_date' } });
    expect(getPendingTitles()).toEqual(['Tarea A', 'Tarea C', 'Tarea B']);

    fireEvent.change(select, { target: { value: 'recent' } });
    expect(getPendingTitles()).toEqual(['Tarea A', 'Tarea B', 'Tarea C']);
  });

  it('mantiene el orden seleccionado al recibir un evento Realtime', async () => {
    render(<KanbanBoard projectId="proj-1" members={mockMembers} />);

    await waitFor(() => {
      expect(getPendingTitles()).toHaveLength(3);
    });

    fireEvent.change(screen.getByRole('combobox', { name: /ordenar tareas/i }), {
      target: { value: 'priority' },
    });
    expect(getPendingTitles()).toEqual(['Tarea C', 'Tarea B', 'Tarea A']);

    // Otro usuario sube la prioridad de la tarea A a 'high' (llega por Realtime).
    const realtimeHandler = mockOn.mock.calls[0][2] as (payload: unknown) => void;
    act(() => {
      realtimeHandler({
        eventType: 'UPDATE',
        new: { ...mockTasks[0], priority: 'high' },
        old: { id: 'A' },
      });
    });

    // A (high, más reciente) pasa delante de C (high).
    expect(getPendingTitles()).toEqual(['Tarea A', 'Tarea C', 'Tarea B']);
  });
});
