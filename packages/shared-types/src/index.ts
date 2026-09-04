/**
 * Point d entree unique du package @paymarh/shared-types.
 *
 * REGLE D OR : un type metier se definit UNE SEULE FOIS ici. Ni l API ni le
 * back-office ne redeclarent la forme d un Account, d une Company ou d un
 * User. Voir README.md.
 */
export type {
  Uuid,
  IsoDateTime,
  Timestamps,
  ListResponse,
  ApiWarning,
  ApiResponse,
  AlerteApi,
  ReponseEcriture,
} from './common';
export type { Role } from './role';
export type { Account, AccountType } from './account';
export type { Company, Societe } from './company';
export type { SocieteListe } from './societe-liste';
export type { Etablissement } from './etablissement';
export type { CompteBancaire } from './compte-bancaire';
export type {
  ImpactSuppressionSociete,
  ImpactSuppressionEtablissement,
  ImpactSuppressionCompteBancaire,
  ResultatSuppression,
} from './impact-suppression';
export type {
  EtatSalarie,
  EtatLigneFiche,
  SexePersonne,
  SituationFamilialeSalarie,
  PersonneACharge,
  CompteBancaireSalarie,
  PretSalarie,
  SaisieSurSalaire,
  EmploiFicheNonType,
  FicheSalarie,
} from './salarie';
export type { User } from './user';
export type { TenantContext, PlatformAccessReason } from './tenancy';
export type { AuditLog, AuditEcart, AuditChampModifie } from './audit';
export type { HealthResponse } from './health';
export type { Permission } from './permission';
export { PERMISSIONS } from './permission';
export type {
  RessourceAvecOperations,
  ListResponseAvecOperations,
} from './ressource-avec-operations';
export type { FormeJuridique, Banque, JourFerie, TypeHeure, TypeExoneration } from './referentiel';
export type {
  JourSemaine,
  ParametrageSociete,
  ParametrageEtablissement,
  HoraireDefautLigne,
  HoraireMensuelLigne,
  JourFerieTravailleRef,
} from './parametrage';
