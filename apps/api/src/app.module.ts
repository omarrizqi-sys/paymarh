import { join } from 'node:path';
import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from './common/audit/audit.module.js';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { TenancyModule } from './common/tenancy/tenancy.module.js';
import { TenantContextMiddleware } from './common/tenancy/tenant-context.middleware.js';
import { AccountsController } from './modules/accounts/accounts.controller.js';
import { AccountsModule } from './modules/accounts/accounts.module.js';
import { AdminSocietesController } from './modules/companies/admin-societes.controller.js';
import { CompaniesModule } from './modules/companies/companies.module.js';
import { ComptesBancairesController } from './modules/companies/comptes-bancaires.controller.js';
import { EtablissementsController } from './modules/companies/etablissements.controller.js';
import { ReferentielsController } from './modules/companies/referentiels.controller.js';
import { SocietesController } from './modules/companies/societes.controller.js';
import { HealthModule } from './modules/health/health.module.js';
import { EmploisController } from './modules/salaries/emplois.controller.js';
import { SalariesModule } from './modules/salaries/salaries.module.js';
import { SalariesController } from './modules/salaries/salaries.controller.js';
import { UsersController } from './modules/users/users.controller.js';
import { UsersModule } from './modules/users/users.module.js';
import { ConformiteRoutesModule } from './common/conformite-routes/conformite-routes.module.js';
import { PermissionsModule } from './common/permissions/permissions.module.js';
import { RemunerationModule } from './common/remuneration/remuneration.module.js';

/**
 * Module racine de l API.
 *
 * Les modules metier s ajoutent ici. CompaniesModule porte la fiche societe
 * (etape 1.1.b) : societes, etablissements, comptes bancaires, referentiels.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '..', '..', '.env'),
        join(import.meta.dirname, '..', '..', '..', '.env'),
      ],
    }),
    PrismaModule,
    TenancyModule,
    AuditModule,
    HealthModule,
    ConformiteRoutesModule,
    PermissionsModule,
    RemunerationModule,
    AccountsModule,
    CompaniesModule,
    SalariesModule,
    UsersModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantContextMiddleware)
      .forRoutes(
        AccountsController,
        UsersController,
        SocietesController,
        EtablissementsController,
        ComptesBancairesController,
        ReferentielsController,
        AdminSocietesController,
        SalariesController,
        EmploisController
      );
  }
}
