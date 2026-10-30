import { describe, it, expect } from 'vitest';
import { isValidEmail, normalizeEmail, validateProjectInput, validateTaskInput } from '../lib/validators';
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
});

describe('validateProjectInput - Boundary Value Analysis (Issue #26)', () => {
  it('rejects names with 1 and 2 characters with a descriptive Spanish error', () => {
    for (const name of ['a', 'ab']) {
      const result = validateProjectInput(name);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('El nombre debe tener al menos 3 caracteres.');
    }
  });

  it('accepts names with exactly 3 characters (lower bound)', () => {
    const result = validateProjectInput('abc');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('accepts names with exactly 100 characters (upper bound)', () => {
    const result = validateProjectInput('a'.repeat(100));
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects names with 101 characters with a descriptive Spanish error', () => {
    const result = validateProjectInput('a'.repeat(101));
    expect(result.valid).toBe(false);
    expect(result.error).toBe('El nombre no puede exceder 100 caracteres.');
  });

  it('rejects empty or whitespace-only names as required', () => {
    for (const name of ['', '   ', '\t\n']) {
      const result = validateProjectInput(name);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('El nombre del proyecto es obligatorio.');
    }
  });

  it('measures length after trimming surrounding spaces', () => {
    expect(validateProjectInput('  ab  ').valid).toBe(false);
    expect(validateProjectInput('  abc  ').valid).toBe(true);
    expect(validateProjectInput(` ${'a'.repeat(100)} `).valid).toBe(true);
  });

  it('accepts names mixing accents, digits and symbols', () => {
    expect(validateProjectInput('Ñandú 2026 - Diseño & Pruebas').valid).toBe(true);
  });
});

describe('validateTaskInput - Relational Model Restrictions (Issue #26)', () => {
  it.each(['todo', 'done', 'PENDING', 'Pending', 'in-progress', 'archived', ''])(
    'rejects status "%s" outside the relational model',
    (status) => {
      const result = validateTaskInput('Tarea válida', status, 'medium');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Estado de tarea inválido.');
    }
  );

  it.each(['urgent', 'critical', 'HIGH', 'Low', 'normal', ''])(
    'rejects priority "%s" outside the relational model',
    (priority) => {
      const result = validateTaskInput('Tarea válida', 'pending', priority);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Prioridad de tarea inválida.');
    }
  );

  it('accepts every valid status and priority combination', () => {
    for (const status of ['pending', 'in_progress', 'completed']) {
      for (const priority of ['low', 'medium', 'high']) {
        expect(validateTaskInput('Tarea válida', status, priority)).toEqual({ valid: true });
      }
    }
  });

  it('validates the title before status and priority', () => {
    const result = validateTaskInput('   ', 'invalid_status', 'invalid_priority');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('El título de la tarea es obligatorio.');
  });

  it('applies title length boundaries (2 to 150 characters)', () => {
    expect(validateTaskInput('a', 'pending', 'low')).toEqual({
      valid: false,
      error: 'El título debe tener al menos 2 caracteres.',
    });
    expect(validateTaskInput('ab', 'pending', 'low').valid).toBe(true);
    expect(validateTaskInput('a'.repeat(150), 'pending', 'low').valid).toBe(true);
    expect(validateTaskInput('a'.repeat(151), 'pending', 'low')).toEqual({
      valid: false,
      error: 'El título no puede superar 150 caracteres.',
    });
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
