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
  PerimetreEmploi,
  RequiertPermission,
} from '../../common/permissions/requiert-permission.decorator.js';
import { TenantGuard } from '../../common/tenancy/tenant.guard.js';
import {
  ModifierAffectationEmploiDto,
  ModifierContratEmploiDto,
  ModifierRemunerationEmploiDto,
} from './dto/emploi.dto.js';
import {
  CreerAvantageEnNatureDto,
  CreerPrimeContractuelleDto,
  CreerStatutParticulierDto,
  ModifierAvantageEnNatureDto,
  ModifierPrimeContractuelleDto,
  ModifierStatutParticulierDto,
} from './dto/tableaux-emploi.dto.js';
import { EmploisService } from './emplois.service.js';
import { TableauxEmploiService } from './tableaux-emploi.service.js';
import {
  EN_TETE_IF_MATCH,
  VerrouillageOptimisteService,
} from './verrouillage/verrouillage-optimiste.service.js';

@Controller('emplois')
@UseGuards(TenantGuard)
export class EmploisController {
  constructor(
    private readonly emplois: EmploisService,
    private readonly tableaux: TableauxEmploiService,
    private readonly verrouillage: VerrouillageOptimisteService
  ) {}

  @Get(':id')
  @RequiertPermission('salarie.lire')
  @PerimetreEmploi('id')
  lire(@Param('id', ParseUUIDPipe) id: string) {
    return this.emplois.lire(id);
  }

  @Get(':id/versions/contrat')
  @RequiertPermission('salarie.lire')
  @PerimetreEmploi('id')
  listerVersionsContrat(@Param('id', ParseUUIDPipe) id: string) {
    return this.emplois.listerVersionsContrat(id);
  }

  @Get(':id/versions/remuneration')
  @RequiertPermission('salarie.lire')
  @PerimetreEmploi('id')
  listerVersionsRemuneration(@Param('id', ParseUUIDPipe) id: string) {
    return this.emplois.listerVersionsRemuneration(id);
  }

  @Get(':id/versions/affectation-temps-de-travail')
  @RequiertPermission('salarie.lire')
  @PerimetreEmploi('id')
  listerVersionsAffectation(@Param('id', ParseUUIDPipe) id: string) {
    return this.emplois.listerVersionsAffectation(id);
  }

  @Patch(':id/contrat')
  @RequiertPermission('emploi.modifier')
  @PerimetreEmploi('id')
  @JournaliserEcriture({ entite: 'Emploi', action: 'MODIFIER_CONTRAT_EMPLOI' })
  @ExigeIfMatch()
  modifierContrat(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModifierContratEmploiDto,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined,
    @Query('confirmationJeton') confirmationJeton?: string
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.emplois.modifierContrat(id, dto, version, confirmationJeton);
  }

