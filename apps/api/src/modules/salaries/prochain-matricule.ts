/**
 * Calcul du prochain matricule salarie pour une societe.
 *
 * Retient le plus grand matricule commencant par le prefixe, y compris
 * ceux des salaries supprimes ou sortis (valeurs consommees passees en entree).
 * La longueur ne s applique qu a la generation automatique.
 */

export interface ParametresMatricule {
  readonly prefixe: string;
  readonly longueur: number;
}

/**
 * Extrait la partie numerique d un matricule apres le prefixe.
 * Retourne null si le matricule ne commence pas par le prefixe ou n a pas de suffixe numerique.
 */
function extraireSuffixeNumerique(matricule: string, prefixe: string): bigint | null {
  if (!matricule.startsWith(prefixe)) {
    return null;
  }
  const suffixe = matricule.slice(prefixe.length);
  if (suffixe.length === 0 || !/^\d+$/.test(suffixe)) {
    return null;
  }
  return BigInt(suffixe);
}

/**
 * Formate un numero avec zeros de tete selon la longueur parametree.
 */
function formaterSuffixe(numero: bigint, longueur: number): string {
  const brut = numero.toString();
  if (brut.length >= longueur) {
    return brut;
  }
  return brut.padStart(longueur, '0');
}

/**
 * Formate un matricule auto-genere a partir d un numero de compteur.
 */
export function formaterMatriculeAuto(parametres: ParametresMatricule, numero: number): string {
  return `${parametres.prefixe}${formaterSuffixe(BigInt(numero), parametres.longueur)}`;
}

/**
 * Deduit le dernier numero consomme a partir des valeurs deja attribuees.
 */
export function deduireDernierNumeroMatricule(
  parametres: ParametresMatricule,
  matriculesConsommes: readonly string[]
): number {
  const { prefixe } = parametres;
  let maximum = 0n;

  for (const matricule of matriculesConsommes) {
    const suffixe = extraireSuffixeNumerique(matricule, prefixe);
    if (suffixe !== null && suffixe > maximum) {
      maximum = suffixe;
    }
  }

  return Number(maximum);
}

/**
 * Calcule le prochain matricule auto-genere a partir des matricules deja consommes.
 * La liste doit etre celle des valeurs persistees, pas seulement les salaries encore en poste.
 */
export function calculerProchainMatricule(
  parametres: ParametresMatricule,
  matriculesConsommes: readonly string[]
): string {
  const suivant = BigInt(deduireDernierNumeroMatricule(parametres, matriculesConsommes)) + 1n;
  return `${parametres.prefixe}${formaterSuffixe(suivant, parametres.longueur)}`;
}

/**
 * Calcule le prochain numero d ordre d emploi pour un salarie.
 */
export function calculerProchainNumeroOrdre(numerosExistants: readonly number[]): number {
  if (numerosExistants.length === 0) {
    return 1;
  }
  return Math.max(...numerosExistants) + 1;
}
