// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MESSAGE_ERREUR_GENERIQUE } from '@/lib/messages-interface';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  Banque,
  CompteBancaireSalarie,
  LienParente,
  Pays,
  Permission,
  SituationFamiliale,
} from '@paymarh/shared-types';
import { AppelApiEchoue } from '@/lib/api/client';
import { reinitialiserCompteurIdLocalCompte } from '@/lib/fiche/comptes-bancaires-lignes';
import type { FicheSalarieAvecOperations } from '@/lib/api/salaries';
import { FicheSalarieClient } from './fiche-salarie-client';
import { FormulaireTableauProvider } from './contexte-formulaire-tableau';
import { RegistreFicheProvider, useRegistreFiche } from './registre-fiche-provider';
import { RubriqueComptesBancaires } from './rubrique-comptes-bancaires';
import { RubriqueIdentite, type ValeursIdentite } from './rubrique-identite';
import { RailActionsFiche } from './rail-actions-fiche';

const BANQUES: readonly Banque[] = [
  { id: 'bnq-1', nom: 'Attijariwafa Bank', ancienNom: null, codeBanque: '007', couleur: '#000' },
];

const PAYS: readonly Pays[] = [{ id: 'pays-ma', ordre: 1, codeIso: 'MA', libelle: 'Maroc' }];

const SITUATIONS: readonly SituationFamiliale[] = [
  {
    id: 'sf-1',
    code: 'CELIBATAIRE',
    libelleMasculin: 'Celibataire',
    libelleFeminin: 'Celibataire',
  },
];

const LIENS: readonly LienParente[] = [{ id: 'lp-1', ordre: 1, code: 'ENFANT', libelle: 'Enfant' }];

const TYPES_SAISIE = [
  { id: 'ts-1', ordre: 1, code: 'PENSION_ALIMENTAIRE', libelle: 'Pension alimentaire' },
  { id: 'ts-2', ordre: 2, code: 'TIERS_DETENTEUR', libelle: 'Saisie à tiers détenteur' },
] as const;

const OPERATIONS_ECRITURE = [
  'salarie.lire',
  'salarie.modifier',
  'salarie.remuneration.lire',
  'salarie.remuneration.ecrire',
] as const;

const {
  remplacerComptesBancaires,
  modifierIdentiteSalarie,
  modifierIdentifiantsLegauxSalarie,
  modifierCoordonneesSalarie,
  modifierDatesSalarie,
  lireSalarie,
} = vi.hoisted(() => ({
  remplacerComptesBancaires: vi.fn(),
  modifierIdentiteSalarie: vi.fn(),
  modifierIdentifiantsLegauxSalarie: vi.fn(),
  modifierCoordonneesSalarie: vi.fn(),
  modifierDatesSalarie: vi.fn(),
  lireSalarie: vi.fn(),
}));

