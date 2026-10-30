import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import App, { OFFLINE_BANNER_TEXT, RECONNECTED_TOAST_TEXT } from '../App';

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'simon@test.com' },
    profile: { id: 'user-1', display_name: 'Simon Burgos' },
    loading: false,
    sessionExpiredMsg: null,
    clearSessionMsg: vi.fn(),
  }),
}));

vi.mock('../components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../pages/DashboardPage', () => ({
  DashboardPage: () => <div data-testid="dashboard-page">Dashboard Mock</div>,
}));

vi.mock('../pages/ProjectDetailPage', () => ({
  ProjectDetailPage: () => <div data-testid="project-detail-page">Project Mock</div>,
}));

vi.mock('../lib/supabase', () => {
  const queryBuilder: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockResolvedValue({ count: 0, error: null }),
  };

  return {
    supabase: {
      from: vi.fn().mockReturnValue(queryBuilder),
    },
  };
});

describe('Connectivity Detection and Auto-Reload — Issue #46', () => {
  let addEventListenerSpy: any;
  let removeEventListenerSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('subscribes online and offline event listeners on mount and removes them on unmount', async () => {
    let unmountFn: () => void;
    await act(async () => {
      const { unmount } = render(<App />);
      unmountFn = unmount;
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    act(() => {
      unmountFn();
    });

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('shows yellow warning banner when browser goes offline', async () => {
    await act(async () => {
      render(<App />);
    });

    expect(screen.queryByText(OFFLINE_BANNER_TEXT)).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByText(OFFLINE_BANNER_TEXT)).toBeInTheDocument();
    const banner = screen.getByRole('alert');
    expect(banner).toHaveClass('bg-yellow-400');
  });

  it('hides warning banner and shows reconnected toast when browser goes online', async () => {
    await act(async () => {
      render(<App />);
    });

    // First trigger offline
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByText(OFFLINE_BANNER_TEXT)).toBeInTheDocument();

    // Trigger online
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    // Warning banner should be hidden
    expect(screen.queryByText(OFFLINE_BANNER_TEXT)).not.toBeInTheDocument();

    // Reconnection toast should be visible
    expect(screen.getByText(RECONNECTED_TOAST_TEXT)).toBeInTheDocument();
    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent(RECONNECTED_TOAST_TEXT);
  });
});
