import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuditEcart } from '@paymarh/shared-types';
import type { Observable } from 'rxjs';
import { from, switchMap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { TenantContextService } from '../tenancy/tenant-context.service.js';
import { AuditService } from './audit.service.js';
import {
  CLE_JOURNALISER_ECRITURE,
  type OptionsJournalEcriture,
} from './journaliser-ecriture.decorator.js';

function calculerEcart(
  avant: Record<string, unknown>,
  apres: Record<string, unknown>
): AuditEcart | null {
  const champs: AuditEcart['champs'] = [];
  const cles = new Set([...Object.keys(avant), ...Object.keys(apres)]);

  for (const nom of cles) {
    const ancienne = avant[nom];
    const nouvelle = apres[nom];
    if (JSON.stringify(ancienne) !== JSON.stringify(nouvelle)) {
      champs.push({ nom, ancienne, nouvelle });
    }
  }

  return champs.length > 0 ? { champs } : null;
}

function extraireDonnees(reponse: unknown): Record<string, unknown> | null {
  if (typeof reponse !== 'object' || reponse === null) {
    return null;
  }

  const enveloppe = reponse as Record<string, unknown>;
  if ('donnees' in enveloppe && typeof enveloppe.donnees === 'object' && enveloppe.donnees !== null) {
    return enveloppe.donnees as Record<string, unknown>;
  }

  return enveloppe;
}

/**
 * Journalise une entree AuditLog par requete d ecriture reussie decoree.
 */
@Injectable()
export class AuditEcritureInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.getAllAndOverride<OptionsJournalEcriture | undefined>(
      CLE_JOURNALISER_ECRITURE,
      [context.getHandler(), context.getClass()]
    );

    if (options === undefined) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<{ params?: Record<string, string> }>();
    const idParam = options.idParam ?? 'id';
    const targetId = request.params?.[idParam];

    if (typeof targetId !== 'string') {
      return next.handle();
    }

    const promesseAvant = options.chargerAvant
      ? options.chargerAvant(targetId)
      : this.chargerEntiteParDefaut(options.entite, targetId);

    return from(promesseAvant).pipe(
      switchMap((avant) =>
        next.handle().pipe(
          switchMap(async (reponse) => {
            const apres = extraireDonnees(reponse);
            const ctx = this.tenantContext.getOrThrow();
            const ecart =
              avant !== null && apres !== null ? calculerEcart(avant, apres) : null;

            await this.audit.record({
              userId: ctx.userId,
              accountId: ctx.accountId,
              companyId: ctx.companyId,
              action: options.action,
              targetType: options.entite,
              targetId,
              ecart,
            });

            return reponse;
          })
        )
      )
    );
  }

  private async chargerEntiteParDefaut(
    entite: string,
    id: string
  ): Promise<Record<string, unknown> | null> {
    switch (entite) {
      case 'Salarie': {
        const salarie = await this.prisma.salarie.findUnique({ where: { id } });
        return salarie as Record<string, unknown> | null;
      }
      case 'Emploi': {
        const emploi = await this.prisma.emploi.findUnique({ where: { id } });
        return emploi as Record<string, unknown> | null;
      }
      default:
        return null;
    }
  }
}
