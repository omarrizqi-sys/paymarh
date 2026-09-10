// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaisieSurSalaire, TypeSaisieSurSalaire } from '@paymarh/shared-types';
import { FicheSalarieClient } from './fiche-salarie-client';
import { FormulaireTableauProvider } from './contexte-formulaire-tableau';
import { RegistreFicheProvider } from './registre-fiche-provider';
import { RubriqueSaisiesSurSalaire } from './rubrique-saisies-sur-salaire';
import { RailActionsFiche } from './rail-actions-fiche';
import { reinitialiserCompteurIdLocal } from '@/lib/fiche/saisies-sur-salaire-lignes';

const TYPES_SAISIE: readonly TypeSaisieSurSalaire[] = [
  { id: 'ts-1', ordre: 1, code: 'PENSION_ALIMENTAIRE', libelle: 'Pension alimentaire' },
  { id: 'ts-2', ordre: 2, code: 'TIERS_DETENTEUR', libelle: 'Saisie à tiers détenteur' },
];

const { creerSaisieSurSalaire, impactSuppressionSaisieSurSalaire, supprimerSaisieSurSalaire } =
  vi.hoisted(() => ({
    creerSaisieSurSalaire: vi.fn(),
    impactSuppressionSaisieSurSalaire: vi.fn(),
    supprimerSaisieSurSalaire: vi.fn(),
  }));

