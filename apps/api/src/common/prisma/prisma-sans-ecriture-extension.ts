import type { PrismaClient } from '../../generated/prisma/client.js';
import type { RequeteSansEcritureContextService } from '../conformite-routes/requete-sans-ecriture-context.service.js';

const OPERATIONS_ECRITURE = new Set([
  'create',
  'createMany',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
]);

/** Extension Prisma bloquant toute ecriture en contexte @RouteSansEcriture. */
export function creerExtensionGardeSansEcriture(
  sansEcriture: RequeteSansEcritureContextService
): Parameters<PrismaClient['$extends']>[0] {
  const refuserSiMarque = (operation: string): void => {
    sansEcriture.refuserEcriture(operation);
  };

  return {
    name: 'garde-route-sans-ecriture',
    client: {
      $executeRaw({ args, query }) {
        refuserSiMarque('$executeRaw');
        return query(args);
      },
      $executeRawUnsafe({ args, query }) {
        refuserSiMarque('$executeRawUnsafe');
        return query(args);
      },
    },
    query: {
      $allModels: {
        async $allOperations({ operation, query, args }) {
          if (OPERATIONS_ECRITURE.has(operation)) {
            refuserSiMarque(operation);
          }
          return query(args);
        },
      },
    },
  };
}
