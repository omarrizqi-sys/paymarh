// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { MessagesChamp } from '@/components/formulaire/messages-champ';

/** Message neutre renvoye par l API pour VALEUR_INDISPONIBLE (validation-fiche.ts). */
const MESSAGE_VALEUR_INDISPONIBLE = "Cette valeur n'est pas disponible.";

describe('affichage erreurs API', () => {
  it('affiche le message VALEUR_INDISPONIBLE tel quel sans reformulation', () => {
    render(
      createElement(MessagesChamp, {
        champ: 'codeDossier',
        erreur: MESSAGE_VALEUR_INDISPONIBLE,
      })
    );
    const alerte = screen.getByRole('alert');
    expect(alerte.textContent).toBe(MESSAGE_VALEUR_INDISPONIBLE);
  });
});
