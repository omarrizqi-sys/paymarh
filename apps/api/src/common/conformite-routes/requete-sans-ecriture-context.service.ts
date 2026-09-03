import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import { EcritureInterditeRouteSansEcritureError } from './ecriture-interdite-route-sans-ecriture.error.js';

export interface ContexteRequeteSansEcriture {
  readonly route: string;
}

/**
 * Porte le marquage « sans ecriture » pendant toute la duree d une requete HTTP
 * decoree @RouteSansEcriture (meme mecanisme que TenantContextService).
 */
@Injectable()
export class RequeteSansEcritureContextService {
  private readonly storage = new AsyncLocalStorage<ContexteRequeteSansEcriture>();

  run<T>(route: string, callback: () => T): T {
    return this.storage.run({ route }, callback);
  }

  estSansEcriture(): boolean {
    return this.storage.getStore() !== undefined;
  }

  getRoute(): string | undefined {
    return this.storage.getStore()?.route;
  }

  refuserEcriture(operation: string): void {
    const route = this.storage.getStore()?.route;
    if (route !== undefined) {
      throw new EcritureInterditeRouteSansEcritureError(route, operation);
    }
  }
}
