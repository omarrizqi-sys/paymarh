// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  messageConfirmationAnnuler,
  messageConfirmationRechargement,
} from './avertissement-navigation';

describe('avertissement navigation fiche salarie', () => {
  it('messageConfirmationAnnuler liste les rubriques modifiees', () => {
    expect(messageConfirmationAnnuler(['Coordonnees'])).toBe(
      'Annuler les modifications des rubriques : Coordonnees ?'
    );
  });

  it('messageConfirmationRechargement previent avant ecrasement', () => {
    expect(messageConfirmationRechargement(['Identite'])).toContain(
      'Recharger les valeurs du serveur écrasera la saisie en cours (Identite)'
    );
  });
});
