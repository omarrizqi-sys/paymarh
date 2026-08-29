import { ConflictException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { estConflitUnicite, relancerConflitUnicite } from './conflit-unicite.js';

function p2002(contrainte: string, valeur?: string): object {
  const suffixe = valeur ? ` with value '${valeur}'` : '';
  return {
    code: 'P2002',
    name: 'PrismaClientKnownRequestError',
    message: `Unique constraint failed on the constraint: \`${contrainte}\`${suffixe}`,
    meta: {},
  };
}

function corps(exception: ConflictException): Record<string, unknown> {
  return exception.getResponse() as Record<string, unknown>;
}

function serialiser(exception: ConflictException): string {
  return JSON.stringify(corps(exception));
}

describe('conflit-unicite', () => {
  it('detecte un P2002 Prisma', () => {
    expect(estConflitUnicite(p2002('Company_accountId_codeDossier_key'))).toBe(true);
    expect(estConflitUnicite(new Error('autre'))).toBe(false);
  });

  it('mappe explicitement chaque contrainte metier vers le bon champ', () => {
    const cas: Array<[string, string]> = [
      ['Company_accountId_codeDossier_key', 'codeDossier'],
      ['Company_accountId_identifiantFiscal_key', 'identifiantFiscal'],
      ['Etablissement_accountId_ice_key', 'ice'],
    ];

    for (const [contrainte, champAttendu] of cas) {
      try {
        relancerConflitUnicite(p2002(contrainte, 'VALEUR-SECRETA-123'));
        expect.unreachable('aurait du lever ConflictException');
      } catch (erreur) {
        expect(erreur).toBeInstanceOf(ConflictException);
        const corpsErr = corps(erreur as ConflictException);
        expect(corpsErr.code).toBe('VALEUR_INDISPONIBLE');
        expect(corpsErr.champ).toBe(champAttendu);
      }
    }
  });

  it('ne propage jamais le nom de table, de contrainte ni la valeur en conflit', () => {
    const contrainte = 'Company_accountId_codeDossier_key';
    const valeur = 'DOSSIER-DEMO-777';

    try {
      relancerConflitUnicite(p2002(contrainte, valeur));
      expect.unreachable('aurait du lever ConflictException');
    } catch (erreur) {
      expect(erreur).toBeInstanceOf(ConflictException);
      const texte = serialiser(erreur as ConflictException).toLowerCase();

      expect(texte).not.toContain('company');
      expect(texte).not.toContain(contrainte.toLowerCase());
      expect(texte).not.toContain(valeur.toLowerCase());
      expect(texte).not.toContain('prisma');
      expect(texte).not.toContain('p2002');
    }
  });

  it('relance toute autre erreur sans la modifier', () => {
    const autre = new Error('erreur interne');
    expect(() => relancerConflitUnicite(autre)).toThrow(autre);
  });
});
