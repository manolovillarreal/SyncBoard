import { describe, it, expect, expectTypeOf } from 'vitest';
import { ActivityAction, ActivityLog } from '../types/database.types';

// Estas comprobaciones de tipos se validan con `npm run lint` (tsc --noEmit incluye src/test)
describe('Tipos estrictos del modelo de datos (Issue #30)', () => {
  it('ActivityLog.action usa el tipo literal ActivityAction', () => {
    expectTypeOf<ActivityLog['action']>().toEqualTypeOf<ActivityAction>();
  });

  it('ActivityAction solo admite las acciones de auditoría soportadas', () => {
    const supported: ActivityAction[] = [
      'project_created',
      'project_deleted',
      'task_created',
      'task_updated',
      'task_status_changed',
      'task_deleted',
      'invitation_created',
      'member_joined',
    ];
    expect(new Set(supported).size).toBe(8);

    // @ts-expect-error: una acción no soportada debe ser rechazada por el compilador
    const invalid: ActivityAction = 'project_renamed';
    expect(supported).not.toContain(invalid);
  });
});
