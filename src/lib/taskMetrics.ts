import { Task, TaskStatus } from '../types/database.types';

export type TaskStatusCounts = Record<TaskStatus, number>;

export const emptyTaskStatusCounts = (): TaskStatusCounts => ({
  pending: 0,
  in_progress: 0,
  completed: 0,
});

/**
 * Agrupa tareas por proyecto y cuenta cuántas hay en cada columna (estado).
 * Los estados desconocidos se ignoran.
 */
export const countTasksByProject = (
  tasks: Pick<Task, 'project_id' | 'status'>[]
): Record<string, TaskStatusCounts> => {
  const result: Record<string, TaskStatusCounts> = {};
  for (const task of tasks) {
    if (!(task.status in emptyTaskStatusCounts())) continue;
    if (!result[task.project_id]) {
      result[task.project_id] = emptyTaskStatusCounts();
    }
    result[task.project_id][task.status] += 1;
  }
  return result;
};
