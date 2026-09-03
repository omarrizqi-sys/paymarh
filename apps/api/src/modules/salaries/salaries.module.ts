import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { TenancyModule } from '../../common/tenancy/tenancy.module.js';
import { BULLETIN_PORT } from './bulletin/bulletin.port.js';
import { BulletinPortProvisoire } from './bulletin/bulletin.port.provisoire.js';
import { MoisEnCoursService } from './mois-en-cours/mois-en-cours.service.js';
import { VerrouillageOptimisteService } from './verrouillage/verrouillage-optimiste.service.js';

/**
 * Socle transverse fiche salarie (etape 2.1.b) — sans endpoints metier.
 */
@Module({
  imports: [PrismaModule, TenancyModule],
  providers: [
    MoisEnCoursService,
    VerrouillageOptimisteService,
    {
      provide: BULLETIN_PORT,
      useClass: BulletinPortProvisoire,
    },
  ],
  exports: [MoisEnCoursService, VerrouillageOptimisteService, BULLETIN_PORT],
})
export class SalariesModule {}
