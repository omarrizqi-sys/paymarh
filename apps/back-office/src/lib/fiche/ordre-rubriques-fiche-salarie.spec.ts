import { describe, expect, it } from 'vitest';
import {
  RubriqueAbsenteDeLOrdreError,
  assertRubriquesDansOrdre,
  idRubriqueEmploi,
  idsSommaireNavigation,
  libelleRubriqueEmploi,
  ordreEnregistrementFiche,
  ORDRE_RUBRIQUES_EMPLOI,
  ORDRE_RUBRIQUES_SALARIE,
  ID_SOMMAIRE_EMPLOIS,
} from './ordre-rubriques-fiche-salarie';

describe('ordreEnregistrementFiche', () => {
  it('place les huit rubriques salarie avant les rubriques d emploi', () => {
    const ordre = ordreEnregistrementFiche([
      { id: 'emp-b', libellePoste: 'B', version: 1 },
      { id: 'emp-a', libellePoste: 'A', version: 2 },
    ]);

    expect(ordre.slice(0, ORDRE_RUBRIQUES_SALARIE.length)).toEqual([...ORDRE_RUBRIQUES_SALARIE]);
    expect(ordre).toContain(idRubriqueEmploi('emp-b', 'contrat'));
    expect(ordre.indexOf(idRubriqueEmploi('emp-b', 'contrat'))).toBeLessThan(
      ordre.indexOf(idRubriqueEmploi('emp-a', 'contrat'))
    );
  });

  it('ordonne les rubriques de chaque emploi selon ORDRE_RUBRIQUES_EMPLOI', () => {
    const ordre = ordreEnregistrementFiche([{ id: 'emp-1', libellePoste: 'Poste', version: 3 }]);
    const debutEmploi = ordre.indexOf(idRubriqueEmploi('emp-1', ORDRE_RUBRIQUES_EMPLOI[0]));
    const rubriquesEmploi = ordre.slice(debutEmploi, debutEmploi + ORDRE_RUBRIQUES_EMPLOI.length);
    expect(rubriquesEmploi).toEqual(
      ORDRE_RUBRIQUES_EMPLOI.map((rubrique) => idRubriqueEmploi('emp-1', rubrique))
    );
  });
});

describe('idsSommaireNavigation', () => {
  it('contient les huit rubriques salarie puis Emplois sans les rubriques d emploi', () => {
    const ids = idsSommaireNavigation();
    expect(ids).toEqual([...ORDRE_RUBRIQUES_SALARIE, ID_SOMMAIRE_EMPLOIS]);
    expect(ids).not.toContain(idRubriqueEmploi('emp-1', 'contrat'));
  });
});

describe('libelleRubriqueEmploi', () => {
  it('qualifie le libelle avec le poste', () => {
    expect(libelleRubriqueEmploi('contrat', 'Responsable paie')).toBe('Contrat — Responsable paie');
  });
});

describe('assertRubriquesDansOrdre', () => {
  it('leve RubriqueAbsenteDeLOrdreError quand une rubrique inscrite est absente de l ordre', () => {
    const ordre = ordreEnregistrementFiche([]);
    expect(() => assertRubriquesDansOrdre(['identite', 'fantome'], ordre)).toThrow(
      RubriqueAbsenteDeLOrdreError
    );
    try {
      assertRubriquesDansOrdre(['fantome'], ordre);
    } catch (erreur) {
      expect(erreur).toBeInstanceOf(RubriqueAbsenteDeLOrdreError);
      expect((erreur as RubriqueAbsenteDeLOrdreError).idsAbsents).toEqual(['fantome']);
    }
  });
});