vi.mock('@/lib/api/salaries', async (importOriginal) => {
  const reel = await importOriginal();
  return {
    ...(reel as Record<string, unknown>),
    creerSaisieSurSalaire: (...args: unknown[]) => creerSaisieSurSalaire(...args),
    impactSuppressionSaisieSurSalaire: (...args: unknown[]) =>
      impactSuppressionSaisieSurSalaire(...args),
    supprimerSaisieSurSalaire: (...args: unknown[]) => supprimerSaisieSurSalaire(...args),
    lireSalarie: vi.fn(),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

function saisie(surcharges: Partial<SaisieSurSalaire> = {}): SaisieSurSalaire {
  return {
    id: 'saisie-1',
    typeSaisieCode: 'TIERS_DETENTEUR',
    referenceDecision: 'DEC-2026-01',
    creancier: 'Banque Populaire',
    libelleBulletin: 'SAISIE',
    montantTotal: '5000.00',
    montantMensuel: null,
    moisDebut: '2026-01',
    moisFin: null,
    moisEffetDebut: '2026-01',
    moisEffetFin: null,
    etat: 'ACTIVE',
    ...surcharges,
  };
}

function Harness({
  lignes = [],
  extra,
}: {
  readonly lignes?: SaisieSurSalaire[];
  readonly extra?: ReactNode;
}) {
  return (
    <RegistreFicheProvider versionInitiale={3} onRechargerServeur={vi.fn()}>
      <FormulaireTableauProvider>
        {extra}
        <RubriqueSaisiesSurSalaire
          companyId="soc-1"
          salarieId="sal-1"
          lignesServeur={lignes}
          typesSaisie={TYPES_SAISIE}
          onVersionChange={vi.fn()}
        />
        <RailActionsFiche
          operations={['salarie.modifier']}
          companyId="soc-test"
          salarieId="sal-test"
        />
      </FormulaireTableauProvider>
    </RegistreFicheProvider>
  );
}

describe('RubriqueSaisiesSurSalaire — formulaire', () => {
  afterEach(() => cleanup());

  it('T54 — pension alimentaire affiche montant mensuel et mois de fin', () => {
    render(
      <Harness
        lignes={[saisie({ typeSaisieCode: 'PENSION_ALIMENTAIRE', montantMensuel: '2000.00' })]}
      />
    );
    fireEvent.click(screen.getByTestId('ligne-saisie-1'));
    expect(screen.getByLabelText('Montant mensuel')).toBeTruthy();
    expect(screen.getByLabelText('Mois de fin')).toBeTruthy();
    expect(screen.queryByLabelText('Montant total')).toBeNull();
  });

  it('T55 — saisie tiers detenteur affiche montant total seul', () => {
    render(<Harness lignes={[saisie()]} />);
    fireEvent.click(screen.getByTestId('ligne-saisie-1'));
    expect(screen.getByLabelText('Montant total')).toBeTruthy();
    expect(screen.queryByLabelText('Montant mensuel')).toBeNull();
    expect(screen.queryByLabelText('Mois de fin')).toBeNull();
  });

  it('T56 — changement tiers vers pension affiche avertissement et conserve montant total localement', () => {
    render(<Harness lignes={[saisie()]} />);
    fireEvent.click(screen.getByTestId('ligne-saisie-1'));
    fireEvent.change(screen.getByLabelText('Type de saisie'), {
      target: { value: 'PENSION_ALIMENTAIRE' },
    });
    expect(screen.getByTestId('avertissement-changement-type')).toBeTruthy();
    expect(
      screen.getByText(/montant total saisi ne s’applique pas à une pension alimentaire/)
    ).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Type de saisie'), {
      target: { value: 'TIERS_DETENTEUR' },
    });
    expect(screen.queryByTestId('avertissement-changement-type')).toBeNull();
    expect(screen.getByLabelText('Montant total')).toHaveProperty('value', '5000.00');
  });

  it('T57 — libelles type de saisie issus du referentiel', () => {
    render(<Harness lignes={[saisie()]} />);
    expect(screen.getByText('Saisie à tiers détenteur')).toBeTruthy();
  });
});

describe('RubriqueSaisiesSurSalaire — suppression', () => {
  beforeEach(() => {
    impactSuppressionSaisieSurSalaire.mockReset();
    supprimerSaisieSurSalaire.mockReset();
  });

  afterEach(() => cleanup());

  it('T58 — suppression affiche le titre propre', async () => {
    impactSuppressionSaisieSurSalaire.mockResolvedValue({
      donnees: { message: 'Msg saisie', jetonConfirmation: 'jeton' },
    });

    render(<Harness lignes={[saisie()]} />);
    fireEvent.click(screen.getByTestId('supprimer-saisie-1'));
    await waitFor(() => expect(screen.getByTestId('confirmer-suppression-ligne')).toBeTruthy());
    expect(screen.getByText('Supprimer cette saisie ?')).toBeTruthy();
  });
});

describe('RubriqueSaisiesSurSalaire — sommaire', () => {
  afterEach(() => cleanup());

  it('T59 — saisies apparait apres prets dans le sommaire', () => {
    render(
      <FicheSalarieClient
        companyId="soc-1"
        salarieId="sal-1"
        initial={{
          id: 'sal-1',
          version: 1,
          etat: 'ACTIF',
          moisEnCours: '2026-09',
          dateSortie: null,
          matricule: 'EMP001',
          nom: 'Benali',
          prenom: 'Sara',
          sexe: 'FEMME',
          dateNaissance: '1990-05-12',
          villeNaissance: null,
          paysNaissanceId: null,
          nationaliteId: null,
          typePieceIdentite: 'CIN',
          situationFamiliale: { code: null, libelle: null },
          numeroPiece: null,
          numeroCnss: null,
          numeroCimr: null,
          adresse: null,
          complementAdresse: null,
          ville: null,
          codePostal: null,
          paysId: null,
          telephonePersonnel: null,
          telephoneProfessionnel: null,
          emailPersonnel: null,
          emailProfessionnel: null,
          urgencePrenom: null,
          urgenceNom: null,
          urgenceTelephone: null,
          urgenceEmail: null,
          dateEntree: '2020-01-15',
          dateAnciennete: '2020-01-15',
          emplois: [],
          nombrePersonnesACharge: 0,
          personnesACharge: [],
          prets: [],
          saisiesSurSalaire: [],
          operations: ['salarie.lire', 'salarie.modifier'],
        }}
        pays={[]}
        situationsFamiliales={[]}
        liensParente={[]}
        banques={[]}
        typesSaisie={TYPES_SAISIE}
      />
    );
    const boutons = screen.getAllByRole('button');
    const ids = boutons
      .map((b) => b.getAttribute('data-testid'))
      .filter((id): id is string => id?.startsWith('sommaire-') ?? false)
      .map((id) => id.replace('sommaire-', ''));
    const indexPrets = ids.indexOf('prets');
    const indexSaisies = ids.indexOf('saisies-sur-salaire');
    expect(indexPrets).toBeGreaterThanOrEqual(0);
    expect(indexSaisies).toBeGreaterThan(indexPrets);
  });
});

function ficheReponseSaisies(saisies: SaisieSurSalaire[], version: number) {
  return { donnees: { version, saisiesSurSalaire: saisies }, alertes: [] };
}

function remplirSaisieTiers(): void {
  fireEvent.change(screen.getByLabelText('Type de saisie'), {
    target: { value: 'TIERS_DETENTEUR' },
  });
  fireEvent.change(screen.getByLabelText('Référence de la décision'), {
    target: { value: 'DEC-2026-001' },
  });
  fireEvent.change(screen.getByLabelText('Créancier demandeur'), { target: { value: 'Banque' } });
  fireEvent.change(screen.getByLabelText('Libellé bulletin'), { target: { value: 'SAISIE' } });
  fireEvent.change(screen.getByLabelText('Mois de début'), { target: { value: '2026-01' } });
  fireEvent.change(screen.getByLabelText('Montant total'), { target: { value: '5000.00' } });
}

function annulerFiche(): void {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
}

describe('RubriqueSaisiesSurSalaire — reinitialiser apres enregistrement', () => {
  beforeEach(() => {
    reinitialiserCompteurIdLocal();
    creerSaisieSurSalaire.mockReset();
  });

  afterEach(() => cleanup());

  it('T63 — apres enregistrement puis Annuler fiche la ligne enregistree reste affichee', async () => {
    creerSaisieSurSalaire.mockResolvedValueOnce(
      ficheReponseSaisies(
        [saisie({ id: 'saisie-enregistree', referenceDecision: 'DEC-2026-001' })],
        4
      )
    );

    render(<Harness lignes={[]} />);
    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    remplirSaisieTiers();
    fireEvent.click(screen.getByTestId('valider-ligne'));
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));
    await waitFor(() => expect(creerSaisieSurSalaire).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId('ligne-saisie-enregistree')).toBeTruthy());

    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    remplirSaisieTiers();
    fireEvent.change(screen.getByLabelText('Référence de la décision'), {
      target: { value: 'DEC-2026-002' },
    });
    fireEvent.click(screen.getByTestId('valider-ligne'));

    annulerFiche();

    expect(screen.getByTestId('ligne-saisie-enregistree')).toBeTruthy();
    expect(screen.queryByText('DEC-2026-002')).toBeNull();
  });
});
