import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import {
  ActivityFeed,
  ACTIVITY_ACTION_FILTERS,
  ALL_ACTIONS,
} from '../features/activity/ActivityFeed';

type QueryResult = { data: unknown; error: unknown };

const mockLimit = vi.fn<() => Promise<QueryResult>>();
let realtimeCallback: (() => void) | null = null;

const queryBuilder = {
  select: () => queryBuilder,
  eq: () => queryBuilder,
  order: () => queryBuilder,
  limit: () => mockLimit(),
  in: () => Promise.resolve({ data: [], error: null }),
};

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => queryBuilder,
    channel: () => ({
      on: (_event: string, _filter: unknown, cb: () => void) => {
        realtimeCallback = cb;
        return { subscribe: () => ({ id: 'mock-channel' }) };
      },
    }),
    removeChannel: vi.fn(),
  },
}));

const actor = { id: 'user-1', display_name: 'Sebastian' };
const makeLog = (id: string, action: string, details: Record<string, unknown>) => ({
  id,
  project_id: 'proj-1',
  actor_id: 'user-1',
  action,
  task_id: null,
  details,
  created_at: '2026-10-21T12:00:00Z',
  profiles: actor,
});

const logs = [
  makeLog('1', 'task_created', { title: 'Diseñar esquema' }),
  makeLog('2', 'task_created', { title: 'Configurar CI' }),
  makeLog('3', 'task_status_changed', { title: 'Diseñar esquema', new_status: 'completed' }),
  makeLog('4', 'invitation_created', { email: 'ana@upb.edu.co' }),
  makeLog('5', 'project_created', { project_name: 'SyncBoard' }),
];

const getFilter = () => screen.getByLabelText(/filtrar por tipo de acción/i) as HTMLSelectElement;
const visibleEvents = () => screen.getAllByRole('listitem');

describe('ActivityFeed — filtro por tipo de acción (Issue #23)', () => {
  beforeEach(() => {
    mockLimit.mockReset();
    mockLimit.mockResolvedValue({ data: logs, error: null });
    realtimeCallback = null;
  });

  it('muestra todos los eventos por defecto', async () => {
    render(<ActivityFeed projectId="proj-1" />);
    await screen.findByText(/"Configurar CI"/);

    expect(getFilter().value).toBe(ALL_ACTIONS);
    expect(visibleEvents()).toHaveLength(logs.length);
  });

  it('ofrece una opción por cada tipo de acción con su número de eventos', async () => {
    render(<ActivityFeed projectId="proj-1" />);
    await screen.findByText(/"Configurar CI"/);

    const options = within(getFilter()).getAllByRole('option');
    expect(options).toHaveLength(ACTIVITY_ACTION_FILTERS.length + 1);
    expect(screen.getByRole('option', { name: 'Todas las acciones (5)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Tareas creadas (2)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Tareas eliminadas (0)' })).toBeInTheDocument();
  });

  it('muestra solo los eventos del tipo seleccionado', async () => {
    render(<ActivityFeed projectId="proj-1" />);
    await screen.findByText(/"Configurar CI"/);

    fireEvent.change(getFilter(), { target: { value: 'task_created' } });

    expect(visibleEvents()).toHaveLength(2);
    visibleEvents().forEach((item) => expect(item).toHaveTextContent(/creó la tarea/));
    expect(screen.queryByText(/ana@upb\.edu\.co/)).not.toBeInTheDocument();
  });

  it('muestra un estado vacío contextual si no hay eventos de ese tipo', async () => {
    render(<ActivityFeed projectId="proj-1" />);
    await screen.findByText(/"Configurar CI"/);

    fireEvent.change(getFilter(), { target: { value: 'task_deleted' } });

    expect(screen.getByText(/no hay eventos de este tipo/i)).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('"Limpiar filtro" vuelve a mostrar todo el historial', async () => {
    render(<ActivityFeed projectId="proj-1" />);
    await screen.findByText(/"Configurar CI"/);

    expect(screen.queryByRole('button', { name: /limpiar filtro/i })).not.toBeInTheDocument();
    fireEvent.change(getFilter(), { target: { value: 'invitation_created' } });
    expect(visibleEvents()).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: /limpiar filtro/i }));

    expect(getFilter().value).toBe(ALL_ACTIONS);
    expect(visibleEvents()).toHaveLength(logs.length);
  });

  it('mantiene el filtro activo cuando llegan eventos nuevos por Realtime', async () => {
    render(<ActivityFeed projectId="proj-1" />);
    await screen.findByText(/"Configurar CI"/);
    fireEvent.change(getFilter(), { target: { value: 'task_created' } });

    mockLimit.mockResolvedValueOnce({
      data: [makeLog('6', 'task_created', { title: 'Escribir pruebas' }), ...logs],
      error: null,
    });
    realtimeCallback?.();

    expect(await screen.findByText(/"Escribir pruebas"/)).toBeInTheDocument();
    expect(getFilter().value).toBe('task_created');
    expect(visibleEvents()).toHaveLength(3);
  });
});
