import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateProjectModal } from '../features/projects/CreateProjectModal';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

describe('CreateProjectModal — Issue #12 (Prevención de doble clic y spinner)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with inputs and enabled submit button initially', () => {
    render(
      <CreateProjectModal
        isOpen={true}
        onClose={vi.fn()}
        onProjectCreated={vi.fn()}
      />
    );

    const nameInput = screen.getByPlaceholderText(/ej. Taller 1/i);
    const descInput = screen.getByPlaceholderText(/Objetivos, entregables/i);
    const submitBtn = screen.getByRole('button', { name: /Crear Proyecto/i });

    expect(nameInput).toBeInTheDocument();
    expect(nameInput).not.toBeDisabled();
    expect(descInput).not.toBeDisabled();
    expect(submitBtn).not.toBeDisabled();
  });

  it('disables submit button and inputs, shows spinner and "Creando proyecto..." while loading', async () => {
    let resolveRpc: (value: any) => void;
    const rpcPromise = new Promise((resolve) => {
      resolveRpc = resolve;
    });

    vi.mocked(supabase.rpc).mockReturnValue(rpcPromise as any);

    const onClose = vi.fn();
    const onProjectCreated = vi.fn();

    render(
      <CreateProjectModal
        isOpen={true}
        onClose={onClose}
        onProjectCreated={onProjectCreated}
      />
    );

    const nameInput = screen.getByPlaceholderText(/ej. Taller 1/i);
    const descInput = screen.getByPlaceholderText(/Objetivos, entregables/i);
    const submitBtn = screen.getByRole('button', { name: /Crear Proyecto/i });

    fireEvent.change(nameInput, { target: { value: 'Nuevo Proyecto Distribuido' } });
    fireEvent.change(descInput, { target: { value: 'Descripción válida del proyecto' } });

    fireEvent.click(submitBtn);

    // Verification during loading
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Creando proyecto\.\.\./i })).toBeInTheDocument();
    });

    const loadingBtn = screen.getByRole('button', { name: /Creando proyecto\.\.\./i });
    expect(loadingBtn).toBeDisabled();
    expect(nameInput).toBeDisabled();
    expect(descInput).toBeDisabled();

    // Fast second click during loading does not trigger a second RPC call
    fireEvent.click(loadingBtn);
    expect(supabase.rpc).toHaveBeenCalledTimes(1);

    // Resolve RPC call
    resolveRpc!({ data: 'new-proj-123', error: null });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
      expect(onProjectCreated).toHaveBeenCalledWith('new-proj-123');
    });
  });

  it('restores interactive state if RPC fails with an error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'Database connection failed' },
    } as any);

    render(
      <CreateProjectModal
        isOpen={true}
        onClose={vi.fn()}
        onProjectCreated={vi.fn()}
      />
    );

    const nameInput = screen.getByPlaceholderText(/ej. Taller 1/i);
    fireEvent.change(nameInput, { target: { value: 'Proyecto Fallido' } });

    const submitBtn = screen.getByRole('button', { name: /Crear Proyecto/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    });

    // Inputs and submit button should be re-enabled
    const reEnabledBtn = screen.getByRole('button', { name: /Crear Proyecto/i });
    expect(reEnabledBtn).not.toBeDisabled();
    expect(nameInput).not.toBeDisabled();
  });
});
