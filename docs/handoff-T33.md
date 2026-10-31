# Handoff T33 — Indicador de progreso del proyecto

## Objetivo
Mostrar en `ProjectDetailPage` el porcentaje de tareas completadas con una barra visual y actualizarlo reactivamente cuando cambia el estado de una tarea.

## Trabajo realizado
- Se añadió el cálculo tipado de tareas completadas, total y porcentaje redondeado.
- Se añadió el indicador visual con Tailwind, color verde esmeralda y estado vacío informativo.
- `KanbanBoard` comunica las métricas derivadas tras cargas, cambios optimistas, rollbacks y eventos Realtime.
- Se añadieron pruebas para 0%, 50%, 100% y el ancho visual del progreso.

## Verificaciones
- `npm run lint`
- `npm run test`
- `npm run build`
