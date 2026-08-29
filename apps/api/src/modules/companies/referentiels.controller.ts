import { Controller, Get, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../../common/tenancy/tenant.guard.js';
import { ReferentielsService } from './referentiels.service.js';

@Controller('referentiels')
@UseGuards(TenantGuard)
export class ReferentielsController {
  constructor(private readonly referentiels: ReferentielsService) {}

  @Get('banques')
  banques() {
    return this.referentiels.banques();
  }

  @Get('jours-feries')
  joursFeries() {
    return this.referentiels.joursFeries();
  }

  @Get('formes-juridiques')
  formesJuridiques() {
    return this.referentiels.formesJuridiques();
  }

  @Get('types-heures')
  typesHeures() {
    return this.referentiels.typesHeures();
  }

  @Get('types-exoneration')
  typesExoneration() {
    return this.referentiels.typesExoneration();
  }
}
