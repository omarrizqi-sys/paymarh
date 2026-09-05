// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement, useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RegistreFicheProvider, useRegistreFiche } from './registre-fiche-provider';
import { SommaireRubriques } from './sommaire-rubriques';
import { SqueletteFicheSalarie } from './squelette-fiche-salarie';
import { RailActionsFiche } from './rail-actions-fiche';

function EnregistrerRubriquesSommaire() {
  const { enregistrerRubrique } = useRegistreFiche();
  useEffect(() => {
    const desA = enregistrerRubrique({
      id: 'identite',
      libelle: 'Identite',
      estModifiee: () => false,
      envoyer: vi.fn(),
      reinitialiser: () => undefined,
    });
    const desB = enregistrerRubrique({
      id: 'coordonnees',
      libelle: 'Coordonnees',
      estModifiee: () => false,
      envoyer: vi.fn(),
      reinitialiser: () => undefined,
    });
    return () => {
      desA();
      desB();
    };
  }, [enregistrerRubrique]);
  return null;
}

describe('SqueletteFicheSalarie et sommaire', () => {
  afterEach(() => cleanup());

  it('un clic dans le sommaire fait defiler jusqu a la rubrique sans masquer les autres', () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });

    render(
      createElement(
        RegistreFicheProvider,
        { versionInitiale: 1, onRechargerServeur: vi.fn() },
        createElement(EnregistrerRubriquesSommaire),
        createElement(SqueletteFicheSalarie, {
          sommaire: createElement(SommaireRubriques),
          rubriques: createElement(
            'div',
            null,
            createElement('section', { id: 'identite' }, 'Identite visible'),
            createElement('section', { id: 'coordonnees' }, 'Coordonnees visible')
          ),
          renderRail: () => createElement(RailActionsFiche, { operations: ['salarie.modifier'] }),
        })
      )
    );

    fireEvent.click(screen.getByTestId('sommaire-coordonnees'));

    expect(scrollIntoView).toHaveBeenCalled();
    expect(screen.getByText('Identite visible')).toBeTruthy();
    expect(screen.getByText('Coordonnees visible')).toBeTruthy();
  });

  it('le rail replie conserve ses icones cliquables', () => {
    render(
      createElement(
        RegistreFicheProvider,
        { versionInitiale: 1, onRechargerServeur: vi.fn() },
        createElement(SqueletteFicheSalarie, {
          rubriques: createElement('p', null, 'Contenu'),
          renderRail: (compact) =>
            createElement(RailActionsFiche, {
              operations: ['salarie.modifier', 'salarie.supprimer'],
              modeCompact: compact,
            }),
        })
      )
    );

    fireEvent.click(screen.getByTestId('replier-rail'));
    expect(screen.getByTestId('rail-icones')).toBeTruthy();
    expect(screen.getByTestId('rail-compact')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeTruthy();
  });
});
