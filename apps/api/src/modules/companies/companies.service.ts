import { Injectable, NotFoundException } from '@nestjs/common';
import type { Company, ListResponse, Uuid } from '@paymarh/shared-types';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { TenantContextService } from '../../common/tenancy/tenant-context.service.js';
import { accountScope } from '../../common/tenancy/tenant-scope.js';

/** Ligne telle que Prisma la renvoie, avant serialisation des dates. */
interface CompanyRow {
  id: string;
  accountId: string;
  codeDossier: string;
  raisonSociale: string;
  nomCommercial: string | null;
  formeJuridiqueId: string;
  etatDossier: 'EN_MONTAGE' | 'EN_PRODUCTION' | 'INACTIVE';
  regimeDeBase: 'NON_AGRICOLE';
  periodicitePaie: 'MENSUEL';
  moisDebutMontage: string;
  moisDebutProduction: string;
  dateInactivite: string | null;
  moisEnCours: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convertit une ligne de base en objet d API.
 * Les dates sont serialisees en ISO 8601 : le contrat public de l API ne
 * manipule jamais d objet `Date` (voir @paymarh/shared-types).
 */
function toCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    accountId: row.accountId,
    codeDossier: row.codeDossier,
    raisonSociale: row.raisonSociale,
    nomCommercial: row.nomCommercial,
    formeJuridiqueId: row.formeJuridiqueId,
    etatDossier: row.etatDossier,
    regimeDeBase: row.regimeDeBase,
    periodicitePaie: row.periodicitePaie,
    moisDebutMontage: row.moisDebutMontage,
    moisDebutProduction: row.moisDebutProduction,
    dateInactivite: row.dateInactivite,
    moisEnCours: row.moisEnCours,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * GRAINE - module societes (lecture).
 *
 * Etape 1.1.b etendra ce service avec les ecritures et les permissions.
 * Ici on conserve la demonstration du filtrage multi-tenant.
 */
@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService
  ) {}

  async findAll(): Promise<ListResponse<Company>> {
    const context = this.tenantContext.getOrThrow();

    const rows = await this.prisma.company.findMany({
      where: accountScope(context),
      orderBy: { raisonSociale: 'asc' },
    });

    return { items: rows.map(toCompany), total: rows.length };
  }

  async findOne(id: Uuid): Promise<Company> {
    const context = this.tenantContext.getOrThrow();

    const row = await this.prisma.company.findFirst({
      where: { ...accountScope(context), id },
    });

    if (!row) {
      throw new NotFoundException(`Societe introuvable : ${id}`);
    }

    return toCompany(row);
  }
}
