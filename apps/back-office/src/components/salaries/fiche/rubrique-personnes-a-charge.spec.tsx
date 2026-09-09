// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LienParente, Pays, PersonneACharge, SituationFamiliale } from '@paymarh/shared-types';
import { AppelApiEchoue } from '@/lib/api/client';
import type { FicheSalarieAvecOperations } from '@/lib/api/salaries';
import { FicheSalarieClient } from './fiche-salarie-client';
import { FormulaireTableauProvider } from './contexte-formulaire-tableau';
import { RegistreFicheProvider, useRegistreFiche } from './registre-fiche-provider';
import { RubriquePersonnesACharge } from './rubrique-personnes-a-charge';
import { RailActionsFiche } from './rail-actions-fiche';
import { reinitialiserCompteurIdLocal } from '@/lib/fiche/personnes-a-charge-lignes';

const PAYS: readonly Pays[] = [
  { id: 'pays-ma', ordre: 1, codeIso: 'MA', libelle: 'Maroc' },
  { id: 'pays-fr', ordre: 2, codeIso: 'FR', libelle: 'France' },
];

const SITUATIONS: readonly SituationFamiliale[] = [
  {
    id: 'sf-1',
    code: 'CELIBATAIRE',
    libelleMasculin: 'Celibataire',
    libelleFeminin: 'Celibataire',
  },
  { id: 'sf-2', code: 'MARIE', libelleMasculin: 'Marie', libelleFeminin: 'Mariee' },
];

const LIENS: readonly LienParente[] = [
  { id: 'lp-1', ordre: 1, code: 'ENFANT', libelle: 'Enfant' },
  { id: 'lp-2', ordre: 2, code: 'CONJOINT', libelle: 'Conjoint' },
];

const TYPES_SAISIE = [
  { id: 'ts-1', ordre: 1, code: 'PENSION_ALIMENTAIRE', libelle: 'Pension alimentaire' },
  { id: 'ts-2', ordre: 2, code: 'TIERS_DETENTEUR', libelle: 'Saisie à tiers détenteur' },
] as const;

const {
  creerPersonneACharge,
  modifierPersonneACharge,
  impactSuppressionPersonneACharge,
  supprimerPersonneACharge,
  modifierIdentiteSalarie,
} = vi.hoisted(() => ({
  creerPersonneACharge: vi.fn(),
  modifierPersonneACharge: vi.fn(),
  impactSuppressionPersonneACharge: vi.fn(),
  supprimerPersonneACharge: vi.fn(),
  modifierIdentiteSalarie: vi.fn(),
}));

