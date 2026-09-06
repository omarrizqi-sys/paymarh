import { InternalServerErrorException } from '@nestjs/common';

/** Leve lorsqu une route @RouteSansEcriture tente une ecriture en base. */
export class EcritureInterditeRouteSansEcritureError extends InternalServerErrorException {
  readonly route: string;
  readonly operation: string;

  constructor(route: string, operation: string) {
    const message = `Écriture interdite sur la route ${route} : l’opération « ${operation} » est refusée en contexte sans écriture.`;
    super(message);
    this.name = 'EcritureInterditeRouteSansEcritureError';
    this.route = route;
    this.operation = operation;
  }
}
