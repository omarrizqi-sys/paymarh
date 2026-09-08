import type { Banque, CompteBancaireSalarie } from '@paymarh/shared-types';

export interface LigneCompteBancaireLocale {
  readonly id: string;
  readonly banqueId: string | null;
  readonly banqueLibreSaisie: string | null;
  readonly rib: string;
  readonly iban: string;
  readonly bic: string;
  readonly titulaire: string;
  readonly partVirement: string;
  readonly nonEnregistree: boolean;
}

let compteurIdLocal = 0;

export function genererIdLocalCompte(): string {
  compteurIdLocal += 1;
  return `local-${compteurIdLocal}`;
}

export function reinitialiserCompteurIdLocalCompte(): void {
  compteurIdLocal = 0;
}

export function creerLigneCompteVide(): LigneCompteBancaireLocale {
  return {
    id: genererIdLocalCompte(),
    banqueId: null,
    banqueLibreSaisie: null,
    rib: '',
    iban: '',
    bic: '',
    titulaire: '',
    partVirement: '',
    nonEnregistree: true,
  };
}

export function depuisServeur(compte: CompteBancaireSalarie): LigneCompteBancaireLocale {
  return {
    id: compte.id,
    banqueId: compte.banqueId,
    banqueLibreSaisie: compte.banqueLibreSaisie,
    rib: compte.rib ?? '',
    iban: compte.iban ?? '',
    bic: compte.bic ?? '',
    titulaire: compte.titulaire ?? '',
    partVirement: compte.partVirement ?? '',
    nonEnregistree: false,
  };
}

export function ordreAffichage(
  lignes: readonly LigneCompteBancaireLocale[]
): LigneCompteBancaireLocale[] {
  const enregistrees = lignes.filter((l) => !l.nonEnregistree);
  const nouvelles = lignes.filter((l) => l.nonEnregistree);
  return [...enregistrees, ...nouvelles];
}

export function libelleBanque(
  ligne: LigneCompteBancaireLocale,
  banques: readonly Banque[]
): string {
  if (ligne.banqueId !== null) {
    return banques.find((b) => b.id === ligne.banqueId)?.nom ?? '';
  }
  return ligne.banqueLibreSaisie ?? '';
}

function lignesEgales(a: LigneCompteBancaireLocale, b: LigneCompteBancaireLocale): boolean {
  return (
    a.banqueId === b.banqueId &&
    a.banqueLibreSaisie === b.banqueLibreSaisie &&
    a.rib === b.rib &&
    a.iban === b.iban &&
    a.bic === b.bic &&
    a.titulaire === b.titulaire &&
    a.partVirement === b.partVirement
  );
}

export function estModifieeContreReference(
  courant: readonly LigneCompteBancaireLocale[],
  reference: readonly LigneCompteBancaireLocale[]
): boolean {
  const idsCourant = new Set(courant.map((l) => l.id));

  if (courant.some((l) => l.nonEnregistree)) return true;
  if (reference.some((l) => !idsCourant.has(l.id))) return true;

  for (const ligne of courant) {
    const ref = reference.find((r) => r.id === ligne.id);
    if (ref === undefined) continue;
    if (!lignesEgales(ligne, ref)) return true;
  }

  return false;
}

export interface CorpsCompteBancaireEnvoi {
  readonly id?: string;
  readonly banqueId: string | null;
  readonly banqueLibreSaisie: string | null;
  readonly rib: string | null;
  readonly iban: string | null;
  readonly bic: string | null;
  readonly titulaire: string | null;
  readonly partVirement: string | null;
}

export function versCorpsLigneEnvoi(ligne: LigneCompteBancaireLocale): CorpsCompteBancaireEnvoi {
  let banqueId: string | null = null;
  let banqueLibreSaisie: string | null = null;

  if (ligne.banqueId !== null) {
    banqueId = ligne.banqueId;
  } else if (ligne.banqueLibreSaisie !== null && ligne.banqueLibreSaisie.trim().length > 0) {
    banqueLibreSaisie = ligne.banqueLibreSaisie.trim();
  }

  const corps: CorpsCompteBancaireEnvoi = {
    banqueId,
    banqueLibreSaisie,
    rib: ligne.rib.length > 0 ? ligne.rib : null,
    iban: ligne.iban.length > 0 ? ligne.iban : null,
    bic: ligne.bic.length > 0 ? ligne.bic : null,
    titulaire: ligne.titulaire.length > 0 ? ligne.titulaire : null,
    partVirement: ligne.partVirement.length > 0 ? ligne.partVirement : null,
  };

  if (!ligne.nonEnregistree) {
    return { ...corps, id: ligne.id };
  }

  return corps;
}

export function versCorpsEnvoi(
  lignes: readonly LigneCompteBancaireLocale[]
): CorpsCompteBancaireEnvoi[] {
  return ordreAffichage(lignes).map(versCorpsLigneEnvoi);
}

export function libelleEtatLigneCompte(ligne: LigneCompteBancaireLocale): string | null {
  if (ligne.nonEnregistree) return 'non enregistrée';
  return null;
}