vi.mock('@/lib/api/salaries', async (importOriginal) => {
  const reel = await importOriginal();
  return {
    ...(reel as Record<string, unknown>),
    creerPersonneACharge: (...args: unknown[]) => creerPersonneACharge(...args),
    modifierPersonneACharge: (...args: unknown[]) => modifierPersonneACharge(...args),
    impactSuppressionPersonneACharge: (...args: unknown[]) =>
      impactSuppressionPersonneACharge(...args),
    supprimerPersonneACharge: (...args: unknown[]) => supprimerPersonneACharge(...args),
    modifierIdentiteSalarie: (...args: unknown[]) => modifierIdentiteSalarie(...args),
    lireSalarie: vi.fn(),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

function personne(surcharges: Partial<PersonneACharge> = {}): PersonneACharge {
  return {
    id: 'pac-1',
    lienParenteCode: 'ENFANT',
    prenom: 'Yassine',
    nom: 'Alaoui',
    sexe: 'HOMME',
    dateNaissance: '2015-03-10',
    aCharge: true,
    moisEffetDebut: '2026-01',
    moisEffetFin: null,
    etat: 'ACTIVE',
    situationHandicap: false,
    ...surcharges,
  };
}

function ficheReponse(personnes: PersonneACharge[], version: number) {
  return {
    donnees: { version, personnesACharge: personnes },
    alertes: [] as { code: string; message: string; champ?: string }[],
  };
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
    adresse: '1 rue Atlas',
    complementAdresse: null,
    ville: 'Casablanca',
    codePostal: '20000',
    paysId: 'pays-ma',
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
    nombrePersonnesACharge: 1,
    personnesACharge: [personne()],
    prets: [],
    saisiesSurSalaire: [],
    operations: ['salarie.lire', 'salarie.modifier'],
    ...surcharges,
  };
}

function reponseEcritureIdentite(
  fiche: FicheSalarieAvecOperations,
  alertes: { code: string; message: string; champ?: string }[] = []
) {
  return { donnees: { ...fiche, version: fiche.version + 1 }, alertes };
}

function rendreFicheComplete(fiche: FicheSalarieAvecOperations = ficheSalarieBase()) {
  return render(
    <FicheSalarieClient
      companyId="soc-1"
      salarieId="sal-1"
      initial={fiche}
      pays={PAYS}
      situationsFamiliales={SITUATIONS}
      liensParente={LIENS}
      banques={[]}
      typesSaisie={TYPES_SAISIE}
    />
  );
}

function champNom(): HTMLInputElement {
  const element = document.getElementById('nom');
  if (!(element instanceof HTMLInputElement)) {
    throw new Error('Champ nom introuvable');
  }
  return element;
}

function Harness({
  lignes = [personne()],
  versionInitiale = 3,
  onVersionChange = vi.fn(),
  extra,
}: {
  readonly lignes?: PersonneACharge[];
  readonly versionInitiale?: number;
  readonly onVersionChange?: (version: number) => void;
  readonly extra?: ReactNode;
}) {
  return (
    <RegistreFicheProvider versionInitiale={versionInitiale} onRechargerServeur={vi.fn()}>
      <FormulaireTableauProvider>
        {extra}
        <RubriquePersonnesACharge
          companyId="soc-1"
          salarieId="sal-1"
          lignesServeur={lignes}
          liensParente={LIENS}
          onVersionChange={onVersionChange}
        />
        <RailActionsFiche operations={['salarie.modifier']} />
      </FormulaireTableauProvider>
    </RegistreFicheProvider>
  );
}

function LecteurVersion() {
  const { version } = useRegistreFiche();
  return <span data-testid="version-registre">{version}</span>;
}

function LecteurEcritureHorsSequence() {
  const { ecritureHorsSequenceEnCours } = useRegistreFiche();
  return <span data-testid="ecriture-hors-sequence">{String(ecritureHorsSequenceEnCours)}</span>;
}

describe('RubriquePersonnesACharge — envoi', () => {
  beforeEach(() => {
    creerPersonneACharge.mockReset();
    modifierPersonneACharge.mockReset();
    impactSuppressionPersonneACharge.mockReset();
    supprimerPersonneACharge.mockReset();
    modifierIdentiteSalarie.mockReset();
  });

  afterEach(() => cleanup());

  it('T13 — envoyer envoie les modifications puis les ajouts dans l ordre d affichage', async () => {
    const ordreAppels: string[] = [];
    modifierPersonneACharge.mockImplementation(async () => {
      ordreAppels.push('modif');
      return ficheReponse([personne({ prenom: 'Modifie' })], 4);
    });
    creerPersonneACharge.mockImplementation(async () => {
      ordreAppels.push('ajout');
      return ficheReponse([personne({ prenom: 'Modifie' }), personne({ id: 'pac-2' })], 5);
    });

    render(<Harness />);
    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Modifie' } });
    fireEvent.click(screen.getByTestId('valider-ligne'));
    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(ordreAppels).toEqual(['modif', 'ajout']));
  });

  it('T14 — le numero de version du premier appel est celui envoye par le second', async () => {
    modifierPersonneACharge.mockResolvedValueOnce(
      ficheReponse([personne({ prenom: 'Modifie' })], 4)
    );
    creerPersonneACharge.mockResolvedValueOnce(
      ficheReponse(
        [personne({ prenom: 'Modifie' }), personne({ id: 'pac-2', prenom: 'Nouveau' })],
        5
      )
    );

    render(<Harness />);
    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Modifie' } });
    fireEvent.click(screen.getByTestId('valider-ligne'));
    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    const prenoms = screen.getAllByLabelText('Prénom');
    fireEvent.change(prenoms[prenoms.length - 1]!, { target: { value: 'Nouveau' } });
    fireEvent.click(screen.getAllByTestId('valider-ligne')[0]!);
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(creerPersonneACharge).toHaveBeenCalled());
    expect(modifierPersonneACharge).toHaveBeenCalledWith(
      'soc-1',
      'sal-1',
      'pac-1',
      3,
      expect.any(Object)
    );
    expect(creerPersonneACharge).toHaveBeenCalledWith('soc-1', 'sal-1', 4, expect.any(Object));
  });

  it('T15 — refus 400 sur une ligne n interrompt pas l envoi des suivantes', async () => {
    modifierPersonneACharge.mockRejectedValueOnce(
      new AppelApiEchoue(400, { code: 'REFUS', message: 'Refus metier' })
    );
    creerPersonneACharge.mockResolvedValueOnce(
      ficheReponse([personne(), personne({ id: 'pac-2', prenom: 'Ok' })], 5)
    );

    render(<Harness />);
    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Echec' } });
    fireEvent.click(screen.getByTestId('valider-ligne'));
    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(creerPersonneACharge).toHaveBeenCalled());
  });

  it('T33 — deux lignes refusees 400 : premiere ouverte, seconde marquee, aucun message perdu', async () => {
    modifierPersonneACharge
      .mockRejectedValueOnce(new AppelApiEchoue(400, { code: 'REFUS', message: 'Refus ligne 1' }))
      .mockRejectedValueOnce(new AppelApiEchoue(400, { code: 'REFUS', message: 'Refus ligne 2' }));

    render(
      <Harness lignes={[personne({ id: 'pac-1' }), personne({ id: 'pac-2', prenom: 'B' })]} />
    );

    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Echec1' } });
    fireEvent.click(screen.getByTestId('valider-ligne'));
    fireEvent.click(screen.getByTestId('ligne-pac-2'));
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Echec2' } });
    fireEvent.click(screen.getByTestId('valider-ligne'));
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(modifierPersonneACharge).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('formulaire-pac-1')).toBeTruthy();
    expect(screen.queryByTestId('formulaire-pac-2')).toBeNull();
    expect(screen.getByText('Refus ligne 1')).toBeTruthy();
    expect(screen.getByTestId('marque-erreur-ligne-pac-2')).toBeTruthy();

    fireEvent.click(screen.getByTestId('ligne-pac-2'));
    await waitFor(() => expect(screen.getByTestId('formulaire-pac-2')).toBeTruthy());
    expect(screen.getByText('Refus ligne 2')).toBeTruthy();
    expect(screen.getByTestId('marque-erreur-ligne-pac-1')).toBeTruthy();

    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    await waitFor(() => expect(screen.getByText('Refus ligne 1')).toBeTruthy());
  });

  it('T16 — refus 409 interrompt la sequence', async () => {
    modifierPersonneACharge.mockRejectedValueOnce(
      new AppelApiEchoue(409, { code: 'CONFLIT_VERSION', message: 'Conflit' })
    );

    render(<Harness />);
    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Echec' } });
    fireEvent.click(screen.getByTestId('valider-ligne'));
    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(screen.getByTestId('bandeau-conflit-version')).toBeTruthy());
    expect(creerPersonneACharge).not.toHaveBeenCalled();
  });

  it('T18 — saisie identite non enregistree survit a une ecriture tableau', async () => {
    const fiche = ficheSalarieBase();
    modifierIdentiteSalarie.mockRejectedValueOnce(
      new AppelApiEchoue(400, { code: 'REFUS', message: 'Refus identite' })
    );
    modifierPersonneACharge.mockResolvedValueOnce({
      donnees: {
        ...ficheSalarieBase({ nom: 'Benali', version: 4 }),
        personnesACharge: [personne({ nom: 'Serveur' })],
      },
      alertes: [],
    });

    rendreFicheComplete(fiche);

    fireEvent.change(champNom(), { target: { value: 'Local' } });
    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    fireEvent.change(document.getElementById('nom-pac-1')!, { target: { value: 'Tableau' } });
    fireEvent.click(screen.getByTestId('valider-ligne'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Enregistrer/i })).toHaveProperty('disabled', false)
    );
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(modifierPersonneACharge).toHaveBeenCalled());
    expect(champNom()).toHaveProperty('value', 'Local');
    expect(modifierPersonneACharge).toHaveBeenCalledWith(
      'soc-1',
      'sal-1',
      'pac-1',
      3,
      expect.any(Object)
    );

    modifierIdentiteSalarie.mockResolvedValueOnce(
      reponseEcritureIdentite(ficheSalarieBase({ nom: 'Local', version: 5 }))
    );
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));
    await waitFor(() => expect(modifierIdentiteSalarie).toHaveBeenCalledTimes(2));
    expect(modifierIdentiteSalarie).toHaveBeenLastCalledWith(
      'soc-1',
      'sal-1',
      4,
      expect.objectContaining({ nom: 'Local' })
    );
  });

  it('T23 — apres suppression reussie la version atteint une autre rubrique', async () => {
    impactSuppressionPersonneACharge.mockResolvedValue({
      donnees: { message: 'Msg', jetonConfirmation: 'jeton' },
    });
    supprimerPersonneACharge.mockResolvedValue(ficheReponse([], 6));

    render(<Harness extra={<LecteurVersion />} />);

    fireEvent.click(screen.getByTestId('supprimer-pac-1'));
    await waitFor(() => expect(screen.getByTestId('confirmer-suppression-ligne')).toBeTruthy());
    fireEvent.click(screen.getByTestId('confirmer-suppression-ligne'));

    await waitFor(() => expect(screen.getByTestId('version-registre').textContent).toBe('6'));
  });

  it('T24 — pendant l aller-retour tous les boutons Supprimer sont grises', async () => {
    let resolveSuppression: () => void = () => undefined;
    impactSuppressionPersonneACharge.mockResolvedValue({
      donnees: { message: 'Msg', jetonConfirmation: 'jeton' },
    });
    supprimerPersonneACharge.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSuppression = () => resolve(ficheReponse([], 6));
        })
    );

    render(<Harness lignes={[personne(), personne({ id: 'pac-2', prenom: 'B' })]} />);

    fireEvent.click(screen.getByTestId('supprimer-pac-1'));
    await waitFor(() => expect(screen.getByTestId('confirmer-suppression-ligne')).toBeTruthy());
    fireEvent.click(screen.getByTestId('confirmer-suppression-ligne'));

    await waitFor(() => {
      const boutons = screen.getAllByRole('button', { name: 'Supprimer' });
      for (const bouton of boutons) {
        expect(bouton).toHaveProperty('disabled', true);
      }
    });

    resolveSuppression();
  });

  it('T36 — CONFIRMATION_OBSOLETE redemande apercu sans DELETE auto', async () => {
    impactSuppressionPersonneACharge
      .mockResolvedValueOnce({ donnees: { message: 'Premier', jetonConfirmation: 'j1' } })
      .mockResolvedValueOnce({ donnees: { message: 'Second', jetonConfirmation: 'j2' } });
    supprimerPersonneACharge.mockRejectedValueOnce(
      new AppelApiEchoue(409, { code: 'CONFIRMATION_OBSOLETE', message: 'Obsolete' })
    );

    render(<Harness />);

    fireEvent.click(screen.getByTestId('supprimer-pac-1'));
    await waitFor(() => expect(screen.getByTestId('confirmer-suppression-ligne')).toBeTruthy());
    fireEvent.click(screen.getByTestId('confirmer-suppression-ligne'));

    await waitFor(() => expect(impactSuppressionPersonneACharge).toHaveBeenCalledTimes(2));
    expect(supprimerPersonneACharge).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('mention-situation-changee')).toBeTruthy();
    expect(screen.getByTestId('message-apercu-suppression').textContent).toBe('Second');
  });

  it('T24b — pendant l aller-retour le bouton Enregistrer est inactif', async () => {
    let resolveSuppression: () => void = () => undefined;
    impactSuppressionPersonneACharge.mockResolvedValue({
      donnees: { message: 'Msg', jetonConfirmation: 'jeton' },
    });
    supprimerPersonneACharge.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSuppression = () => resolve(ficheReponse([], 6));
        })
    );

    render(<Harness />);
    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Modif' } });
    fireEvent.click(screen.getByTestId('valider-ligne'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Enregistrer/i })).toHaveProperty('disabled', false)
    );

    fireEvent.click(screen.getByTestId('supprimer-pac-1'));
    await waitFor(() => expect(screen.getByTestId('confirmer-suppression-ligne')).toBeTruthy());
    fireEvent.click(screen.getByTestId('confirmer-suppression-ligne'));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Enregistrer/i })).toHaveProperty('disabled', true)
    );

    resolveSuppression();
    await waitFor(() => expect(supprimerPersonneACharge).toHaveBeenCalledTimes(1));
  });

  it('T37 — apres suppression reussie Enregistrer redevient actif si une autre rubrique est modifiee', async () => {
    impactSuppressionPersonneACharge.mockResolvedValue({
      donnees: { message: 'Msg', jetonConfirmation: 'jeton' },
    });
    supprimerPersonneACharge.mockResolvedValue(ficheReponse([], 6));

    rendreFicheComplete();
    fireEvent.change(champNom(), { target: { value: 'Modifie' } });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Enregistrer/i })).toHaveProperty('disabled', false)
    );

    fireEvent.click(screen.getByTestId('supprimer-pac-1'));
    await waitFor(() => expect(screen.getByTestId('confirmer-suppression-ligne')).toBeTruthy());
    fireEvent.click(screen.getByTestId('confirmer-suppression-ligne'));

    await waitFor(() => expect(supprimerPersonneACharge).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Enregistrer/i })).toHaveProperty('disabled', false)
    );
  });

  it('T38 — apres echec de suppression le signal de fin est emis et Enregistrer redevient actif', async () => {
    impactSuppressionPersonneACharge.mockResolvedValue({
      donnees: { message: 'Msg', jetonConfirmation: 'jeton' },
    });
    supprimerPersonneACharge.mockRejectedValueOnce(
      new AppelApiEchoue(400, { code: 'REFUS', message: 'Refus metier' })
    );

    render(<Harness extra={<LecteurEcritureHorsSequence />} />);
    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Modifie' } });
    fireEvent.click(screen.getByTestId('valider-ligne'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Enregistrer/i })).toHaveProperty('disabled', false)
    );

    fireEvent.click(screen.getByTestId('supprimer-pac-1'));
    await waitFor(() => expect(screen.getByTestId('confirmer-suppression-ligne')).toBeTruthy());
    await waitFor(() =>
      expect(screen.getByTestId('ecriture-hors-sequence').textContent).toBe('true')
    );
    fireEvent.click(screen.getByTestId('confirmer-suppression-ligne'));

    await waitFor(() => expect(supprimerPersonneACharge).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByTestId('ecriture-hors-sequence').textContent).toBe('false')
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Enregistrer/i })).toHaveProperty('disabled', false)
    );
    expect(screen.getByTestId('dialogue-suppression-ligne')).toBeTruthy();
    expect(screen.getByText('Refus metier')).toBeTruthy();
  });
});

