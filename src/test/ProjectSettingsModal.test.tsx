import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectSettingsModal } from '../features/projects/ProjectSettingsModal';
import { Project } from '../types/database.types';

const mockAuthUserId = vi.hoisted(() => ({ current: 'user-1' }));

const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });
const mockMembersEq = vi.fn().mockResolvedValue({ data: [], error: null });
const mockSelect = vi.fn().mockReturnValue({ eq: mockMembersEq });
const mockFrom = vi.fn().mockImplementation(() => ({ select: mockSelect, update: mockUpdate }));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: vi.fn(),
  },
}));

vi.mock('../features/auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: mockAuthUserId.current, email: 'test@syncboard.edu' },
    profile: { id: mockAuthUserId.current, display_name: 'Usuario Test', created_at: '2026-10-01T00:00:00Z' },
    session: null,
    loading: false,
  }),
}));

const mockProject: Project = {
  id: 'proj-1',
  name: 'Proyecto Sistemas Distribuidos',
  description: 'Tablero del curso',
  owner_id: 'user-1',
  created_at: '2026-10-21T12:00:00Z',
  updated_at: '2026-10-21T12:00:00Z',
  deleted_at: null,
};

const renderModal = (overrides: { onProjectUpdated?: () => void; onClose?: () => void } = {}) =>
  render(
    <ProjectSettingsModal
      project={mockProject}
      isOpen={true}
      onClose={overrides.onClose ?? vi.fn()}
      onProjectUpdated={overrides.onProjectUpdated ?? vi.fn()}
      onProjectDeleted={vi.fn()}
      onOpenInviteMember={vi.fn()}
    />
  );

const getNameInput = () => screen.getByDisplayValue(mockProject.name) as HTMLInputElement;
const getDescriptionInput = () =>
  screen.getByDisplayValue(mockProject.description as string) as HTMLTextAreaElement;

describe('ProjectSettingsModal editing - Issue #49', () => {
  beforeEach(() => {
    mockAuthUserId.current = 'user-1';
    mockUpdateEq.mockResolvedValue({ error: null });
    mockMembersEq.mockResolvedValue({ data: [], error: null });
  });

  it('fills the inputs with the initial project name and description', async () => {
    renderModal();

    expect(getNameInput().value).toBe('Proyecto Sistemas Distribuidos');
    expect(getDescriptionInput().value).toBe('Tablero del curso');

    await waitFor(() => expect(mockMembersEq).toHaveBeenCalledWith('project_id', 'proj-1'));
  });

  it('updates the project in Supabase when the owner edits the name and submits', async () => {
    const onProjectUpdated = vi.fn();
    const onClose = vi.fn();
    renderModal({ onProjectUpdated, onClose });

    fireEvent.change(getNameInput(), { target: { value: '  Proyecto Renombrado  ' } });
    fireEvent.click(screen.getByRole('button', { name: /actualizar información/i }));

    await waitFor(() => expect(onProjectUpdated).toHaveBeenCalled());

    expect(mockFrom).toHaveBeenCalledWith('projects');
    expect(mockUpdate).toHaveBeenCalledWith({
      name: 'Proyecto Renombrado',
      description: 'Tablero del curso',
    });
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'proj-1');
    expect(onProjectUpdated).toHaveBeenCalledWith({
      name: 'Proyecto Renombrado',
      description: 'Tablero del curso',
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('disables the fields and hides the submit button when the user is not the owner', async () => {
    mockAuthUserId.current = 'user-2';
    renderModal();

    expect(getNameInput()).toBeDisabled();
    expect(getDescriptionInput()).toBeDisabled();
    expect(screen.queryByRole('button', { name: /actualizar información/i })).not.toBeInTheDocument();

    await waitFor(() => expect(mockMembersEq).toHaveBeenCalled());
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('keeps the fields enabled for the owner', async () => {
    renderModal();

    expect(getNameInput()).toBeEnabled();
    expect(getDescriptionInput()).toBeEnabled();

    await waitFor(() => expect(mockMembersEq).toHaveBeenCalled());
  });
});
