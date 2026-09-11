// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DialogueConfirmationSuppressionTableau } from './dialogue-confirmation-suppression-tableau';
import { textesSuppressionHistorisee } from './textes-suppression-tableau-historise';

describe('DialogueConfirmationSuppressionTableau', () => {
  afterEach(() => cleanup());

  it('T19 — message serveur tel quel plus mention immediate', () => {
    render(
      <DialogueConfirmationSuppressionTableau
        textes={textesSuppressionHistorisee({
          titre: 'Supprimer cette personne à charge ?',
          messageServeur: 'La ligne sera close et restera visible.',
          rubriqueModifiee: false,
        })}
        preambule={null}
        chargement={false}
        erreur={undefined}
        ouvert
        onFermer={vi.fn()}
        onConfirmer={vi.fn()}
      />
    );
    expect(screen.getByTestId('message-apercu-suppression').textContent).toBe(
      'La ligne sera close et restera visible.'
    );
    expect(screen.getByTestId('dialogue-suppression-ligne-titre').textContent).toBe(
      'Supprimer cette personne à charge ?'
    );
    expect(screen.getByTestId('mention-suppression-immediate').textContent).toBe(
      'Cette suppression part tout de suite. Le bouton Annuler de la fiche ne reviendra pas dessus.'
    );
  });

  it('T20 — mention des modifications non enregistrees', () => {
    render(
      <DialogueConfirmationSuppressionTableau
        textes={textesSuppressionHistorisee({
          titre: 'Supprimer cette personne à charge ?',
          messageServeur: 'Msg',
          rubriqueModifiee: true,
        })}
        preambule={null}
        chargement={false}
        erreur={undefined}
        ouvert
        onFermer={vi.fn()}
        onConfirmer={vi.fn()}
      />
    );
    expect(screen.getByTestId('mention-modifs-non-enregistrees')).toBeTruthy();
    expect(screen.getByTestId('mention-modifs-non-enregistrees').textContent).toBe(
      'Vos autres modifications de cette rubrique restent à enregistrer.'
    );
  });

  it('T21 — confirmation declenche onConfirmer', () => {
    const onConfirmer = vi.fn();
    render(
      <DialogueConfirmationSuppressionTableau
        textes={textesSuppressionHistorisee({
          titre: 'Supprimer cette personne à charge ?',
          messageServeur: 'Msg',
          rubriqueModifiee: false,
        })}
        preambule={null}
        chargement={false}
        erreur={undefined}
        ouvert
        onFermer={vi.fn()}
        onConfirmer={onConfirmer}
      />
    );
    fireEvent.click(screen.getByTestId('confirmer-suppression-ligne'));
    expect(onConfirmer).toHaveBeenCalledTimes(1);
  });

  it('T22 — preambule situation changee affiche en tete', () => {
    render(
      <DialogueConfirmationSuppressionTableau
        textes={textesSuppressionHistorisee({
          titre: 'Supprimer cette personne à charge ?',
          messageServeur: 'Second',
          rubriqueModifiee: false,
        })}
        preambule="La situation a changé depuis l’affichage."
        chargement={false}
        erreur={undefined}
        ouvert
        onFermer={vi.fn()}
        onConfirmer={vi.fn()}
      />
    );
    expect(screen.getByTestId('mention-situation-changee')).toBeTruthy();
    expect(screen.getByTestId('message-apercu-suppression').textContent).toBe('Second');
  });
});
