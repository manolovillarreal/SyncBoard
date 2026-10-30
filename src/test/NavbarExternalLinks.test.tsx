import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '../components/Navbar';

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@syncboard.edu' },
    profile: { id: 'user-1', display_name: 'Usuario Test', created_at: '2026-10-01T00:00:00Z' },
    signOut: vi.fn(),
    updateDisplayName: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

const renderAndOpenProfile = () => {
  render(<Navbar onGoHome={vi.fn()} onOpenInvitations={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Usuario Test/ }));
};

describe('Navbar - Enlaces al repositorio y documentación (Issue #50)', () => {
  it('muestra el enlace al repositorio de GitHub con atributos de seguridad', () => {
    renderAndOpenProfile();

    const repoLink = screen.getByRole('link', { name: /Repositorio en GitHub/ });
    expect(repoLink).toHaveAttribute('href', 'https://github.com/manolovillarreal/SyncBoard');
    expect(repoLink).toHaveAttribute('target', '_blank');
    expect(repoLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('muestra el enlace secundario a la guía de desarrollo con atributos de seguridad', () => {
    renderAndOpenProfile();

    const docsLink = screen.getByRole('link', { name: /Guía de desarrollo/ });
    expect(docsLink).toHaveAttribute(
      'href',
      'https://github.com/manolovillarreal/SyncBoard/blob/main/docs/development.md'
    );
    expect(docsLink).toHaveAttribute('target', '_blank');
    expect(docsLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('no muestra los enlaces mientras el menú de perfil está cerrado', () => {
    render(<Navbar onGoHome={vi.fn()} onOpenInvitations={vi.fn()} />);

    expect(screen.queryByRole('link', { name: /Repositorio en GitHub/ })).not.toBeInTheDocument();
  });
});
