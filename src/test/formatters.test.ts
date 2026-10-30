import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRelativeTime } from '../lib/formatters';

const NOW = new Date('2026-10-30T12:00:00Z');

const ago = (ms: number): string => new Date(NOW.getTime() - ms).toISOString();

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('formatRelativeTime - Issue #6', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('devuelve "hace un momento" para un desfase de 20 segundos', () => {
    expect(formatRelativeTime(ago(20 * SECOND))).toBe('hace un momento');
  });

  it('devuelve "hace 15 minutos" para un desfase de 15 minutos', () => {
    expect(formatRelativeTime(ago(15 * MINUTE))).toBe('hace 15 minutos');
  });

  it('devuelve "hace 4 horas" para un desfase de 4 horas', () => {
    expect(formatRelativeTime(ago(4 * HOUR))).toBe('hace 4 horas');
  });

  it('devuelve "hace 2 días" para un desfase de 2 días', () => {
    expect(formatRelativeTime(ago(2 * DAY))).toBe('hace 2 días');
  });

  it('usa el singular cuando la cantidad es 1', () => {
    expect(formatRelativeTime(ago(1 * MINUTE))).toBe('hace 1 minuto');
    expect(formatRelativeTime(ago(1 * HOUR))).toBe('hace 1 hora');
    expect(formatRelativeTime(ago(1 * DAY))).toBe('hace 1 día');
  });

  it('trata fechas ligeramente futuras (desfase de reloj) como "hace un momento"', () => {
    expect(formatRelativeTime(ago(-5 * SECOND))).toBe('hace un momento');
  });

  it('muestra la fecha absoluta para 30 días o más', () => {
    const result = formatRelativeTime(ago(45 * DAY));
    expect(result).not.toMatch(/^hace/);
    expect(result).toMatch(/2026/);
  });
});
