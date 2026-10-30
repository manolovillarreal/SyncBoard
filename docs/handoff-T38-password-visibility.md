# Plantilla de Handoff — SyncBoard

## 1. Identificador y Objetivo de la Tarea
- **ID de Tarea**: T38 (Issue #38)
- **Título**: Botón para alternar visibilidad de contraseña en AuthPage
- **Responsable/Agente**: Juan Sebastian Lopez Martinez (con asistencia de Claude Code)
- **Fecha**: 2026-10-29

---

## 2. Contexto Relevante
- El Issue #38 solicita un botón con icono de ojo (`Eye` / `EyeOff`) en el extremo derecho de los campos de contraseña de `AuthPage` que alterne el atributo `type` entre `password` y `text`.

---

## 3. Estado Real del Repositorio al Comenzar
- **Rama base**: `main`
- **Último commit verificado**: `2d97d8a`
- **Archivos sin confirmar preexistentes**: Ninguno (clon limpio).

---

## 4. Trabajo Realizado
- Se creó el componente local `PasswordInput` en `src/pages/AuthPage.tsx`, que encapsula el icono `Lock`, el input y un botón de visibilidad con estado propio (`visible`).
- El botón alterna `type="password"` / `type="text"` y cambia el icono entre `Eye` (oculto) y `EyeOff` (visible).
- Se reemplazaron los tres inputs de contraseña existentes: inicio de sesión, contraseña de registro y confirmación de contraseña.
- Se añadieron pruebas de componente en `src/test/AuthPagePasswordToggle.test.tsx`.
- Se actualizó `docs/backlog.md` marcando `T38` como *En revisión*.

---

## 5. Archivos Creados / Modificados
- `src/pages/AuthPage.tsx`: Componente `PasswordInput` y su uso en los formularios de login y registro.
- `src/test/AuthPagePasswordToggle.test.tsx`: Pruebas con React Testing Library para el Issue #38.
- `docs/backlog.md`: Estado de la tarea `T38`.
- `docs/handoff-T38-password-visibility.md`: Documento formal de relevo.

---

## 6. Decisiones Técnicas Tomadas
- Cada campo mantiene su propio estado de visibilidad, de modo que mostrar la confirmación no revela la contraseña principal y viceversa.
- El botón usa `type="button"` para no enviar el formulario, `aria-label` dinámico (`Mostrar/Ocultar <campo>`), `aria-pressed` y `aria-controls` enlazado al `id` del input generado con `useId`.
- Se aumentó el `padding-right` del input (`pr-3` → `pr-10`) para que el texto no quede debajo del botón.
- El estado se reinicia (contraseña oculta) al cambiar de pestaña porque el componente se desmonta.

---

## 7. Comandos y Verificaciones Ejecutados
| Comando | Propósito | Resultado Real |
|---|---|---|
| `npm run lint` | Chequeo de tipos TypeScript | Exitoso (código 0) |
| `npm run test` | Suite de pruebas Vitest | 14 pasaron / 0 fallaron (3 archivos) |
| `npm run build` | Compilación de producción Vite | Exitoso (código 0) |

---

## 8. Problemas Encontrados y Soluciones
- Ninguno.

---

## 9. Limitaciones y Pendientes
- El criterio 4 menciona el formulario de recuperación de acceso, pero ese formulario solo contiene el campo de correo electrónico (no hay campo de contraseña), por lo que no aplica.

---

## 10. Rama, Commits y Pull Request
- **Rama de trabajo**: `feat/T38-auth-password-visibility`
- **Commits asociados**: `feat(T38): botón para alternar visibilidad de contraseña en AuthPage`
- **PR**: Contra `main` de `manolovillarreal/SyncBoard`, vinculado al Issue #38.

---

## 11. Pasos Concretos para Continuar
1. Revisar y aprobar el Pull Request asociado a la rama `feat/T38-auth-password-visibility`.
2. Fusionar en `main` tras la validación del pipeline de GitHub Actions.