vi.mock('@/lib/api/salaries', async (importOriginal) => {
  const reel = await importOriginal();
  return {
    ...(reel as Record<string, unknown>),
    remplacerComptesBancaires: (...args: unknown[]) => remplacerComptesBancaires(...args),
    modifierIdentiteSalarie: (...args: unknown[]) => modifierIdentiteSalarie(...args),
    modifierIdentifiantsLegauxSalarie: (...args: unknown[]) =>
      modifierIdentifiantsLegauxSalarie(...args),
    modifierCoordonneesSalarie: (...args: unknown[]) => modifierCoordonneesSalarie(...args),
    modifierDatesSalarie: (...args: unknown[]) => modifierDatesSalarie(...args),
    lireSalarie: (...args: unknown[]) => lireSalarie(...args),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

function compte(surcharges: Partial<CompteBancaireSalarie> = {}): CompteBancaireSalarie {
  return {
    id: 'cpt-1',
    banqueId: 'bnq-1',
    banqueLibreSaisie: null,
    rib: '007780000000000000000000',
    iban: '',
    bic: '',
    titulaire: 'Sara Benali',
    partVirement: null,
    ...surcharges,
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
    situationFamiliale: { code: 'CELIBATAIRE', libelle: 'Celibataire' },
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
    nombrePersonnesACharge: 0,
    personnesACharge: [],
    prets: [],
    saisiesSurSalaire: [],
    operations: [...OPERATIONS_ECRITURE],
    ...surcharges,
  };
}

function reponseComptes(
  comptes: CompteBancaireSalarie[],
  version: number,
  alertes: {
    code: string;
    message: string;
    champ?: string;
    indexLigne?: number;
  }[] = []
) {
  return {
    donnees: { version, comptesBancaires: comptes },
    alertes,
  };
}

function reponseEcritureIdentite(
  fiche: FicheSalarieAvecOperations,
  alertes: { code: string; message: string; champ?: string }[] = []
) {
  return { donnees: { ...fiche, version: fiche.version + 1 }, alertes };
}

function rendreRubrique({
  comptes = [compte()],
  operations = [...OPERATIONS_ECRITURE],
  versionInitiale = 3,
  onComptesChange = vi.fn(),
  extra,
}: {
  readonly comptes?: CompteBancaireSalarie[];
  readonly operations?: readonly Permission[];
  readonly versionInitiale?: number;
  readonly onComptesChange?: (comptes: readonly CompteBancaireSalarie[], version: number) => void;
  readonly extra?: ReactNode;
} = {}) {
  return render(
    <RegistreFicheProvider versionInitiale={versionInitiale} onRechargerServeur={vi.fn()}>
      <FormulaireTableauProvider>
        {extra}
        <RubriqueComptesBancaires
          companyId="soc-1"
          salarieId="sal-1"
          comptesServeur={comptes}
          banques={BANQUES}
          operations={operations}
          onComptesChange={onComptesChange}
        />
        <RailActionsFiche operations={operations} companyId="soc-test" salarieId="sal-test" />
      </FormulaireTableauProvider>
    </RegistreFicheProvider>
  );
}

function valeursIdentiteDepuisFiche(
  fiche: FicheSalarieAvecOperations = ficheSalarieBase()
): ValeursIdentite {
  return {
    nom: fiche.nom,
    prenom: fiche.prenom,
    sexe: fiche.sexe,
    dateNaissance: fiche.dateNaissance ?? '',
    villeNaissance: fiche.villeNaissance ?? '',
    paysNaissanceId: fiche.paysNaissanceId ?? '',
    nationaliteId: fiche.nationaliteId ?? '',
    situationFamilialeCode: fiche.situationFamiliale.code ?? '',
  };
}

function rubriqueIdentiteTest(): ReactNode {
  return (
    <RubriqueIdentite
      companyId="soc-1"
      salarieId="sal-1"
      valeurs={valeursIdentiteDepuisFiche()}
      pays={PAYS}
      situationsFamiliales={SITUATIONS}
      onServeurChange={() => undefined}
    />
  );
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
      banques={BANQUES}
      typesSaisie={TYPES_SAISIE}
    />
  );
}

function champ(id: string): HTMLInputElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`Champ introuvable : ${id}`);
  }
  return element;
}

function validerLigne(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Valider la ligne' }));
}

function annulerLigne(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Annuler la ligne' }));
}

function idLigneLocale(): string {
  const ligne = document.querySelector('[data-testid^="ligne-local-"]');
  if (ligne === null) throw new Error('Ligne locale introuvable');
  return ligne.getAttribute('data-testid')!.replace('ligne-', '');
}

function zoneComptes(): HTMLElement {
  const element = document.getElementById('comptes-bancaires');
  if (element === null) throw new Error('Rubrique comptes bancaires introuvable');
  return element;
}

async function attendreDialogueSuppressionDifferee(): Promise<void> {
  await waitFor(() => expect(screen.getByTestId('dialogue-suppression-differee')).toBeTruthy());
}

async function confirmerSuppressionDifferee(): Promise<void> {
  await attendreDialogueSuppressionDifferee();
  fireEvent.click(screen.getByTestId('dialogue-suppression-differee-confirmer'));
}

function LecteurModifiees() {
  const { rubriquesSommaire } = useRegistreFiche();
  const entree = rubriquesSommaire.find((r) => r.id === 'comptes-bancaires');
  return <span data-testid="comptes-modifiee">{entree?.modifiee ? 'oui' : 'non'}</span>;
}

