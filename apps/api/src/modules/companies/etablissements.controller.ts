import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TenantGuard } from '../../common/tenancy/tenant.guard.js';
import {
  CreerEtablissementDto,
  ModifierEtablissementDto,
  ParametrageEtablissementDto,
} from './dto/etablissement-compte.dto.js';
import { EtablissementsService } from './etablissements.service.js';

@Controller()
@UseGuards(TenantGuard)
export class EtablissementsController {
  constructor(private readonly etablissements: EtablissementsService) {}

  @Get('societes/:societeId/etablissements')
  lister(@Param('societeId', ParseUUIDPipe) societeId: string) {
    return this.etablissements.lister(societeId);
  }

  @Post('societes/:societeId/etablissements')
  creer(
    @Param('societeId', ParseUUIDPipe) societeId: string,
    @Body() dto: CreerEtablissementDto
  ) {
    return this.etablissements.creer(societeId, dto);
  }

  @Get('etablissements/:id/impact-suppression')
  impact(@Param('id', ParseUUIDPipe) id: string) {
    return this.etablissements.impactSuppression(id);
  }

  @Get('etablissements/:id/parametrage')
  parametrage(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('mois') mois: string
  ) {
    return this.etablissements.lireParametrage(id, mois);
  }

  @Get('etablissements/:id')
  lire(@Param('id', ParseUUIDPipe) id: string) {
    return this.etablissements.lire(id);
  }

  @Patch('etablissements/:id')
  modifier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModifierEtablissementDto
  ) {
    return this.etablissements.modifier(id, dto);
  }

  @Post('etablissements/:id/designer-principal')
  designerPrincipal(@Param('id', ParseUUIDPipe) id: string) {
    return this.etablissements.designerPrincipal(id);
  }

  @Put('etablissements/:id/parametrage')
  ecrireParametrage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ParametrageEtablissementDto
  ) {
    return this.etablissements.ecrireParametrage(id, dto);
  }

  @Delete('etablissements/:id')
  supprimer(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('confirmationJeton') confirmationJeton?: string
  ) {
    return this.etablissements.supprimer(id, confirmationJeton);
  }
}
