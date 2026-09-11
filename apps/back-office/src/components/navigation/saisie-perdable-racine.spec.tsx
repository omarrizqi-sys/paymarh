// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement, useEffect, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  RegistreFicheProvider,
  useRegistreFiche,
} from '@/components/salaries/fiche/registre-fiche-provider';
import { NavigationEnTete } from './navigation-en-tete';
import { NavigationGardeeProvider } from './navigation-gardee';
import { SaisiePerdableRacineProvider, useDeclarerSaisiePerdable } from './saisie-perdable-racine';

const routerPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: routerPush,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}));

function DeclarerRegistreFichePourGarde() {
  const { aModificationsNonEnregistrees, libellesRubriquesModifiees } = useRegistreFiche();
  useDeclarerSaisiePerdable(aModificationsNonEnregistrees, libellesRubriquesModifiees);
  return null;
}

function EcranSaisieSimule({
  actif,
  modifiee,
}: {
  readonly actif: boolean;
  readonly modifiee: boolean;
}) {
  const { enregistrerRubrique, notifierSommaire } = useRegistreFiche();
  const [modifieeLocale, setModifieeLocale] = useState(modifiee);

  useEffect(() => {
    setModifieeLocale(modifiee);
  }, [modifiee]);

  useEffect(() => {
    if (!actif) return;
    return enregistrerRubrique({
      id: 'identite',
      libelle: 'Identite',
      estModifiee: () => modifieeLocale,
      envoyer: vi.fn(async () => ({ version: 2, alertes: [] })),
      reinitialiser: () => setModifieeLocale(false),
    });
  }, [actif, enregistrerRubrique, modifieeLocale]);

  useEffect(() => {
    if (actif && modifieeLocale) {
      notifierSommaire();
    }
  }, [actif, modifieeLocale, notifierSommaire]);

  if (!actif) return null;

  return createElement(
    'button',
    {
      type: 'button',
      'data-testid': 'marquer-identite',
      onClick: () => {
        setModifieeLocale(true);
        notifierSommaire();
      },
    },
    'Marquer Identite'
  );
}

function RenduCoquille({
  ecranActif,
  modifiee = false,
}: {
  readonly ecranActif: boolean;
  readonly modifiee?: boolean;
}) {
  return (
    <SaisiePerdableRacineProvider>
      <NavigationGardeeProvider>
        <NavigationEnTete />
        <RegistreFicheProvider versionInitiale={1} onRechargerServeur={vi.fn()}>
          <DeclarerRegistreFichePourGarde />
          <EcranSaisieSimule actif={ecranActif} modifiee={modifiee} />
        </RegistreFicheProvider>
      </NavigationGardeeProvider>
    </SaisiePerdableRacineProvider>
  );
}

describe('Saisie perdable racine', () => {
  afterEach(() => {
    cleanup();
    routerPush.mockReset();
  });

  it('SPR01 — apres demontage de l ecran a saisie, l en-tete ne demande plus rien', () => {
    const { rerender } = render(<RenduCoquille ecranActif modifiee />);

    fireEvent.click(screen.getByTestId('marquer-identite'));
    fireEvent.click(screen.getByRole('link', { name: 'Sociétés' }));
    expect(screen.getByTestId('dialogue-suppression-differee')).toBeTruthy();
    fireEvent.click(screen.getByTestId('dialogue-suppression-differee-annuler'));

    rerender(<RenduCoquille ecranActif={false} />);
    fireEvent.click(screen.getByRole('link', { name: 'Sociétés' }));

    expect(screen.queryByTestId('dialogue-suppression-differee')).toBeNull();
    expect(routerPush).toHaveBeenCalledWith('/societes');
  });
});
