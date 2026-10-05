import { describe, expect, it } from 'vitest';
import {
  calculerLignesTahfiz,
  type LigneTahfizCalculee,
  type VersionContratPourTahfiz,
} from './periodes-tahfiz.js';

const SANS_FIN = { moisDebut: '2025-07', moisFin: null };

function version(
  moisEffet: string,
  typeContratCode: string,
  dateDebut = '2024-01-01',
  dateSortie: string | null = null
): VersionContratPourTahfiz {
  return {
    moisEffet,
    typeContratCode,
    dateDebut: new Date(dateDebut),
    dateSortie: dateSortie !== null ? new Date(dateSortie) : null,
  };
}

function enJours(lignes: readonly LigneTahfizCalculee[]) {
  return lignes.map((l) => ({
    dateDebut: l.dateDebut.toISOString().slice(0, 10),
    dateFin: l.dateFin?.toISOString().slice(0, 10) ?? null,
  }));
}

describe('calculerLignesTahfiz', () => {
  it('CDI simple : une ligne du 1er jour du mois d activation, sans fin', () => {
    expect(enJours(calculerLignesTahfiz([version('2024-01', 'CDI')], SANS_FIN))).toEqual([
      { dateDebut: '2025-07-01', dateFin: null },
    ]);
  });

  it('debut d emploi apres l activation : la ligne commence au debut de l emploi', () => {
    expect(
      enJours(calculerLignesTahfiz([version('2025-09', 'CDI', '2025-09-15')], SANS_FIN))
    ).toEqual([{ dateDebut: '2025-09-15', dateFin: null }]);
  });

  it('sortie d emploi pendant TAHFIZ : la ligne se termine a la date de sortie', () => {
    expect(
      enJours(
        calculerLignesTahfiz([version('2024-01', 'CDI', '2024-01-01', '2025-10-20')], SANS_FIN)
      )
    ).toEqual([{ dateDebut: '2025-07-01', dateFin: '2025-10-20' }]);
  });

  it('TAHFIZ avec fin : la ligne se termine au dernier jour du mois de fin', () => {
    expect(
      enJours(
        calculerLignesTahfiz([version('2024-01', 'CDI')], {
          moisDebut: '2025-07',
          moisFin: '2026-06',
        })
      )
    ).toEqual([{ dateDebut: '2025-07-01', dateFin: '2026-06-30' }]);
  });

  it('versions CDD puis CDI : la ligne commence au mois d effet de la version CDI', () => {
    expect(
      enJours(
        calculerLignesTahfiz([version('2024-01', 'CDD'), version('2025-09', 'CDI')], SANS_FIN)
      )
    ).toEqual([{ dateDebut: '2025-09-01', dateFin: null }]);
  });

  it('versions CDI puis CDD : la ligne se termine la veille du mois d effet de la version CDD', () => {
    expect(
      enJours(
        calculerLignesTahfiz([version('2024-01', 'CDI'), version('2025-10', 'CDD')], SANS_FIN)
      )
    ).toEqual([{ dateDebut: '2025-07-01', dateFin: '2025-09-30' }]);
  });

  it('versions CDI, CDD, CDI : deux lignes', () => {
    expect(
      enJours(
        calculerLignesTahfiz(
          [version('2026-01', 'CDI'), version('2024-01', 'CDI'), version('2025-09', 'CDD')],
          SANS_FIN
        )
      )
    ).toEqual([
      { dateDebut: '2025-07-01', dateFin: '2025-08-31' },
      { dateDebut: '2026-01-01', dateFin: null },
    ]);
  });

  it('intersection vide : la periode CDI se termine avant l activation, aucune ligne', () => {
    expect(
      calculerLignesTahfiz([version('2024-01', 'CDI'), version('2025-03', 'CDD')], SANS_FIN)
    ).toEqual([]);
  });

  it('emploi termine avant l activation : aucune ligne', () => {
    expect(
      calculerLignesTahfiz([version('2024-01', 'CDI', '2024-01-01', '2025-03-31')], SANS_FIN)
    ).toEqual([]);
  });
});
