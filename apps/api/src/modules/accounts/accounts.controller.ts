import { Controller, Get, UseGuards } from '@nestjs/common';
import type { Account } from '@paymarh/shared-types';
import { TenantGuard } from '../../common/tenancy/tenant.guard.js';
import { AccountsService } from './accounts.service.js';

/** GRAINE - compte (tenant) de l utilisateur courant. */
@Controller('accounts')
@UseGuards(TenantGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('me')
  findMine(): Promise<Account> {
    return this.accountsService.findMine();
  }
}
