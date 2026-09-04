/** Codes de blocage qui arretent la sequence d enregistrement global. */
export const CODES_ARRET_SEQUENCE = new Set(['CONFLIT_VERSION', 'EN_TETE_IF_MATCH_REQUIS']);

export function estConflitVersion(code: string): boolean {
  return CODES_ARRET_SEQUENCE.has(code);
}
