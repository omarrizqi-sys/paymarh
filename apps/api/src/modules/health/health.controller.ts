import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@paymarh/shared-types';
import { HealthService } from './health.service.js';

/**
 * `GET /health`
 *
 * Seule route publique de l API : pas de garde de tenant, puisqu elle ne lit
 * aucune donnee. C est elle que le back-office interroge pour afficher son
 * etat de connexion.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check(): HealthResponse {
    return this.healthService.check();
  }
}