describe('RubriqueComptesBancaires — droits', () => {
  afterEach(() => cleanup());

  it('TB04 — cle comptesBancaires absente : rubrique absente du DOM et du sommaire', () => {
    const { comptesBancaires: _ignore, ...sansComptes } = ficheSalarieBase({
      comptesBancaires: [compte()],
    });
    rendreFicheComplete(sansComptes);

    expect(document.getElementById('comptes-bancaires')).toBeNull();
    expect(screen.queryByTestId('sommaire-comptes-bancaires')).toBeNull();
  });

  it('TB05 — cle presente liste vide : rubrique presente tableau vide bouton Ajouter', () => {
    rendreFicheComplete(ficheSalarieBase({ comptesBancaires: [] }));

    expect(document.getElementById('comptes-bancaires')).toBeTruthy();
    expect(screen.getByTestId('sommaire-comptes-bancaires').textContent).toContain(
      'Comptes bancaires'
    );
    expect(within(zoneComptes()).queryByTestId(/^ligne-/)).toBeNull();
    expect(within(zoneComptes()).getByTestId('ajouter-ligne')).toBeTruthy();
  });

  it('TB06 — sans salarie.remuneration.ecrire : ni Ajouter ni Supprimer aucun champ modifiable', () => {
    rendreRubrique({
      operations: ['salarie.lire', 'salarie.modifier', 'salarie.remuneration.lire'],
    });

    expect(screen.queryByTestId('ajouter-ligne')).toBeNull();
    expect(screen.queryByTestId('supprimer-cpt-1')).toBeNull();

    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    expect(champ('rib-cpt-1')).toHaveProperty('readOnly', true);
    expect(screen.queryByRole('button', { name: 'Valider la ligne' })).toBeNull();
  });

  it('TB07 — sans ecrire la rubrique ne se declare jamais modifiee', () => {
    render(
      <RegistreFicheProvider versionInitiale={3} onRechargerServeur={vi.fn()}>
        <FormulaireTableauProvider>
          <LecteurModifiees />
          <RubriqueComptesBancaires
            companyId="soc-1"
            salarieId="sal-1"
            comptesServeur={[compte()]}
            banques={BANQUES}
            operations={['salarie.lire', 'salarie.modifier', 'salarie.remuneration.lire']}
            onComptesChange={vi.fn()}
          />
        </FormulaireTableauProvider>
      </RegistreFicheProvider>
    );

    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    expect(screen.getByTestId('comptes-modifiee').textContent).toBe('non');
  });
});

