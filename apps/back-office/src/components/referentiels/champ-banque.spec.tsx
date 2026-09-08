// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Banque } from '@paymarh/shared-types';
import { ChampBanque, ligneDepuisValeurChampBanque, type ValeurChampBanque } from './champ-banque';

const BANQUES: readonly Banque[] = [
  { id: 'bnq-1', nom: 'Attijariwafa Bank', ancienNom: null, codeBanque: '007', couleur: '#000' },
];

describe('ChampBanque', () => {
  afterEach(() => cleanup());

  it('TB25 — accepte et conserve une valeur absente du referentiel', () => {
    const onChange = vi.fn();
    render(
      <ChampBanque
        id="banque-test"
        banques={BANQUES}
        valeur={{ banqueId: null, texte: '' }}
        onChange={onChange}
      />
    );

    const champ = document.getElementById('banque-test');
    if (!(champ instanceof HTMLInputElement)) throw new Error('Champ banque introuvable');
    fireEvent.change(champ, { target: { value: 'Banque Inconnue SA' } });

    expect(onChange).toHaveBeenLastCalledWith({
      banqueId: null,
      texte: 'Banque Inconnue SA',
    });

    const { banqueId, banqueLibreSaisie } = ligneDepuisValeurChampBanque(
      { banqueId: null, texte: 'Banque Inconnue SA' },
      BANQUES
    );
    expect(banqueId).toBeNull();
    expect(banqueLibreSaisie).toBe('Banque Inconnue SA');
  });

  it('TB27 — aucun pre-remplissage de la banque a partir du RIB', () => {
    const onChangeBanque = vi.fn();
    let valeurBanque: ValeurChampBanque = { banqueId: null, texte: '' };

    render(
      <div>
        <ChampBanque
          id="banque-test"
          banques={BANQUES}
          valeur={valeurBanque}
          onChange={(valeur) => {
            valeurBanque = valeur;
            onChangeBanque(valeur);
          }}
        />
        <input id="rib-test" aria-label="RIB" />
      </div>
    );

    fireEvent.change(screen.getByLabelText('RIB'), {
      target: { value: '007780000000000000000000' },
    });

    expect(onChangeBanque).not.toHaveBeenCalled();
    expect(valeurBanque).toEqual({ banqueId: null, texte: '' });
    expect(document.getElementById('banque-test')).toHaveProperty('value', '');
  });
});
