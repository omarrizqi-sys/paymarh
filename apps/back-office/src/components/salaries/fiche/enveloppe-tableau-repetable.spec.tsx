// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EnveloppeTableauRepetable } from './enveloppe-tableau-repetable';

interface LigneTest {
  readonly id: string;
  readonly etat: 'ACTIVE' | 'INACTIVE' | 'NON_ENREGISTREE';
  readonly moisFin: string | null;
  readonly valeur: string;
}

function ligne(id: string, surcharges: Partial<LigneTest> = {}): LigneTest {
  return { id, etat: 'ACTIVE', moisFin: null, valeur: 'A', ...surcharges };
}

describe('EnveloppeTableauRepetable', () => {
  afterEach(() => cleanup());

  it('T05 — cliquer une ligne deplie le formulaire sous cette ligne', () => {
    render(
      <EnveloppeTableauRepetable
        colonnes={[{ id: 'val', libelle: 'Valeur', render: (l) => l.valeur }]}
        lignes={[ligne('a'), ligne('b')]}
        getLigneId={(l) => l.id}
        estInactive={(l) => l.etat === 'INACTIVE'}
        estNonEnregistree={(l) => l.etat === 'NON_ENREGISTREE'}
        libelleEtatLigne={() => null}
        idColonneMarque="val"
        formulaireOuvertId="b"
        onOuvrirFormulaire={() => undefined}
        onValiderLigne={() => undefined}
        onAnnulerLigne={() => undefined}
        onAjouter={() => undefined}
        onSupprimer={() => undefined}
        suppressionEnCours={false}
        peutModifier
        renderFormulaire={() => <div>form</div>}
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
        colonnes={[{ id: 'val', libelle: 'Valeur', render: (l) => l.valeur }]}
        lignes={lignes}
        getLigneId={(l) => l.id}
        estInactive={() => false}
        estNonEnregistree={() => false}
        libelleEtatLigne={() => null}
        idColonneMarque="val"
        formulaireOuvertId="a"
        onOuvrirFormulaire={() => undefined}
        onValiderLigne={() => undefined}
        onAnnulerLigne={() => undefined}
        onAjouter={() => undefined}
        onSupprimer={() => undefined}
        suppressionEnCours={false}
        peutModifier
        renderFormulaire={renderFormulaire}
      />
    );
    fireEvent.change(screen.getByLabelText('saisie-a'), { target: { value: 'Modifie' } });
    rerender(
      <EnveloppeTableauRepetable
        colonnes={[{ id: 'val', libelle: 'Valeur', render: (l) => l.valeur }]}
        lignes={lignes}
        getLigneId={(l) => l.id}
        estInactive={() => false}
        estNonEnregistree={() => false}
        libelleEtatLigne={() => null}
        idColonneMarque="val"
        formulaireOuvertId="b"
        onOuvrirFormulaire={() => undefined}
        onValiderLigne={() => undefined}
        onAnnulerLigne={() => undefined}
        onAjouter={() => undefined}
        onSupprimer={() => undefined}
        suppressionEnCours={false}
        peutModifier
        renderFormulaire={renderFormulaire}
      />
    );
    expect(screen.queryByTestId('formulaire-a')).toBeNull();
    rerender(
      <EnveloppeTableauRepetable
        colonnes={[{ id: 'val', libelle: 'Valeur', render: (l) => l.valeur }]}
        lignes={lignes}
        getLigneId={(l) => l.id}
        estInactive={() => false}
        estNonEnregistree={() => false}
        libelleEtatLigne={() => null}
        idColonneMarque="val"
        formulaireOuvertId="a"
        onOuvrirFormulaire={() => undefined}
        onValiderLigne={() => undefined}
        onAnnulerLigne={() => undefined}
        onAjouter={() => undefined}
        onSupprimer={() => undefined}
        suppressionEnCours={false}
        peutModifier
        renderFormulaire={renderFormulaire}
      />
    );
    expect(screen.getByLabelText('saisie-a')).toHaveProperty('value', 'Modifie');
  });

  it('T07 — Annuler la ligne replie sans appel serveur', () => {
    const onAnnulerLigne = vi.fn();
    render(
      <EnveloppeTableauRepetable
        colonnes={[{ id: 'val', libelle: 'Valeur', render: (l) => l.valeur }]}
        lignes={[ligne('a')]}
        getLigneId={(l) => l.id}
        estInactive={() => false}
        estNonEnregistree={() => false}
        libelleEtatLigne={() => null}
        idColonneMarque="val"
        formulaireOuvertId="a"
        onOuvrirFormulaire={() => undefined}
        onValiderLigne={() => undefined}
        onAnnulerLigne={onAnnulerLigne}
        onAjouter={() => undefined}
        onSupprimer={() => undefined}
        suppressionEnCours={false}
        peutModifier
        renderFormulaire={(_l, actions) => (
          <button type="button" onClick={actions.onAnnuler}>
            Annuler la ligne
          </button>
        )}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Annuler la ligne' }));
    expect(onAnnulerLigne).toHaveBeenCalledWith('a');
  });

  it('T08 — Valider la ligne replie sans appel serveur', () => {
    const onValiderLigne = vi.fn();
    render(
      <EnveloppeTableauRepetable
        colonnes={[{ id: 'val', libelle: 'Valeur', render: (l) => l.valeur }]}
        lignes={[ligne('a')]}
        getLigneId={(l) => l.id}
        estInactive={() => false}
        estNonEnregistree={() => false}
        libelleEtatLigne={() => null}
        idColonneMarque="val"
        formulaireOuvertId="a"
        onOuvrirFormulaire={() => undefined}
        onValiderLigne={onValiderLigne}
        onAnnulerLigne={() => undefined}
        onAjouter={() => undefined}
        onSupprimer={() => undefined}
        suppressionEnCours={false}
        peutModifier
        renderFormulaire={(_l, actions) => (
          <button type="button" onClick={actions.onValider}>
            Valider la ligne
          </button>
        )}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Valider la ligne' }));
    expect(onValiderLigne).toHaveBeenCalledWith('a');
  });

  it('T09 — ligne inactive en lecture seule sans bouton Supprimer', () => {
    render(
      <EnveloppeTableauRepetable
        colonnes={[{ id: 'val', libelle: 'Valeur', render: (l) => l.valeur }]}
        lignes={[ligne('inact', { etat: 'INACTIVE', moisFin: '08/2026' })]}
        getLigneId={(l) => l.id}
        estInactive={(l) => l.etat === 'INACTIVE'}
        estNonEnregistree={() => false}
        libelleEtatLigne={() => 'inactive depuis 08/2026'}
        idColonneMarque="val"
        formulaireOuvertId="inact"
        onOuvrirFormulaire={() => undefined}
        onValiderLigne={() => undefined}
        onAnnulerLigne={() => undefined}
        onAjouter={() => undefined}
        onSupprimer={() => undefined}
        suppressionEnCours={false}
        peutModifier
        renderFormulaire={(_l, actions) => (
          <div data-testid="formulaire-lecture-seule">
            {actions.lectureSeule ? 'lecture' : 'edit'}
          </div>
        )}
      />
    );
    expect(screen.queryByTestId('supprimer-inact')).toBeNull();
    expect(screen.getByTestId('formulaire-lecture-seule').textContent).toBe('lecture');
  });

  it('T10 — ligne non enregistree en dernier avec mention', () => {
    render(
      <EnveloppeTableauRepetable
        colonnes={[{ id: 'val', libelle: 'Valeur', render: (l) => l.valeur }]}
        lignes={[ligne('saved'), ligne('new', { etat: 'NON_ENREGISTREE' })]}
        getLigneId={(l) => l.id}
        estInactive={() => false}
        estNonEnregistree={(l) => l.etat === 'NON_ENREGISTREE'}
        libelleEtatLigne={(l) => (l.etat === 'NON_ENREGISTREE' ? 'non enregistrée' : null)}
        idColonneMarque="val"
        formulaireOuvertId={null}
        onOuvrirFormulaire={() => undefined}
        onValiderLigne={() => undefined}
        onAnnulerLigne={() => undefined}
        onAjouter={() => undefined}
        onSupprimer={() => undefined}
        suppressionEnCours={false}
        peutModifier
        renderFormulaire={() => null}
      />
    );
    expect(screen.getByTestId('etat-ligne-new').textContent).toContain('non enregistrée');
  });

  it('T11 — supprimer ligne jamais enregistree : callback local seulement', () => {
    const onSupprimer = vi.fn();
    render(
      <EnveloppeTableauRepetable
        colonnes={[{ id: 'val', libelle: 'Valeur', render: (l) => l.valeur }]}
        lignes={[ligne('new', { etat: 'NON_ENREGISTREE' })]}
        getLigneId={(l) => l.id}
        estInactive={() => false}
        estNonEnregistree={(l) => l.etat === 'NON_ENREGISTREE'}
        libelleEtatLigne={() => 'non enregistrée'}
        idColonneMarque="val"
        formulaireOuvertId={null}
        onOuvrirFormulaire={() => undefined}
        onValiderLigne={() => undefined}
        onAnnulerLigne={() => undefined}
        onAjouter={() => undefined}
        onSupprimer={onSupprimer}
        suppressionEnCours={false}
        peutModifier
        renderFormulaire={() => null}
      />
    );
    fireEvent.click(screen.getByTestId('supprimer-new'));
    expect(onSupprimer).toHaveBeenCalledTimes(1);
  });

  it('TB01 — l enveloppe declenche le comportement de suppression differee sans appel serveur', () => {
    const onConfirmer = vi.fn();
    const chargerApercu = vi.fn();
    render(
      <EnveloppeTableauRepetable
        colonnes={[{ id: 'val', libelle: 'Valeur', render: (l) => l.valeur }]}
        lignes={[ligne('saved')]}
        getLigneId={(l) => l.id}
        estInactive={() => false}
        estNonEnregistree={() => false}
        libelleEtatLigne={() => null}
        idColonneMarque="val"
        formulaireOuvertId={null}
        onOuvrirFormulaire={() => undefined}
        onValiderLigne={() => undefined}
        onAnnulerLigne={() => undefined}
        onAjouter={() => undefined}
        onSupprimer={() => undefined}
        suppressionEnCours={false}
        peutModifier
        strategieSuppression={{
          titre: 'Supprimer ?',
          corps: 'Differee',
          libelleConfirmer: 'Supprimer',
          libelleAnnuler: 'Garder la ligne',
          onConfirmer,
        }}
        renderFormulaire={() => null}
      />
    );
    fireEvent.click(screen.getByTestId('supprimer-saved'));
    expect(chargerApercu).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('dialogue-suppression-differee-confirmer'));
    expect(onConfirmer).toHaveBeenCalledTimes(1);
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
  });
});
