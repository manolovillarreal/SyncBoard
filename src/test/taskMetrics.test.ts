import { describe, it, expect } from 'vitest';
import { countTasksByProject, emptyTaskStatusCounts } from '../lib/taskMetrics';

describe('countTasksByProject - Issue #36', () => {
  it('devuelve un objeto vacío cuando no hay tareas', () => {
    expect(countTasksByProject([])).toEqual({});
  });

  it('cuenta las tareas por proyecto y por estado', () => {
    const result = countTasksByProject([
      { project_id: 'a', status: 'pending' },
      { project_id: 'a', status: 'pending' },
      { project_id: 'a', status: 'in_progress' },
      { project_id: 'a', status: 'completed' },
      { project_id: 'b', status: 'completed' },
    ]);

    expect(result.a).toEqual({ pending: 2, in_progress: 1, completed: 1 });
    expect(result.b).toEqual({ pending: 0, in_progress: 0, completed: 1 });
  });

  it('ignora estados desconocidos', () => {
    const result = countTasksByProject([
      { project_id: 'a', status: 'archived' as never },
      { project_id: 'a', status: 'pending' },
    ]);

    expect(result.a).toEqual({ pending: 1, in_progress: 0, completed: 0 });
  });

  it('emptyTaskStatusCounts devuelve contadores en cero e independientes', () => {
    const first = emptyTaskStatusCounts();
    first.pending = 5;
    expect(emptyTaskStatusCounts()).toEqual({ pending: 0, in_progress: 0, completed: 0 });
  });
});
