import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InviteMemberModal } from '../features/invitations/InviteMemberModal';
import { EMAIL_FORMAT_ERROR } from '../lib/validators';

const mockInvoke = vi.fn();
const mockFrom = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
    from: (...args: unknown[]) => mockFrom(...args),
    auth: { getUser: vi.fn() },
  },
}));

describe('InviteMemberModal - Validación de correo (Issue #17)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra un error específico y no llama a la red si el formato es inválido', () => {
    render(<InviteMemberModal isOpen onClose={vi.fn()} projectId="proj-1" projectName="Proyecto" />);

    fireEvent.change(screen.getByPlaceholderText('companero@universidad.edu'), {
      target: { value: 'usuario@dominio' },
    });
    fireEvent.click(screen.getByRole('button', { name: /registrar invitación/i }));

    expect(screen.getByText(EMAIL_FORMAT_ERROR)).toBeInTheDocument();
    expect(mockInvoke).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
