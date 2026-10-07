// Password rules: min 8 chars, at least one lowercase, one uppercase and one special character.
const validatePassword = (pw) => {
  const p = String(pw || '');
  if (p.length < 8) return 'Password must be at least 8 characters long';
  if (!/[a-z]/.test(p)) return 'Password must contain a lowercase letter';
  if (!/[A-Z]/.test(p)) return 'Password must contain an uppercase letter';
  if (!/[^A-Za-z0-9]/.test(p)) return 'Password must contain a special character (e.g. @ # $ ! %)';
  return null;
};

module.exports = { validatePassword };
