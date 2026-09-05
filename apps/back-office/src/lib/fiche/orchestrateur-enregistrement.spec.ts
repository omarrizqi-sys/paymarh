import { describe, expect, it, vi } from 'vitest';
import { AppelApiEchoue } from '@/lib/api/client';
import type { RubriqueEnregistrable } from './orchestrateur-enregistrement';
import { enregistrerRubriquesModifiees } from './orchestrateur-enregistrement';

function creerRubrique(
  id: string,
  libelle: string,
  modifiee: boolean,
  envoyer: RubriqueEnregistrable['envoyer']
): RubriqueEnregistrable {
  return { id, libelle, estModifiee: () => modifiee, envoyer, reinitialiser: () => undefined };
}

describe('enregistrerRubriquesModifiees', () => {
  it('une rubrique modifiee, un clic sur Enregistrer, un seul appel envoye', async () => {
    const envoyer = vi.fn(async () => ({ version: 2, alertes: [] }));
    const rubriques = [
      creerRubrique('identite', 'Identite', true, envoyer),
      creerRubrique('coordonnees', 'Coordonnees', false, vi.fn()),
    ];

    const resultat = await enregistrerRubriquesModifiees(rubriques, 1);

    expect(envoyer).toHaveBeenCalledTimes(1);
    expect(envoyer).toHaveBeenCalledWith(1);
    expect(resultat.resultats).toHaveLength(1);
    expect(resultat.resultats[0]?.statut).toBe('succes');
    expect(resultat.version).toBe(2);
  });

  it('deux rubriques modifiees, un clic, les deux acceptees avec circulation du numero de version', async () => {
    const envoyerA = vi.fn(async (version: number) => ({ version: version + 1, alertes: [] }));
    const envoyerB = vi.fn(async (version: number) => ({ version: version + 1, alertes: [] }));
    const rubriques = [
      creerRubrique('identite', 'Identite', true, envoyerA),
      creerRubrique('coordonnees', 'Coordonnees', true, envoyerB),
    ];

    const resultat = await enregistrerRubriquesModifiees(rubriques, 5);

    expect(envoyerA).toHaveBeenCalledWith(5);
    expect(envoyerB).toHaveBeenCalledWith(6);
    expect(resultat.resultats.every((r) => r.statut === 'succes')).toBe(true);
    expect(resultat.version).toBe(7);
    expect(resultat.conflit).toBe(false);
  });

  it('trois rubriques modifiees : la premiere enregistree, la deuxieme en conflit de version, la troisieme non envoyee', async () => {
    const envoyerA = vi.fn(async () => ({ version: 2, alertes: [] }));
    const envoyerB = vi.fn(async () => {
      throw new AppelApiEchoue(409, {
        code: 'CONFLIT_VERSION',
        message: 'La fiche a ete modifiee entre-temps.',
      });
    });
    const envoyerC = vi.fn(async () => ({ version: 4, alertes: [] }));
    const rubriques = [
      creerRubrique('identite', 'Identite', true, envoyerA),
      creerRubrique('coordonnees', 'Coordonnees', true, envoyerB),
      creerRubrique('dates', 'Dates', true, envoyerC),
    ];

    const resultat = await enregistrerRubriquesModifiees(rubriques, 1);

    expect(envoyerA).toHaveBeenCalledTimes(1);
    expect(envoyerB).toHaveBeenCalledTimes(1);
    expect(envoyerC).toHaveBeenCalledTimes(0);
    expect(resultat.conflit).toBe(true);
    expect(resultat.resultats).toEqual([
      expect.objectContaining({ statut: 'succes', libelle: 'Identite' }),
      expect.objectContaining({ statut: 'conflit', libelle: 'Coordonnees' }),
    ]);
  });

  it('trois rubriques modifiees : la premiere enregistree, la deuxieme refusee metier, la troisieme enregistree', async () => {
    const envoyerA = vi.fn(async () => ({ version: 2, alertes: [] }));
    const envoyerB = vi.fn(async () => {
      throw new AppelApiEchoue(400, { code: 'VALEUR_INDISPONIBLE', message: 'Valeur refusee.' });
    });
    const envoyerC = vi.fn(async () => ({ version: 4, alertes: [] }));
    const rubriques = [
      creerRubrique('identite', 'Identite', true, envoyerA),
      creerRubrique('coordonnees', 'Coordonnees', true, envoyerB),
      creerRubrique('dates', 'Dates', true, envoyerC),
    ];

    const resultat = await enregistrerRubriquesModifiees(rubriques, 1);

    expect(envoyerA).toHaveBeenCalledTimes(1);
    expect(envoyerB).toHaveBeenCalledTimes(1);
    expect(envoyerC).toHaveBeenCalledTimes(1);
    expect(resultat.conflit).toBe(false);
    expect(resultat.resultats).toEqual([
      expect.objectContaining({ statut: 'succes', libelle: 'Identite' }),
      expect.objectContaining({
        statut: 'echec',
        libelle: 'Coordonnees',
        message: 'Valeur refusee.',
      }),
      expect.objectContaining({ statut: 'succes', libelle: 'Dates' }),
    ]);
  });

  it('un warning renvoye par le serveur est transmis sans empecher l enregistrement', async () => {
    const alerte = {
      code: 'FORMAT_CONTACT_INVALIDE',
      message: 'Format de mail inattendu.',
      champ: 'emailPersonnel',
    };
    const envoyer = vi.fn(async () => ({ version: 2, alertes: [alerte] }));
    const rubriques = [creerRubrique('coordonnees', 'Coordonnees', true, envoyer)];

    const resultat = await enregistrerRubriquesModifiees(rubriques, 1);

    expect(resultat.resultats[0]?.statut).toBe('succes');
    expect(resultat.resultats[0]?.alertes).toEqual([alerte]);
  });
});
