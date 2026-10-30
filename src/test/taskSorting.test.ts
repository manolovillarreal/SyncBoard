import { describe, it, expect } from 'vitest';
import { sortTasks } from '../lib/taskSorting';
import { Task } from '../types/database.types';

const makeTask = (overrides: Partial<Task> & Pick<Task, 'id'>): Task => ({
  project_id: 'proj-1',
  title: overrides.id,
  description: null,
  status: 'pending',
  priority: 'medium',
  assignee_id: null,
  created_by: 'user-1',
  due_date: null,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
  ...overrides,
});

const tasks: Task[] = [
  makeTask({ id: 'a', priority: 'low', due_date: '2026-11-20', created_at: '2026-10-05T00:00:00Z' }),
  makeTask({ id: 'b', priority: 'high', due_date: null, created_at: '2026-10-02T00:00:00Z' }),
  makeTask({ id: 'c', priority: 'medium', due_date: '2026-11-01', created_at: '2026-10-09T00:00:00Z' }),
  makeTask({ id: 'd', priority: 'high', due_date: '2026-11-10', created_at: '2026-10-07T00:00:00Z' }),
  makeTask({ id: 'e', priority: 'low', due_date: null, created_at: '2026-10-08T00:00:00Z' }),
  makeTask({ id: 'f', priority: 'medium', due_date: '2026-11-01', created_at: '2026-10-03T00:00:00Z' }),
];

const ids = (list: Task[]) => list.map((t) => t.id);

describe('sortTasks - Issue #8', () => {
  it('"Más recientes" ordena por fecha de creación descendente', () => {
    expect(ids(sortTasks(tasks, 'recent'))).toEqual(['c', 'e', 'd', 'a', 'f', 'b']);
  });

  it('"Mayor prioridad" coloca high, luego medium y al final low', () => {
    const sorted = sortTasks(tasks, 'priority');
    expect(sorted.map((t) => t.priority)).toEqual(['high', 'high', 'medium', 'medium', 'low', 'low']);
    // Dentro de la misma prioridad desempata por más reciente
    expect(ids(sorted)).toEqual(['d', 'b', 'c', 'f', 'e', 'a']);
  });

  it('"Fecha límite más próxima" coloca primero las fechas cercanas y al final las tareas sin fecha', () => {
    expect(ids(sortTasks(tasks, 'due_date'))).toEqual(['c', 'f', 'd', 'a', 'e', 'b']);
  });

  it('no muta el arreglo original', () => {
    const original = ids(tasks);
    sortTasks(tasks, 'priority');
    expect(ids(tasks)).toEqual(original);
  });

  it('es determinista ante empates totales (desempata por id)', () => {
    const tied = [makeTask({ id: 'z' }), makeTask({ id: 'y' }), makeTask({ id: 'x' })];
    expect(ids(sortTasks(tied, 'due_date'))).toEqual(['x', 'y', 'z']);
  });
});
