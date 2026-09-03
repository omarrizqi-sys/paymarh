import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TenantGuard } from '../../common/tenancy/tenant.guard.js';
import {
  CreerCompteBancaireDto,
  ModifierCompteBancaireDto,
} from './dto/etablissement-compte.dto.js';
import { ComptesBancairesService } from './comptes-bancaires.service.js';

@Controller()
@UseGuards(TenantGuard)
export class ComptesBancairesController {
  constructor(private readonly comptes: ComptesBancairesService) {}

  @Get('societes/:societeId/comptes-bancaires')
  lister(@Param('societeId', ParseUUIDPipe) societeId: string) {
    return this.comptes.lister(societeId);
  }

  @Post('societes/:societeId/comptes-bancaires')
  creer(@Param('societeId', ParseUUIDPipe) societeId: string, @Body() dto: CreerCompteBancaireDto) {
    return this.comptes.creer(societeId, dto);
  }

  @Get('comptes-bancaires/:id/impact-suppression')
  impact(@Param('id', ParseUUIDPipe) id: string) {
    return this.comptes.impactSuppression(id);
  }

  @Patch('comptes-bancaires/:id')
  modifier(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ModifierCompteBancaireDto) {
    return this.comptes.modifier(id, dto);
  }

  @Post('comptes-bancaires/:id/cloturer')
  cloturer(@Param('id', ParseUUIDPipe) id: string) {
    return this.comptes.cloturer(id);
  }

  @Delete('comptes-bancaires/:id')
  supprimer(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('confirmationJeton') confirmationJeton?: string
  ) {
    return this.comptes.supprimer(id, confirmationJeton);
  }
}
