import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { AuditEcritureInterceptor } from './audit-ecriture.interceptor.js';
import { AuditService } from './audit.service.js';

/**
 * Global : la tracabilite doit etre accessible depuis n importe quel module
 * sans ceremonie, pour qu il n y ait aucune excuse a ne pas journaliser.
 */
@Global()
@Module({
  imports: [PrismaModule, TenancyModule],
  providers: [
    AuditService,
    AuditEcritureInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditEcritureInterceptor,
    },
  ],
  exports: [AuditService],
})
export class AuditModule {}
