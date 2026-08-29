import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { TenantContextService } from './tenant-context.service.js';

/**
 * En-tetes HTTP lus au module 0 pour identifier l appelant.
 *
 * ATTENTION - CE N EST PAS DE L AUTHENTIFICATION.
 *
 * Le module 0 n implemente volontairement AUCUNE authentification (ni login,
 * ni mot de passe, ni fournisseur d identite). Ces en-tetes sont un simple
 * relais de developpement, destine a pouvoir demontrer et tester l isolation
 * multi-tenant avant qu Auth.js ne soit branche.
 *
 * Ils seront SUPPRIMES et remplaces par la session Auth.js dans le module
 * dedie a l authentification. Aucune mise en production n est possible tant
 * que ce relais existe.
 */
export const HEADER_USER_ID = 'x-paymarh-user-id';
export const HEADER_COMPANY_ID = 'x-paymarh-company-id';

/** Un UUID et rien d autre : evite d envoyer une chaine arbitraire a la base. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Construit le contexte multi-tenant de la requete et l installe pour toute
 * sa duree.
 *
 * Comportement en cas de doute : on n installe AUCUN contexte. La garde
 * TenantGuard refusera alors la requete. On echoue ferme, jamais ouvert.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantContextMiddleware.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService
  ) {}

  async use(request: Request, _response: Response, next: NextFunction): Promise<void> {
    const userId = this.readHeader(request, HEADER_USER_ID);

    if (userId === null || !UUID_PATTERN.test(userId)) {
      next();
      return;
    }

    // Le role et le compte de rattachement ne sont JAMAIS lus depuis la
    // requete : ils viennent de la base. Sinon un appelant pourrait se
    // declarer PLATFORM_ADMIN ou changer de compte a volonte.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, accountId: true },
    });

    if (!user) {
      this.logger.warn(`Utilisateur inconnu refuse : ${userId}`);
      next();
      return;
    }

    const requestedCompanyId = this.readHeader(request, HEADER_COMPANY_ID);
    const companyId =
      requestedCompanyId !== null && UUID_PATTERN.test(requestedCompanyId)
        ? requestedCompanyId
        : null;

    this.tenantContext.run(
      {
        userId: user.id,
        role: user.role,
        accountId: user.accountId,
        companyId,
      },
      () => {
        next();
      }
    );
  }

  private readHeader(request: Request, name: string): string | null {
    const value = request.headers[name];

    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    return null;
  }
}
