import { Module } from '@nestjs/common';
import { AdminSocietesController } from './admin-societes.controller.js';
import { AdminSocietesService } from './admin-societes.service.js';
import { ComptesBancairesController } from './comptes-bancaires.controller.js';
import { ComptesBancairesService } from './comptes-bancaires.service.js';
import { EtablissementsController } from './etablissements.controller.js';
import { EtablissementsService } from './etablissements.service.js';
import { ReferentielsController } from './referentiels.controller.js';
import { ReferentielsService } from './referentiels.service.js';
import { SocietesController } from './societes.controller.js';
import { SocietesService } from './societes.service.js';
import { SalariesModule } from '../salaries/salaries.module.js';

@Module({
  imports: [SalariesModule],
  controllers: [
    SocietesController,
    EtablissementsController,
    ComptesBancairesController,
    ReferentielsController,
    AdminSocietesController,
  ],
  providers: [
    SocietesService,
    EtablissementsService,
    ComptesBancairesService,
    ReferentielsService,
    AdminSocietesService,
  ],
  exports: [SocietesService],
})
export class CompaniesModule {}
