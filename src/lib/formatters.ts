import { TaskPriority, TaskStatus } from '../types/database.types';

export const formatStatus = (status: TaskStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'in_progress':
      return 'En progreso';
    case 'completed':
      return 'Completada';
    default:
      return status;
  }
};

export const formatPriority = (priority: TaskPriority): string => {
  switch (priority) {
    case 'low':
      return 'Baja';
    case 'medium':
      return 'Media';
    case 'high':
      return 'Alta';
    default:
      return priority;
  }
};

export const getPriorityBadgeClass = (priority: TaskPriority): string => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'medium':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'low':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const pluralize = (value: number, singular: string, plural: string): string =>
  `hace ${value} ${value === 1 ? singular : plural}`;

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  // Diferencias negativas (relojes desfasados entre cliente y servidor) se tratan como "ahora".
  const diffMs = Math.max(0, Date.now() - date.getTime());

  if (diffMs < MINUTE_MS) return 'hace un momento';
  if (diffMs < HOUR_MS) return pluralize(Math.floor(diffMs / MINUTE_MS), 'minuto', 'minutos');
  if (diffMs < DAY_MS) return pluralize(Math.floor(diffMs / HOUR_MS), 'hora', 'horas');
  if (diffMs < 30 * DAY_MS) return pluralize(Math.floor(diffMs / DAY_MS), 'día', 'días');

  return formatDate(dateString);
};
