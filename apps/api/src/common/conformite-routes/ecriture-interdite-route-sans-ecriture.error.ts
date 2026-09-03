import { InternalServerErrorException } from '@nestjs/common';

/** Leve lorsqu une route @RouteSansEcriture tente une ecriture en base. */
export class EcritureInterditeRouteSansEcritureError extends InternalServerErrorException {
  readonly route: string;
  readonly operation: string;

  constructor(route: string, operation: string) {
    const message = `Ecriture interdite sur la route ${route} : l operation « ${operation} » est refusee en contexte sans ecriture.`;
    super(message);
    this.name = 'EcritureInterditeRouteSansEcritureError';
    this.route = route;
    this.operation = operation;
  }
}