describe('RubriquePersonnesACharge — affichage', () => {
  afterEach(() => cleanup());

  it('T25 — ligne CLOTUREE affichee grisee avec mois de fin MM/AAAA', () => {
    render(<Harness lignes={[personne({ etat: 'CLOTUREE', moisEffetFin: '2026-08' })]} />);
    expect(screen.getByTestId('ligne-pac-1').className).toMatch(/opacity-60/);
    expect(screen.getByTestId('etat-ligne-pac-1').textContent).toBe('inactive depuis 08/2026');
  });
});

describe('RubriquePersonnesACharge — formulaire', () => {
  afterEach(() => cleanup());

  it('T34 — annuler la ligne restaure la valeur d origine apres ouverture d une autre ligne', () => {
    render(
      <Harness
        lignes={[
          personne({ id: 'pac-1', prenom: 'Yassine' }),
          personne({ id: 'pac-2', prenom: 'B' }),
        ]}
      />
    );

    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    fireEvent.change(document.getElementById('prenom-pac-1')!, { target: { value: 'Modifie' } });
    fireEvent.click(screen.getByTestId('ligne-pac-2'));
    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    fireEvent.click(screen.getByTestId('annuler-ligne'));

    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    expect(document.getElementById('prenom-pac-1')).toHaveProperty('value', 'Yassine');
  });

  it('T35 — annuler la ligne apres validation locale revient aux valeurs validees', () => {
    render(<Harness lignes={[personne({ id: 'pac-1', prenom: 'Yassine' })]} />);

    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    fireEvent.change(document.getElementById('prenom-pac-1')!, { target: { value: 'Valide' } });
    fireEvent.click(screen.getByTestId('valider-ligne'));
    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    fireEvent.change(document.getElementById('prenom-pac-1')!, { target: { value: 'Brouillon' } });
    fireEvent.click(screen.getByTestId('annuler-ligne'));

    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    expect(document.getElementById('prenom-pac-1')).toHaveProperty('value', 'Valide');
  });

  it('T26 — case handicap absente du DOM quand lien Conjoint', () => {
    render(<Harness lignes={[personne({ lienParenteCode: 'CONJOINT' })]} />);
    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    expect(screen.queryByLabelText('Situation de handicap')).toBeNull();
  });

  it('T27 — Enfant puis Conjoint puis Enfant conserve la case cochée', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    fireEvent.click(screen.getByLabelText('Situation de handicap'));
    fireEvent.change(screen.getByLabelText('Lien de parenté'), { target: { value: 'CONJOINT' } });
    expect(screen.queryByLabelText('Situation de handicap')).toBeNull();
    fireEvent.change(screen.getByLabelText('Lien de parenté'), { target: { value: 'ENFANT' } });
    expect((screen.getByLabelText('Situation de handicap') as HTMLInputElement).checked).toBe(true);
  });

  it('T28 — aucun controle metier local sur date ancienne', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    fireEvent.change(screen.getByLabelText('Date de naissance'), {
      target: { value: '1900-01-01' },
    });
    expect(screen.queryByText(/trop/i)).toBeNull();
  });

  it('T29 — alerte avec champ sous le champ concerne', async () => {
    modifierPersonneACharge.mockRejectedValueOnce(
      new AppelApiEchoue(400, { code: 'REFUS', message: 'Prenom invalide', champ: 'prenom' })
    );
    render(<Harness />);
    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'X' } });
    fireEvent.click(screen.getByTestId('valider-ligne'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Enregistrer/i })).toHaveProperty('disabled', false)
    );
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));
    await waitFor(() => expect(screen.getByText('Prenom invalide')).toBeTruthy());
  });

  it('T30 — alerte sans champ en tete de rubrique', async () => {
    modifierPersonneACharge.mockResolvedValueOnce({
      donnees: { version: 4, personnesACharge: [personne()] },
      alertes: [{ code: 'ALERTE', message: 'Alerte generale' }],
    });
    render(<Harness />);
    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'X' } });
    fireEvent.click(screen.getByTestId('valider-ligne'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Enregistrer/i })).toHaveProperty('disabled', false)
    );
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));
    await waitFor(() => expect(screen.getByTestId('alertes-tete-personnes-a-charge')).toBeTruthy());
  });

  it('T31 — alertes disparaissent quand un champ est modifie', async () => {
    modifierPersonneACharge.mockResolvedValueOnce({
      donnees: { version: 4, personnesACharge: [personne()] },
      alertes: [{ code: 'ALERTE', message: 'Alerte generale' }],
    });
    render(<Harness />);
    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'X' } });
    fireEvent.click(screen.getByTestId('valider-ligne'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Enregistrer/i })).toHaveProperty('disabled', false)
    );
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));
    await waitFor(() => expect(screen.getByText('Alerte generale')).toBeTruthy());
    fireEvent.click(screen.getByTestId('ligne-pac-1'));
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Y' } });
    expect(screen.queryByText('Alerte generale')).toBeNull();
  });
});

