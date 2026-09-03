import { RequestMethod, type ExecutionContext } from '@nestjs/common';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import type { Reflector } from '@nestjs/core';

const NOM_METHODE_HTTP: Record<number, string> = {
  [RequestMethod.GET]: 'GET',
  [RequestMethod.POST]: 'POST',
  [RequestMethod.PUT]: 'PUT',
  [RequestMethod.PATCH]: 'PATCH',
  [RequestMethod.DELETE]: 'DELETE',
};

function joindreChemins(...segments: readonly string[]): string {
  const normalise = segments
    .flatMap((segment) => segment.split('/'))
    .filter((partie) => partie.length > 0)
    .join('/');
  return `/${normalise}`;
}

/** Cle normalisee « METHOD /chemin » pour une requete HTTP NestJS. */
export function cleRouteHttp(context: ExecutionContext, reflector: Reflector): string | null {
  const handler = context.getHandler();
  const classe = context.getClass();

  const methodeHttp = reflector.get<number | undefined>(METHOD_METADATA, handler);
  if (methodeHttp === undefined) {
    return null;
  }

  const prefixeControleur = reflector.get<string | undefined>(PATH_METADATA, classe) ?? '';
  const cheminHandler = reflector.get<string | undefined>(PATH_METADATA, handler) ?? '';
  const cheminComplet = joindreChemins(prefixeControleur, cheminHandler);
  const nom = NOM_METHODE_HTTP[methodeHttp];
  if (nom === undefined) {
    return null;
  }

  return `${nom} ${cheminComplet}`;
}

/** Meme normalisation que cleRouteHttp, pour le scan au demarrage. */
export function cleRouteHandler(
  reflector: Reflector,
  metatype: object,
  handler: (...args: unknown[]) => unknown,
  methodeHttp: number
): string {
  const prefixeControleur = reflector.get<string | undefined>(PATH_METADATA, metatype) ?? '';
  const cheminHandler = reflector.get<string | undefined>(PATH_METADATA, handler) ?? '';
  const cheminComplet = joindreChemins(prefixeControleur, cheminHandler);
  const nom = NOM_METHODE_HTTP[methodeHttp] ?? String(methodeHttp);
  return `${nom} ${cheminComplet}`;
}
