import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RequeteSansEcritureContextService } from './requete-sans-ecriture-context.service.js';
import { RequeteSansEcritureInterceptor } from './requete-sans-ecriture.interceptor.js';
import { VerificateurRoutesService } from './verificateur-routes.service.js';

@Global()
@Module({
  providers: [
    VerificateurRoutesService,
    RequeteSansEcritureContextService,
    RequeteSansEcritureInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequeteSansEcritureInterceptor,
    },
  ],
  exports: [VerificateurRoutesService, RequeteSansEcritureContextService],
})
export class ConformiteRoutesModule {}
