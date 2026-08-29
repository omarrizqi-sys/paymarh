import { Controller, Get, UseGuards } from '@nestjs/common';
import type { ListResponse, User } from '@paymarh/shared-types';
import { TenantGuard } from '../../common/tenancy/tenant.guard.js';
import { UsersService } from './users.service.js';

/** GRAINE - utilisateurs. Lecture seule, filtree par compte. */
@Controller('users')
@UseGuards(TenantGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Doit etre declaree AVANT toute route parametree (`:id`), sinon "me"
   * serait interprete comme un identifiant.
   */
  @Get('me')
  findMe(): Promise<User> {
    return this.usersService.findMe();
  }

  @Get()
  findAll(): Promise<ListResponse<User>> {
    return this.usersService.findAllInAccount();
  }
}
