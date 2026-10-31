import React from 'react';
import { TaskProgress } from '../../lib/taskProgress';

interface ProjectProgressProps {
  progress: TaskProgress;
}

export const ProjectProgress: React.FC<ProjectProgressProps> = ({ progress }) => (
  <div className="mt-4 max-w-xl" aria-label="Progreso del proyecto">
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="font-semibold text-slate-600">Progreso de tareas</span>
      <span className="font-bold text-emerald-700">{progress.percentage}%</span>
    </div>
    <div
      className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200"
      role="progressbar"
      aria-label="Porcentaje de tareas completadas"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress.percentage}
    >
      <div
        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
        style={{ width: `${progress.percentage}%` }}
      />
    </div>
    <p className="mt-1.5 text-xs text-slate-500">
      {progress.total === 0
        ? 'Aún no hay tareas registradas.'
        : `${progress.completed} de ${progress.total} tareas completadas`}
    </p>
  </div>
);
