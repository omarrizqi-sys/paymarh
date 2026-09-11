// @vitest-environment jsdom
/**
 * Exercice la forme REELLE renvoyee par ValidationPipe (main.ts) quand les
 * dates obligatoires sont vides — message: string[], sans champ, sans code.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pays, SituationFamiliale } from '@paymarh/shared-types';
import { MESSAGE_ERREUR_GENERIQUE } from '@/lib/messages-interface';
import { EcranCreationSalarie } from './ecran-creation-salarie';
import { NavigationGardeeTestProvider } from '@/test/navigation-gardee-test';

const { routerPush } = vi.hoisted(() => ({
  routerPush: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush }),
}));

const CORPS_VALIDATION_PIPE = {
  message: [
    'dateNaissance must be a valid ISO 8601 date string',
    'dateEntree must be a valid ISO 8601 date string',
  ],
  error: 'Bad Request',
  statusCode: 400,
};

const PAYS: readonly Pays[] = [{ id: 'pays-ma', ordre: 1, codeIso: 'MA', libelle: 'Maroc' }];

const SITUATIONS: readonly SituationFamiliale[] = [
  {
    id: 'sf-1',
    code: 'CELIBATAIRE',
    libelleMasculin: 'Celibataire',
    libelleFeminin: 'Celibataire',
  },
];

describe('Creation — forme reelle ValidationPipe', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    routerPush.mockReset();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => CORPS_VALIDATION_PIPE,
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('refus ValidationPipe (dates vides) : le message s affiche sous dateNaissance, pas le generique', async () => {
    render(
      <NavigationGardeeTestProvider>
        <EcranCreationSalarie companyId="soc-1" pays={PAYS} situationsFamiliales={SITUATIONS} />
      </NavigationGardeeTestProvider>
    );
    fireEvent.change(document.getElementById('nom')!, { target: { value: 'Benali' } });
    fireEvent.change(document.getElementById('prenom')!, { target: { value: 'Sara' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le salarié' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const blocDateNaissance = document.getElementById('dateNaissance')!.parentElement!;
    expect(within(blocDateNaissance).getByRole('alert')).toBeTruthy();
    expect(screen.queryByText(MESSAGE_ERREUR_GENERIQUE)).toBeNull();
    expect(routerPush).not.toHaveBeenCalled();
  });
});
