export const SURFACES = ['api', 'web', 'mobile'];

/** Cible d’un retour : API, web, mobile, ou une combinaison. Ordre fixe. */
export function parseTargets(raw) {
  let list = [];
  if (Array.isArray(raw)) list = raw;
  else if (typeof raw === 'string') {
    const s = raw.trim();
    if (s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s);
        list = Array.isArray(parsed) ? parsed : [];
      } catch {
        list = s.split(/[,+\s]+/);
      }
    } else if (s) list = s.split(/[,+\s]+/);
  }
  const want = new Set(
    list.map((item) => String(item || '').trim().toLowerCase()).filter((k) => SURFACES.includes(k)),
  );
  return SURFACES.filter((k) => want.has(k));
}
