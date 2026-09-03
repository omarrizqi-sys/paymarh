import { Global, Module } from '@nestjs/common';
import { VerificateurRoutesService } from './verificateur-routes.service.js';

@Global()
@Module({
  providers: [VerificateurRoutesService],
  exports: [VerificateurRoutesService],
})
export class ConformiteRoutesModule {}
