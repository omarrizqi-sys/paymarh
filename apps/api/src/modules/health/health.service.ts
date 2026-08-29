import { Injectable } from '@nestjs/common';
import type { HealthResponse } from '@paymarh/shared-types';
import { API_VERSION } from '../../version.js';

/**
 * Temoin de bonne sante de l API.
 *
 * Ne touche volontairement NI la base NI le contexte de tenant : il doit
 * pouvoir repondre meme quand tout le reste est casse, sinon il ne dit rien
 * d utile.
 */
@Injectable()
export class HealthService {
  check(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: API_VERSION,
    };
  }
}
