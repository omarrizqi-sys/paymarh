import { Controller, Get, Module, Patch } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { JournaliserEcriture } from '../audit/journaliser-ecriture.decorator.js';
import { ConformiteRoutesModule } from './conformite-routes.module.js';
import { ExigeIfMatch } from './exige-if-match.decorator.js';
import { ErreurConformiteRoutes, VerificateurRoutesService } from './verificateur-routes.service.js';
import { RequiertPermission } from '../permissions/requiert-permission.decorator.js';

async function demarrerModule(module: typeof Module): Promise<void> {
  const moduleRef = await Test.createTestingModule({
    imports: [ConformiteRoutesModule, module],
  }).compile();
  await moduleRef.init();
}

describe('VerificateurRoutesService — demarrage refusant', () => {
  afterEach(() => {
    // Rien a nettoyer : chaque test utilise un module isole.
  });

  it('une route de lecture sans @RequiertPermission fait echouer le demarrage', async () => {
    @Controller('probe-conformite')
    class ProbeLectureSansPermission {
      @Get('lecture-sans-permission')
      lire() {
        return {};
      }
    }

    @Module({ controllers: [ProbeLectureSansPermission] })
    class ProbeModule {
      /** Ancre de module NestJS pour le test. */
      static readonly test = true;
    }

    await expect(demarrerModule(ProbeModule)).rejects.toSatisfy(
      (erreur: unknown) =>
        erreur instanceof ErreurConformiteRoutes &&
        erreur.message.includes('@RequiertPermission') &&
        erreur.message.includes('GET /probe-conformite/lecture-sans-permission')
    );
  });

  it('une route d ecriture sans @RequiertPermission fait echouer le demarrage', async () => {
    @Controller('probe-conformite')
    class ProbeEcritureSansPermission {
      @Patch('ecriture-sans-permission')
      @JournaliserEcriture({ entite: 'Salarie', action: 'PROBE' })
      @ExigeIfMatch()
      ecrire() {
        return {};
      }
    }

    @Module({ controllers: [ProbeEcritureSansPermission] })
    class ProbeModule {
      static readonly test = true;
    }

    await expect(demarrerModule(ProbeModule)).rejects.toSatisfy(
      (erreur: unknown) =>
        erreur instanceof ErreurConformiteRoutes &&
        erreur.message.includes('@RequiertPermission') &&
        erreur.message.includes('PATCH /probe-conformite/ecriture-sans-permission')
    );
  });

  it('une route d ecriture sans @JournaliserEcriture fait echouer le demarrage', async () => {
    @Controller('probe-conformite')
    class ProbeSansJournal {
      @Patch('ecriture-sans-journal')
      @RequiertPermission('salarie.modifier')
      @ExigeIfMatch()
      ecrire() {
        return {};
      }
    }

    @Module({ controllers: [ProbeSansJournal] })
    class ProbeModule {
      static readonly test = true;
    }

    await expect(demarrerModule(ProbeModule)).rejects.toSatisfy(
      (erreur: unknown) =>
        erreur instanceof ErreurConformiteRoutes &&
        erreur.message.includes('@JournaliserEcriture') &&
        erreur.message.includes('PATCH /probe-conformite/ecriture-sans-journal')
    );
  });

  it('une route d ecriture sans @ExigeIfMatch fait echouer le demarrage', async () => {
    @Controller('probe-conformite')
    class ProbeSansIfMatch {
      @Patch('ecriture-sans-if-match')
      @RequiertPermission('salarie.modifier')
      @JournaliserEcriture({ entite: 'Salarie', action: 'PROBE' })
      ecrire() {
        return {};
      }
    }

    @Module({ controllers: [ProbeSansIfMatch] })
    class ProbeModule {
      static readonly test = true;
    }

    await expect(demarrerModule(ProbeModule)).rejects.toSatisfy(
      (erreur: unknown) =>
        erreur instanceof ErreurConformiteRoutes &&
        erreur.message.includes('@ExigeIfMatch') &&
        erreur.message.includes('PATCH /probe-conformite/ecriture-sans-if-match')
    );
  });

  it('l application demarre normalement avec la liste d exemption module 1 en place', async () => {
    const { AppModule } = await import('../../app.module.js');
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const verificateur = moduleRef.get(VerificateurRoutesService);
    expect(() => verificateur.verifier()).not.toThrow();
    await moduleRef.close();
  });
});
