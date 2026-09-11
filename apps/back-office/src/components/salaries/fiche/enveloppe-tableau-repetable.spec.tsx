// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EnveloppeTableauRepetable } from './enveloppe-tableau-repetable';
import { textesSuppressionDiffereeCompteBancaire } from '@/components/navigation/textes-suppression-tableau-historise';

interface LigneTest {
  readonly id: string;
  readonly etat: 'ACTIVE' | 'CLOTUREE' | 'NON_ENREGISTREE';
  readonly moisFin: string | null;
  readonly valeur: string;
}

function ligne(id: string, surcharges: Partial<LigneTest> = {}): LigneTest {
  return { id, etat: 'ACTIVE', moisFin: null, valeur: 'A', ...surcharges };
}

function propsCommunes(surcharges: Record<string, unknown> = {}) {
  return {
    colonnes: [{ id: 'val', libelle: 'Valeur', render: (l: LigneTest) => l.valeur }],
    lignes: [ligne('a')],
    getLigneId: (l: LigneTest) => l.id,
    estInactive: () => false,
    estNonEnregistree: () => false,
    libelleEtatLigne: () => null,
    idColonneMarque: 'val',
    formulaireOuvertId: null,
    onOuvrirFormulaire: () => undefined,
    onValiderLigne: () => undefined,
    onAnnulerLigne: () => undefined,
    onAjouter: () => undefined,
    onSupprimer: () => undefined,
    peutModifier: true,
    renderFormulaire: () => null,
    ...surcharges,
  };
}

