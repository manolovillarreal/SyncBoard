import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KanbanColumn } from '../features/tasks/KanbanColumn';

const baseProps = {
  status: 'pending' as const,
  title: 'Pendiente',
  tasks: [],
  members: [],
  onAddTask: vi.fn(),
  onEditTask: vi.fn(),
  onDeleteTask: vi.fn(),
  onStatusChange: vi.fn(),
  colorScheme: 'slate' as const,
};

describe('KanbanColumn - Estado vacío contextual (Issue #5)', () => {
  it('muestra el mensaje de filtros y "Limpiar filtros" cuando hay tareas ocultas por los filtros', () => {
    const onClearFilters = vi.fn();
    render(<KanbanColumn {...baseProps} totalTasksCount={3} onClearFilters={onClearFilters} />);

    expect(screen.getByText('No hay tareas que coincidan con los filtros aplicados')).toBeInTheDocument();
    expect(screen.queryByText('Sin tareas en esta etapa')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^añadir tarea$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /limpiar filtros/i }));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('muestra "Sin tareas en esta etapa" y el botón de añadir cuando la columna está realmente vacía', () => {
    const onAddTask = vi.fn();
    render(<KanbanColumn {...baseProps} onAddTask={onAddTask} totalTasksCount={0} onClearFilters={vi.fn()} />);

    expect(screen.getByText('Sin tareas en esta etapa')).toBeInTheDocument();
    expect(screen.queryByText('No hay tareas que coincidan con los filtros aplicados')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^añadir tarea$/i }));
    expect(onAddTask).toHaveBeenCalledWith('pending');
  });
});
