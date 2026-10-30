import { describe, it, expect } from 'vitest';
import {
  formatStatus,
  formatPriority,
  getPriorityBadgeClass,
  formatDate,
  formatDateTime,
} from '../lib/formatters';
import { TaskPriority, TaskStatus } from '../types/database.types';

// Fecha de referencia al mediodía UTC: el día calendario es el mismo en cualquier
// zona horaria entre UTC-11 y UTC+11, así las pruebas no dependen del TZ del equipo o del CI.
const MIDDAY_UTC = '2026-10-21T12:00:00Z';

describe('formatStatus', () => {
  it.each<[TaskStatus, string]>([
    ['pending', 'Pendiente'],
    ['in_progress', 'En progreso'],
    ['completed', 'Completada'],
  ])('traduce "%s" a "%s"', (status, label) => {
    expect(formatStatus(status)).toBe(label);
  });

  it('devuelve el valor original ante un estado desconocido', () => {
    expect(formatStatus('archived' as TaskStatus)).toBe('archived');
  });
});

describe('formatPriority', () => {
  it.each<[TaskPriority, string]>([
    ['low', 'Baja'],
    ['medium', 'Media'],
    ['high', 'Alta'],
  ])('traduce "%s" a "%s"', (priority, label) => {
    expect(formatPriority(priority)).toBe(label);
  });

  it('devuelve el valor original ante una prioridad desconocida', () => {
    expect(formatPriority('urgent' as TaskPriority)).toBe('urgent');
  });
});

describe('getPriorityBadgeClass', () => {
  it.each<[TaskPriority, string]>([
    ['high', 'red'],
    ['medium', 'amber'],
    ['low', 'emerald'],
  ])('asigna a "%s" la paleta %s (fondo, texto y borde)', (priority, color) => {
    const classes = getPriorityBadgeClass(priority).split(' ');
    expect(classes).toEqual([`bg-${color}-100`, `text-${color}-700`, `border-${color}-200`]);
  });

  it('usa la paleta neutra slate ante una prioridad desconocida', () => {
    expect(getPriorityBadgeClass('urgent' as TaskPriority)).toBe(
      'bg-slate-100 text-slate-700 border-slate-200'
    );
  });

  it('asigna una clase distinta a cada prioridad', () => {
    const classes = (['low', 'medium', 'high'] as TaskPriority[]).map(getPriorityBadgeClass);
    expect(new Set(classes).size).toBe(3);
  });
});

describe('formatDate', () => {
  it('devuelve cadena vacía para null o cadena vacía', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('')).toBe('');
  });

  it('formatea día con dos dígitos, mes abreviado en español y año', () => {
    const result = formatDate(MIDDAY_UTC);
    expect(result).toMatch(/^21/);
    expect(result.toLowerCase()).toContain('oct');
    expect(result).toContain('2026');
  });

  it('rellena con cero los días de un dígito', () => {
    expect(formatDate('2026-03-05T12:00:00Z')).toMatch(/^05/);
  });

  it('coincide con el formato es-ES de la plataforma', () => {
    const expected = new Date(MIDDAY_UTC).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    expect(formatDate(MIDDAY_UTC)).toBe(expected);
  });
});

describe('formatDateTime', () => {
  it('devuelve cadena vacía para null o cadena vacía', () => {
    expect(formatDateTime(null)).toBe('');
    expect(formatDateTime('')).toBe('');
  });

  it('incluye día, mes abreviado y hora en formato HH:MM, sin año', () => {
    const result = formatDateTime(MIDDAY_UTC);
    expect(result).toMatch(/^21/);
    expect(result.toLowerCase()).toContain('oct');
    expect(result).toMatch(/\d{2}:\d{2}/);
    expect(result).not.toContain('2026');
  });

  it('coincide con el formato es-ES de la plataforma', () => {
    const expected = new Date(MIDDAY_UTC).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
    expect(formatDateTime(MIDDAY_UTC)).toBe(expected);
  });
});
