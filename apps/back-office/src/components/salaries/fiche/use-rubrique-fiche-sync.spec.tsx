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
      <span data-testid="etat-modifiee">{rubrique.modifiee ? 'oui' : 'non'}</span>
      <button type="button" onClick={() => rubrique.reinitialiser()}>
        Reinitialiser
      </button>
    </div>
  );
}

function LecteurParent() {
  const { nombreModifiees } = useRegistreFiche();
  return <span data-testid="parent-nombre-modifiees">{nombreModifiees}</span>;
}

function BoutonEnregistrer() {
  const { enregistrer, nombreModifiees } = useRegistreFiche();
  return (
    <button
      type="button"
      data-testid="bouton-enregistrer"
      disabled={nombreModifiees === 0}
      onClick={() => void enregistrer()}
    >
      Enregistrer
    </button>
  );
}

function HarnessComplet({
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
      <LecteurParent />
      <BoutonEnregistrer />
    </RegistreFicheProvider>
  );
}

function HarnessReferenceInstable({ initial }: { readonly initial: Valeurs }) {
  const [valeurs, setValeurs] = useState(initial);
  const [, setTick] = useState(0);

  return (
    <RegistreFicheProvider versionInitiale={1} onRechargerServeur={vi.fn(async () => undefined)}>
      <button type="button" onClick={() => setTick((g) => g + 1)}>
        Nouvelle reference
      </button>
      <BlocTest
        valeurs={{ prenom: valeurs.prenom, nom: valeurs.nom }}
        envoyer={vi.fn(async () => ({ version: 2, alertes: [] }))}
        onServeurChange={(v) => setValeurs(v)}
      />
    </RegistreFicheProvider>
  );
}

export async function scenarioPostEnregistrementSaisieImmediate(): Promise<void> {
  render(
    <HarnessComplet
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
  expect(screen.getByLabelText('Nom')).toHaveProperty('value', 'Tazi');
}

describe('useRubriqueFiche — synchronisation registre (W1-W3, V1, V4)', () => {
  afterEach(() => cleanup());

  it('W1 — apres enregistrement, une saisie immediate nest pas ecrasee par la resync serveur', async () => {
    await scenarioPostEnregistrementSaisieImmediate();
  });

  it('W2 — un objet serveur identique avec cles reordonnees ne reinitialise pas la saisie locale', () => {
    render(<HarnessReferenceInstable initial={{ nom: 'Benali', prenom: 'Sara' }} />);

    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Alaoui' } });
    expect(screen.getByLabelText('Nom')).toHaveProperty('value', 'Alaoui');

    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle reference' }));
    expect(screen.getByLabelText('Nom')).toHaveProperty('value', 'Alaoui');
  });

  it('W3 — un contenu serveur reellement different met a jour la saisie locale', async () => {
    render(
      <HarnessComplet
        initial={{ nom: 'Benali', prenom: 'Sara' }}
        envoyer={vi.fn(async () => ({ version: 2, alertes: [] }))}
      />
    );

    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Alaoui' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(screen.getByTestId('etat-modifiee').textContent).toBe('non'));
    expect(screen.getByLabelText('Nom')).toHaveProperty('value', 'Alaoui');

    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Tazi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(screen.getByLabelText('Nom')).toHaveProperty('value', 'Tazi'));
  });

  it('V1 — apres mutation, le parent voit le bloc comme modifie sans second rendu', () => {
    render(
      <HarnessComplet
        initial={{ nom: 'Benali', prenom: 'Sara' }}
        envoyer={vi.fn(async () => ({ version: 2, alertes: [] }))}
      />
    );

    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Alaoui' } });

    expect(screen.getByTestId('etat-modifiee').textContent).toBe('oui');
    expect(screen.getByTestId('parent-nombre-modifiees').textContent).toBe('1');
    expect(screen.getByTestId('bouton-enregistrer')).toHaveProperty('disabled', false);
  });

  it('V4 — apres reinitialisation, une nouvelle saisie reste visible par le parent', () => {
    render(
      <HarnessComplet
        initial={{ nom: 'Benali', prenom: 'Sara' }}
        envoyer={vi.fn(async () => ({ version: 2, alertes: [] }))}
      />
    );

    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Alaoui' } });
    expect(screen.getByTestId('parent-nombre-modifiees').textContent).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: 'Reinitialiser' }));
    expect(screen.getByTestId('parent-nombre-modifiees').textContent).toBe('0');

    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Tazi' } });
    expect(screen.getByTestId('parent-nombre-modifiees').textContent).toBe('1');
    expect(screen.getByTestId('etat-modifiee').textContent).toBe('oui');
  });
});
