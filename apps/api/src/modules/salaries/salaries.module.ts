import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { TenancyModule } from '../../common/tenancy/tenancy.module.js';
import { BULLETIN_PORT } from './bulletin/bulletin.port.js';
import { BulletinPortProvisoire } from './bulletin/bulletin.port.provisoire.js';
import { MoisEnCoursService } from './mois-en-cours/mois-en-cours.service.js';
import { SalariesController } from './salaries.controller.js';
import { SalariesService } from './salaries.service.js';
import { VerrouillageOptimisteService } from './verrouillage/verrouillage-optimiste.service.js';

/**
 * Module fiche salarie — socle transverse et endpoints salarie (etape 2.1.b).
 */
@Module({
  imports: [PrismaModule, TenancyModule],
  controllers: [SalariesController],
  providers: [
    SalariesService,
    MoisEnCoursService,
    VerrouillageOptimisteService,
    {
      provide: BULLETIN_PORT,
      useClass: BulletinPortProvisoire,
    },
  ],
  exports: [MoisEnCoursService, VerrouillageOptimisteService, BULLETIN_PORT, SalariesService],
})
export class SalariesModule {}