describe('RubriqueComptesBancaires — envoi', () => {
  beforeEach(() => {
    reinitialiserCompteurIdLocalCompte();
    remplacerComptesBancaires.mockReset();
    modifierIdentiteSalarie.mockReset();
    modifierIdentifiantsLegauxSalarie.mockReset();
    modifierCoordonneesSalarie.mockReset();
    modifierDatesSalarie.mockReset();
  });

  afterEach(() => cleanup());

  it('TB08 — une ligne modifiee : PUT envoie la liste entiere ordre affichage nouvelles en dernier', async () => {
    remplacerComptesBancaires.mockResolvedValueOnce(
      reponseComptes([compte({ titulaire: 'Modifie' }), compte({ id: 'cpt-2' })], 4)
    );

    rendreRubrique({ comptes: [compte()] });

    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    fireEvent.change(champ('titulaire-cpt-1'), { target: { value: 'Modifie' } });
    validerLigne();
    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    const idLocal = idLigneLocale();
    fireEvent.change(champ(`titulaire-${idLocal}`), { target: { value: 'Nouveau' } });
    validerLigne();
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(remplacerComptesBancaires).toHaveBeenCalledTimes(1));
    const corps = remplacerComptesBancaires.mock.calls[0]![3] as { comptes: unknown[] };
    expect(corps.comptes).toHaveLength(2);
    expect(corps.comptes[0]).toEqual(
      expect.objectContaining({ id: 'cpt-1', titulaire: 'Modifie' })
    );
    expect(corps.comptes[1]).toEqual(expect.objectContaining({ titulaire: 'Nouveau' }));
    expect(corps.comptes[1]).not.toHaveProperty('id');
  });

  it('TB09 — suppression en attente : rubrique modifiee PUT sans la ligne', async () => {
    remplacerComptesBancaires.mockResolvedValueOnce(reponseComptes([], 4));

    rendreRubrique({ comptes: [compte()] });

    fireEvent.click(screen.getByTestId('supprimer-cpt-1'));
    await confirmerSuppressionDifferee();
    expect(screen.queryByTestId('ligne-cpt-1')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(remplacerComptesBancaires).toHaveBeenCalledTimes(1));
    const corps = remplacerComptesBancaires.mock.calls[0]![3] as { comptes: unknown[] };
    expect(corps.comptes).toEqual([]);
  });

  it('TB10 — suppression de la derniere ligne : PUT avec liste vide', async () => {
    remplacerComptesBancaires.mockResolvedValueOnce(reponseComptes([], 4));

    rendreRubrique({ comptes: [compte()] });

    fireEvent.click(screen.getByTestId('supprimer-cpt-1'));
    await confirmerSuppressionDifferee();
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() =>
      expect(remplacerComptesBancaires).toHaveBeenCalledWith('soc-1', 'sal-1', 3, { comptes: [] })
    );
  });

  it('TB11 — apres succes version retenue liste remplacee sans ecraser une autre rubrique', async () => {
    const fiche = ficheSalarieBase({ comptesBancaires: [compte()] });
    modifierIdentiteSalarie.mockResolvedValueOnce(
      reponseEcritureIdentite(
        ficheSalarieBase({ nom: 'Local', comptesBancaires: [compte()], version: 4 })
      )
    );
    remplacerComptesBancaires.mockResolvedValueOnce({
      donnees: {
        ...fiche,
        version: 5,
        comptesBancaires: [compte({ titulaire: 'Serveur' })],
      },
      alertes: [],
    });

    rendreFicheComplete(fiche);

    fireEvent.change(champ('nom'), { target: { value: 'Local' } });
    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    fireEvent.change(champ('titulaire-cpt-1'), { target: { value: 'Tableau' } });
    validerLigne();
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(remplacerComptesBancaires).toHaveBeenCalled());
    expect(champ('nom')).toHaveProperty('value', 'Local');
    expect(screen.getByTestId('ligne-cpt-1').textContent).toContain('Serveur');
  });

  it('TB12 — ligne ajoutee recupere son identifiant serveur puis se modifie correctement', async () => {
    remplacerComptesBancaires
      .mockResolvedValueOnce(reponseComptes([compte({ id: 'cpt-serveur' })], 4))
      .mockResolvedValueOnce(
        reponseComptes([compte({ id: 'cpt-serveur', titulaire: 'Deuxieme' })], 5)
      );

    rendreRubrique({ comptes: [] });

    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    const idLocal = idLigneLocale();
    fireEvent.change(champ(`titulaire-${idLocal}`), { target: { value: 'Premier' } });
    validerLigne();
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(remplacerComptesBancaires).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('ligne-cpt-serveur')).toBeTruthy();

    fireEvent.click(screen.getByTestId('ligne-cpt-serveur'));
    fireEvent.change(champ('titulaire-cpt-serveur'), { target: { value: 'Deuxieme' } });
    validerLigne();
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(remplacerComptesBancaires).toHaveBeenCalledTimes(2));
    const secondCorps = remplacerComptesBancaires.mock.calls[1]![3] as {
      comptes: { id: string }[];
    };
    expect(secondCorps.comptes[0]?.id).toBe('cpt-serveur');
    expect(remplacerComptesBancaires).toHaveBeenLastCalledWith(
      'soc-1',
      'sal-1',
      4,
      expect.any(Object)
    );
  });
});

