import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ActivityFeed } from '../features/activity/ActivityFeed';

const mockRemoveChannel = vi.fn();
const mockSubscribe = vi.fn().mockReturnValue({ id: 'mock-channel' });
const mockOn = vi.fn();
const mockChannel = vi.fn().mockReturnValue({ on: mockOn });
const mockLimit = vi.fn();
const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
let realtimeCallback:
  | ((payload: { eventType: string; old: { id: string } }) => void)
  | undefined;

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

const activityLogs = [
  {
    id: 'log-1',
    project_id: 'project-1',
    actor_id: null,
    action: 'task_created',
    task_id: null,
    details: { title: 'Tarea conservada' },
    created_at: '2026-10-29T12:00:00Z',
    profiles: null,
  },
  {
    id: 'log-2',
    project_id: 'project-1',
    actor_id: null,
    action: 'task_deleted',
    task_id: null,
    details: { title: 'Tarea eliminada' },
    created_at: '2026-10-29T11:00:00Z',
    profiles: null,
  },
];

describe('ActivityFeed realtime subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLimit.mockResolvedValue({ data: activityLogs, error: null });
    mockOn.mockImplementation(
      (
        _event: string,
        _config: unknown,
        callback: (payload: { eventType: string; old: { id: string } }) => void
      ) => {
        return {
          subscribe: () => {
            mockSubscribe();
            realtimeCallback = callback;
            return { id: 'mock-channel' };
          },
        };
      }
    );
  });

  it('removes a log when a DELETE payload references its old id', async () => {
    render(<ActivityFeed projectId="project-1" />);

    await waitFor(() => {
      expect(screen.getByText(/Tarea conservada/)).toBeInTheDocument();
      expect(screen.getByText(/Tarea eliminada/)).toBeInTheDocument();
    });

    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({ event: '*', table: 'activity_log' }),
      expect.any(Function)
    );

    realtimeCallback?.({
      eventType: 'DELETE',
      old: { id: 'log-2' },
    });

    await waitFor(() => {
      expect(screen.getByText(/Tarea conservada/)).toBeInTheDocument();
      expect(screen.queryByText(/Tarea eliminada/)).not.toBeInTheDocument();
    });
  });
});
