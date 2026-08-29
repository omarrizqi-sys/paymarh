import { Injectable, NotFoundException } from '@nestjs/common';
import type { Company, ListResponse, Uuid } from '@paymarh/shared-types';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { TenantContextService } from '../../common/tenancy/tenant-context.service.js';
import { accountScope } from '../../common/tenancy/tenant-scope.js';

/** Ligne telle que Prisma la renvoie, avant serialisation des dates. */
interface CompanyRow {
  id: string;
  accountId: string;
  name: string;
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
    name: row.name,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * GRAINE - module societes.
 *
 * Aucune logique de paie ici : ce service existe au module 0 uniquement pour
 * DEMONTRER le filtrage multi-tenant sur une vraie table. Il est volontairement
 * en lecture seule.
 */
@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService
  ) {}

  async findAll(): Promise<ListResponse<Company>> {
    const context = this.tenantContext.getOrThrow();

    // Le `where` part TOUJOURS de accountScope() : c est ce qui garantit
    // qu on ne voit que les societes de son propre compte.
    const rows = await this.prisma.company.findMany({
      where: accountScope(context),
      orderBy: { name: 'asc' },
    });

    return { items: rows.map(toCompany), total: rows.length };
  }

  async findOne(id: Uuid): Promise<Company> {
    const context = this.tenantContext.getOrThrow();

    // `findFirst` et non `findUnique` : on veut que le filtre par compte
    // fasse partie de la recherche elle-meme. Avec `findUnique({ id })`, on
    // trouverait la societe d un AUTRE compte avant de pouvoir la refuser.
    const row = await this.prisma.company.findFirst({
      where: { ...accountScope(context), id },
    });

    if (!row) {
      // 404 et non 403, deliberement : repondre "interdit" revelerait
      // qu une societe portant cet identifiant existe chez un autre client.
      throw new NotFoundException(`Societe introuvable : ${id}`);
    }

    return toCompany(row);
  }
}
