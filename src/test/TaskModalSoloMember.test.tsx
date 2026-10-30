import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskModal } from '../features/tasks/TaskModal';
import { ProjectMember } from '../types/database.types';

vi.mock('../lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@syncboard.edu' },
    profile: { id: 'user-1', display_name: 'Usuario Test', created_at: '2026-10-01T00:00:00Z' },
    session: null,
    loading: false,
  }),
}));

const HINT = 'Aún no hay más integrantes en el equipo. Puedes invitar colaboradores desde la configuración.';

const makeMember = (userId: string, name: string, role: ProjectMember['role']): ProjectMember => ({
  project_id: 'proj-1',
  user_id: userId,
  role,
  joined_at: '2026-10-01T00:00:00Z',
  profiles: { id: userId, display_name: name, created_at: '2026-10-01T00:00:00Z' },
});

const owner = makeMember('user-1', 'Usuario Test', 'owner');

const renderModal = (members: ProjectMember[]) =>
  render(
    <TaskModal
      isOpen
      onClose={vi.fn()}
      projectId="proj-1"
      members={members}
      onTaskSaved={vi.fn()}
    />
  );

const getAssigneeSelect = () =>
  screen
    .getAllByRole('combobox')
    .find((select) =>
      Array.from((select as HTMLSelectElement).options).some((opt) => opt.value === 'user-1')
    ) as HTMLSelectElement;

describe('TaskModal nota de equipo sin integrantes - Issue #37', () => {
  it('muestra la nota de orientación cuando el proyecto solo tiene un integrante', () => {
    renderModal([owner]);
    expect(screen.getByText(HINT)).toBeInTheDocument();
  });

  it('permite asignarse a sí mismo cuando es el único integrante', () => {
    renderModal([owner]);
    const select = getAssigneeSelect();
    expect(select).not.toBeDisabled();

    fireEvent.change(select, { target: { value: 'user-1' } });
    expect(select.value).toBe('user-1');
  });

  it('no muestra la nota cuando hay 2 o más integrantes', () => {
    renderModal([owner, makeMember('user-2', 'Compañera', 'member')]);
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
  });
});
