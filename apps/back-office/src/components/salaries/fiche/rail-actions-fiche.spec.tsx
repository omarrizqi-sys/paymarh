// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement, useEffect, useState, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppelApiEchoue } from '@/lib/api/client';
import { MESSAGE_ERREUR_GENERIQUE } from '@/lib/messages-interface';
import type { RubriqueEnregistrable } from '@/lib/fiche/orchestrateur-enregistrement';
import { RegistreFicheProvider, useRegistreFiche } from './registre-fiche-provider';
import { RailActionsFiche } from './rail-actions-fiche';

const routerPush = vi.fn();
const { impactSuppressionSalarie, supprimerSalarie } = vi.hoisted(() => ({
  impactSuppressionSalarie: vi.fn(),
  supprimerSalarie: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush, refresh: vi.fn() }),
}));

vi.mock('@/lib/api/salaries', async (importOriginal) => {
  const reel = await importOriginal();
  return {
    ...(reel as Record<string, unknown>),
    impactSuppressionSalarie: (...args: unknown[]) => impactSuppressionSalarie(...args),
    supprimerSalarie: (...args: unknown[]) => supprimerSalarie(...args),
  };
});

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
  versionInitiale = 1,
  children,
}: {
  readonly rubriques?: RubriqueEnregistrable[];
  readonly onRecharger?: () => Promise<void>;
  readonly versionInitiale?: number;
  readonly children?: ReactNode;
}) {
  return createElement(
    RegistreFicheProvider,
    { versionInitiale, onRechargerServeur: onRecharger },
    rubriques?.map((rubrique) => createElement(RubriqueTest, { key: rubrique.id, rubrique })),
    children,
    createElement(RailActionsFiche, {
      operations: ['salarie.modifier', 'salarie.supprimer'],
      companyId: 'soc-test',
      salarieId: 'sal-test',
    })
  );
}

function LecteurEcritureHorsSequence() {
  const { ecritureHorsSequenceEnCours } = useRegistreFiche();
  return <span data-testid="ecriture-hors-sequence">{String(ecritureHorsSequenceEnCours)}</span>;
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
    expect(screen.getByTestId('recap-enregistrement')?.textContent).toContain('Identite : succès');
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
    expect(screen.getByText(/Recharger les valeurs du serveur écrasera/)).toBeTruthy();
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
        createElement(RailActionsFiche, {
          operations: ['salarie.modifier'],
          companyId: 'soc-test',
          salarieId: 'sal-test',
        })
      )
    );

    expect(screen.queryByRole('button', { name: 'Supprimer' })).toBeNull();
  });
});

