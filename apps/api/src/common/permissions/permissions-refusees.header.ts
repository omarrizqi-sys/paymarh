/**
 * En-tete de developpement : liste de permissions a refuser (virgules).
 * Ignore en production (NODE_ENV === 'production').
 */
export const HEADER_PERMISSIONS_REFUSEES = 'x-paymarh-permissions-refusees';

export function lirePermissionsRefuseesDepuisEnTete(
  enTete: string | string[] | undefined
): Set<string> {
  if (typeof enTete !== 'string' || enTete.trim().length === 0) {
    return new Set();
  }

  return new Set(
    enTete
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
  );
}
