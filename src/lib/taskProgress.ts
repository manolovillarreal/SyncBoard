import { Task } from '../types/database.types';

export interface TaskProgress {
  completed: number;
  total: number;
  percentage: number;
}

export const calculateTaskProgress = (tasks: Task[]): TaskProgress => {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === 'completed').length;

  return {
    completed,
    total,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
};
