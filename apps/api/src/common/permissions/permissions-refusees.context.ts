import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';

/**
 * Contexte de developpement : permissions refusees pour la requete courante.
 * Renseigne une seule fois par le middleware tenant (en-tete lu la-bas).
 */
@Injectable()
export class PermissionsRefuseesContext {
  private readonly storage = new AsyncLocalStorage<ReadonlySet<string>>();

  run<T>(permissionsRefusees: ReadonlySet<string>, callback: () => T): T {
    return this.storage.run(permissionsRefusees, callback);
  }

  lire(): ReadonlySet<string> {
    return this.storage.getStore() ?? new Set();
  }
}