describe('RailActionsFiche — suppression fiche', () => {
  beforeEach(() => {
    impactSuppressionSalarie.mockReset();
    supprimerSalarie.mockReset();
    routerPush.mockReset();
  });

  afterEach(() => cleanup());

  it('SF01 — clic Supprimer demande l apercu et affiche le message serveur', async () => {
    impactSuppressionSalarie.mockResolvedValue({
      donnees: {
        message: 'Message serveur suppression fiche',
        jetonConfirmation: 'jeton-apercu',
      },
    });

    render(createElement(Harness, null));

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    await waitFor(() =>
      expect(impactSuppressionSalarie).toHaveBeenCalledWith('soc-test', 'sal-test')
    );
    await waitFor(() => expect(screen.getByTestId('dialogue-suppression-fiche')).toBeTruthy());
    expect(screen.getByTestId('message-apercu-suppression').textContent).toBe(
      'Message serveur suppression fiche'
    );
    expect(screen.getByTestId('dialogue-suppression-fiche-titre').textContent).toBe(
      'Supprimer ce salarié ?'
    );
  });

  it('SF02 — confirmation envoie DELETE avec jeton et version puis navigue vers la liste', async () => {
    impactSuppressionSalarie.mockResolvedValue({
      donnees: { message: 'Msg', jetonConfirmation: 'jeton-apercu' },
    });
    supprimerSalarie.mockResolvedValue({ donnees: { id: 'sal-test' }, alertes: [] });

    render(createElement(Harness, { versionInitiale: 7 }));

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    await waitFor(() => expect(screen.getByTestId('confirmer-suppression-fiche')).toBeTruthy());
    fireEvent.click(screen.getByTestId('confirmer-suppression-fiche'));

    await waitFor(() =>
      expect(supprimerSalarie).toHaveBeenCalledWith('soc-test', 'sal-test', 7, 'jeton-apercu')
    );
    expect(routerPush).toHaveBeenCalledWith('/societes/soc-test/salaries');
  });

  it('SF03 — Garder le salarie ferme la fenetre sans appel DELETE', async () => {
    impactSuppressionSalarie.mockResolvedValue({
      donnees: { message: 'Msg', jetonConfirmation: 'jeton-apercu' },
    });

    render(createElement(Harness, null));

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    await waitFor(() => expect(screen.getByTestId('dialogue-suppression-fiche')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Garder le salarié' }));

    expect(supprimerSalarie).not.toHaveBeenCalled();
    expect(screen.queryByTestId('dialogue-suppression-fiche')).toBeNull();
  });

  it('SF04 — echec de suppression reactive Enregistrer et Annuler', async () => {
    impactSuppressionSalarie.mockResolvedValue({
      donnees: { message: 'Msg', jetonConfirmation: 'jeton-apercu' },
    });
    supprimerSalarie.mockRejectedValueOnce(
      new AppelApiEchoue(500, { code: 'ERREUR', message: 'Detail interne' })
    );

    render(
      createElement(Harness, {
        children: createElement(
          'div',
          null,
          createElement(RubriqueModifiable, {
            id: 'identite',
            libelle: 'Identite',
            envoyer: vi.fn(async () => ({ version: 2, alertes: [] })),
          }),
          createElement(LecteurEcritureHorsSequence)
        ),
      })
    );

    fireEvent.click(screen.getByTestId('marquer-identite'));
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    await waitFor(() => expect(screen.getByTestId('confirmer-suppression-fiche')).toBeTruthy());
    fireEvent.click(screen.getByTestId('confirmer-suppression-fiche'));

    await waitFor(() =>
      expect(screen.getByTestId('ecriture-hors-sequence').textContent).toBe('false')
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Enregistrer/ })).toHaveProperty('disabled', false)
    );
    expect(screen.getByRole('button', { name: 'Annuler' })).toHaveProperty('disabled', false);
  });

  it('SF05 — refus metier laisse la fenetre ouverte avec le message serveur', async () => {
    impactSuppressionSalarie.mockResolvedValue({
      donnees: { message: 'Msg', jetonConfirmation: 'jeton-apercu' },
    });
    supprimerSalarie.mockRejectedValueOnce(
      new AppelApiEchoue(409, {
        code: 'SUPPRESSION_INTERDITE',
        message: 'Des bulletins existent pour ce salarie.',
      })
    );

    render(createElement(Harness, null));

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    await waitFor(() => expect(screen.getByTestId('confirmer-suppression-fiche')).toBeTruthy());
    fireEvent.click(screen.getByTestId('confirmer-suppression-fiche'));

    await waitFor(() => expect(screen.getByTestId('dialogue-suppression-fiche')).toBeTruthy());
    expect(screen.getByText('Des bulletins existent pour ce salarie.')).toBeTruthy();
    expect(screen.queryByText(MESSAGE_ERREUR_GENERIQUE)).toBeNull();
  });

  it('SF06 — modifications non enregistrees : phrase supplementaire affichee', async () => {
    impactSuppressionSalarie.mockResolvedValue({
      donnees: { message: 'Msg', jetonConfirmation: 'jeton-apercu' },
    });

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
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    await waitFor(() => expect(screen.getByTestId('mention-modifs-non-enregistrees')).toBeTruthy());
    expect(screen.getByTestId('mention-modifs-non-enregistrees').textContent).toBe(
      'Vos modifications non enregistrées seront perdues.'
    );
  });

  it('SF07 — sans modification la phrase supplementaire est absente', async () => {
    impactSuppressionSalarie.mockResolvedValue({
      donnees: { message: 'Msg', jetonConfirmation: 'jeton-apercu' },
    });

    render(createElement(Harness, null));

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    await waitFor(() => expect(screen.getByTestId('dialogue-suppression-fiche')).toBeTruthy());
    expect(screen.queryByTestId('mention-modifs-non-enregistrees')).toBeNull();
  });

  it('SF08 — conflit de version ferme la fenetre et affiche le bandeau fiche', async () => {
    impactSuppressionSalarie.mockResolvedValue({
      donnees: { message: 'Msg', jetonConfirmation: 'jeton-apercu' },
    });
    supprimerSalarie.mockRejectedValueOnce(
      new AppelApiEchoue(409, {
        code: 'CONFLIT_VERSION',
        message: 'La fiche a ete modifiee entre-temps.',
      })
    );

    render(createElement(Harness, null));

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    await waitFor(() => expect(screen.getByTestId('confirmer-suppression-fiche')).toBeTruthy());
    fireEvent.click(screen.getByTestId('confirmer-suppression-fiche'));

    await waitFor(() => expect(screen.getByTestId('bandeau-conflit-version')).toBeTruthy());
    expect(screen.queryByTestId('dialogue-suppression-fiche')).toBeNull();
  });
});
