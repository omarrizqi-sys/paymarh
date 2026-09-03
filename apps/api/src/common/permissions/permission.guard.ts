import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Permission } from '@paymarh/shared-types';
import { PrismaService } from '../prisma/prisma.service.js';
import { accountScope } from '../tenancy/tenant-scope.js';
import { TenantContextService } from '../tenancy/tenant-context.service.js';
import type { Request } from 'express';
import {
  PERMISSION_SERVICE,
  type PermissionService,
} from './permission.service.js';
import {
  CLE_PERIMETRE_EMPLOI,
  CLE_PERIMETRE_SALARIE,
  CLE_PERMISSION,
} from './requiert-permission.decorator.js';
import { HEADER_PERMISSIONS_REFUSEES, lirePermissionsRefuseesDepuisEnTete } from './permissions-refusees.header.js';
import { EXEMPTIONS_ROUTES_MODULE_1 } from '../conformite-routes/exemptions-module-1.js';
import { cleRouteHttp } from '../conformite-routes/route-cle.js';

const MESSAGE_NEUTRE = 'Ressource introuvable.';
const MESSAGE_INTERDIT = 'Action non autorisee.';

/**
 * POINT DE PASSAGE UNIQUE des droits pour la fiche salarie (etape 2.1.b).
 * Aucun controleur ni service ne doit verifier une permission ailleurs.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(PERMISSION_SERVICE) private readonly permissions: PermissionService,
    private readonly tenantContext: TenantContextService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<Permission | undefined>(
      CLE_PERMISSION,
      [context.getHandler(), context.getClass()]
    );

    if (permission === undefined) {
      const route = cleRouteHttp(context, this.reflector);
      if (route !== null && EXEMPTIONS_ROUTES_MODULE_1.has(route)) {
        return true;
      }
      throw new InternalServerErrorException(
        'Route sans @RequiertPermission : acces refuse (devrait etre detecte au demarrage).'
      );
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();

    const parametreSalarie = this.reflector.getAllAndOverride<string | undefined>(
      CLE_PERIMETRE_SALARIE,
      [context.getHandler(), context.getClass()]
    );
    const parametreEmploi = this.reflector.getAllAndOverride<string | undefined>(
      CLE_PERIMETRE_EMPLOI,
      [context.getHandler(), context.getClass()]
    );

    if (parametreSalarie !== undefined) {
      await this.verifierPerimetreSalarie(request.params ?? {}, parametreSalarie);
    } else if (parametreEmploi !== undefined) {
      await this.verifierPerimetreEmploi(request.params ?? {}, parametreEmploi);
    }

    const ctx = this.tenantContext.getOrThrow();
    const refusees = lirePermissionsRefuseesDepuisEnTete(
      request.headers[HEADER_PERMISSIONS_REFUSEES]
    );
    if (!this.permissions.possedePermission(ctx, permission, refusees)) {
      throw new ForbiddenException(MESSAGE_INTERDIT);
    }

    return true;
  }

  private async verifierPerimetreSalarie(
    params: Record<string, string>,
    nomParametre: string
  ): Promise<void> {
    const id = params[nomParametre];
    if (typeof id !== 'string' || id.length === 0) {
      throw new NotFoundException(MESSAGE_NEUTRE);
    }

    const ctx = this.tenantContext.getOrThrow();
    const salarie = await this.prisma.salarie.findFirst({
      where: {
        id,
        company: accountScope(ctx),
      },
      select: { id: true },
    });

    if (salarie === null) {
      throw new NotFoundException(MESSAGE_NEUTRE);
    }
  }

  private async verifierPerimetreEmploi(
    params: Record<string, string>,
    nomParametre: string
  ): Promise<void> {
    const id = params[nomParametre];
    if (typeof id !== 'string' || id.length === 0) {
      throw new NotFoundException(MESSAGE_NEUTRE);
    }

    const ctx = this.tenantContext.getOrThrow();
    const emploi = await this.prisma.emploi.findFirst({
      where: {
        id,
        salarie: { company: accountScope(ctx) },
      },
      select: { id: true },
    });

    if (emploi === null) {
      throw new NotFoundException(MESSAGE_NEUTRE);
    }
  }
}
