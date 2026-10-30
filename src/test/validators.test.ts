import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  normalizeEmail,
  validateProjectInput,
  validateTaskInput,
  getTodayDateString,
} from '../lib/validators';
import { formatStatus, formatPriority, formatDate } from '../lib/formatters';

describe('Validators Unit Tests', () => {
  it('validates email addresses correctly', () => {
    expect(isValidEmail('estudiante@universidad.edu')).toBe(true);
    expect(isValidEmail('usuario.prueba@dominio.com')).toBe(true);
    expect(isValidEmail('correo-invalido')).toBe(false);
    expect(isValidEmail('sin-arroba.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('normalizes email addresses to lowercase and trims spaces', () => {
    expect(normalizeEmail('  Estudiante@Universidad.EDU  ')).toBe('estudiante@universidad.edu');
  });

  it('validates project input', () => {
    expect(validateProjectInput('').valid).toBe(false);
    expect(validateProjectInput('ab').valid).toBe(false);
    expect(validateProjectInput('Proyecto Sistemas Distribuidos').valid).toBe(true);
  });

  it('validates task input and status restrictions', () => {
    expect(validateTaskInput('', 'pending', 'medium').valid).toBe(false);
    expect(validateTaskInput('Tarea válida', 'pending', 'medium').valid).toBe(true);
    expect(validateTaskInput('Tarea válida', 'in_progress', 'high').valid).toBe(true);
    expect(validateTaskInput('Tarea válida', 'completed', 'low').valid).toBe(true);
    expect(validateTaskInput('Tarea inválida', 'invalid_status', 'high').valid).toBe(false);
    expect(validateTaskInput('Tarea inválida', 'pending', 'invalid_priority').valid).toBe(false);
  });

  it('validates task due dates - Issue #11', () => {
    const today = getTodayDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, '0')}-${String(tomorrowDate.getDate()).padStart(2, '0')}`;

    // Fecha de ayer rechazada en tarea nueva
    const resYesterday = validateTaskInput('Tarea nueva', 'pending', 'medium', yesterday);
    expect(resYesterday.valid).toBe(false);
    expect(resYesterday.error).toBe('La fecha límite no puede ser anterior al día de hoy');

    // Fecha de mañana aceptada en tarea nueva
    const resTomorrow = validateTaskInput('Tarea nueva', 'pending', 'medium', tomorrow);
    expect(resTomorrow.valid).toBe(true);

    // Fecha de hoy aceptada en tarea nueva
    const resToday = validateTaskInput('Tarea nueva', 'pending', 'medium', today);
    expect(resToday.valid).toBe(true);

    // Tarea sin fecha límite aceptada
    const resNoDate = validateTaskInput('Tarea nueva', 'pending', 'medium', '');
    expect(resNoDate.valid).toBe(true);

    // Permitir conservar fecha pasada al editar tarea existente
    const resEditSamePast = validateTaskInput('Tarea existente', 'pending', 'medium', yesterday, true, yesterday);
    expect(resEditSamePast.valid).toBe(true);

    // Rechazar si al editar se cambia a otra fecha pasada
    const pastOlderDate = new Date();
    pastOlderDate.setDate(pastOlderDate.getDate() - 2);
    const olderPast = `${pastOlderDate.getFullYear()}-${String(pastOlderDate.getMonth() + 1).padStart(2, '0')}-${String(pastOlderDate.getDate()).padStart(2, '0')}`;
    const resEditDifferentPast = validateTaskInput('Tarea existente', 'pending', 'medium', olderPast, true, yesterday);
    expect(resEditDifferentPast.valid).toBe(false);
    expect(resEditDifferentPast.error).toBe('La fecha límite no puede ser anterior al día de hoy');
  });
});

describe('Formatters Unit Tests', () => {
  it('formats task status to Spanish labels', () => {
    expect(formatStatus('pending')).toBe('Pendiente');
    expect(formatStatus('in_progress')).toBe('En progreso');
    expect(formatStatus('completed')).toBe('Completada');
  });

  it('formats task priorities to Spanish labels', () => {
    expect(formatPriority('low')).toBe('Baja');
    expect(formatPriority('medium')).toBe('Media');
    expect(formatPriority('high')).toBe('Alta');
  });

  it('formats dates consistently', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('2026-10-21')).toContain('2026');
  });
});
