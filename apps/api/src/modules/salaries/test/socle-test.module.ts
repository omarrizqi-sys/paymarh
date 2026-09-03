import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { TenantContextMiddleware } from '../../../common/tenancy/tenant-context.middleware.js';
import { PrismaModule } from '../../../common/prisma/prisma.module.js';
import { TenancyModule } from '../../../common/tenancy/tenancy.module.js';
import { SalariesModule } from '../salaries.module.js';
import { SocleSalarieTestController } from './socle-salarie-test.controller.js';

if (process.env.NODE_ENV === 'production') {
  throw new Error(
    'SocleTestModule ne doit jamais etre charge en production : il expose des routes de test sur des donnees salarie.'
  );
}

/** Module de test HTTP pour le socle 2.1.b — importe uniquement dans les tests. */
@Module({
  imports: [SalariesModule, PrismaModule, TenancyModule],
  controllers: [SocleSalarieTestController],
})
export class SocleTestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantContextMiddleware).forRoutes(SocleSalarieTestController);
  }
}
