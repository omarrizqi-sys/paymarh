import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JournaliserEcriture } from '../../common/audit/journaliser-ecriture.decorator.js';
import { ExigeIfMatch } from '../../common/conformite-routes/exige-if-match.decorator.js';
import {
  RouteSansEcriture,
  SansIfMatch,
} from '../../common/conformite-routes/route-sans-ecriture.decorator.js';
import {
  PerimetreSalarie,
  RequiertPermission,
} from '../../common/permissions/requiert-permission.decorator.js';
import { TenantGuard } from '../../common/tenancy/tenant.guard.js';
import {
  CreerSalarieDto,
  ListerSalariesQueryDto,
  ModifierCoordonneesSalarieDto,
  ModifierDatesSalarieDto,
  ModifierIdentifiantsLegauxSalarieDto,
  ModifierIdentiteSalarieDto,
  VerifierSalarieDto,
} from './dto/salarie.dto.js';
import { CreerEmploiDto } from './dto/emploi.dto.js';
import { EmploisService } from './emplois.service.js';
import { SalariesService } from './salaries.service.js';
import {
  EN_TETE_IF_MATCH,
  VerrouillageOptimisteService,
} from './verrouillage/verrouillage-optimiste.service.js';

@Controller('salaries')
@UseGuards(TenantGuard)
export class SalariesController {
  constructor(
    private readonly salaries: SalariesService,
    private readonly emplois: EmploisService,
    private readonly verrouillage: VerrouillageOptimisteService
  ) {}

  @Get()
  @RequiertPermission('salarie.lire')
  lister(@Query() query: ListerSalariesQueryDto) {
    return this.salaries.lister(query);
  }

  @Post('verifier')
  @RequiertPermission('salarie.lire')
  @RouteSansEcriture()
  verifier(@Body() dto: VerifierSalarieDto) {
    return this.salaries.verifier(dto);
  }

  @Post()
  @RequiertPermission('salarie.creer')
  @JournaliserEcriture({ entite: 'Salarie', action: 'CREER_SALARIE' })
  @SansIfMatch()
  creer(@Body() dto: CreerSalarieDto) {
    return this.salaries.creer(dto);
  }

  @Post(':salarieId/emplois')
  @RequiertPermission('emploi.creer')
  @PerimetreSalarie('salarieId')
  @JournaliserEcriture({ entite: 'Emploi', action: 'CREER_EMPLOI' })
  @SansIfMatch()
  creerEmploi(
    @Param('salarieId', ParseUUIDPipe) salarieId: string,
    @Body() dto: CreerEmploiDto
  ) {
    return this.emplois.creer(salarieId, dto);
  }

  @Get(':id/impact-suppression')
  @RequiertPermission('salarie.supprimer')
  @PerimetreSalarie('id')
  impactSuppression(@Param('id', ParseUUIDPipe) id: string) {
    return this.salaries.impactSuppression(id);
  }

  @Get(':id')
  @RequiertPermission('salarie.lire')
  @PerimetreSalarie('id')
  lire(@Param('id', ParseUUIDPipe) id: string) {
    return this.salaries.lire(id);
  }

  @Patch(':id/identite')
  @RequiertPermission('salarie.modifier')
  @PerimetreSalarie('id')
  @JournaliserEcriture({ entite: 'Salarie', action: 'MODIFIER_IDENTITE_SALARIE' })
  @ExigeIfMatch()
  modifierIdentite(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModifierIdentiteSalarieDto,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.salaries.modifierIdentite(id, dto, version);
  }

  @Patch(':id/coordonnees')
  @RequiertPermission('salarie.modifier')
  @PerimetreSalarie('id')
  @JournaliserEcriture({ entite: 'Salarie', action: 'MODIFIER_COORDONNEES_SALARIE' })
  @ExigeIfMatch()
  modifierCoordonnees(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModifierCoordonneesSalarieDto,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.salaries.modifierCoordonnees(id, dto, version);
  }

  @Patch(':id/identifiants-legaux')
  @RequiertPermission('salarie.modifier')
  @PerimetreSalarie('id')
  @JournaliserEcriture({ entite: 'Salarie', action: 'MODIFIER_IDENTIFIANTS_SALARIE' })
  @ExigeIfMatch()
  modifierIdentifiantsLegaux(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModifierIdentifiantsLegauxSalarieDto,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.salaries.modifierIdentifiantsLegaux(id, dto, version);
  }

  @Patch(':id/dates')
  @RequiertPermission('salarie.modifier')
  @PerimetreSalarie('id')
  @JournaliserEcriture({ entite: 'Salarie', action: 'MODIFIER_DATES_SALARIE' })
  @ExigeIfMatch()
  modifierDates(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModifierDatesSalarieDto,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.salaries.modifierDates(id, dto, version);
  }

  @Delete(':id')
  @RequiertPermission('salarie.supprimer')
  @PerimetreSalarie('id')
  @JournaliserEcriture({ entite: 'Salarie', action: 'SUPPRIMER_SALARIE' })
  @ExigeIfMatch()
  supprimer(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('confirmationJeton') confirmationJeton: string | undefined,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.salaries.supprimer(id, confirmationJeton, version);
  }
}
