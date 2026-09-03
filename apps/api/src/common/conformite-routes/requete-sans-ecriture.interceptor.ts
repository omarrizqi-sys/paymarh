import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { CLE_ROUTE_SANS_ECRITURE } from './route-sans-ecriture.decorator.js';
import { cleRouteHttp } from './route-cle.js';
import { RequeteSansEcritureContextService } from './requete-sans-ecriture-context.service.js';

/** Installe le contexte sans ecriture pour les routes @RouteSansEcriture. */
@Injectable()
export class RequeteSansEcritureInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly sansEcriture: RequeteSansEcritureContextService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const marque =
      this.reflector.get<boolean | undefined>(CLE_ROUTE_SANS_ECRITURE, context.getHandler()) ===
      true;

    if (!marque) {
      return next.handle();
    }

    const route = cleRouteHttp(context, this.reflector);
    if (route === null) {
      return next.handle();
    }

    return new Observable((observer) => {
      this.sansEcriture.run(route, () => {
        const subscription = next.handle().subscribe({
          next: (valeur) => observer.next(valeur),
          error: (erreur) => observer.error(erreur),
          complete: () => observer.complete(),
        });
        return () => subscription.unsubscribe();
      });
    });
  }
}
