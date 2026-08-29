// ---------------------------------------------------------------------------
// COQUILLE AUTH.JS - DESACTIVEE AU MODULE 0
//
// Le module 0 n implemente AUCUNE authentification : pas de page de connexion,
// pas de fournisseur d identite, pas de mot de passe, pas de session.
//
// Ce fichier n existe que pour reserver l emplacement et fixer les decisions
// deja prises, afin que le module d authentification n ait qu a les activer :
//
//   - Auth.js (next-auth) sera la bibliotheque utilisee ;
//   - la session portera l identifiant de l utilisateur, son role et son
//     accountId, qui alimenteront le TenantContext de l API ;
//   - le back-office transmettra cette identite a l API, remplacant l en-tete
//     de developpement 'x-paymarh-user-id' utilise aujourd hui
//     (voir apps/api/src/common/tenancy/tenant-context.middleware.ts).
//
// AUCUNE dependance next-auth n est installee a ce stade : installer une
// bibliotheque d authentification sans l utiliser reviendrait a l exposer
// sans la maitriser. Elle sera ajoutee dans le module dedie.
// ---------------------------------------------------------------------------

/**
 * Forme de la session PaymaRH, une fois l authentification branchee.
 *
 * Declaree des maintenant pour que le contrat soit lisible, mais rien ne la
 * produit encore.
 */
export interface SessionPaymaRH {
  readonly userId: string;
  readonly email: string;
  readonly role: 'PLATFORM_ADMIN' | 'ACCOUNT_ADMIN' | 'MANAGER' | 'EMPLOYEE';
  readonly accountId: string | null;
}

/**
 * Interrupteur de la coquille.
 *
 * Tant qu il vaut `false`, aucune brique d authentification ne doit etre
 * activee. Le module d authentification le basculera a `true` en meme temps
 * qu il fournira une vraie implementation.
 */
export const AUTHENTIFICATION_ACTIVEE = false;

/**
 * Session de l utilisateur courant.
 *
 * Renvoie toujours `null` au module 0 : il n y a pas d utilisateur connecte,
 * et c est volontaire. Ne PAS faire renvoyer une fausse session a cette
 * fonction - ce serait creer une authentification factice, precisement ce que
 * le module 0 interdit.
 */
export function obtenirSession(): SessionPaymaRH | null {
  return null;
}
