import { Injectable, NotFoundException } from '@nestjs/common';
import type { ApiResponse, Societe, Uuid } from '@paymarh/shared-types';
import { AuditService } from '../../common/audit/audit.service.js';
import { assertPeutFaire } from '../../common/permissions/peut-faire.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { TenantContextService } from '../../common/tenancy/tenant-context.service.js';
import { ok } from './api-response.js';
import type { ForcerRegimeDto } from './dto/societe.dto.js';
import { toSociete } from './mappers.js';

/**
 * Chemin elargi explicite du PLATFORM_ADMIN.
 * Hors hierarchie multi-tenant normale ; chaque appel est journalise.
 */
@Injectable()
export class AdminSocietesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly audit: AuditService
  ) {}

  async forcerRegimeDeBase(
    id: Uuid,
    dto: ForcerRegimeDto
  ): Promise<ApiResponse<Societe>> {
    const context = this.tenantContext.getOrThrow();
    assertPeutFaire(context, 'societe.forcer-regime-de-base', { companyId: id });

    const societe = await this.prisma.company.findFirst({ where: { id } });
    if (!societe) {
      throw new NotFoundException(`Societe introuvable : ${id}`);
    }

    const ancienne = societe.regimeDeBase;
    const maj = await this.prisma.company.update({
      where: { id },
      data: { regimeDeBase: dto.regimeDeBase },
    });

    await this.audit.record({
      userId: context.userId,
      action: `FORCER_REGIME_DE_BASE ancienne=${ancienne} nouvelle=${dto.regimeDeBase} motif=${dto.motif}`,
      targetType: 'Company',
      targetId: id,
    });

    return ok(toSociete(maj));
  }
}
