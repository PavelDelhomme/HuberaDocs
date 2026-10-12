/** Fichiers labo DA exposés en HTML brut (pas la SPA). */
export function isAllowedLaboFile(file) {
  const name = String(file || '');
  return /^labo-da-vague[12]\.html$/.test(name) || name === 'README.md';
}
