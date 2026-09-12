// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { createElement, useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RubriqueAbsenteDeLOrdreError } from '@/lib/fiche/ordre-rubriques-fiche-salarie';
import type { RubriqueEnregistrable } from '@/lib/fiche/orchestrateur-enregistrement';
import { RegistreFicheProvider, useRegistreFiche } from './registre-fiche-provider';
import { SommaireRubriques } from './sommaire-rubriques';

const ENTITE_SALARIE = { kind: 'salarie' as const };

function RubriqueHarness({
  rubrique,
}: {
  readonly rubrique: Omit<RubriqueEnregistrable, 'estModifiee' | 'reinitialiser'> & {
    readonly modifiee?: boolean;
  };
}) {
  const { enregistrerRubrique } = useRegistreFiche();
  useEffect(() => {
    return enregistrerRubrique({
      ...rubrique,
      estModifiee: () => rubrique.modifiee ?? false,
      reinitialiser: () => undefined,
    });
  }, [enregistrerRubrique, rubrique]);
  return null;
}

function CaptureEnregistrer({
  onCapture,
}: {
  readonly onCapture: (
    enregistrer: ReturnType<typeof useRegistreFiche>['enregistrerRubrique']
  ) => void;
}) {
  const { enregistrerRubrique } = useRegistreFiche();
  useEffect(() => {
    onCapture(enregistrerRubrique);
  }, [enregistrerRubrique, onCapture]);
  return null;
}

describe('RegistreFicheProvider', () => {
  afterEach(() => cleanup());

  it('le sommaire affiche les huit rubriques salarie plus Emplois sans les rubriques d emploi', () => {
    render(
      createElement(
        RegistreFicheProvider,
        {
          versionInitiale: 1,
          emplois: [{ id: 'emp-1', libellePoste: 'Poste', version: 2 }],
          onRechargerServeur: vi.fn(),
        },
        createElement(RubriqueHarness, {
          rubrique: {
            id: 'identite',
            libelle: 'Identité',
            entite: ENTITE_SALARIE,
            envoyer: vi.fn(),
          },
        }),
        createElement(SommaireRubriques, {})
      )
    );

    expect(screen.getByTestId('sommaire-identite')).toBeTruthy();
    expect(screen.getByTestId('sommaire-emplois')).toBeTruthy();
    expect(screen.queryByTestId('sommaire-emp-1/contrat')).toBeNull();
  });

  it('leve RubriqueAbsenteDeLOrdreError quand une rubrique inscrite est absente de l ordre', () => {
    let enregistrerRubriqueCapture:
      ReturnType<typeof useRegistreFiche>['enregistrerRubrique'] | null = null;

    render(
      createElement(
        RegistreFicheProvider,
        { versionInitiale: 1, onRechargerServeur: vi.fn() },
        createElement(CaptureEnregistrer, {
          onCapture: (fn) => {
            enregistrerRubriqueCapture = fn;
          },
        })
      )
    );

    expect(enregistrerRubriqueCapture).not.toBeNull();
    expect(() =>
      enregistrerRubriqueCapture!({
        id: 'rubrique-inconnue',
        libelle: 'Fantôme',
        entite: ENTITE_SALARIE,
        estModifiee: () => false,
        envoyer: vi.fn(),
        reinitialiser: () => undefined,
      })
    ).toThrow(RubriqueAbsenteDeLOrdreError);
  });
});
