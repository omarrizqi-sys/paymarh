import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { EtatBulletin, type BulletinPort, type MoisBulletin } from '../bulletin/bulletin.port.js';
import {
  MoisEnCoursService,
  moisCalendaireCourant,
  moisDepuisDate,
  moisSuivant,
} from './mois-en-cours.service.js';

function bulletin(mois: string, etat: EtatBulletin): MoisBulletin {
  return { mois, etat };
}

function creerService(
  bulletins: readonly MoisBulletin[],
  emploisActifs: { dateDebut: Date; dateSortie: Date | null }[] = []
): MoisEnCoursService {
  const bulletinsPort: BulletinPort = {
    listerBulletinsParSalarie: vi.fn().mockResolvedValue(bulletins),
    listerBulletinsParEmploi: vi.fn().mockResolvedValue([]),
  };

  const prisma = {
    emploi: {
      findMany: vi.fn().mockResolvedValue(
        emploisActifs.map((e) => ({
          contratVersions: [{ dateDebut: e.dateDebut, dateSortie: e.dateSortie }],
        }))
      ),
    },
  };

  return new MoisEnCoursService(bulletinsPort, prisma as unknown as PrismaService);
}

describe('MoisEnCoursService — cascade a trois cas', () => {
  const salarieId = '00000000-0000-4000-8000-000000000001';

  it('cas 3 — sans bulletin ni emploi actif : mois calendaire du serveur', async () => {
    const service = creerService([]);
    const reference = new Date('2026-09-15T12:00:00.000Z');
    const mois = await service.calculerPourSalarie(salarieId, reference);
    expect(mois).toBe('2026-09');
  });

  it('cas 3 — sans bulletin, deux emplois actifs : mois de debut du plus ancien', async () => {
    const service = creerService([], [
      { dateDebut: new Date('2024-06-01'), dateSortie: null },
      { dateDebut: new Date('2025-03-01'), dateSortie: null },
    ]);
    const mois = await service.calculerPourSalarie(salarieId, new Date('2026-01-01'));
    expect(mois).toBe('2024-06');
  });

  it('cas 1 — mars etat 2 et fevrier etat 4 : mars est le mois en cours', async () => {
    const service = creerService([
      bulletin('2026-02', EtatBulletin.EDITE),
      bulletin('2026-03', EtatBulletin.CALCULE),
    ]);
    const mois = await service.calculerPourSalarie(salarieId);
    expect(mois).toBe('2026-03');
  });

  it('cas 2 — janvier, fevrier et mars tous etat 4 : avril est le mois en cours', async () => {
    const service = creerService([
      bulletin('2026-01', EtatBulletin.EDITE),
      bulletin('2026-02', EtatBulletin.EDITE),
      bulletin('2026-03', EtatBulletin.EDITE),
    ]);
    const mois = await service.calculerPourSalarie(salarieId);
    expect(mois).toBe('2026-04');
  });

  it('cas 1 — etat VALIDE (3) compte comme calcule', async () => {
    const service = creerService([bulletin('2026-05', EtatBulletin.VALIDE)]);
    expect(await service.calculerPourSalarie(salarieId)).toBe('2026-05');
  });
});

describe('utilitaires mois', () => {
  it('moisSuivant en decembre bascule sur janvier', () => {
    expect(moisSuivant('2025-12')).toBe('2026-01');
  });

  it('moisCalendaireCourant utilise Africa/Casablanca — 1er du mois a 00h30 locale', () => {
    // 1 avril 2026 00:30 heure marocaine (UTC+1 hors Ramadan) = 31 mars 2026 23:30 UTC
    expect(moisCalendaireCourant(new Date('2026-03-31T23:30:00.000Z'))).toBe('2026-04');
  });

  it('moisDepuisDate lit une date de calendrier stockee en UTC sans conversion locale', () => {
    expect(moisDepuisDate(new Date('2026-04-01T00:00:00.000Z'))).toBe('2026-04');
  });
});
