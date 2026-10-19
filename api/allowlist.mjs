/** Allowlist Docs : uniquement la config serveur. Aucune adresse dans le code. */

export function allowlistFromEnv(raw) {
  return String(raw || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.includes('@') && !s.includes(' '));
}

export function isAllowlisted(email, allow) {
  const value = String(email || '').trim().toLowerCase();
  if (!value || !value.includes('@')) return false;
  return allow.includes(value);
}

/** Un probe ne compte que s’il a vérifié le jeton (valid: true). */
export function emailFromValidatedProbe(data) {
  if (!data || typeof data !== 'object' || data.valid !== true) return '';
  const direct = String(data.email || '').trim().toLowerCase();
  if (direct.includes('@')) return direct;
  const user = data.user && typeof data.user === 'object' ? data.user : null;
  const nested = String(user?.email || '').trim().toLowerCase();
  return nested.includes('@') ? nested : '';
}

/**
 * La session suit l’adresse du jeton vérifié, pas celle annoncée par le client.
 * Une annonce différente est refusée.
 */
export function sessionEmailForLogin({ bodyEmail, tokenEmail, allow }) {
  const token = String(tokenEmail || '').trim().toLowerCase();
  const body = String(bodyEmail || '').trim().toLowerCase();
  if (!token || !isAllowlisted(token, allow)) return { error: 'allowlist' };
  if (body && body !== token) return { error: 'allowlist' };
  return { email: token };
}
