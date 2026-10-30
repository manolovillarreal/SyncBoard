import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivityFeed, ACTIVITY_LOAD_ERROR_MESSAGE } from '../features/activity/ActivityFeed';

type QueryResult = { data: unknown; error: unknown };

// Cada consulta a activity_log termina en .limit(); las respuestas se encolan en orden.
const mockLimit = vi.fn<() => Promise<QueryResult>>();
const mockIn = vi.fn<() => Promise<QueryResult>>();
let realtimeCallback: (() => void) | null = null;

const queryBuilder = {
  select: () => queryBuilder,
  eq: () => queryBuilder,
  order: () => queryBuilder,
  limit: () => mockLimit(),
  in: () => mockIn(),
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

const networkError = { message: 'Failed to fetch' };
const failure: QueryResult = { data: null, error: networkError };

const sampleLog = {
  id: 'log-1',
  project_id: 'proj-1',
  actor_id: 'user-1',
  action: 'task_created',
  task_id: 'task-1',
  details: { title: 'Diseñar esquema' },
  created_at: '2026-10-21T12:00:00Z',
  profiles: { id: 'user-1', display_name: 'Sebastian' },
};

/** Simula un fallo completo: consulta principal y consulta de respaldo. */
const queueFullFailure = () => {
  mockLimit.mockResolvedValueOnce(failure).mockResolvedValueOnce(failure);
};

describe('ActivityFeed — botón de reintento (Issue #18)', () => {
  beforeEach(() => {
    mockLimit.mockReset();
    mockIn.mockReset();
    realtimeCallback = null;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('muestra un mensaje de error con botón Reintentar cuando la carga falla', async () => {
    queueFullFailure();
    render(<ActivityFeed projectId="proj-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(ACTIVITY_LOAD_ERROR_MESSAGE);
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    // El error ya no se confunde con un historial vacío.
    expect(screen.queryByText(/no se ha registrado actividad/i)).not.toBeInTheDocument();
  });

  it('vuelve a consultar y muestra los eventos al reintentar con éxito', async () => {
    queueFullFailure();
    mockLimit.mockResolvedValueOnce({ data: [sampleLog], error: null });
    render(<ActivityFeed projectId="proj-1" />);

    fireEvent.click(await screen.findByRole('button', { name: /reintentar/i }));

    expect(await screen.findByText(/"Diseñar esquema"/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mockLimit).toHaveBeenCalledTimes(3);
  });

  it('deshabilita el botón mientras el reintento está en curso', async () => {
    queueFullFailure();
    let resolveRetry: (value: QueryResult) => void = () => {};
    mockLimit.mockReturnValueOnce(new Promise((resolve) => (resolveRetry = resolve)));
    render(<ActivityFeed projectId="proj-1" />);

    fireEvent.click(await screen.findByRole('button', { name: /reintentar/i }));

    const busyButton = await screen.findByRole('button', { name: /reintentando/i });
    expect(busyButton).toBeDisabled();
    fireEvent.click(busyButton);
    expect(mockLimit).toHaveBeenCalledTimes(3);

    resolveRetry({ data: [], error: null });
    expect(await screen.findByText(/no se ha registrado actividad/i)).toBeInTheDocument();
  });

  it('mantiene el error visible si el reintento también falla', async () => {
    queueFullFailure();
    queueFullFailure();
    render(<ActivityFeed projectId="proj-1" />);

    fireEvent.click(await screen.findByRole('button', { name: /reintentar/i }));

    await waitFor(() => expect(mockLimit).toHaveBeenCalledTimes(4));
    expect(await screen.findByRole('button', { name: /^reintentar$/i })).toBeEnabled();
    expect(screen.getByRole('alert')).toHaveTextContent(ACTIVITY_LOAD_ERROR_MESSAGE);
  });

  it('conserva los eventos ya cargados si falla una recarga por Realtime', async () => {
    mockLimit.mockResolvedValueOnce({ data: [sampleLog], error: null });
    render(<ActivityFeed projectId="proj-1" />);
    expect(await screen.findByText(/"Diseñar esquema"/)).toBeInTheDocument();

    queueFullFailure();
    realtimeCallback?.();

    expect(await screen.findByRole('alert')).toHaveTextContent(ACTIVITY_LOAD_ERROR_MESSAGE);
    expect(screen.getByText(/"Diseñar esquema"/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});
