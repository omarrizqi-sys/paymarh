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
  Put,
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
import {
  CreerPersonneAChargeDto,
  CreerPretDto,
  CreerSaisieSurSalaireDto,
  ModifierPersonneAChargeDto,
  ModifierPretDto,
  ModifierSaisieSurSalaireDto,
  RemplacerComptesBancairesDto,
} from './dto/tableaux-salarie.dto.js';
import { EmploisService } from './emplois.service.js';
import { SalariesService } from './salaries.service.js';
import { TableauxSalarieService } from './tableaux-salarie.service.js';
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
    private readonly tableaux: TableauxSalarieService,
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

  @Post(':id/personnes-a-charge')
  @RequiertPermission('salarie.modifier')
  @PerimetreSalarie('id')
  @JournaliserEcriture({ entite: 'Salarie', action: 'CREER_PERSONNE_A_CHARGE' })
  @ExigeIfMatch()
  creerPersonneACharge(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreerPersonneAChargeDto,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.tableaux.creerPersonneACharge(id, dto, version);
  }

  @Patch(':id/personnes-a-charge/:ligneId')
  @RequiertPermission('salarie.modifier')
  @PerimetreSalarie('id')
  @JournaliserEcriture({ entite: 'Salarie', action: 'MODIFIER_PERSONNE_A_CHARGE' })
  @ExigeIfMatch()
  modifierPersonneACharge(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ligneId', ParseUUIDPipe) ligneId: string,
    @Body() dto: ModifierPersonneAChargeDto,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.tableaux.modifierPersonneACharge(id, ligneId, dto, version);
  }

  @Get(':id/personnes-a-charge/:ligneId/impact-suppression')
  @RequiertPermission('salarie.modifier')
  @PerimetreSalarie('id')
  impactSuppressionPersonneACharge(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ligneId', ParseUUIDPipe) ligneId: string
  ) {
    return this.tableaux.impactSuppressionPersonneACharge(id, ligneId);
  }

  @Delete(':id/personnes-a-charge/:ligneId')
  @RequiertPermission('salarie.modifier')
  @PerimetreSalarie('id')
  @JournaliserEcriture({ entite: 'Salarie', action: 'SUPPRIMER_PERSONNE_A_CHARGE' })
  @ExigeIfMatch()
  supprimerPersonneACharge(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ligneId', ParseUUIDPipe) ligneId: string,
    @Query('confirmationJeton') confirmationJeton: string | undefined,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.tableaux.supprimerPersonneACharge(id, ligneId, confirmationJeton, version);
  }

  @Put(':id/comptes-bancaires')
  @RequiertPermission('salarie.modifier')
  @PerimetreSalarie('id')
  @JournaliserEcriture({ entite: 'Salarie', action: 'REMPLACER_COMPTES_BANCAIRES' })
  @ExigeIfMatch()
  remplacerComptesBancaires(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RemplacerComptesBancairesDto,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.tableaux.remplacerComptesBancaires(id, dto, version);
  }

  @Post(':id/prets')
  @RequiertPermission('salarie.modifier')
  @PerimetreSalarie('id')
  @JournaliserEcriture({ entite: 'Salarie', action: 'CREER_PRET' })
  @ExigeIfMatch()
  creerPret(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreerPretDto,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.tableaux.creerPret(id, dto, version);
  }

  @Patch(':id/prets/:ligneId')
  @RequiertPermission('salarie.modifier')
  @PerimetreSalarie('id')
  @JournaliserEcriture({ entite: 'Salarie', action: 'MODIFIER_PRET' })
  @ExigeIfMatch()
  modifierPret(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ligneId', ParseUUIDPipe) ligneId: string,
    @Body() dto: ModifierPretDto,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.tableaux.modifierPret(id, ligneId, dto, version);
  }

  @Get(':id/prets/:ligneId/impact-suppression')
  @RequiertPermission('salarie.modifier')
  @PerimetreSalarie('id')
  impactSuppressionPret(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ligneId', ParseUUIDPipe) ligneId: string
  ) {
    return this.tableaux.impactSuppressionPret(id, ligneId);
  }

  @Delete(':id/prets/:ligneId')
  @RequiertPermission('salarie.modifier')
  @PerimetreSalarie('id')
  @JournaliserEcriture({ entite: 'Salarie', action: 'SUPPRIMER_PRET' })
  @ExigeIfMatch()
  supprimerPret(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ligneId', ParseUUIDPipe) ligneId: string,
    @Query('confirmationJeton') confirmationJeton: string | undefined,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.tableaux.supprimerPret(id, ligneId, confirmationJeton, version);
  }

  @Post(':id/saisies-sur-salaire')
  @RequiertPermission('salarie.modifier')
  @PerimetreSalarie('id')
  @JournaliserEcriture({ entite: 'Salarie', action: 'CREER_SAISIE_SUR_SALAIRE' })
  @ExigeIfMatch()
  creerSaisieSurSalaire(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreerSaisieSurSalaireDto,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.tableaux.creerSaisieSurSalaire(id, dto, version);
  }

  @Patch(':id/saisies-sur-salaire/:ligneId')
  @RequiertPermission('salarie.modifier')
  @PerimetreSalarie('id')
  @JournaliserEcriture({ entite: 'Salarie', action: 'MODIFIER_SAISIE_SUR_SALAIRE' })
  @ExigeIfMatch()
  modifierSaisieSurSalaire(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ligneId', ParseUUIDPipe) ligneId: string,
    @Body() dto: ModifierSaisieSurSalaireDto,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.tableaux.modifierSaisieSurSalaire(id, ligneId, dto, version);
  }

  @Get(':id/saisies-sur-salaire/:ligneId/impact-suppression')
  @RequiertPermission('salarie.modifier')
  @PerimetreSalarie('id')
  impactSuppressionSaisie(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ligneId', ParseUUIDPipe) ligneId: string
  ) {
    return this.tableaux.impactSuppressionSaisie(id, ligneId);
  }

  @Delete(':id/saisies-sur-salaire/:ligneId')
  @RequiertPermission('salarie.modifier')
  @PerimetreSalarie('id')
  @JournaliserEcriture({ entite: 'Salarie', action: 'SUPPRIMER_SAISIE_SUR_SALAIRE' })
  @ExigeIfMatch()
  supprimerSaisieSurSalaire(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ligneId', ParseUUIDPipe) ligneId: string,
    @Query('confirmationJeton') confirmationJeton: string | undefined,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.tableaux.supprimerSaisie(id, ligneId, confirmationJeton, version);
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