  @Patch(':id/remuneration')
  @RequiertPermission('emploi.modifier')
  @PerimetreEmploi('id')
  @JournaliserEcriture({ entite: 'Emploi', action: 'MODIFIER_REMUNERATION_EMPLOI' })
  @ExigeIfMatch()
  modifierRemuneration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModifierRemunerationEmploiDto,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.emplois.modifierRemuneration(id, dto, version);
  }

  @Patch(':id/affectation-temps-de-travail')
  @RequiertPermission('emploi.modifier')
  @PerimetreEmploi('id')
  @JournaliserEcriture({ entite: 'Emploi', action: 'MODIFIER_AFFECTATION_EMPLOI' })
  @ExigeIfMatch()
  modifierAffectation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModifierAffectationEmploiDto,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.emplois.modifierAffectation(id, dto, version);
  }

  @Post(':id/primes-contractuelles')
  @RequiertPermission('emploi.modifier')
  @PerimetreEmploi('id')
  @JournaliserEcriture({ entite: 'Emploi', action: 'CREER_PRIME_CONTRACTUELLE' })
  @ExigeIfMatch()
  creerPrimeContractuelle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreerPrimeContractuelleDto,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.tableaux.creerPrimeContractuelle(id, dto, version);
  }

  @Patch(':id/primes-contractuelles/:ligneId')
  @RequiertPermission('emploi.modifier')
  @PerimetreEmploi('id')
  @JournaliserEcriture({ entite: 'Emploi', action: 'MODIFIER_PRIME_CONTRACTUELLE' })
  @ExigeIfMatch()
  modifierPrimeContractuelle(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ligneId', ParseUUIDPipe) ligneId: string,
    @Body() dto: ModifierPrimeContractuelleDto,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.tableaux.modifierPrimeContractuelle(id, ligneId, dto, version);
  }

  @Delete(':id/primes-contractuelles/:ligneId')
  @RequiertPermission('emploi.modifier')
  @PerimetreEmploi('id')
  @JournaliserEcriture({ entite: 'Emploi', action: 'SUPPRIMER_PRIME_CONTRACTUELLE' })
  @ExigeIfMatch()
  supprimerPrimeContractuelle(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ligneId', ParseUUIDPipe) ligneId: string,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.tableaux.supprimerPrimeContractuelle(id, ligneId, version);
  }

  @Post(':id/avantages-en-nature')
  @RequiertPermission('emploi.modifier')
  @PerimetreEmploi('id')
  @JournaliserEcriture({ entite: 'Emploi', action: 'CREER_AVANTAGE_EN_NATURE' })
  @ExigeIfMatch()
  creerAvantageEnNature(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreerAvantageEnNatureDto,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.tableaux.creerAvantageEnNature(id, dto, version);
  }

  @Patch(':id/avantages-en-nature/:ligneId')
  @RequiertPermission('emploi.modifier')
  @PerimetreEmploi('id')
  @JournaliserEcriture({ entite: 'Emploi', action: 'MODIFIER_AVANTAGE_EN_NATURE' })
  @ExigeIfMatch()
  modifierAvantageEnNature(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ligneId', ParseUUIDPipe) ligneId: string,
    @Body() dto: ModifierAvantageEnNatureDto,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.tableaux.modifierAvantageEnNature(id, ligneId, dto, version);
  }

  @Delete(':id/avantages-en-nature/:ligneId')
  @RequiertPermission('emploi.modifier')
  @PerimetreEmploi('id')
  @JournaliserEcriture({ entite: 'Emploi', action: 'SUPPRIMER_AVANTAGE_EN_NATURE' })
  @ExigeIfMatch()
  supprimerAvantageEnNature(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ligneId', ParseUUIDPipe) ligneId: string,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.tableaux.supprimerAvantageEnNature(id, ligneId, version);
  }

  @Post(':id/statuts-particuliers')
  @RequiertPermission('emploi.modifier')
  @PerimetreEmploi('id')
  @JournaliserEcriture({ entite: 'Emploi', action: 'CREER_STATUT_PARTICULIER' })
  @ExigeIfMatch()
  creerStatutParticulier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreerStatutParticulierDto,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.tableaux.creerStatutParticulier(id, dto, version);
  }

  @Patch(':id/statuts-particuliers/:ligneId')
  @RequiertPermission('emploi.modifier')
  @PerimetreEmploi('id')
  @JournaliserEcriture({ entite: 'Emploi', action: 'MODIFIER_STATUT_PARTICULIER' })
  @ExigeIfMatch()
  modifierStatutParticulier(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ligneId', ParseUUIDPipe) ligneId: string,
    @Body() dto: ModifierStatutParticulierDto,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.tableaux.modifierStatutParticulier(id, ligneId, dto, version);
  }

  @Delete(':id/statuts-particuliers/:ligneId')
  @RequiertPermission('emploi.modifier')
  @PerimetreEmploi('id')
  @JournaliserEcriture({ entite: 'Emploi', action: 'SUPPRIMER_STATUT_PARTICULIER' })
  @ExigeIfMatch()
  supprimerStatutParticulier(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ligneId', ParseUUIDPipe) ligneId: string,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.tableaux.supprimerStatutParticulier(id, ligneId, version);
  }

  @Delete(':id')
  @RequiertPermission('emploi.supprimer')
  @PerimetreEmploi('id')
  @JournaliserEcriture({ entite: 'Emploi', action: 'SUPPRIMER_EMPLOI' })
  @ExigeIfMatch()
  supprimer(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers(EN_TETE_IF_MATCH) ifMatch: string | undefined
  ) {
    const version = this.verrouillage.exigerVersion(ifMatch);
    return this.emplois.supprimer(id, version);
  }
}
