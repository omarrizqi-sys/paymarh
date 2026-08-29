import type { Timestamps, Uuid } from './common';

export interface Etablissement extends Timestamps {
  readonly id: Uuid;
  readonly companyId: Uuid;
  readonly accountId: Uuid;
  readonly nom: string;
  readonly estPrincipal: boolean;
  readonly adresse: string;
  readonly complementAdresse: string | null;
  readonly codePostal: string | null;
  readonly ville: string;
  readonly pays: string;
  readonly ice: string | null;
  readonly taxeProfessionnelle: string | null;
  readonly telephone: string | null;
  readonly email: string | null;
}
