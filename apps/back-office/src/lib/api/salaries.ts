import type { ReponseEcriture } from '@paymarh/shared-types';
import { appelerSalarieGet, appelerSalariePatch } from './client-salarie';
import type { FicheSalarieAvecOperations } from './salaries-types';

export type { FicheSalarie, FicheSalarieAvecOperations } from './salaries-types.js';

export async function lireSalarie(
  companyId: string,
  salarieId: string
): Promise<{ donnees: FicheSalarieAvecOperations }> {
  return appelerSalarieGet<FicheSalarieAvecOperations>(companyId, `/salaries/${salarieId}`);
}

export async function modifierIdentiteSalarie(
  companyId: string,
  salarieId: string,
  version: number,
  corps: { nom?: string; prenom?: string }
): Promise<ReponseEcriture<FicheSalarieAvecOperations>> {
  return appelerSalariePatch(companyId, `/salaries/${salarieId}/identite`, corps, version);
}

export async function modifierCoordonneesSalarie(
  companyId: string,
  salarieId: string,
  version: number,
  corps: { ville?: string; adresse?: string }
): Promise<ReponseEcriture<FicheSalarieAvecOperations>> {
  return appelerSalariePatch(companyId, `/salaries/${salarieId}/coordonnees`, corps, version);
}

export async function modifierDatesSalarie(
  companyId: string,
  salarieId: string,
  version: number,
  corps: { dateEntree?: string; dateAnciennete?: string }
): Promise<ReponseEcriture<FicheSalarieAvecOperations>> {
  return appelerSalariePatch(companyId, `/salaries/${salarieId}/dates`, corps, version);
}
