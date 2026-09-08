// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PretSalarie } from '@paymarh/shared-types';
import { AppelApiEchoue } from '@/lib/api/client';
import type { FicheSalarieAvecOperations } from '@/lib/api/salaries';
import { FicheSalarieClient } from './fiche-salarie-client';
import { FormulaireTableauProvider } from './contexte-formulaire-tableau';
import { RegistreFicheProvider, useRegistreFiche } from './registre-fiche-provider';
import { RubriquePrets } from './rubrique-prets';
import { RailActionsFiche } from './rail-actions-fiche';
import { reinitialiserCompteurIdLocal } from '@/lib/fiche/prets-lignes';

const TYPES_SAISIE = [
  { id: 'ts-1', ordre: 1, code: 'PENSION_ALIMENTAIRE', libelle: 'Pension alimentaire' },
  { id: 'ts-2', ordre: 2, code: 'TIERS_DETENTEUR', libelle: 'Saisie à tiers détenteur' },
] as const;

const { creerPret, modifierPret, impactSuppressionPret, supprimerPret, modifierIdentiteSalarie } =
  vi.hoisted(() => ({
    creerPret: vi.fn(),
    modifierPret: vi.fn(),
    impactSuppressionPret: vi.fn(),
    supprimerPret: vi.fn(),
    modifierIdentiteSalarie: vi.fn(),
  }));

