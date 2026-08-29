import { ConflictException } from '@nestjs/common';

/**
 * Correspondance explicite contrainte PostgreSQL → champ métier exposé à l'API.
 * Ne jamais déduire le champ depuis meta.target Prisma ni depuis le message brut.
 */
const CONTRAINTE_VERS_CHAMP: Readonly<Record<string, string>> = {
  Company_accountId_codeDossier_key: 'codeDossier',
  Company_accountId_identifiantFiscal_key: 'identifiantFiscal',
  Etablissement_accountId_ice_key: 'ice',
};

export function estConflitUnicite(erreur: unknown): boolean {
  return (
    typeof erreur === 'object' &&
    erreur !== null &&
    'code' in erreur &&
    (erreur as { code: string }).code === 'P2002'
  );
}

function extraireNomContrainte(erreur: unknown): string | null {
  if (typeof erreur !== 'object' || erreur === null) return null;

  const meta = (erreur as { meta?: { constraint?: string } }).meta;
  if (typeof meta?.constraint === 'string' && meta.constraint.length > 0) {
    return meta.constraint;
  }

  const message = (erreur as { message?: string }).message ?? '';
  const match = message.match(/constraint: `([^`]+)`/);
  return match?.[1] ?? null;
}

/** Transforme un P2002 Prisma en ConflictException neutre, sans fuite de détails internes. */
export function relancerConflitUnicite(erreur: unknown): never {
  if (!estConflitUnicite(erreur)) {
    throw erreur;
  }

  const contrainte = extraireNomContrainte(erreur);
  const champ = contrainte ? CONTRAINTE_VERS_CHAMP[contrainte] : undefined;

  throw new ConflictException({
    code: 'VALEUR_INDISPONIBLE',
    message: "Cette valeur n'est pas disponible.",
    ...(champ ? { champ } : {}),
  });
}
