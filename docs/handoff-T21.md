# Handoff — T21 Resincronización automática de tareas

## 1. Identificador y objetivo
- **ID:** T21 / Issue #21
- **Responsable:** Thomas Hoyos Carmona
- **Fecha:** 2026-10-29
- **Objetivo:** Revalidar silenciosamente las tareas del tablero cuando la pestaña vuelve a estar visible, evitando consultas repetidas durante cinco segundos.

## 2. Estado inicial
- **Rama base:** `main`
- **Rama de trabajo:** `thomashycr-T21` (nombre solicitado: `T21`; el prefijo de ramas del entorno se aplica automáticamente)
- **Estado inicial:** Árbol de trabajo limpio; no había archivos sin confirmar.

## 3. Trabajo realizado
- Se añadió un listener `visibilitychange` en `KanbanBoard`.
- La sincronización solo ocurre al volver a `visible`.
- Se añadió una ventana de protección de cinco segundos basada en la última consulta.
- El listener se elimina al desmontar el componente.
- Se añadieron pruebas para la resincronización, el throttling y la limpieza del listener.

## 4. Archivos modificados
- `src/features/tasks/KanbanBoard.tsx`: listener de visibilidad y protección temporal.
- `src/test/KanbanBoardShortcut.test.tsx`: pruebas del comportamiento de visibilidad.
- `docs/backlog.md`: T21 marcada como completada.
- `docs/handoff-T21.md`: relevo de implementación y validación.

## 5. Validación
| Comando | Resultado |
|---|---|
| `npm run lint` | No ejecutado: `npm` no está disponible en el entorno |
| `npm run test` | No ejecutado: `npm` no está disponible en el entorno |
| `npm run build` | No ejecutado: `npm` no está disponible en el entorno |

## 6. Pendientes
- No se abre PR ni se hace merge, según la solicitud.
