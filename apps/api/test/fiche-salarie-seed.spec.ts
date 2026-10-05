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

  it('le seed est idempotent', async () => {
    const avant = await prisma.pays.count();
    const { execSync } = await import('node:child_process');
    const racine = new URL('../../..', import.meta.url);
    execSync('pnpm db:seed', { cwd: racine, stdio: 'pipe' });
    const apres = await prisma.pays.count();
    expect(apres).toBe(avant);
    expect(apres).toBe(195);
  }, 30_000);

  it('apres deux executions du seed, il existe exactement une ligne TAHFIZ', async () => {
    const { execSync } = await import('node:child_process');
    const racine = new URL('../../..', import.meta.url);
    execSync('pnpm db:seed', { cwd: racine, stdio: 'pipe' });
    execSync('pnpm db:seed', { cwd: racine, stdio: 'pipe' });
    const count = await prisma.statutParticulier.count({
      where: { code: STATUT_TECHNIQUE_TAHFIZ.code },
    });
    expect(count).toBe(1);
  }, 60_000);

  it('TAHFIZ n apparait pas dans les statuts particuliers saisissables', () => {
    expect(STATUTS_PARTICULIERS.map((s) => s.code)).toEqual(['IDMAJ']);
    expect(STATUTS_PARTICULIERS.some((s) => s.code === STATUT_TECHNIQUE_TAHFIZ.code)).toBe(false);
  });
});

async function societeDemoId(): Promise<string> {
  const societe = await prisma.company.findFirstOrThrow({
    where: { codeDossier: 'DEMO-001' },
    select: { id: true },
  });
  return societe.id;
}

describe('seed salaries de demonstration', () => {
  it('S1 — apres seed, la societe de demonstration porte exactement quatre salaries', async () => {
    const { execSync } = await import('node:child_process');
    const racine = new URL('../../..', import.meta.url);
    execSync('pnpm db:seed', { cwd: racine, stdio: 'pipe' });
    const count = await prisma.salarie.count({ where: { companyId: await societeDemoId() } });
    expect(count).toBe(4);
  }, 30_000);

  it('S2 — apres deux executions du seed, elle en porte toujours quatre', async () => {
    const { execSync } = await import('node:child_process');
    const racine = new URL('../../..', import.meta.url);
    execSync('pnpm db:seed', { cwd: racine, stdio: 'pipe' });
    execSync('pnpm db:seed', { cwd: racine, stdio: 'pipe' });
    const count = await prisma.salarie.count({ where: { companyId: await societeDemoId() } });
    expect(count).toBe(4);
  }, 60_000);

  it('T10 — Youssef Bennani : emploi n 1 en INSERTION, ses deux IDMAJ, aucune ligne TAHFIZ', async () => {
    const { execSync } = await import('node:child_process');
    const racine = new URL('../../..', import.meta.url);
    execSync('pnpm db:seed', { cwd: racine, stdio: 'pipe' });
    const youssef = await prisma.salarie.findFirstOrThrow({
      where: { companyId: await societeDemoId(), nom: 'Bennani', prenom: 'Youssef' },
      select: { id: true },
    });
    const emploi = await prisma.emploi.findFirstOrThrow({
      where: { salarieId: youssef.id, numeroOrdre: 1 },
      select: {
        contratVersions: { select: { typeContratCode: true } },
        statutsParticuliers: {
          where: { statutCode: 'IDMAJ' },
          orderBy: { dateDebut: 'asc' },
          select: { dateDebut: true, dateFin: true, origine: true },
        },
      },
    });
    expect(emploi.contratVersions).toEqual([{ typeContratCode: 'INSERTION' }]);
    expect(emploi.statutsParticuliers).toEqual([
      {
        dateDebut: new Date('2021-06-01'),
        dateFin: new Date('2022-12-31'),
        origine: 'SAISIE_MANUELLE',
      },
      { dateDebut: new Date('2023-01-01'), dateFin: null, origine: 'SAISIE_MANUELLE' },
    ]);
    const tahfiz = await prisma.statutParticulierLigne.count({
      where: { statutCode: 'TAHFIZ', emploi: { salarieId: youssef.id } },
    });
    expect(tahfiz).toBe(0);
  }, 30_000);

  it('T10 — Karim Alaoui : un emploi CDI et une ligne TAHFIZ propagee du 2025-07-01, sans fin', async () => {
    const { execSync } = await import('node:child_process');
    const racine = new URL('../../..', import.meta.url);
    execSync('pnpm db:seed', { cwd: racine, stdio: 'pipe' });
    const karim = await prisma.salarie.findFirstOrThrow({
      where: { companyId: await societeDemoId(), nom: 'Alaoui', prenom: 'Karim' },
      select: {
        sexe: true,
        dateEntree: true,
        emplois: {
          select: {
            contratVersions: {
              select: { typeContratCode: true, dateDebut: true, libellePoste: true },
            },
            primesContractuelles: { select: { id: true } },
            avantagesEnNature: { select: { id: true } },
            statutsParticuliers: {
              select: { statutCode: true, origine: true, dateDebut: true, dateFin: true },
            },
          },
        },
      },
    });
    expect(karim.sexe).toBe('HOMME');
    expect(karim.dateEntree).toEqual(new Date('2024-01-01'));
    expect(karim.emplois).toEqual([
      {
        contratVersions: [
          { typeContratCode: 'CDI', dateDebut: new Date('2024-01-01'), libellePoste: 'Comptable' },
        ],
        primesContractuelles: [],
        avantagesEnNature: [],
        statutsParticuliers: [
          {
            statutCode: 'TAHFIZ',
            origine: 'PROPAGE_SOCIETE',
            dateDebut: new Date('2025-07-01'),
            dateFin: null,
          },
        ],
      },
    ]);
  }, 30_000);

  it('S3 — le salarie complet a deux personnes a charge, deux comptes, un pret et deux saisies', async () => {
    const societeId = await societeDemoId();
    const complet = await prisma.salarie.findFirstOrThrow({
      where: { companyId: societeId, nom: 'Bennani', prenom: 'Youssef' },
      select: { id: true },
    });
    const [pac, comptes, prets, saisies] = await Promise.all([
      prisma.personneACharge.count({ where: { salarieId: complet.id } }),
      prisma.compteBancaireSalarie.count({ where: { salarieId: complet.id } }),
      prisma.pret.count({ where: { salarieId: complet.id } }),
      prisma.saisieSurSalaire.count({ where: { salarieId: complet.id } }),
    ]);
    expect(pac).toBe(2);
    expect(comptes).toBe(2);
    expect(prets).toBe(1);
    expect(saisies).toBe(2);
  });
});
