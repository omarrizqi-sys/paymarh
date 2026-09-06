// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import {
  confirmerNavigationAvecModifications,
  messageConfirmationAnnuler,
  messageConfirmationRechargement,
} from './avertissement-navigation';

describe('avertissement navigation fiche salarie', () => {
  it('une tentative de navigation avec des modifications en cours declenche la confirmation', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    const autorise = confirmerNavigationAvecModifications(['Identite', 'Dates']);

    expect(autorise).toBe(false);
    expect(confirm).toHaveBeenCalledWith(
      'Des modifications non enregistrées concernent : Identite, Dates. Quitter quand même ?'
    );
    confirm.mockRestore();
  });

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
