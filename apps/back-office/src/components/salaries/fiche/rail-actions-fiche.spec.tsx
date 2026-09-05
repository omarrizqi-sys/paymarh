// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement, useEffect, useState, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppelApiEchoue } from '@/lib/api/client';
import type { RubriqueEnregistrable } from '@/lib/fiche/orchestrateur-enregistrement';
import { RegistreFicheProvider, useRegistreFiche } from './registre-fiche-provider';
import { RailActionsFiche } from './rail-actions-fiche';

function RubriqueTest({ rubrique }: { readonly rubrique: RubriqueEnregistrable }) {
  const { enregistrerRubrique } = useRegistreFiche();
  useEffect(() => enregistrerRubrique(rubrique), [enregistrerRubrique, rubrique]);
  return null;
}

function RubriqueModifiable({
  id,
  libelle,
  envoyer,
}: {
  readonly id: string;
  readonly libelle: string;
  readonly envoyer: RubriqueEnregistrable['envoyer'];
}) {
  const { enregistrerRubrique, notifierSommaire } = useRegistreFiche();
  const [modifiee, setModifiee] = useState(false);

  useEffect(() => {
    return enregistrerRubrique({
      id,
      libelle,
      estModifiee: () => modifiee,
      envoyer,
      reinitialiser: () => undefined,
    });
  }, [enregistrerRubrique, envoyer, id, libelle, modifiee]);

  return createElement(
    'button',
    {
      type: 'button',
      'data-testid': `marquer-${id}`,
      onClick: () => {
        setModifiee(true);
        notifierSommaire();
      },
    },
    `Marquer ${libelle}`
  );
}

function Harness({
  rubriques,
  onRecharger = vi.fn(async () => undefined),
  children,
}: {
  readonly rubriques?: RubriqueEnregistrable[];
  readonly onRecharger?: () => Promise<void>;
  readonly children?: ReactNode;
}) {
  return createElement(
    RegistreFicheProvider,
    { versionInitiale: 1, onRechargerServeur: onRecharger },
    rubriques?.map((rubrique) => createElement(RubriqueTest, { key: rubrique.id, rubrique })),
    children,
    createElement(RailActionsFiche, {
      operations: ['salarie.modifier', 'salarie.supprimer'],
    })
  );
}

