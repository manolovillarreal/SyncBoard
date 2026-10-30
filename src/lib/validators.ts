// Input validation and sanitization utilities

// Estructura estricta: usuario @ dominio . TLD (mínimo 2 letras).
// - Usuario: letras, dígitos y . _ % + - (sin puntos al inicio, al final ni consecutivos).
// - Dominio: etiquetas de letras, dígitos y guiones (sin guion al inicio o al final), separadas por puntos.
// - Se rechazan espacios, comas, dobles @ y cualquier otro carácter no permitido.
const STRICT_EMAIL_RE =
  /^[a-z0-9_%+-]+(?:\.[a-z0-9_%+-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;

export const isValidEmail = (email: string): boolean => {
  return STRICT_EMAIL_RE.test(email.trim().toLowerCase());
};

export const EMAIL_FORMAT_ERROR =
  'Formato de correo inválido: debe tener usuario, @, dominio y una extensión de al menos 2 letras (ej. usuario@universidad.edu), sin espacios ni comas.';

export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

export const validateProjectInput = (name: string): { valid: boolean; error?: string } => {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: 'El nombre del proyecto es obligatorio.' };
  }
  if (trimmed.length < 3) {
    return { valid: false, error: 'El nombre debe tener al menos 3 caracteres.' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'El nombre no puede exceder 100 caracteres.' };
  }
  return { valid: true };
};

export const validateTaskInput = (
  title: string,
  status: string,
  priority: string
): { valid: boolean; error?: string } => {
  const trimmed = title.trim();
  if (!trimmed) {
    return { valid: false, error: 'El título de la tarea es obligatorio.' };
  }
  if (trimmed.length < 2) {
    return { valid: false, error: 'El título debe tener al menos 2 caracteres.' };
  }
  if (trimmed.length > 150) {
    return { valid: false, error: 'El título no puede superar 150 caracteres.' };
  }

  const validStatuses = ['pending', 'in_progress', 'completed'];
  if (!validStatuses.includes(status)) {
    return { valid: false, error: 'Estado de tarea inválido.' };
  }

  const validPriorities = ['low', 'medium', 'high'];
  if (!validPriorities.includes(priority)) {
    return { valid: false, error: 'Prioridad de tarea inválida.' };
  }

  return { valid: true };
};