vi.mock('@/lib/api/salaries', async (importOriginal) => {
  const reel = await importOriginal();
  return {
    ...(reel as Record<string, unknown>),
    creerPret: (...args: unknown[]) => creerPret(...args),
    modifierPret: (...args: unknown[]) => modifierPret(...args),
    impactSuppressionPret: (...args: unknown[]) => impactSuppressionPret(...args),
    supprimerPret: (...args: unknown[]) => supprimerPret(...args),
    modifierIdentiteSalarie: (...args: unknown[]) => modifierIdentiteSalarie(...args),
    lireSalarie: vi.fn(),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

function pret(surcharges: Partial<PretSalarie> = {}): PretSalarie {
  return {
    id: 'pret-1',
    libelleObjet: 'Avance logement',
    libelleBulletin: 'PRET',
    montantTotal: '1000.00',
    moisDebut: '2026-01',
    mensualite: '100.00',
    nombreEcheances: 10,
    soldeRestant: '1000.00',
    moisEffetDebut: '2026-01',
    moisEffetFin: null,
    etat: 'ACTIVE',
    ...surcharges,
  };
}

function ficheReponse(prets: PretSalarie[], version: number, alertes: unknown[] = []) {
  return { donnees: { version, prets }, alertes };
}

function ficheSalarieBase(
  surcharges: Partial<FicheSalarieAvecOperations> = {}
): FicheSalarieAvecOperations {
  return {
    id: 'sal-1',
    version: 3,
    etat: 'ACTIF',
    moisEnCours: '2026-09',
    dateSortie: null,
    matricule: 'EMP001',
    nom: 'Benali',
    prenom: 'Sara',
    sexe: 'FEMME',
    dateNaissance: '1990-05-12',
    villeNaissance: 'Rabat',
    paysNaissanceId: 'pays-ma',
    nationaliteId: 'pays-ma',
    typePieceIdentite: 'CIN',
    situationFamiliale: { code: 'MARIE', libelle: 'Mariee' },
    numeroPiece: 'AB123456',
    numeroCnss: '001122',
    numeroCimr: '3344',
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
    prets: [pret()],
    saisiesSurSalaire: [],
    operations: ['salarie.lire', 'salarie.modifier'],
    ...surcharges,
  };
}

function Harness({
  lignes = [pret()],
  extra,
}: {
  readonly lignes?: PretSalarie[];
  readonly extra?: ReactNode;
}) {
  return (
    <RegistreFicheProvider versionInitiale={3} onRechargerServeur={vi.fn()}>
      <FormulaireTableauProvider>
        {extra}
        <RubriquePrets
          companyId="soc-1"
          salarieId="sal-1"
          lignesServeur={lignes}
          onVersionChange={vi.fn()}
        />
        <RailActionsFiche operations={['salarie.modifier']} />
      </FormulaireTableauProvider>
    </RegistreFicheProvider>
  );
}

function rendreFicheComplete(fiche: FicheSalarieAvecOperations = ficheSalarieBase()) {
  return render(
    <FicheSalarieClient
      companyId="soc-1"
      salarieId="sal-1"
      initial={fiche}
      pays={[]}
      situationsFamiliales={[]}
      liensParente={[]}
      banques={[]}
      typesSaisie={TYPES_SAISIE}
    />
  );
}

describe('RubriquePrets — envoi et alertes', () => {
  beforeEach(() => {
    creerPret.mockReset();
    modifierPret.mockReset();
    impactSuppressionPret.mockReset();
    supprimerPret.mockReset();
    modifierIdentiteSalarie.mockReset();
  });

  afterEach(() => cleanup());

  it('T47 — pret incoherent enregistre avec alerte sous mensualite et formulaire ouvert', async () => {
    modifierPret.mockResolvedValueOnce(
      ficheReponse([pret({ mensualite: '90.00' })], 4, [
        {
          code: 'MENSUALITE_ECHEANCES_INCOHERENTE',
          message: 'Incoherence mensualite',
          champ: 'mensualite',
        },
      ])
    );

    render(<Harness />);
    fireEvent.click(screen.getByTestId('ligne-pret-1'));
    fireEvent.change(screen.getByLabelText('Mensualité'), { target: { value: '90.00' } });
    fireEvent.click(screen.getByTestId('valider-ligne'));
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(modifierPret).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId('formulaire-pret-1')).toBeTruthy());
    expect(screen.getByText('Incoherence mensualite')).toBeTruthy();
  });

  it('T48 — solde restant vide sur ligne modifiee non enregistree', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId('ligne-pret-1'));
    fireEvent.change(screen.getByLabelText('Mensualité'), { target: { value: '90.00' } });
    fireEvent.click(screen.getByTestId('valider-ligne'));
    const cellules = screen.getByTestId('ligne-pret-1').querySelectorAll('td');
    expect(cellules[4]?.textContent).toBe('');
  });

  it('T49 — suppression affiche le titre propre et le message serveur', async () => {
    impactSuppressionPret.mockResolvedValue({
      donnees: { message: 'Message serveur pret', jetonConfirmation: 'jeton' },
    });
    supprimerPret.mockResolvedValue(ficheReponse([], 5));

    render(<Harness />);
    fireEvent.click(screen.getByTestId('supprimer-pret-1'));
    await waitFor(() => expect(screen.getByTestId('confirmer-suppression-ligne')).toBeTruthy());
    expect(screen.getByText('Supprimer ce prêt ?')).toBeTruthy();
    expect(screen.getByTestId('message-apercu-suppression').textContent).toBe(
      'Message serveur pret'
    );
  });

  it('T50 — saisie identite non enregistree survit a une ecriture prets', async () => {
    modifierIdentiteSalarie.mockResolvedValueOnce({
      donnees: ficheSalarieBase({ nom: 'Local', version: 5 }),
      alertes: [],
    });
    modifierPret.mockResolvedValueOnce(ficheReponse([pret({ libelleObjet: 'Serveur' })], 4));

    rendreFicheComplete();
    fireEvent.change(document.getElementById('nom')!, { target: { value: 'Local' } });
    fireEvent.click(screen.getByTestId('ligne-pret-1'));
    fireEvent.change(document.getElementById('libelleObjet-pret-1')!, {
      target: { value: 'Modifie' },
    });
    fireEvent.click(screen.getByTestId('valider-ligne'));
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(modifierPret).toHaveBeenCalled());
    await waitFor(() => expect(document.getElementById('nom')).toHaveProperty('value', 'Local'));
  });
});

describe('RubriquePrets — affichage', () => {
  afterEach(() => cleanup());

  it('T51 — ligne INACTIVE sans bouton supprimer', () => {
    render(<Harness lignes={[pret({ etat: 'INACTIVE', moisEffetFin: '2026-08' })]} />);
    expect(screen.queryByTestId('supprimer-pret-1')).toBeNull();
    fireEvent.click(screen.getByTestId('ligne-pret-1'));
    expect(screen.getByTestId('formulaire-lecture-seule')).toBeTruthy();
  });

  it('T61 — ligne INACTIVE sans moisEffetFin reste modifiable (pas encore effective au mois en cours)', () => {
    render(
      <Harness
        lignes={[
          pret({
            etat: 'INACTIVE',
            moisEffetFin: null,
            moisEffetDebut: '2025-01',
            libelleObjet: 'Pret personnel',
          }),
        ]}
      />
    );
    expect(screen.getByTestId('supprimer-pret-1')).toBeTruthy();
    fireEvent.click(screen.getByTestId('ligne-pret-1'));
    expect(screen.queryByTestId('formulaire-lecture-seule')).toBeNull();
    expect(screen.getByLabelText('Libellé / objet')).toBeTruthy();
  });
});

