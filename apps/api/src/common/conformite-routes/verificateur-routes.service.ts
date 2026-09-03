import { Injectable, type OnApplicationBootstrap, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { ModulesContainer, Reflector } from '@nestjs/core';
import type { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { CLE_JOURNALISER_ECRITURE } from '../audit/journaliser-ecriture.decorator.js';
import { CLE_PERMISSION } from '../permissions/requiert-permission.decorator.js';
import { CLE_EXIGE_IF_MATCH } from './exige-if-match.decorator.js';
import { EXEMPTIONS_ROUTES_MODULE_1 } from './exemptions-module-1.js';

const METHODES_ECRITURE = new Set<number>([
  RequestMethod.POST,
  RequestMethod.PUT,
  RequestMethod.PATCH,
  RequestMethod.DELETE,
]);

const NOM_METHODE_HTTP: Record<number, string> = {
  [RequestMethod.GET]: 'GET',
  [RequestMethod.POST]: 'POST',
  [RequestMethod.PUT]: 'PUT',
  [RequestMethod.PATCH]: 'PATCH',
  [RequestMethod.DELETE]: 'DELETE',
  [RequestMethod.ALL]: 'ALL',
  [RequestMethod.OPTIONS]: 'OPTIONS',
  [RequestMethod.HEAD]: 'HEAD',
  [RequestMethod.SEARCH]: 'SEARCH',
};

export class ErreurConformiteRoutes extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErreurConformiteRoutes';
  }
}

function joindreChemins(...segments: readonly string[]): string {
  const normalise = segments
    .flatMap((segment) => segment.split('/'))
    .filter((partie) => partie.length > 0)
    .join('/');
  return `/${normalise}`;
}

function cleRoute(methode: number, cheminComplet: string): string {
  const nom = NOM_METHODE_HTTP[methode];
  if (nom === undefined) {
    return `${methode} ${cheminComplet}`;
  }
  return `${nom} ${cheminComplet}`;
}

@Injectable()
export class VerificateurRoutesService implements OnApplicationBootstrap {
  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly reflector: Reflector
  ) {}

  onApplicationBootstrap(): void {
    this.verifier();
  }

  /** Leve ErreurConformiteRoutes si une route non exemptee manque une etiquette. */
  verifier(): void {
    const manquements: string[] = [];

    for (const module of this.modulesContainer.values()) {
      for (const controller of module.controllers.values()) {
        this.verifierControleur(controller, manquements);
      }
    }

    if (manquements.length > 0) {
      throw new ErreurConformiteRoutes(manquements.join('\n'));
    }
  }

  private verifierControleur(
    controller: InstanceWrapper<object>,
    manquements: string[]
  ): void {
    const metatype = controller.metatype;
    if (metatype === undefined || metatype === null) {
      return;
    }

    const prefixeControleur =
      this.reflector.get<string | undefined>(PATH_METADATA, metatype) ?? '';
    const prototype = metatype.prototype as object;

    for (const nomMethode of Object.getOwnPropertyNames(prototype)) {
      if (nomMethode === 'constructor') {
        continue;
      }

      const handler = prototype[nomMethode as keyof typeof prototype] as
        | ((...args: unknown[]) => unknown)
        | undefined;
      if (typeof handler !== 'function') {
        continue;
      }

      const methodeHttp = this.reflector.get<number | undefined>(
        METHOD_METADATA,
        handler
      );
      if (methodeHttp === undefined) {
        continue;
      }

      const cheminHandler =
        this.reflector.get<string | undefined>(PATH_METADATA, handler) ?? '';
      const cheminComplet = joindreChemins(prefixeControleur, cheminHandler);
      const route = cleRoute(methodeHttp, cheminComplet);

      if (EXEMPTIONS_ROUTES_MODULE_1.has(route)) {
        continue;
      }

      const permission = this.reflector.get(CLE_PERMISSION, handler);
      if (permission === undefined) {
        manquements.push(
          `Route ${route} (${metatype.name}.${nomMethode}) : etiquette manquante @RequiertPermission`
        );
      }

      if (!METHODES_ECRITURE.has(methodeHttp)) {
        continue;
      }

      const journal = this.reflector.get(CLE_JOURNALISER_ECRITURE, handler);
      if (journal === undefined) {
        manquements.push(
          `Route ${route} (${metatype.name}.${nomMethode}) : etiquette manquante @JournaliserEcriture`
        );
      }

      const ifMatch = this.reflector.get(CLE_EXIGE_IF_MATCH, handler);
      if (ifMatch !== true) {
        manquements.push(
          `Route ${route} (${metatype.name}.${nomMethode}) : etiquette manquante @ExigeIfMatch`
        );
      }
    }
  }
}