describe('RubriqueComptesBancaires — alertes', () => {
  beforeEach(() => {
    reinitialiserCompteurIdLocalCompte();
    remplacerComptesBancaires.mockReset();
    modifierDatesSalarie.mockReset();
  });

  afterEach(() => cleanup());

  it('TB13 — alerte avec indexLigne affichee sur la ligne concernee formulaire ouvert', async () => {
    remplacerComptesBancaires.mockResolvedValueOnce(
      reponseComptes([compte()], 4, [
        { code: 'ALERTE', message: 'RIB invalide', champ: 'rib', indexLigne: 0 },
      ])
    );

    rendreRubrique();

    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    fireEvent.change(champ('rib-cpt-1'), { target: { value: '000' } });
    validerLigne();
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(screen.getByText('RIB invalide')).toBeTruthy());
    expect(screen.getByTestId('formulaire-cpt-1')).toBeTruthy();
  });

  it('TB14 — plusieurs alertes : premiere ouverte autres marquees message au depliage', async () => {
    remplacerComptesBancaires.mockResolvedValueOnce(
      reponseComptes([compte(), compte({ id: 'cpt-2', rib: '111' })], 4, [
        { code: 'A1', message: 'Erreur ligne 1', champ: 'rib', indexLigne: 0 },
        { code: 'A2', message: 'Erreur ligne 2', champ: 'rib', indexLigne: 1 },
      ])
    );

    rendreRubrique({ comptes: [compte(), compte({ id: 'cpt-2', rib: '111' })] });

    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    fireEvent.change(champ('rib-cpt-1'), { target: { value: '000' } });
    validerLigne();
    fireEvent.click(screen.getByTestId('ligne-cpt-2'));
    fireEvent.change(champ('rib-cpt-2'), { target: { value: '000' } });
    validerLigne();
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(screen.getByTestId('formulaire-cpt-1')).toBeTruthy());
    expect(screen.queryByTestId('formulaire-cpt-2')).toBeNull();
    expect(screen.getByText('Erreur ligne 1')).toBeTruthy();
    expect(screen.getByTestId('marque-erreur-ligne-cpt-2')).toBeTruthy();

    fireEvent.click(screen.getByTestId('ligne-cpt-2'));
    await waitFor(() => expect(screen.getByText('Erreur ligne 2')).toBeTruthy());
  });

  it('TB15 — alerte sans champ ni indexLigne en tete de rubrique aucun formulaire ouvert', async () => {
    remplacerComptesBancaires.mockResolvedValueOnce(
      reponseComptes([compte()], 4, [
        { code: 'SOMME', message: 'La somme des parts depasse 100 %' },
      ])
    );

    rendreRubrique();

    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    fireEvent.change(champ('part-cpt-1'), { target: { value: '150' } });
    validerLigne();
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(screen.getByTestId('alertes-tete-comptes-bancaires')).toBeTruthy());
    expect(screen.getByText('La somme des parts depasse 100 %')).toBeTruthy();
    expect(screen.queryByTestId('formulaire-cpt-1')).toBeNull();
  });

  it('TB16 — modifier une ligne efface son alerte ajouter ou supprimer efface toutes les alertes', async () => {
    remplacerComptesBancaires.mockResolvedValueOnce(
      reponseComptes([compte(), compte({ id: 'cpt-2', rib: '111' })], 4, [
        { code: 'A1', message: 'Erreur RIB ligne 1', champ: 'rib', indexLigne: 0 },
        { code: 'SOMME', message: 'Alerte generale' },
      ])
    );

    rendreRubrique({ comptes: [compte(), compte({ id: 'cpt-2', rib: '111' })] });

    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    fireEvent.change(champ('rib-cpt-1'), { target: { value: '000' } });
    validerLigne();
    fireEvent.click(screen.getByTestId('ligne-cpt-2'));
    fireEvent.change(champ('rib-cpt-2'), { target: { value: '000' } });
    validerLigne();
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(screen.getByText('Erreur RIB ligne 1')).toBeTruthy());
    expect(screen.getByText('Alerte generale')).toBeTruthy();

    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    fireEvent.change(champ('rib-cpt-1'), { target: { value: '222' } });
    expect(screen.queryByText('Erreur RIB ligne 1')).toBeNull();
    expect(screen.getByText('Alerte generale')).toBeTruthy();

    fireEvent.click(within(zoneComptes()).getByTestId('ajouter-ligne'));
    expect(screen.queryByText('Alerte generale')).toBeNull();
  });

  it('TB17 — refus 400 saisie conservee sequence poursuivie', async () => {
    const fiche = ficheSalarieBase({ comptesBancaires: [compte()] });
    remplacerComptesBancaires.mockRejectedValueOnce(
      new AppelApiEchoue(400, { code: 'REFUS', message: 'Refus comptes' })
    );
    modifierDatesSalarie.mockResolvedValueOnce(reponseEcritureIdentite(fiche));

    rendreFicheComplete(fiche);

    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    fireEvent.change(champ('titulaire-cpt-1'), { target: { value: 'Conserve' } });
    validerLigne();
    fireEvent.change(champ('dateEntree'), { target: { value: '2021-02-01' } });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(modifierDatesSalarie).toHaveBeenCalled());
    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    expect(champ('titulaire-cpt-1')).toHaveProperty('value', 'Conserve');
    expect(screen.getByTestId('erreur-rubrique-comptes-bancaires').textContent).toContain(
      'Refus comptes'
    );
  });

  it('TB18 — refus 409 arret immediat bandeau sans message local rubrique', async () => {
    remplacerComptesBancaires.mockRejectedValueOnce(
      new AppelApiEchoue(409, { code: 'CONFLIT_VERSION', message: 'Conflit' })
    );
    modifierDatesSalarie.mockResolvedValueOnce(
      reponseEcritureIdentite(ficheSalarieBase({ comptesBancaires: [compte()] }))
    );

    rendreFicheComplete(ficheSalarieBase({ comptesBancaires: [compte()] }));

    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    fireEvent.change(champ('titulaire-cpt-1'), { target: { value: 'Echec' } });
    validerLigne();
    fireEvent.change(champ('dateEntree'), { target: { value: '2021-02-01' } });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(screen.getByTestId('bandeau-conflit-version')).toBeTruthy());
    expect(modifierDatesSalarie).not.toHaveBeenCalled();
    expect(screen.queryByTestId('erreur-rubrique-comptes-bancaires')).toBeNull();
  });
});

