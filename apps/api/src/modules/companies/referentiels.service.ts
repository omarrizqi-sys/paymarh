import { Injectable } from '@nestjs/common';
import type { ApiResponse, ListResponse } from '@paymarh/shared-types';
import { assertPeutFaire } from '../../common/permissions/peut-faire.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { TenantContextService } from '../../common/tenancy/tenant-context.service.js';
import { ok } from './api-response.js';

@Injectable()
export class ReferentielsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService
  ) {}

  private assertLecture(): void {
    assertPeutFaire(this.tenantContext.getOrThrow(), 'referentiel.lire');
  }

  async banques(): Promise<ApiResponse<ListResponse<unknown>>> {
    this.assertLecture();
    const items = await this.prisma.banque.findMany({ orderBy: { nom: 'asc' } });
    return ok({ items, total: items.length });
  }

  async joursFeries(): Promise<ApiResponse<ListResponse<unknown>>> {
    this.assertLecture();
    const items = await this.prisma.jourFerie.findMany({ orderBy: { code: 'asc' } });
    return ok({ items, total: items.length });
  }

  async formesJuridiques(): Promise<ApiResponse<ListResponse<unknown>>> {
    this.assertLecture();
    const items = await this.prisma.formeJuridique.findMany({ orderBy: { code: 'asc' } });
    return ok({ items, total: items.length });
  }

  async typesHeures(): Promise<ApiResponse<ListResponse<unknown>>> {
    this.assertLecture();
    const items = await this.prisma.typeHeure.findMany({ orderBy: { ordre: 'asc' } });
    return ok({ items, total: items.length });
  }

  async typesExoneration(): Promise<ApiResponse<ListResponse<unknown>>> {
    this.assertLecture();
    const items = await this.prisma.typeExoneration.findMany({ orderBy: { code: 'asc' } });
    return ok({ items, total: items.length });
  }
}
