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
    'fevrier',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'aout',
    'septembre',
    'octobre',
    'novembre',
    'decembre',
  ];
  const index = Number(mois) - 1;
  return `${noms[index] ?? mois} ${annee}`;
}

export function formaterMoisClotureConges(mois: number): string {
  const noms = [
    'Janvier',
    'Fevrier',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Aout',
    'Septembre',
    'Octobre',
    'Novembre',
    'Decembre',
  ];
  return noms[mois - 1] ?? String(mois);
}
