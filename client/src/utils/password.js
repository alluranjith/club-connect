// Mirrors the server rule: 8+ chars, a lowercase letter, an uppercase letter and a special character.
export const PASSWORD_RULES = [
  { id: 'len', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'lower', label: 'A lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'upper', label: 'An uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'special', label: 'A special character (@ # $ ! %)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const isStrongPassword = (p) => PASSWORD_RULES.every((r) => r.test(p || ''));
