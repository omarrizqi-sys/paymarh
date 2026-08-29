import type { CompteBancaire, Etablissement, Societe } from '@paymarh/shared-types';

type DateLike = Date | string | null;

function isoDate(valeur: DateLike): string | null {
  if (valeur === null || valeur === undefined) return null;
  if (typeof valeur === 'string') return valeur.slice(0, 10);
  return valeur.toISOString().slice(0, 10);
}

export function toSociete(row: {
  id: string;
  accountId: string;
  codeDossier: string;
  raisonSociale: string;
  nomCommercial: string | null;
  formeJuridiqueId: string;
  activiteExercee: string | null;
  identifiantFiscal: string | null;
  registreCommerce: string | null;
  tribunalRegistreCommerce: string | null;
  dateCreation: DateLike;
  dateCessationActivite: DateLike;
  siteWeb: string | null;
  regimeDeBase: 'NON_AGRICOLE';
  periodicitePaie: 'MENSUEL';
  etatDossier: 'EN_MONTAGE' | 'EN_PRODUCTION' | 'INACTIVE';
  moisDebutMontage: string;
  moisDebutProduction: string;
  dateInactivite: string | null;
  moisEnCours: string;
  signataireCivilite: string | null;
  signatairePrenom: string | null;
  signataireNom: string | null;
  signataireQualite: string | null;
  matriculePrefixe: string | null;
  matriculeLongueur: number;
  matriculeGenerationAuto: boolean;
  calculAutoAbsencesEntreesSorties: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Societe {
  return {
    id: row.id,
    accountId: row.accountId,
    codeDossier: row.codeDossier,
    raisonSociale: row.raisonSociale,
    nomCommercial: row.nomCommercial,
    formeJuridiqueId: row.formeJuridiqueId,
    activiteExercee: row.activiteExercee,
    identifiantFiscal: row.identifiantFiscal,
    registreCommerce: row.registreCommerce,
    tribunalRegistreCommerce: row.tribunalRegistreCommerce,
    dateCreation: isoDate(row.dateCreation),
    dateCessationActivite: isoDate(row.dateCessationActivite),
    siteWeb: row.siteWeb,
    regimeDeBase: row.regimeDeBase,
    periodicitePaie: row.periodicitePaie,
    etatDossier: row.etatDossier,
    moisDebutMontage: row.moisDebutMontage,
    moisDebutProduction: row.moisDebutProduction,
    dateInactivite: row.dateInactivite,
    moisEnCours: row.moisEnCours,
    signataireCivilite: row.signataireCivilite,
    signatairePrenom: row.signatairePrenom,
    signataireNom: row.signataireNom,
    signataireQualite: row.signataireQualite,
    matriculePrefixe: row.matriculePrefixe,
    matriculeLongueur: row.matriculeLongueur,
    matriculeGenerationAuto: row.matriculeGenerationAuto,
    calculAutoAbsencesEntreesSorties: row.calculAutoAbsencesEntreesSorties,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toEtablissement(row: {
  id: string;
  companyId: string;
  accountId: string;
  nom: string;
  estPrincipal: boolean;
  adresse: string;
  complementAdresse: string | null;
  codePostal: string | null;
  ville: string;
  pays: string;
  ice: string | null;
  taxeProfessionnelle: string | null;
  telephone: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Etablissement {
  return {
    id: row.id,
    companyId: row.companyId,
    accountId: row.accountId,
    nom: row.nom,
    estPrincipal: row.estPrincipal,
    adresse: row.adresse,
    complementAdresse: row.complementAdresse,
    codePostal: row.codePostal,
    ville: row.ville,
    pays: row.pays,
    ice: row.ice,
    taxeProfessionnelle: row.taxeProfessionnelle,
    telephone: row.telephone,
    email: row.email,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toCompteBancaire(row: {
  id: string;
  companyId: string;
  libelle: string | null;
  banqueId: string | null;
  banqueSaisieLibre: string | null;
  rib: string | null;
  iban: string | null;
  bic: string | null;
  nomPayeur: string | null;
  usageSalaires: boolean;
  usageCotisationsSociales: boolean;
  usageIR: boolean;
  etat: 'ACTIF' | 'CLOTURE';
  createdAt: Date;
  updatedAt: Date;
  etablissements?: { etablissementId: string }[];
}): CompteBancaire {
  return {
    id: row.id,
    companyId: row.companyId,
    libelle: row.libelle,
    banqueId: row.banqueId,
    banqueSaisieLibre: row.banqueSaisieLibre,
    rib: row.rib,
    iban: row.iban,
    bic: row.bic,
    nomPayeur: row.nomPayeur,
    usageSalaires: row.usageSalaires,
    usageCotisationsSociales: row.usageCotisationsSociales,
    usageIR: row.usageIR,
    etat: row.etat,
    etablissementIds: (row.etablissements ?? []).map((l) => l.etablissementId),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
