import type {
  BaseSaisieDuree,
  ModeDeterminationSalaire,
  ModePaiement,
  StatutCadre,
} from '@paymarh/shared-types';

const LIBELLES_STATUT_CADRE: Record<StatutCadre, string> = {
  CADRE: 'Cadre',
  NON_CADRE: 'Non-cadre',
};

const LIBELLES_MODE_DETERMINATION: Record<ModeDeterminationSalaire, string> = {
  BRUT_MENSUEL: 'Brut mensuel',
  BRUT_HORAIRE: 'Brut horaire',
  NET_CIBLE: 'Net cible',
};

const LIBELLES_MODE_PAIEMENT: Record<ModePaiement, string> = {
  VIREMENT: 'Virement',
  CHEQUE: 'Chèque',
  ESPECES: 'Espèces',
};

const LIBELLES_BASE_SAISIE_DUREE: Record<BaseSaisieDuree, string> = {
  HEBDOMADAIRE: 'Hebdomadaire',
  MENSUELLE: 'Mensuelle',
};

export function libelleStatutCadre(statut: StatutCadre): string {
  return LIBELLES_STATUT_CADRE[statut];
}

export function libelleModeDeterminationSalaire(mode: ModeDeterminationSalaire): string {
  return LIBELLES_MODE_DETERMINATION[mode];
}

export function libelleModePaiement(mode: ModePaiement): string {
  return LIBELLES_MODE_PAIEMENT[mode];
}

export function libelleBaseSaisieDuree(base: BaseSaisieDuree): string {
  return LIBELLES_BASE_SAISIE_DUREE[base];
}

export function libelleReferentielParCode(
  items: readonly { readonly code: string; readonly libelle: string }[],
  code: string
): string {
  const item = items.find((entry) => entry.code === code);
  if (item === undefined) {
    throw new Error(`Libellé introuvable pour le code « ${code} ».`);
  }
  return item.libelle;
}

export function afficherBoolean(valeur: boolean | null): string {
  if (valeur === null) {
    return '';
  }
  return valeur ? 'Oui' : 'Non';
}