describe('RubriquePrets — sommaire', () => {
  afterEach(() => cleanup());

  it('T52 — prets apparait dans le sommaire apres dates cles', () => {
    rendreFicheComplete();
    const boutons = screen.getAllByRole('button');
    const ids = boutons
      .map((b) => b.getAttribute('data-testid'))
      .filter((id): id is string => id !== null && id.startsWith('sommaire-'))
      .map((id) => id.replace('sommaire-', ''));
    const indexDates = ids.indexOf('dates');
    const indexPrets = ids.indexOf('prets');
    expect(indexDates).toBeGreaterThanOrEqual(0);
    expect(indexPrets).toBeGreaterThan(indexDates);
  });
});

function LecteurEcritureHorsSequence() {
  const { ecritureHorsSequenceEnCours } = useRegistreFiche();
  return <span data-testid="ecriture-hors-sequence">{String(ecritureHorsSequenceEnCours)}</span>;
}

describe('RubriquePrets — suppression', () => {
  beforeEach(() => {
    impactSuppressionPret.mockReset();
    supprimerPret.mockReset();
  });

  afterEach(() => cleanup());

  it('T53 — pendant suppression Enregistrer inactif puis reactif apres echec', async () => {
    impactSuppressionPret.mockResolvedValue({
      donnees: { message: 'Msg', jetonConfirmation: 'jeton' },
    });
    supprimerPret.mockRejectedValueOnce(
      new AppelApiEchoue(400, { code: 'REFUS', message: 'Refus metier' })
    );

    render(<Harness extra={<LecteurEcritureHorsSequence />} />);
    fireEvent.click(screen.getByTestId('ligne-pret-1'));
    fireEvent.change(screen.getByLabelText('Mensualité'), { target: { value: '90.00' } });
    fireEvent.click(screen.getByTestId('valider-ligne'));

    fireEvent.click(screen.getByTestId('supprimer-pret-1'));
    await waitFor(() => expect(screen.getByTestId('confirmer-suppression-ligne')).toBeTruthy());
    fireEvent.click(screen.getByTestId('confirmer-suppression-ligne'));

    await waitFor(() =>
      expect(screen.getByTestId('ecriture-hors-sequence').textContent).toBe('false')
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Enregistrer/i })).toHaveProperty('disabled', false)
    );
  });
});

function remplirPretNouveau(): void {
  fireEvent.change(screen.getByLabelText('Libellé / objet'), { target: { value: 'Premier pret' } });
  fireEvent.change(screen.getByLabelText('Libellé bulletin'), { target: { value: 'PRET' } });
  fireEvent.change(screen.getByLabelText('Montant total'), { target: { value: '1000.00' } });
  fireEvent.change(screen.getByLabelText('Mois de début'), { target: { value: '2026-01' } });
  fireEvent.change(screen.getByLabelText('Mensualité'), { target: { value: '100.00' } });
}

function annulerFiche(): void {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
}

describe('RubriquePrets — reinitialiser apres enregistrement', () => {
  beforeEach(() => {
    reinitialiserCompteurIdLocal();
    creerPret.mockReset();
  });

  afterEach(() => cleanup());

  it('T62 — apres enregistrement puis Annuler fiche la ligne enregistree reste affichee', async () => {
    creerPret.mockResolvedValueOnce(
      ficheReponse([pret({ id: 'pret-enregistre', libelleObjet: 'Premier pret' })], 4)
    );

    render(<Harness lignes={[]} />);
    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    remplirPretNouveau();
    fireEvent.click(screen.getByTestId('valider-ligne'));
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));
    await waitFor(() => expect(creerPret).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId('ligne-pret-enregistre')).toBeTruthy());

    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    remplirPretNouveau();
    fireEvent.change(screen.getByLabelText('Libellé / objet'), {
      target: { value: 'Deuxieme pret' },
    });
    fireEvent.click(screen.getByTestId('valider-ligne'));

    annulerFiche();

    expect(screen.getByTestId('ligne-pret-enregistre')).toBeTruthy();
    expect(screen.queryByText('Deuxieme pret')).toBeNull();
  });
});
