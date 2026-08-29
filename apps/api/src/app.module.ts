import { join } from 'node:path';
import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from './common/audit/audit.module.js';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { TenancyModule } from './common/tenancy/tenancy.module.js';
import { TenantContextMiddleware } from './common/tenancy/tenant-context.middleware.js';
import { AccountsController } from './modules/accounts/accounts.controller.js';
import { AccountsModule } from './modules/accounts/accounts.module.js';
import { CompaniesController } from './modules/companies/companies.controller.js';
import { CompaniesModule } from './modules/companies/companies.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { UsersController } from './modules/users/users.controller.js';
import { UsersModule } from './modules/users/users.module.js';

/**
 * Module racine de l API.
 *
 * Les modules `accounts`, `companies` et `users` sont des GRAINES : ils
 * existent pour porter le socle multi-tenant, pas pour faire de la paie.
 * Les modules metier viendront s ajouter ici, un par un.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Le monorepo n a qu un seul .env, a la racine. On tente deux chemins :
      // depuis le repertoire de travail (cas `pnpm dev` lance dans apps/api)
      // et depuis le code compile (dist/), pour rester robuste.
      envFilePath: [
        join(process.cwd(), '..', '..', '.env'),
        join(import.meta.dirname, '..', '..', '..', '.env'),
      ],
    }),
    PrismaModule,
    TenancyModule,
    AuditModule,
    HealthModule,
    AccountsModule,
    CompaniesModule,
    UsersModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Le contexte de tenant est installe sur toutes les routes qui touchent a
    // des donnees. `health` en est volontairement exclu : il doit repondre
    // meme sans utilisateur identifie.
    //
    // On enumere les controleurs plutot que d utiliser un joker : la liste est
    // explicite, donc verifiable d un coup d oeil. Tout nouveau controleur de
    // donnees DOIT etre ajoute ici.
    consumer
      .apply(TenantContextMiddleware)
      .forRoutes(AccountsController, CompaniesController, UsersController);
  }
}