describe('EnveloppeTableauRepetable', () => {
  afterEach(() => cleanup());

  it('T05 — cliquer une ligne deplie le formulaire sous cette ligne', () => {
    render(
      <EnveloppeTableauRepetable
        {...propsCommunes({
          lignes: [ligne('a'), ligne('b')],
          formulaireOuvertId: 'b',
          renderFormulaire: () => <div>form</div>,
        })}
      />
    );
    expect(screen.getByTestId('formulaire-b')).toBeTruthy();
  });

  it('T06 — ouvrir un second formulaire referme le premier en conservant sa saisie', () => {
    const valeurs: Record<string, string> = { a: 'Un', b: 'Deux' };
    const lignes = [ligne('a', { valeur: 'Un' }), ligne('b')];
    function renderFormulaire(l: LigneTest) {
      return (
        <input
          aria-label={`saisie-${l.id}`}
          value={valeurs[l.id] ?? l.valeur}
          onChange={(e) => {
            valeurs[l.id] = e.target.value;
          }}
        />
      );
    }
    const { rerender } = render(
      <EnveloppeTableauRepetable
        {...propsCommunes({
          lignes,
          formulaireOuvertId: 'a',
          renderFormulaire,
        })}
      />
    );
    fireEvent.change(screen.getByLabelText('saisie-a'), { target: { value: 'Modifie' } });
    rerender(
      <EnveloppeTableauRepetable
        {...propsCommunes({
          lignes,
          formulaireOuvertId: 'b',
          renderFormulaire,
        })}
      />
    );
    expect(screen.queryByTestId('formulaire-a')).toBeNull();
    rerender(
      <EnveloppeTableauRepetable
        {...propsCommunes({
          lignes,
          formulaireOuvertId: 'a',
          renderFormulaire,
        })}
      />
    );
    expect(screen.getByLabelText('saisie-a')).toHaveProperty('value', 'Modifie');
  });

  it('T07 — Annuler la ligne replie sans appel serveur', () => {
    const onAnnulerLigne = vi.fn();
    render(
      <EnveloppeTableauRepetable
        {...propsCommunes({
          lignes: [ligne('a')],
          formulaireOuvertId: 'a',
          onAnnulerLigne,
          renderFormulaire: (_l: LigneTest, actions: { onAnnuler: () => void }) => (
            <button type="button" onClick={actions.onAnnuler}>
              Annuler la ligne
            </button>
          ),
        })}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Annuler la ligne' }));
    expect(onAnnulerLigne).toHaveBeenCalledWith('a');
  });

  it('T08 — Valider la ligne replie sans appel serveur', () => {
    const onValiderLigne = vi.fn();
    render(
      <EnveloppeTableauRepetable
        {...propsCommunes({
          lignes: [ligne('a')],
          formulaireOuvertId: 'a',
          onValiderLigne,
          renderFormulaire: (_l: LigneTest, actions: { onValider: () => void }) => (
            <button type="button" onClick={actions.onValider}>
              Valider la ligne
            </button>
          ),
        })}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Valider la ligne' }));
    expect(onValiderLigne).toHaveBeenCalledWith('a');
  });

  it('T09 — ligne inactive en lecture seule sans bouton Supprimer', () => {
    render(
      <EnveloppeTableauRepetable
        {...propsCommunes({
          lignes: [ligne('inact', { etat: 'CLOTUREE', moisFin: '08/2026' })],
          estInactive: (l: LigneTest) => l.etat === 'CLOTUREE',
          libelleEtatLigne: () => 'inactive depuis 08/2026',
          formulaireOuvertId: 'inact',
          renderFormulaire: (_l: LigneTest, actions: { lectureSeule: boolean }) => (
            <div data-testid="formulaire-lecture-seule">
              {actions.lectureSeule ? 'lecture' : 'edit'}
            </div>
          ),
        })}
      />
    );
    expect(screen.queryByTestId('supprimer-inact')).toBeNull();
    expect(screen.getByTestId('formulaire-lecture-seule').textContent).toBe('lecture');
  });

  it('T10 — ligne non enregistree en dernier avec mention', () => {
    render(
      <EnveloppeTableauRepetable
        {...propsCommunes({
          lignes: [ligne('saved'), ligne('new', { etat: 'NON_ENREGISTREE' })],
          estNonEnregistree: (l: LigneTest) => l.etat === 'NON_ENREGISTREE',
          libelleEtatLigne: (l: LigneTest) =>
            l.etat === 'NON_ENREGISTREE' ? 'non enregistrée' : null,
        })}
      />
    );
    expect(screen.getByTestId('etat-ligne-new').textContent).toContain('non enregistrée');
  });

  it('T11 — supprimer ligne jamais enregistree : callback local seulement', () => {
    const onSupprimer = vi.fn();
    render(
      <EnveloppeTableauRepetable
        {...propsCommunes({
          lignes: [ligne('new', { etat: 'NON_ENREGISTREE' })],
          estNonEnregistree: (l: LigneTest) => l.etat === 'NON_ENREGISTREE',
          libelleEtatLigne: () => 'non enregistrée',
          onSupprimer,
        })}
      />
    );
    fireEvent.click(screen.getByTestId('supprimer-new'));
    expect(onSupprimer).toHaveBeenCalledTimes(1);
  });

  it('TB01 — l enveloppe declenche le comportement de suppression differee sans appel serveur', async () => {
    const confirmer = vi.fn(async () => ({ type: 'termine' as const }));
    const preparer = vi.fn(async () => textesSuppressionDiffereeCompteBancaire());
    render(
      <EnveloppeTableauRepetable
        {...propsCommunes({
          lignes: [ligne('saved')],
          suppression: { preparer, confirmer },
        })}
      />
    );
    fireEvent.click(screen.getByTestId('supprimer-saved'));
    await waitFor(() => expect(preparer).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByTestId('dialogue-suppression-differee-confirmer'));
    await waitFor(() => expect(confirmer).toHaveBeenCalledTimes(1));
  });

  it('TB02 — recommencer rappelle preparer sans relancer confirmer', async () => {
    const preparer = vi
      .fn()
      .mockResolvedValueOnce({
        variante: 'historise' as const,
        titre: 'Supprimer ?',
        messageServeur: 'Premier',
        libelleConfirmer: 'Supprimer',
        libelleAnnuler: 'Garder la ligne',
      })
      .mockResolvedValueOnce({
        variante: 'historise' as const,
        titre: 'Supprimer ?',
        messageServeur: 'Second',
        libelleConfirmer: 'Supprimer',
        libelleAnnuler: 'Garder la ligne',
      });
    const confirmer = vi.fn().mockResolvedValueOnce({
      type: 'recommencer' as const,
      preambule: 'La situation a changé depuis l’affichage.',
    });

    render(
      <EnveloppeTableauRepetable
        {...propsCommunes({
          lignes: [ligne('saved')],
          suppression: { preparer, confirmer },
        })}
      />
    );

    fireEvent.click(screen.getByTestId('supprimer-saved'));
    await waitFor(() => expect(preparer).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByTestId('confirmer-suppression-ligne'));
    await waitFor(() => expect(preparer).toHaveBeenCalledTimes(2));
    expect(confirmer).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('mention-situation-changee')).toBeTruthy();
    expect(screen.getByTestId('message-apercu-suppression').textContent).toBe('Second');
  });

  it('TB03 — le fichier de l enveloppe ne contient aucun nom de tableau particulier', () => {
    const fichier = join(
      dirname(fileURLToPath(import.meta.url)),
      'enveloppe-tableau-repetable.tsx'
    );
    const contenu = readFileSync(fichier, 'utf8');
    expect(contenu).not.toMatch(
      /personnes-a-charge|comptes-bancaires|comptesBancaires|personnesACharge/i
    );
    expect(contenu).not.toMatch(/@\/lib\/api\//);
    expect(contenu).not.toMatch(/CONFIRMATION_OBSOLETE|CONFLIT_VERSION|AppelApiEchoue/i);
    expect(contenu).not.toMatch(/suppression.*fiche|supprimerSalarie|impactSuppressionSalarie/i);
  });
});
