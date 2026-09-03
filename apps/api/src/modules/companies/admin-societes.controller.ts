import { Body, Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../../common/tenancy/tenant.guard.js';
import { AdminSocietesService } from './admin-societes.service.js';
import { ForcerRegimeDto } from './dto/societe.dto.js';

@Controller('admin/societes')
@UseGuards(TenantGuard)
export class AdminSocietesController {
  constructor(private readonly admin: AdminSocietesService) {}

  @Post(':id/forcer-regime-de-base')
  forcerRegime(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ForcerRegimeDto) {
    return this.admin.forcerRegimeDeBase(id, dto);
  }
}
