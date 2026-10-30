import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Toast } from '../components/Toast';

describe('Toast - Notificación temporal (Issue #10)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('aparece con el mensaje de éxito y se cierra automáticamente a los 3 segundos', () => {
    const onClose = vi.fn();
    render(<Toast message='Tarea "Diseñar BD" movida a En progreso.' type="success" onClose={onClose} />);

    expect(screen.getByRole('status')).toHaveTextContent('Tarea "Diseñar BD" movida a En progreso.');

    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('se cierra inmediatamente al pulsar el botón de cierre', () => {
    const onClose = vi.fn();
    render(<Toast message="Mensaje" onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /cerrar notificación/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('muestra los errores como alerta con el motivo', () => {
    render(<Toast message="No se pudo mover la tarea: permiso denegado" type="error" onClose={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent('permiso denegado');
  });
});
