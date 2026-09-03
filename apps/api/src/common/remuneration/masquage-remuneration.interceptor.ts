import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Permission } from '@paymarh/shared-types';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PERMISSION_SERVICE, type PermissionService } from '../permissions/permission.service.js';
import {
  HEADER_PERMISSIONS_REFUSEES,
  lirePermissionsRefuseesDepuisEnTete,
} from '../permissions/permissions-refusees.header.js';
import { TenantContextService } from '../tenancy/tenant-context.service.js';
import {
  contientRubriqueMasquee,
  retirerRubriquesMasquees,
  TOUTES_RUBRIQUES_REMUNERATION,
  type RubriqueRemuneration,
} from './rubriques-remuneration.js';

const PERMISSION_LECTURE: Permission = 'salarie.remuneration.lire';
const PERMISSION_ECRITURE: Permission = 'salarie.remuneration.ecrire';
const MESSAGE_INTERDIT = 'Action non autorisee.';

/**
 * Masque les rubriques de remuneration en lecture et refuse les ecritures
 * portant ces rubriques sans le droit adequat.
 */
@Injectable()
export class MasquageRemunerationInterceptor implements NestInterceptor {
  constructor(
    @Inject(PERMISSION_SERVICE) private readonly permissions: PermissionService,
    private readonly tenantContext: TenantContextService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const ctx = this.tenantContext.get();

    if (ctx === undefined) {
      const toutesRubriques = new Set(TOUTES_RUBRIQUES_REMUNERATION);
      if (
        this.estEcriture(request.method) &&
        contientRubriqueMasquee(request.body, toutesRubriques)
      ) {
        throw new ForbiddenException(MESSAGE_INTERDIT);
      }
      return next
        .handle()
        .pipe(map((donnees) => retirerRubriquesMasquees(donnees, toutesRubriques)));
    }

    const refusees = lirePermissionsRefuseesDepuisEnTete(
      request.headers[HEADER_PERMISSIONS_REFUSEES]
    );
    const toutesRubriques = new Set(TOUTES_RUBRIQUES_REMUNERATION);

    if (
      this.estEcriture(request.method) &&
      !this.permissions.possedePermission(ctx, PERMISSION_ECRITURE, refusees) &&
      contientRubriqueMasquee(request.body, toutesRubriques)
    ) {
      throw new ForbiddenException(MESSAGE_INTERDIT);
    }

    const rubriquesMasquees = this.rubriquesMasqueesLecture(ctx, refusees);
    if (rubriquesMasquees.size > 0) {
      return next
        .handle()
        .pipe(map((donnees) => retirerRubriquesMasquees(donnees, rubriquesMasquees)));
    }

    return next.handle();
  }

  private estEcriture(method: string | undefined): boolean {
    return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
  }

  private rubriquesMasqueesLecture(
    ctx: ReturnType<TenantContextService['getOrThrow']>,
    permissionsRefusees: ReadonlySet<string>
  ): ReadonlySet<RubriqueRemuneration> {
    if (this.permissions.possedePermission(ctx, PERMISSION_LECTURE, permissionsRefusees)) {
      return new Set();
    }
    return new Set(TOUTES_RUBRIQUES_REMUNERATION);
  }
}
