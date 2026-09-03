import { describe, expect, it } from 'vitest';
import {
  PAYS,
  STATUTS_PARTICULIERS,
  STATUT_TECHNIQUE_TAHFIZ,
} from '../prisma/reference-data-fiche-salarie.js';
import { prisma } from './support/prisma-test.js';

describe('seed referentiels fiche salarie', () => {
  it('le seed charge exactement 195 pays', async () => {
    const count = await prisma.pays.count();
    expect(count).toBe(195);
    expect(PAYS.length).toBe(195);
  });

  it('le Maroc est en premiere position de la liste des pays', async () => {
    const premier = await prisma.pays.findFirst({ orderBy: { ordre: 'asc' } });
    expect(premier?.ordre).toBe(1);
    expect(premier?.codeIso).toBe('MA');
    expect(premier?.libelle).toBe('Maroc');
  });

  it('le Sahara occidental est absent de la liste des pays', async () => {
    const sahara = await prisma.pays.findFirst({
      where: {
        OR: [
          { codeIso: 'EH' },
          { libelle: { contains: 'Sahara occidental', mode: 'insensitive' } },
        ],
      },
    });
    expect(sahara).toBeNull();
  });

  it('le libelle Palestine est conforme', async () => {
    const palestine = await prisma.pays.findUniqueOrThrow({ where: { codeIso: 'PS' } });
    expect(palestine.libelle).toBe('Palestine');
  });

  it(
    'le seed est idempotent',
    async () => {
      const avant = await prisma.pays.count();
      const { execSync } = await import('node:child_process');
      const racine = new URL('../../..', import.meta.url);
      execSync('pnpm db:seed', { cwd: racine, stdio: 'pipe' });
      const apres = await prisma.pays.count();
      expect(apres).toBe(avant);
      expect(apres).toBe(195);
    },
    30_000
  );

  it(
    'apres deux executions du seed, il existe exactement une ligne TAHFIZ',
    async () => {
      const { execSync } = await import('node:child_process');
      const racine = new URL('../../..', import.meta.url);
      execSync('pnpm db:seed', { cwd: racine, stdio: 'pipe' });
      execSync('pnpm db:seed', { cwd: racine, stdio: 'pipe' });
      const count = await prisma.statutParticulier.count({
        where: { code: STATUT_TECHNIQUE_TAHFIZ.code },
      });
      expect(count).toBe(1);
    },
    60_000
  );

  it('TAHFIZ n apparait pas dans les statuts particuliers saisissables', () => {
    expect(STATUTS_PARTICULIERS.map((s) => s.code)).toEqual(['IDMAJ']);
    expect(STATUTS_PARTICULIERS.some((s) => s.code === STATUT_TECHNIQUE_TAHFIZ.code)).toBe(
      false
    );
  });
});
