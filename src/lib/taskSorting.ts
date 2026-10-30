import { Task, TaskPriority } from '../types/database.types';

export type TaskSortOption = 'recent' | 'priority' | 'due_date';

export const TASK_SORT_LABELS: Record<TaskSortOption, string> = {
  recent: 'Más recientes',
  priority: 'Mayor prioridad',
  due_date: 'Fecha límite más próxima',
};

const PRIORITY_RANK: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const toTime = (dateString: string | null): number | null => {
  if (!dateString) return null;
  const time = new Date(dateString).getTime();
  return Number.isNaN(time) ? null : time;
};

// Desempate común: más recientes primero y, si coinciden, por id para que el orden sea determinista.
const compareByRecent = (a: Task, b: Task): number => {
  const diff = (toTime(b.created_at) ?? 0) - (toTime(a.created_at) ?? 0);
  if (diff !== 0) return diff;
  return a.id.localeCompare(b.id);
};

const compareByPriority = (a: Task, b: Task): number => {
  const diff = (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99);
  return diff !== 0 ? diff : compareByRecent(a, b);
};

const compareByDueDate = (a: Task, b: Task): number => {
  const aDue = toTime(a.due_date);
  const bDue = toTime(b.due_date);

  // Las tareas sin fecha límite van al final.
  if (aDue === null && bDue === null) return compareByRecent(a, b);
  if (aDue === null) return 1;
  if (bDue === null) return -1;

  const diff = aDue - bDue;
  return diff !== 0 ? diff : compareByRecent(a, b);
};

export const getTaskComparator = (option: TaskSortOption): ((a: Task, b: Task) => number) => {
  switch (option) {
    case 'priority':
      return compareByPriority;
    case 'due_date':
      return compareByDueDate;
    case 'recent':
    default:
      return compareByRecent;
  }
};

export const sortTasks = (tasks: Task[], option: TaskSortOption): Task[] =>
  [...tasks].sort(getTaskComparator(option));
