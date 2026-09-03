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
import type { ApiResponse, ListResponse, Societe } from '@paymarh/shared-types';
import { TenantGuard } from '../../common/tenancy/tenant.guard.js';
import {
  ChangerEtatSocieteDto,
  CreerSocieteDto,
  ModifierSocieteDto,
  ParametrageSocieteDto,
} from './dto/societe.dto.js';
import { SocietesService } from './societes.service.js';

@Controller('societes')
@UseGuards(TenantGuard)
export class SocietesController {
  constructor(private readonly societes: SocietesService) {}

  @Get()
  lister(): Promise<ApiResponse<ListResponse<Societe>>> {
    return this.societes.lister();
  }

  @Get(':id/impact-suppression')
  impact(@Param('id', ParseUUIDPipe) id: string) {
    return this.societes.impactSuppression(id);
  }

  @Get(':id/parametrage')
  parametrage(@Param('id', ParseUUIDPipe) id: string, @Query('mois') mois: string) {
    return this.societes.lireParametrage(id, mois);
  }

  @Get(':id')
  lire(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse<Societe>> {
    return this.societes.lire(id);
  }

  @Post()
  creer(@Body() dto: CreerSocieteDto): Promise<ApiResponse<Societe>> {
    return this.societes.creer(dto);
  }

  @Patch(':id/etat')
  changerEtat(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ChangerEtatSocieteDto) {
    return this.societes.changerEtat(id, dto);
  }

  @Patch(':id')
  modifier(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ModifierSocieteDto) {
    return this.societes.modifier(id, dto);
  }

  @Put(':id/parametrage')
  ecrireParametrage(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ParametrageSocieteDto) {
    return this.societes.ecrireParametrage(id, dto);
  }

  @Delete(':id')
  supprimer(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('confirmationJeton') confirmationJeton?: string
  ) {
    return this.societes.supprimer(id, confirmationJeton);
  }
}
