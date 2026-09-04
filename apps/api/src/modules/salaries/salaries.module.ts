import { Module } from '@nestjs/common';
import { PermissionsModule } from '../../common/permissions/permissions.module.js';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { TenancyModule } from '../../common/tenancy/tenancy.module.js';
import { BULLETIN_PORT } from './bulletin/bulletin.port.js';
import { BulletinPortProvisoire } from './bulletin/bulletin.port.provisoire.js';
import { EmploisController } from './emplois.controller.js';
import { EmploisService } from './emplois.service.js';
import { HistorisationEmploiService } from './historisation-emploi.service.js';
import { HistorisationLigneTemporelleService } from './historisation-ligne-temporelle.service.js';
import { MoisEnCoursService } from './mois-en-cours/mois-en-cours.service.js';
import { REFERENTIEL_NATIONAL_PORT } from './referentiel-national/referentiel-national.port.js';
import { ReferentielNationalPortProvisoire } from './referentiel-national/referentiel-national.port.provisoire.js';
import { ResolutionHeritageService } from './heritage/resolution-heritage.service.js';
import { SalariesController } from './salaries.controller.js';
import { SalariesService } from './salaries.service.js';
import { TableauxEmploiService } from './tableaux-emploi.service.js';
import { TableauxSalarieService } from './tableaux-salarie.service.js';
import { PropagationTahfizService } from './tahfiz/propagation-tahfiz.service.js';
import { VerrouillageOptimisteService } from './verrouillage/verrouillage-optimiste.service.js';

/**
 * Module fiche salarie — socle transverse, endpoints salarie et emplois (etapes 2.1.b).
 */
@Module({
  imports: [PrismaModule, TenancyModule, PermissionsModule],
  controllers: [SalariesController, EmploisController],
  providers: [
    SalariesService,
    EmploisService,
    TableauxSalarieService,
    TableauxEmploiService,
    HistorisationEmploiService,
    HistorisationLigneTemporelleService,
    MoisEnCoursService,
    VerrouillageOptimisteService,
    ResolutionHeritageService,
    PropagationTahfizService,
    {
      provide: BULLETIN_PORT,
      useClass: BulletinPortProvisoire,
    },
    {
      provide: REFERENTIEL_NATIONAL_PORT,
      useClass: ReferentielNationalPortProvisoire,
    },
  ],
  exports: [
    MoisEnCoursService,
    VerrouillageOptimisteService,
    BULLETIN_PORT,
    REFERENTIEL_NATIONAL_PORT,
    SalariesService,
    EmploisService,
    PropagationTahfizService,
  ],
})
export class SalariesModule {}
