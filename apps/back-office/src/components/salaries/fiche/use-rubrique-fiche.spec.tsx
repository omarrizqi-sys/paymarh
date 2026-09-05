// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RegistreFicheProvider, useRegistreFiche } from './registre-fiche-provider';
import { useRubriqueFiche } from './use-rubrique-fiche';

interface Valeurs {
  readonly nom: string;
  readonly prenom: string;
}

function BlocTest({
  valeurs,
  envoyer,
  onServeurChange,
}: {
  readonly valeurs: Valeurs;
  readonly envoyer: (
    version: number,
    courant: Valeurs
  ) => Promise<{
    version: number;
    alertes: readonly { code: string; message: string; champ?: string }[];
  }>;
  readonly onServeurChange: (valeurs: Valeurs, version: number) => void;
}) {
  const rubrique = useRubriqueFiche({
    id: 'identite',
    libelle: 'Identite',
    valeursServeur: valeurs,
    estModifiee: (courant, serveur) =>
      courant.nom !== serveur.nom || courant.prenom !== serveur.prenom,
    envoyer,
    onServeurChange,
  });

  return (
    <div>
      <input
        aria-label="Nom"
        value={rubrique.courant.nom}
        onChange={(e) => rubrique.modifier({ nom: e.target.value })}
      />
      <input
        aria-label="Prenom"
        value={rubrique.courant.prenom}
        onChange={(e) => rubrique.modifier({ prenom: e.target.value })}
      />
      <span data-testid="etat-modifiee">{rubrique.modifiee ? 'oui' : 'non'}</span>
      <button type="button" onClick={() => rubrique.reinitialiser()}>
        Reinitialiser
      </button>
    </div>
  );
}

function Harness({
  initial,
  envoyer,
}: {
  readonly initial: Valeurs;
  readonly envoyer: (
    version: number,
    courant: Valeurs
  ) => Promise<{
    version: number;
    alertes: readonly { code: string; message: string; champ?: string }[];
  }>;
}) {
  const [valeurs, setValeurs] = useState(initial);
  return (
    <RegistreFicheProvider versionInitiale={1} onRechargerServeur={vi.fn(async () => undefined)}>
      <BlocTest
        valeurs={valeurs}
        envoyer={async (version, courant) => {
          const resultat = await envoyer(version, courant);
          setValeurs({ nom: courant.nom, prenom: courant.prenom });
          return resultat;
        }}
        onServeurChange={(v) => setValeurs(v)}
      />
      <DeclencheurEnregistrement />
    </RegistreFicheProvider>
  );
}

function DeclencheurEnregistrement() {
  const { enregistrer } = useRegistreFiche();
  return (
    <button type="button" onClick={() => void enregistrer()}>
      Enregistrer
    </button>
  );
}

describe('useRubriqueFiche — reinitialiser', () => {
  afterEach(() => cleanup());

  it('U1 — apres reinitialiser(), un bloc modifie ne l est plus et ses champs ont retrouve leur origine', () => {
    render(
      <Harness
        initial={{ nom: 'Benali', prenom: 'Sara' }}
        envoyer={vi.fn(async () => ({ version: 2, alertes: [] }))}
      />
    );

    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Alaoui' } });
    expect(screen.getByTestId('etat-modifiee').textContent).toBe('oui');

    fireEvent.click(screen.getByRole('button', { name: 'Reinitialiser' }));

    expect(screen.getByLabelText('Nom')).toHaveProperty('value', 'Benali');
    expect(screen.getByLabelText('Prenom')).toHaveProperty('value', 'Sara');
    expect(screen.getByTestId('etat-modifiee').textContent).toBe('non');
  });

  it('U4 — apres un enregistrement reussi, reinitialiser() ramene aux valeurs enregistrees', async () => {
    render(
      <Harness
        initial={{ nom: 'Benali', prenom: 'Sara' }}
        envoyer={vi.fn(async () => ({ version: 2, alertes: [] }))}
      />
    );

    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Alaoui' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(screen.getByTestId('etat-modifiee').textContent).toBe('non'));
    expect(screen.getByLabelText('Nom')).toHaveProperty('value', 'Alaoui');

    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Tazi' } });
    expect(screen.getByTestId('etat-modifiee').textContent).toBe('oui');

    fireEvent.click(screen.getByRole('button', { name: 'Reinitialiser' }));

    expect(screen.getByLabelText('Nom')).toHaveProperty('value', 'Alaoui');
    expect(screen.getByLabelText('Prenom')).toHaveProperty('value', 'Sara');
    expect(screen.getByTestId('etat-modifiee').textContent).toBe('non');
  });
});
