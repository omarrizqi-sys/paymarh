const LIBELLES_ETAT: Record<string, string> = {
  EN_MONTAGE: 'En montage',
  EN_PRODUCTION: 'En production',
  INACTIVE: 'Inactive',
};

const LIBELLES_JOUR: Record<string, string> = {
  LUNDI: 'Lundi',
  MARDI: 'Mardi',
  MERCREDI: 'Mercredi',
  JEUDI: 'Jeudi',
  VENDREDI: 'Vendredi',
  SAMEDI: 'Samedi',
  DIMANCHE: 'Dimanche',
};

export function libelleEtatDossier(etat: string): string {
  return LIBELLES_ETAT[etat] ?? etat;
}

const LIBELLES_ETAT_SALARIE: Record<'ACTIF' | 'INACTIF', string> = {
  ACTIF: 'Actif',
  INACTIF: 'Inactif',
};

export function libelleEtatSalarie(etat: 'ACTIF' | 'INACTIF'): string {
  return LIBELLES_ETAT_SALARIE[etat];
}

export function libelleJourSemaine(jour: string): string {
  return LIBELLES_JOUR[jour] ?? jour;
}

export function formaterMoisAAAA_MM(valeur: string): string {
  const [annee, mois] = valeur.split('-');
  if (!annee || !mois) return valeur;
  const noms = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ];
  const index = Number(mois) - 1;
  return `${noms[index] ?? mois} ${annee}`;
}

const LIBELLES_STATUT_ENREGISTREMENT: Record<string, string> = {
  succes: 'succès',
  echec: 'échec',
  conflit: 'conflit',
  non_tente: 'non tenté',
};

export function libelleStatutEnregistrement(statut: string): string {
  return LIBELLES_STATUT_ENREGISTREMENT[statut] ?? statut;
}

export function formaterMoisClotureConges(mois: number): string {
  const noms = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];
  return noms[mois - 1] ?? String(mois);
}