describe('RailActionsFiche', () => {
  afterEach(() => cleanup());

  it('Enregistrer est inactif quand rien nest modifie, actif des qu une rubrique lest', () => {
    render(
      createElement(Harness, {
        children: createElement(RubriqueModifiable, {
          id: 'identite',
          libelle: 'Identite',
          envoyer: vi.fn(async () => ({ version: 2, alertes: [] })),
        }),
      })
    );

    expect(screen.getByRole('button', { name: 'Enregistrer' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByTestId('marquer-identite'));
    expect(screen.getByRole('button', { name: 'Enregistrer' }).hasAttribute('disabled')).toBe(
      false
    );
  });

  it('Annuler nomme les rubriques concernees dans sa confirmation', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      createElement(Harness, {
        children: createElement(RubriqueModifiable, {
          id: 'identite',
          libelle: 'Identite',
          envoyer: vi.fn(async () => ({ version: 2, alertes: [] })),
        }),
      })
    );

    fireEvent.click(screen.getByTestId('marquer-identite'));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(confirm).toHaveBeenCalledWith('Annuler les modifications des rubriques : Identite ?');
    confirm.mockRestore();
  });

  it('trois rubriques modifiees : conflit sur la deuxieme arrete la sequence et un seul bandeau fiche apparait', async () => {
    const envoyerA = vi.fn(async () => ({ version: 2, alertes: [] }));
    const envoyerB = vi.fn(async () => {
      throw new AppelApiEchoue(409, {
        code: 'CONFLIT_VERSION',
        message: 'La fiche a ete modifiee entre-temps.',
      });
    });
    const envoyerC = vi.fn(async () => ({ version: 4, alertes: [] }));

    render(
      createElement(Harness, {
        children: createElement(
          'div',
          null,
          createElement(RubriqueModifiable, {
            id: 'identite',
            libelle: 'Identite',
            envoyer: envoyerA,
          }),
          createElement(RubriqueModifiable, {
            id: 'coordonnees',
            libelle: 'Coordonnees',
            envoyer: envoyerB,
          }),
          createElement(RubriqueModifiable, {
            id: 'dates',
            libelle: 'Dates',
            envoyer: envoyerC,
          })
        ),
      })
    );

    fireEvent.click(screen.getByTestId('marquer-identite'));
    fireEvent.click(screen.getByTestId('marquer-coordonnees'));
    fireEvent.click(screen.getByTestId('marquer-dates'));
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(screen.getByTestId('bandeau-conflit-version')).toBeTruthy());
    expect(envoyerA).toHaveBeenCalledTimes(1);
    expect(envoyerB).toHaveBeenCalledTimes(1);
    expect(envoyerC).toHaveBeenCalledTimes(0);
    expect(screen.getAllByTestId('bandeau-conflit-version')).toHaveLength(1);
    expect(screen.getByTestId('recap-enregistrement')?.textContent).toContain('Identite : succes');
    expect(screen.queryByTestId('erreur-rubrique-coordonnees')).toBeNull();
  });

  it('une rubrique refusee pour conflit de version affiche le bandeau sans bouton Reessayer', async () => {
    const envoyer = vi.fn(async () => {
      throw new AppelApiEchoue(409, {
        code: 'CONFLIT_VERSION',
        message: 'La fiche a ete modifiee entre-temps.',
      });
    });

    render(
      createElement(Harness, {
        children: createElement(RubriqueModifiable, {
          id: 'identite',
          libelle: 'Identite',
          envoyer,
        }),
      })
    );

    fireEvent.click(screen.getByTestId('marquer-identite'));
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(screen.getByTestId('bandeau-conflit-version')).toBeTruthy());
    expect(screen.queryByRole('button', { name: /Reessayer/i })).toBeNull();
    expect(screen.getByTestId('recharger-valeurs-serveur')).toBeTruthy();
  });

  it('Recharger les valeurs du serveur previent avant decraser la saisie', async () => {
    const envoyer = vi.fn(async () => {
      throw new AppelApiEchoue(409, {
        code: 'CONFLIT_VERSION',
        message: 'La fiche a ete modifiee entre-temps.',
      });
    });

    render(
      createElement(Harness, {
        children: createElement(RubriqueModifiable, {
          id: 'coordonnees',
          libelle: 'Coordonnees',
          envoyer,
        }),
      })
    );

    fireEvent.click(screen.getByTestId('marquer-coordonnees'));
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));
    await waitFor(() => expect(screen.getByTestId('bandeau-conflit-version')).toBeTruthy());

    fireEvent.click(screen.getByTestId('recharger-valeurs-serveur'));
    expect(screen.getByTestId('dialogue-rechargement')).toBeTruthy();
    expect(screen.getByText(/Recharger les valeurs du serveur ecrasera/)).toBeTruthy();
  });

  it('U2 — Annuler appelle reinitialiser sur tous les blocs declares, modifies ou non', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const reinitA = vi.fn();
    const reinitB = vi.fn();
    const recharger = vi.fn(async () => undefined);

    function RubriqueAvecReset({
      id,
      libelle,
      reinitialiser,
      initialeModifiee,
    }: {
      readonly id: string;
      readonly libelle: string;
      readonly reinitialiser: () => void;
      readonly initialeModifiee: boolean;
    }) {
      const { enregistrerRubrique, notifierSommaire } = useRegistreFiche();
      const [modifiee, setModifiee] = useState(initialeModifiee);
      useEffect(() => {
        return enregistrerRubrique({
          id,
          libelle,
          estModifiee: () => modifiee,
          envoyer: vi.fn(async () => ({ version: 2, alertes: [] })),
          reinitialiser: () => {
            reinitialiser();
            setModifiee(false);
            notifierSommaire();
          },
        });
      }, [enregistrerRubrique, id, libelle, modifiee, notifierSommaire, reinitialiser]);
      return null;
    }

    render(
      createElement(Harness, {
        onRecharger: recharger,
        children: createElement(
          'div',
          null,
          createElement(RubriqueAvecReset, {
            id: 'identite',
            libelle: 'Identite',
            reinitialiser: reinitA,
            initialeModifiee: true,
          }),
          createElement(RubriqueAvecReset, {
            id: 'coordonnees',
            libelle: 'Coordonnees',
            reinitialiser: reinitB,
            initialeModifiee: false,
          })
        ),
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    await waitFor(() => expect(reinitA).toHaveBeenCalledTimes(1));
    expect(reinitB).toHaveBeenCalledTimes(1);
    confirm.mockRestore();
  });

  it('U3 — Annuler ne declenche aucun appel au serveur', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const recharger = vi.fn(async () => undefined);

    render(
      createElement(Harness, {
        onRecharger: recharger,
        children: createElement(RubriqueModifiable, {
          id: 'identite',
          libelle: 'Identite',
          envoyer: vi.fn(async () => ({ version: 2, alertes: [] })),
        }),
      })
    );

    fireEvent.click(screen.getByTestId('marquer-identite'));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(recharger).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it('sans droit de suppression, l action correspondante est absente du rail', () => {
    render(
      createElement(
        RegistreFicheProvider,
        { versionInitiale: 1, onRechargerServeur: vi.fn() },
        createElement(RailActionsFiche, { operations: ['salarie.modifier'] })
      )
    );

    expect(screen.queryByRole('button', { name: 'Supprimer' })).toBeNull();
  });
});
