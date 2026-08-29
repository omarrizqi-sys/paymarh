import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { TenantContext } from '@paymarh/shared-types';

/**
 * Porte le contexte multi-tenant pendant toute la duree d une requete.
 *
 * On s appuie sur AsyncLocalStorage (module natif de Node) : le contexte
 * suit automatiquement la chaine des appels asynchrones, sans qu il faille le
 * passer en parametre a chaque fonction. Un service metier peut donc
 * l obtenir a tout moment, ce qui evite l oubli le plus dangereux du
 * multi-tenant : "j ai oublie de transmettre l accountId".
 */
@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantContext>();

  /**
   * Execute `callback` avec le contexte fourni. Tout ce qui se produit dans
   * `callback`, y compris en asynchrone, voit ce contexte.
   */
  run<T>(context: TenantContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  /** Contexte courant, ou `undefined` hors d une requete authentifiee. */
  get(): TenantContext | undefined {
    return this.storage.getStore();
  }

  /**
   * Contexte courant, ou erreur 401.
   *
   * C est la methode a utiliser dans les services : elle echoue de maniere
   * FERMEE. Sans contexte, on ne lit rien - jamais de repli silencieux sur
   * une requete non filtree.
   */
  getOrThrow(): TenantContext {
    const context = this.storage.getStore();

    if (!context) {
      throw new UnauthorizedException(
        "Aucun contexte de tenant pour cette requete : l'acces aux donnees est refuse."
      );
    }

    return context;
  }
}