describe('RubriqueComptesBancaires — suppression differee', () => {
  beforeEach(() => {
    reinitialiserCompteurIdLocalCompte();
    remplacerComptesBancaires.mockReset();
  });

  afterEach(() => cleanup());

  it('TB19 — ligne jamais enregistree : retrait immediat aucune fenetre aucun appel serveur', () => {
    rendreRubrique({ comptes: [] });

    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    const idLocal = idLigneLocale();
    fireEvent.click(screen.getByTestId(`supprimer-${idLocal}`));

    expect(screen.queryByTestId('dialogue-suppression-differee')).toBeNull();
    expect(screen.queryByTestId(`ligne-${idLocal}`)).toBeNull();
    expect(remplacerComptesBancaires).not.toHaveBeenCalled();
  });

  it('TB20 — ligne enregistree : fenetre exacte Garder ne retire rien Supprimer retire localement', async () => {
    rendreRubrique();

    fireEvent.click(screen.getByTestId('supprimer-cpt-1'));
    await attendreDialogueSuppressionDifferee();
    expect(screen.getByTestId('dialogue-suppression-differee-titre').textContent).toBe(
      'Supprimer ce compte bancaire ?'
    );
    expect(screen.getByTestId('dialogue-suppression-differee-corps').textContent).toBe(
      'Cette ligne sera supprimée lors du prochain enregistrement. Le bouton Annuler de la fiche revient dessus.'
    );

    fireEvent.click(screen.getByTestId('dialogue-suppression-differee-annuler'));
    expect(screen.getByTestId('ligne-cpt-1')).toBeTruthy();
    expect(remplacerComptesBancaires).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('supprimer-cpt-1'));
    await confirmerSuppressionDifferee();
    expect(screen.queryByTestId('ligne-cpt-1')).toBeNull();
    expect(remplacerComptesBancaires).not.toHaveBeenCalled();
  });

  it('TB21 — apres suppression differee Annuler fait revenir la ligne', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    rendreRubrique();

    fireEvent.click(screen.getByTestId('supprimer-cpt-1'));
    await confirmerSuppressionDifferee();
    expect(screen.queryByTestId('ligne-cpt-1')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.getByTestId('ligne-cpt-1')).toBeTruthy();
    confirm.mockRestore();
  });

  it('TB22 — ce tableau n emet jamais d appel vers une route d apercu d impact', async () => {
    rendreRubrique();

    fireEvent.click(screen.getByTestId('supprimer-cpt-1'));
    await confirmerSuppressionDifferee();

    expect(remplacerComptesBancaires).not.toHaveBeenCalled();
    expect(screen.queryByTestId('dialogue-suppression-ligne')).toBeNull();
  });
});

