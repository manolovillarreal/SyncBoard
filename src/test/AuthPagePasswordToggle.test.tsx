import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthPage } from '../pages/AuthPage';

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: () => ({
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    resetPassword: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

// Obtiene el input controlado por el botón de visibilidad mediante aria-controls
const getControlledInput = (toggle: HTMLElement): HTMLInputElement => {
  const inputId = toggle.getAttribute('aria-controls');
  const input = inputId ? document.getElementById(inputId) : null;
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('El botón no controla ningún input');
  }
  return input;
};

describe('AuthPage - Alternar visibilidad de contraseña (Issue #38)', () => {
  it('alterna el type del input de contraseña en el formulario de inicio de sesión', () => {
    render(<AuthPage />);

    const toggle = screen.getByRole('button', { name: 'Mostrar contraseña' });
    const input = getControlledInput(toggle);
    expect(input).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    expect(toggle).toHaveAttribute('aria-label', 'Ocultar contraseña');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(toggle);
    expect(input).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('aria-label', 'Mostrar contraseña');
  });

  it('el botón de visibilidad no envía el formulario', () => {
    render(<AuthPage />);

    const toggle = screen.getByRole('button', { name: 'Mostrar contraseña' });
    expect(toggle).toHaveAttribute('type', 'button');
  });

  it('alterna de forma independiente contraseña y confirmación en el registro', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Registrarse' }));

    const passwordToggle = screen.getByRole('button', { name: 'Mostrar contraseña' });
    const confirmToggle = screen.getByRole('button', { name: 'Mostrar confirmación de contraseña' });
    const passwordInput = getControlledInput(passwordToggle);
    const confirmInput = getControlledInput(confirmToggle);

    expect(passwordInput).not.toBe(confirmInput);
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmInput).toHaveAttribute('type', 'password');

    fireEvent.click(confirmToggle);
    expect(confirmInput).toHaveAttribute('type', 'text');
    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(passwordToggle);
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('conserva el valor escrito al alternar la visibilidad', () => {
    render(<AuthPage />);

    const toggle = screen.getByRole('button', { name: 'Mostrar contraseña' });
    const input = getControlledInput(toggle);
    fireEvent.change(input, { target: { value: 'secreta123' } });

    fireEvent.click(toggle);
    expect(input).toHaveValue('secreta123');
  });
});