function annulerFiche(): void {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
}

describe('RubriquePersonnesACharge — reinitialiser apres enregistrement', () => {
  beforeEach(() => {
    reinitialiserCompteurIdLocal();
    creerPersonneACharge.mockReset();
  });

  afterEach(() => cleanup());

  it('T65 — apres enregistrement puis Annuler fiche la ligne enregistree reste affichee', async () => {
    creerPersonneACharge.mockResolvedValueOnce(
      ficheReponse([personne({ id: 'pac-enregistree', prenom: 'Premier' })], 4)
    );

    render(<Harness lignes={[]} />);
    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Premier' } });
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Alaoui' } });
    fireEvent.change(screen.getByLabelText('Date de naissance'), {
      target: { value: '2015-03-10' },
    });
    fireEvent.click(screen.getByTestId('valider-ligne'));
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));
    await waitFor(() => expect(creerPersonneACharge).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId('ligne-pac-enregistree')).toBeTruthy());

    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    fireEvent.change(screen.getAllByLabelText('Prénom').at(-1)!, { target: { value: 'Deuxieme' } });
    fireEvent.change(screen.getAllByLabelText('Nom').at(-1)!, { target: { value: 'Alaoui' } });
    fireEvent.change(screen.getAllByLabelText('Date de naissance').at(-1)!, {
      target: { value: '2018-01-01' },
    });
    fireEvent.click(screen.getAllByTestId('valider-ligne').at(-1)!);

    annulerFiche();

    expect(screen.getByTestId('ligne-pac-enregistree')).toBeTruthy();
    expect(screen.queryByText('Deuxieme')).toBeNull();
  });
});
