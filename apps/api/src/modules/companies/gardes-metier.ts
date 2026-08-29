/**
 * Fonctions de garde isolees — a completer quand les modules cibles existeront.
 *
 * Aujourd hui elles renvoient toujours « aucun obstacle ».
 * Ne pas disperser ces controles dans les services.
 */

/** True s il existe au moins un bulletin pour la societe. */
export function societeADesBulletins(_companyId: string): boolean {
  return false;
}

/** True si un bulletin a utilise ce compte bancaire. */
export function compteBancaireUtiliseParBulletin(_compteBancaireId: string): boolean {
  return false;
}

/** True s il reste des salaries rattaches a l etablissement. */
export function etablissementADesSalaries(_etablissementId: string): boolean {
  return false;
}

/** True s il existe au moins un salarie dans la societe. */
export function societeADesSalaries(_companyId: string): boolean {
  return false;
}

/**
 * Point de controle « production de bulletins definitifs ».
 * EN_MONTAGE doit bloquer ; pas encore de bulletins a produire.
 */
export function productionBulletinsDefinitifsAutorisee(etatDossier: string): boolean {
  return etatDossier !== 'EN_MONTAGE';
}
