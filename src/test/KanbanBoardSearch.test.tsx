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
  buildTask({ id: 't1', title: 'Diseñar esquema relacional', status: 'pending', priority: 'high' }),
  buildTask({ id: 't2', title: 'Implementar login', status: 'in_progress' }),
  buildTask({ id: 't3', title: 'Revisión del DISEÑO de la interfaz', status: 'completed', priority: 'low' }),
];

const mockMembers: ProjectMember[] = [
  {
    project_id: 'proj-1',
    user_id: 'user-1',
    role: 'owner',
    joined_at: '2026-10-01T00:00:00Z',
    profiles: { id: 'user-1', display_name: 'Usuario Test', created_at: '2026-10-01T00:00:00Z' },
  },
];

describe('KanbanBoard - Filtro de búsqueda por texto en títulos - Issue #4', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrder.mockResolvedValue({ data: mockTasks, error: null });
  });

  it('filtra las tareas cuyo título contiene el texto, sin distinguir mayúsculas', async () => {
    render(<KanbanBoard projectId="proj-1" members={mockMembers} />);

    await waitFor(() => {
      expect(screen.getByText('Implementar login')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/buscar tareas por título/i), { target: { value: 'diseñ' } });

    expect(screen.getByText('Diseñar esquema relacional')).toBeInTheDocument();
    expect(screen.getByText('Revisión del DISEÑO de la interfaz')).toBeInTheDocument();
    expect(screen.queryByText('Implementar login')).not.toBeInTheDocument();
  });

  it('ignora espacios al inicio y al final del texto buscado', async () => {
    render(<KanbanBoard projectId="proj-1" members={mockMembers} />);

    await waitFor(() => {
      expect(screen.getByText('Implementar login')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/buscar tareas por título/i), { target: { value: '  login  ' } });

    expect(screen.getByText('Implementar login')).toBeInTheDocument();
    expect(screen.queryByText('Diseñar esquema relacional')).not.toBeInTheDocument();
  });

  it('si ninguna tarea coincide, las columnas muestran el estado vacío', async () => {
    render(<KanbanBoard projectId="proj-1" members={mockMembers} />);

    await waitFor(() => {
      expect(screen.getByText('Implementar login')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/buscar tareas por título/i), { target: { value: 'xyz-inexistente' } });

    expect(screen.queryByText('Implementar login')).not.toBeInTheDocument();
    expect(screen.getAllByText('Sin tareas en esta etapa')).toHaveLength(3);
  });

  it('"Limpiar filtros" borra la búsqueda y restaura todas las tareas', async () => {
    render(<KanbanBoard projectId="proj-1" members={mockMembers} />);

    await waitFor(() => {
      expect(screen.getByText('Implementar login')).toBeInTheDocument();
    });

    expect(screen.queryByText(/limpiar filtros/i)).not.toBeInTheDocument();

    const input = screen.getByLabelText(/buscar tareas por título/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'login' } });
    expect(screen.queryByText('Diseñar esquema relacional')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/limpiar filtros/i));

    expect(input.value).toBe('');
    expect(screen.getByText('Diseñar esquema relacional')).toBeInTheDocument();
    expect(screen.getByText('Revisión del DISEÑO de la interfaz')).toBeInTheDocument();
    expect(screen.queryByText(/limpiar filtros/i)).not.toBeInTheDocument();
  });

  it('muestra un botón que limpia el texto de búsqueda con un solo clic', async () => {
    render(<KanbanBoard projectId="proj-1" members={mockMembers} />);

    await waitFor(() => {
      expect(screen.getByText('Implementar login')).toBeInTheDocument();
    });

    // Sin texto no hay botón de limpiar
    expect(screen.queryByRole('button', { name: /limpiar búsqueda/i })).not.toBeInTheDocument();

    const input = screen.getByLabelText(/buscar tareas por título/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'login' } });
    expect(screen.queryByText('Diseñar esquema relacional')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /limpiar búsqueda/i }));

    expect(input.value).toBe('');
    expect(screen.getByText('Diseñar esquema relacional')).toBeInTheDocument();
    expect(screen.getByText('Implementar login')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /limpiar búsqueda/i })).not.toBeInTheDocument();
  });

  it('se combina con el filtro de prioridad y al vaciar el input se restablecen las tareas que cumplen los demás filtros', async () => {
    render(<KanbanBoard projectId="proj-1" members={mockMembers} />);

    await waitFor(() => {
      expect(screen.getByText('Implementar login')).toBeInTheDocument();
    });

    const prioritySelect = (screen.getAllByRole('combobox') as HTMLSelectElement[]).find((select) =>
      Array.from(select.options).some((opt) => opt.value === 'high')
    ) as HTMLSelectElement;
    fireEvent.change(prioritySelect, { target: { value: 'high' } });

    // Solo la tarea de prioridad alta
    expect(screen.getByText('Diseñar esquema relacional')).toBeInTheDocument();
    expect(screen.queryByText('Revisión del DISEÑO de la interfaz')).not.toBeInTheDocument();

    // Búsqueda + prioridad: "diseñ" coincide con dos títulos, pero solo uno es de prioridad alta
    const input = screen.getByLabelText(/buscar tareas por título/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'diseñ' } });
    expect(screen.getByText('Diseñar esquema relacional')).toBeInTheDocument();
    expect(screen.queryByText('Revisión del DISEÑO de la interfaz')).not.toBeInTheDocument();

    // Al vaciar el input se restablece lo que cumple el filtro de prioridad (no todas las tareas)
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByText('Diseñar esquema relacional')).toBeInTheDocument();
    expect(screen.queryByText('Implementar login')).not.toBeInTheDocument();
    expect(screen.queryByText('Revisión del DISEÑO de la interfaz')).not.toBeInTheDocument();
  });
});
