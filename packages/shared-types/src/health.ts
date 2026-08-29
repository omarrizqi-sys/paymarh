import type { IsoDateTime } from './common';

/**
 * Reponse de `GET /health`.
 *
 * C est le seul contrat reellement implemente au module 0 : il sert de
 * temoin que l API tourne et que le back-office sait la joindre.
 */
export interface HealthResponse {
  readonly status: 'ok';

  /** Instant de la reponse, au format ISO 8601 UTC. */
  readonly timestamp: IsoDateTime;

  /** Version de l API, alignee sur son package.json. */
  readonly version: string;
}
