import type { TenantContext } from '@paymarh/shared-types';
import type { Permission } from './permissions.js';
import { peutFaire } from './peut-faire.js';

function ajouterSi(
  liste: Permission[],
  context: TenantContext,
  permission: Permission,
  companyId?: string
): void {
  if (peutFaire(context, permission, { companyId })) {
    liste.push(permission);
  }
}

/** Operations autorisees sur une societe donnee. */
export function operationsSociete(context: TenantContext, companyId: string): readonly Permission[] {
  const ops: Permission[] = [];
  ajouterSi(ops, context, 'societe.lire', companyId);
  ajouterSi(ops, context, 'societe.modifier', companyId);
  ajouterSi(ops, context, 'societe.changer-etat', companyId);
  ajouterSi(ops, context, 'societe.supprimer', companyId);
  return ops;
}

/** Operations au niveau liste societes (ex. bouton creer). */
export function operationsListeSocietes(context: TenantContext): readonly Permission[] {
  const ops: Permission[] = [];
  ajouterSi(ops, context, 'societe.lire');
  ajouterSi(ops, context, 'societe.creer');
  return ops;
}

/** Operations autorisees sur un etablissement. */
export function operationsEtablissement(
  context: TenantContext,
  companyId: string
): readonly Permission[] {
  const ops: Permission[] = [];
  ajouterSi(ops, context, 'etablissement.lire', companyId);
  ajouterSi(ops, context, 'etablissement.creer', companyId);
  ajouterSi(ops, context, 'etablissement.modifier', companyId);
  ajouterSi(ops, context, 'etablissement.supprimer', companyId);
  ajouterSi(ops, context, 'etablissement.designer-principal', companyId);
  return ops;
}

/** Operations autorisees sur un compte bancaire. */
export function operationsCompteBancaire(
  context: TenantContext,
  companyId: string
): readonly Permission[] {
  const ops: Permission[] = [];
  ajouterSi(ops, context, 'compte-bancaire.lire', companyId);
  ajouterSi(ops, context, 'compte-bancaire.creer', companyId);
  ajouterSi(ops, context, 'compte-bancaire.modifier', companyId);
  ajouterSi(ops, context, 'compte-bancaire.cloturer', companyId);
  ajouterSi(ops, context, 'compte-bancaire.supprimer', companyId);
  return ops;
}
