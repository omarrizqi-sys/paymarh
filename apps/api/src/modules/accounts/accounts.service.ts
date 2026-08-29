import { Injectable, NotFoundException } from '@nestjs/common';
import type { Account, AccountType } from '@paymarh/shared-types';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { TenantContextService } from '../../common/tenancy/tenant-context.service.js';
import { requireAccountId } from '../../common/tenancy/tenant-scope.js';

/** Ligne telle que Prisma la renvoie, avant serialisation des dates. */
interface AccountRow {
  id: string;
  name: string;
  type: AccountType;
  createdAt: Date;
  updatedAt: Date;
}

function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * GRAINE - module comptes (tenants).
 *
 * Il n existe volontairement AUCUNE methode "lister tous les comptes" : une
 * telle methode serait le premier pas vers une fuite inter-comptes. Le jour ou
 * l administration plateforme sera construite, elle passera par le chemin
 * explicite `crossAccountScope` + journalisation.
 */
@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService
  ) {}

  /** Le compte de l utilisateur courant, et lui seul. */
  async findMine(): Promise<Account> {
    const context = this.tenantContext.getOrThrow();
    const accountId = requireAccountId(context);

    const row = await this.prisma.account.findUnique({ where: { id: accountId } });

    if (!row) {
      throw new NotFoundException(`Compte introuvable : ${accountId}`);
    }

    return toAccount(row);
  }
}
