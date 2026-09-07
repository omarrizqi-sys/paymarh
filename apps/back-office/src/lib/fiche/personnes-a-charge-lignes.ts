import type { EtatLigneFiche, PersonneACharge, SexePersonne } from '@paymarh/shared-types';

export interface LignePersonneAChargeLocale {
  readonly id: string;
  readonly lienParenteCode: string;
  readonly prenom: string;
  readonly nom: string;
  readonly sexe: SexePersonne;
  readonly dateNaissance: string;
  readonly situationHandicap: boolean;
  readonly aCharge: boolean;
  readonly etat: EtatLigneFiche | 'NON_ENREGISTREE';
  readonly moisEffetFin: string | null;
}

let compteurIdLocal = 0;

export function genererIdLocal(): string {
  compteurIdLocal += 1;
  return `local-${compteurIdLocal}`;
}

export function creerLigneVide(): LignePersonneAChargeLocale {
  return {
    id: genererIdLocal(),
    lienParenteCode: 'ENFANT',
    prenom: '',
    nom: '',
    sexe: 'HOMME',
    dateNaissance: '',
    situationHandicap: false,
    aCharge: false,
    etat: 'NON_ENREGISTREE',
    moisEffetFin: null,
  };
}

export function depuisServeur(ligne: PersonneACharge): LignePersonneAChargeLocale {
  return {
    id: ligne.id,
    lienParenteCode: ligne.lienParenteCode,
    prenom: ligne.prenom,
    nom: ligne.nom,
    sexe: ligne.sexe,
    dateNaissance: ligne.dateNaissance.slice(0, 10),
    situationHandicap: ligne.situationHandicap ?? false,
    aCharge: ligne.aCharge,
    etat: ligne.etat,
    moisEffetFin: ligne.moisEffetFin,
  };
}

export function trierAffichage(
  lignes: readonly LignePersonneAChargeLocale[]
): LignePersonneAChargeLocale[] {
  const enregistrees = lignes.filter((l) => l.etat !== 'NON_ENREGISTREE');
  const nonEnregistrees = lignes.filter((l) => l.etat === 'NON_ENREGISTREE');
  const triees = [...enregistrees].sort((a, b) => a.dateNaissance.localeCompare(b.dateNaissance));
  return [...triees, ...nonEnregistrees];
}

export function lignesEgales(
  a: LignePersonneAChargeLocale,
  b: LignePersonneAChargeLocale
): boolean {
  return (
    a.lienParenteCode === b.lienParenteCode &&
    a.prenom === b.prenom &&
    a.nom === b.nom &&
    a.sexe === b.sexe &&
    a.dateNaissance === b.dateNaissance &&
    a.situationHandicap === b.situationHandicap &&
    a.aCharge === b.aCharge
  );
}

export function estModifieeContreReference(
  courant: readonly LignePersonneAChargeLocale[],
  reference: readonly LignePersonneAChargeLocale[]
): boolean {
  const idsReference = new Set(reference.map((l) => l.id));
  const idsCourant = new Set(courant.map((l) => l.id));

  if (courant.some((l) => l.etat === 'NON_ENREGISTREE')) return true;
  if (reference.some((l) => !idsCourant.has(l.id) && l.etat === 'ACTIVE')) return true;

  for (const ligne of courant) {
    if (ligne.etat === 'NON_ENREGISTREE') continue;
    const ref = reference.find((r) => r.id === ligne.id);
    if (ref === undefined) continue;
    if (!lignesEgales(ligne, ref)) return true;
  }

  void idsReference;
  return false;
}

export function formaterMoisFin(moisEffetFin: string | null): string {
  if (moisEffetFin === null) return '';
  const [annee, mois] = moisEffetFin.split('-');
  return `${mois}/${annee}`;
}

export function libelleEtatLigne(ligne: LignePersonneAChargeLocale): string | null {
  if (ligne.etat === 'NON_ENREGISTREE') return 'non enregistrée';
  if (ligne.etat === 'INACTIVE' && ligne.moisEffetFin !== null) {
    return `inactive depuis ${formaterMoisFin(ligne.moisEffetFin)}`;
  }
  return null;
}

export function extraireLigneReponse(
  personnesACharge: readonly PersonneACharge[],
  ligneId: string,
  idsConnus: ReadonlySet<string>
): PersonneACharge | undefined {
  const directe = personnesACharge.find((l) => l.id === ligneId);
  if (directe !== undefined) return directe;
  return personnesACharge.find((l) => !idsConnus.has(l.id));
}

export function versCorpsCreation(ligne: LignePersonneAChargeLocale) {
  const corps = {
    lienParenteCode: ligne.lienParenteCode,
    prenom: ligne.prenom,
    nom: ligne.nom,
    sexe: ligne.sexe,
    dateNaissance: ligne.dateNaissance,
    aCharge: ligne.aCharge,
  };
  if (ligne.lienParenteCode === 'ENFANT') {
    return { ...corps, situationHandicap: ligne.situationHandicap };
  }
  return corps;
}

export function versCorpsModification(
  ligne: LignePersonneAChargeLocale,
  reference: LignePersonneAChargeLocale
) {
  const corps: Record<string, unknown> = {};
  if (ligne.lienParenteCode !== reference.lienParenteCode) {
    corps.lienParenteCode = ligne.lienParenteCode;
  }
  if (ligne.prenom !== reference.prenom) corps.prenom = ligne.prenom;
  if (ligne.nom !== reference.nom) corps.nom = ligne.nom;
  if (ligne.sexe !== reference.sexe) corps.sexe = ligne.sexe;
  if (ligne.dateNaissance !== reference.dateNaissance) corps.dateNaissance = ligne.dateNaissance;
  if (ligne.aCharge !== reference.aCharge) corps.aCharge = ligne.aCharge;
  if (
    ligne.lienParenteCode === 'ENFANT' &&
    ligne.situationHandicap !== reference.situationHandicap
  ) {
    corps.situationHandicap = ligne.situationHandicap;
  }
  return corps;
}

/** Pour les tests : remet le compteur d ids locaux a zero. */
export function reinitialiserCompteurIdLocal(): void {
  compteurIdLocal = 0;
}
