import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PermissionsModule } from '../permissions/permissions.module.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { MasquageRemunerationInterceptor } from './masquage-remuneration.interceptor.js';

@Module({
  imports: [PermissionsModule, TenancyModule],
  providers: [
    MasquageRemunerationInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: MasquageRemunerationInterceptor,
    },
  ],
})
export class RemunerationModule {}