describe('RubriqueComptesBancaires — formulaire', () => {
  beforeEach(() => {
    reinitialiserCompteurIdLocalCompte();
    remplacerComptesBancaires.mockReset();
  });

  afterEach(() => cleanup());

  it('TB23 — quatre colonnes IBAN et BIC seulement au depliage', () => {
    rendreRubrique();

    expect(screen.getByText('Banque')).toBeTruthy();
    expect(screen.getByText('RIB')).toBeTruthy();
    expect(screen.getByText('Titulaire du compte')).toBeTruthy();
    expect(screen.getByText('Part du virement')).toBeTruthy();
    expect(screen.queryByText('IBAN')).toBeNull();
    expect(screen.queryByText('BIC')).toBeNull();

    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    expect(screen.getByLabelText('IBAN')).toBeTruthy();
    expect(screen.getByLabelText('BIC')).toBeTruthy();
  });

  it('TB24 — photo prise a la premiere ouverture non renouvelee par fermeture automatique', () => {
    rendreRubrique({
      comptes: [
        compte({ id: 'cpt-1', titulaire: 'Original' }),
        compte({ id: 'cpt-2', titulaire: 'B' }),
      ],
    });

    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    fireEvent.change(champ('titulaire-cpt-1'), { target: { value: 'Brouillon' } });
    fireEvent.click(screen.getByTestId('ligne-cpt-2'));
    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    annulerLigne();

    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    expect(champ('titulaire-cpt-1')).toHaveProperty('value', 'Original');
  });

  it('TB26 — aucun formatage ni troncature sur RIB IBAN BIC', async () => {
    remplacerComptesBancaires.mockResolvedValueOnce(reponseComptes([compte()], 4));

    rendreRubrique({ comptes: [] });

    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    const idLocal = idLigneLocale();
    const rib = ' 007 780 000 0000000000000 ';
    const iban = 'MA64 007 780 0000000000000000 00';
    const bic = '  bmce mamc  ';
    fireEvent.change(champ(`rib-${idLocal}`), { target: { value: rib } });
    fireEvent.change(champ(`iban-${idLocal}`), { target: { value: iban } });
    fireEvent.change(champ(`bic-${idLocal}`), { target: { value: bic } });
    validerLigne();
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(remplacerComptesBancaires).toHaveBeenCalled());
    const corps = remplacerComptesBancaires.mock.calls[0]![3] as {
      comptes: { rib: string; iban: string; bic: string }[];
    };
    expect(corps.comptes[0]?.rib).toBe(rib);
    expect(corps.comptes[0]?.iban).toBe(iban);
    expect(corps.comptes[0]?.bic).toBe(bic);
  });

  it('TB32 — colonne Banque affiche libelle referentiel ou texte libre', () => {
    rendreRubrique({
      comptes: [
        compte({ id: 'cpt-ref', banqueId: 'bnq-1', banqueLibreSaisie: null }),
        compte({
          id: 'cpt-libre',
          banqueId: null,
          banqueLibreSaisie: 'Credit du Maroc',
          rib: '222',
        }),
      ],
    });

    expect(screen.getByTestId('ligne-cpt-ref').textContent).toContain('Attijariwafa Bank');
    expect(screen.getByTestId('ligne-cpt-libre').textContent).toContain('Credit du Maroc');
  });
});

describe('RubriqueComptesBancaires — verrouillage', () => {
  beforeEach(() => {
    reinitialiserCompteurIdLocalCompte();
    remplacerComptesBancaires.mockReset();
  });

  afterEach(() => cleanup());

  it('TB33 — pendant l enregistrement toutes les rubriques sont verrouillees', async () => {
    let resolveComptes: () => void = () => undefined;
    remplacerComptesBancaires.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveComptes = () => resolve(reponseComptes([compte()], 4));
        })
    );

    rendreRubrique({ extra: rubriqueIdentiteTest() });

    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    fireEvent.change(champ('titulaire-cpt-1'), { target: { value: 'Pendant' } });
    validerLigne();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Enregistrer/i })).toHaveProperty('disabled', false)
    );
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(remplacerComptesBancaires).toHaveBeenCalled());
    await waitFor(() =>
      expect(within(zoneComptes()).getByTestId('ajouter-ligne')).toHaveProperty('disabled', true)
    );
    expect(within(zoneComptes()).getByTestId('supprimer-cpt-1')).toHaveProperty('disabled', true);
    expect(screen.getByTestId('ligne-cpt-1').className).toMatch(/opacity-60/);

    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    expect(screen.queryByTestId('formulaire-cpt-1')).toBeNull();

    const nom = champ('nom');
    expect(nom).toHaveProperty('disabled', true);
    fireEvent.change(nom, { target: { value: 'Toujours editable' } });
    expect(nom).toHaveProperty('value', 'Benali');

    resolveComptes();
    await waitFor(() =>
      expect(within(zoneComptes()).getByTestId('ajouter-ligne')).toHaveProperty('disabled', false)
    );
    await waitFor(() => expect(nom).toHaveProperty('disabled', false));
  });
});

