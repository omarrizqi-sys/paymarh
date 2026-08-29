import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service.js';

/**
 * Global : la tracabilite doit etre accessible depuis n importe quel module
 * sans ceremonie, pour qu il n y ait aucune excuse a ne pas journaliser.
 */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
