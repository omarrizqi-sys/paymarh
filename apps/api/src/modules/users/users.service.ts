import { Injectable } from '@nestjs/common';
import type { ListResponse, Role, User } from '@paymarh/shared-types';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { TenantContextService } from '../../common/tenancy/tenant-context.service.js';
import { accountScope } from '../../common/tenancy/tenant-scope.js';

/** Ligne telle que Prisma la renvoie, avant serialisation des dates. */
interface UserRow {
  id: string;
  email: string;
  accountId: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    accountId: row.accountId,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * GRAINE - module utilisateurs.
 *
 * Lecture seule, sans aucune notion de mot de passe ni de session : le
 * module 0 n implemente pas d authentification.
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService
  ) {}

  /**
   * Utilisateurs du compte courant.
   *
   * A noter : un PLATFORM_ADMIN obtient ici une erreur, et c est VOULU. Son
   * accountId est nul, donc accountScope() refuse. Le super-admin ne beneficie
   * d aucun passe-droit sur le chemin normal ; s il doit consulter un compte
   * client, il emprunte le chemin explicite et journalise.
   */
  async findAllInAccount(): Promise<ListResponse<User>> {
    const context = this.tenantContext.getOrThrow();

    const rows = await this.prisma.user.findMany({
      where: accountScope(context),
      orderBy: { email: 'asc' },
    });

    return { items: rows.map(toUser), total: rows.length };
  }

  /** Utilisateur a l origine de la requete courante. */
  async findMe(): Promise<User> {
    const context = this.tenantContext.getOrThrow();

    const row = await this.prisma.user.findUniqueOrThrow({
      where: { id: context.userId },
    });

    return toUser(row);
  }
}