describe('RubriqueComptesBancaires — erreurs serveur', () => {
  beforeEach(() => {
    reinitialiserCompteurIdLocalCompte();
    remplacerComptesBancaires.mockReset();
  });

  afterEach(() => cleanup());

  it('TB36 — erreur 500 affiche message generique et s efface a la modification de ligne', async () => {
    remplacerComptesBancaires.mockRejectedValueOnce(
      new AppelApiEchoue(500, { code: 'ERREUR', message: 'Internal server error' })
    );

    rendreRubrique();

    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    fireEvent.change(champ('rib-cpt-1'), { target: { value: '000' } });
    validerLigne();
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() =>
      expect(screen.getByTestId('erreur-rubrique-comptes-bancaires').textContent).toBe(
        MESSAGE_ERREUR_GENERIQUE
      )
    );

    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    fireEvent.change(champ('rib-cpt-1'), { target: { value: '111' } });
    expect(screen.queryByTestId('erreur-rubrique-comptes-bancaires')).toBeNull();
  });

  it('TB37 — refus 400 rib affiche sur la ligne concernee', async () => {
    remplacerComptesBancaires.mockRejectedValueOnce(
      new AppelApiEchoue(400, {
        code: 'CARACTERE_NON_CONFORME',
        message: 'Ce champ n’accepte que des chiffres.',
        champ: 'rib',
      })
    );

    rendreRubrique();

    fireEvent.click(screen.getByTestId('ligne-cpt-1'));
    fireEvent.change(champ('rib-cpt-1'), { target: { value: 'ABC' } });
    validerLigne();
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() =>
      expect(screen.getByText('Ce champ n’accepte que des chiffres.')).toBeTruthy()
    );
    expect(screen.queryByTestId('erreur-rubrique-comptes-bancaires')).toBeNull();
    fireEvent.change(champ('rib-cpt-1'), { target: { value: '222' } });
    expect(screen.queryByText('Ce champ n’accepte que des chiffres.')).toBeNull();
  });
});

function HarnessComptesParentSynchronise({
  operations = ['salarie.lire', 'salarie.modifier', 'salarie.remuneration.ecrire'],
}: {
  readonly operations?: readonly Permission[];
}) {
  const [comptes, setComptes] = useState<readonly CompteBancaireSalarie[]>([]);
  return (
    <RegistreFicheProvider versionInitiale={3} onRechargerServeur={vi.fn()}>
      <FormulaireTableauProvider>
        <RubriqueComptesBancaires
          companyId="soc-1"
          salarieId="sal-1"
          comptesServeur={comptes}
          banques={BANQUES}
          operations={operations}
          onComptesChange={(suivant, _version) => setComptes(suivant)}
        />
        <RailActionsFiche operations={operations} companyId="soc-test" salarieId="sal-test" />
      </FormulaireTableauProvider>
    </RegistreFicheProvider>
  );
}

describe('RubriqueComptesBancaires — reinitialiser apres enregistrement', () => {
  beforeEach(() => {
    reinitialiserCompteurIdLocalCompte();
    remplacerComptesBancaires.mockReset();
  });

  afterEach(() => cleanup());

  it('TB24 — apres enregistrement puis Annuler fiche la ligne enregistree reste affichee (parent synchronise)', async () => {
    remplacerComptesBancaires.mockResolvedValueOnce(
      reponseComptes([compte({ id: 'cpt-enregistre', titulaire: 'Premier compte' })], 4)
    );

    render(<HarnessComptesParentSynchronise />);
    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    const idLocal = idLigneLocale();
    fireEvent.change(champ(`titulaire-${idLocal}`), { target: { value: 'Premier compte' } });
    validerLigne();
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));
    await waitFor(() => expect(remplacerComptesBancaires).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId('ligne-cpt-enregistre')).toBeTruthy());

    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    const idLocal2 = idLigneLocale();
    fireEvent.change(champ(`titulaire-${idLocal2}`), { target: { value: 'Deuxieme compte' } });
    validerLigne();

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(screen.getByTestId('ligne-cpt-enregistre')).toBeTruthy();
    expect(screen.queryByText('Deuxieme compte')).toBeNull();
  });
});
