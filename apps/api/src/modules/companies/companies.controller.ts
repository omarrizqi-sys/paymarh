import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import type { Company, ListResponse } from '@paymarh/shared-types';
import { TenantGuard } from '../../common/tenancy/tenant.guard.js';
import { CompaniesService } from './companies.service.js';

/**
 * GRAINE - societes du compte courant.
 *
 * TenantGuard est obligatoire : aucune route de donnees ne s en passe.
 */
@Controller('companies')
@UseGuards(TenantGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll(): Promise<ListResponse<Company>> {
    return this.companiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Company> {
    return this.companiesService.findOne(id);
  }
}
