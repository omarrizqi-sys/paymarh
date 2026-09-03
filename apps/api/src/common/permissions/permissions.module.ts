import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { PermissionGuard } from './permission.guard.js';
import { PERMISSION_SERVICE } from './permission.service.js';
import { PermissionServiceProvisoire } from './permission.service.provisoire.js';

@Module({
  imports: [PrismaModule, TenancyModule],
  providers: [
    {
      provide: PERMISSION_SERVICE,
      useClass: PermissionServiceProvisoire,
    },
    PermissionGuard,
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
  exports: [PERMISSION_SERVICE, PermissionGuard],
})
export class PermissionsModule {}
