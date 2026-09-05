import type {
  FormeJuridique,
  Permission,
  RessourceAvecOperations,
  SocieteListe,
} from '@paymarh/shared-types';
import { possedePermission } from '@/lib/permissions';

/** Ligne de liste : ressource API + libelle de forme compose par l ecran. */
export interface LigneSocieteListe extends RessourceAvecOperations<SocieteListe> {
  readonly libelleFormeJuridique: string;
}

/** Droit de creation lu sur les operations de collection. */
export function peutCreerSociete(operations: readonly Permission[]): boolean {
  return possedePermission(operations, 'societe.creer');
}

/** Libelle de forme juridique a partir du referentiel deja charge. */
export function libelleForme(formes: readonly FormeJuridique[], formeJuridiqueId: string): string {
  return formes.find((f) => f.id === formeJuridiqueId)?.libelle ?? '—';
}
