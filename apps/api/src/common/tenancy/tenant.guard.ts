import { type CanActivate, Injectable, UnauthorizedException } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service.js';

/**
 * Garde d isolation multi-tenant.
 *
 * A poser sur TOUT controleur qui touche a des donnees. Elle ne fait qu une
 * chose, mais elle la fait systematiquement : verifier qu un contexte de
 * tenant existe. Le filtrage fin, lui, est applique par les fonctions de
 * tenant-scope.ts au moment de la requete en base.
 *
 * Seul `GET /health` s en passe : il ne lit aucune donnee.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContextService) {}

  canActivate(): boolean {
    const context = this.tenantContext.get();

    if (!context) {
      throw new UnauthorizedException(
        "Requete sans contexte de tenant : acces refuse. (Module 0 : renseignez l'en-tete 'x-paymarh-user-id'.)"
      );
    }

    return true;
  }
}
