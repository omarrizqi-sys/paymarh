// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createElement, useState, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  AvantageEnNatureFiche,
  EmploiFiche,
  NatureAvantageEnNature,
  Permission,
} from '@paymarh/shared-types';
import { AppelApiEchoue } from '@/lib/api/client';
import { LienGarde } from '@/components/navigation/navigation-gardee';
import { useDeclarerSaisiePerdable } from '@/components/navigation/saisie-perdable-racine';
import { NavigationGardeeTestProvider } from '@/test/navigation-gardee-test';
import { RegistreFicheProvider, useRegistreFiche } from '../registre-fiche-provider';
import { FormulaireTableauProvider } from '../contexte-formulaire-tableau';
import { RailActionsFiche } from '../rail-actions-fiche';
import { BlocEmplois } from '../bloc-emplois';
import { RubriqueEmploiAvantagesEnNature } from './rubrique-emploi-avantages-en-nature';
import { reinitialiserCompteurIdLocal } from '@/lib/fiche/avantages-en-nature-lignes';
import {
  OPERATIONS_EMPLOI_REMUNERATION,
  OPERATIONS_SALARIE_COMPLET,
  avecOperationsEmploi,
} from '@/test/operations-harnais-fiche-emploi';

const NATURES: readonly NatureAvantageEnNature[] = [
  { id: 'n1', ordre: 1, code: 'B01', libelle: 'Logement de fonction' },
  { id: 'n2', ordre: 2, code: 'B02', libelle: 'Voiture de fonction' },
  { id: 'n3', ordre: 3, code: 'B03', libelle: 'Nourriture' },
];

const TYPES_CONTRAT = [
  { id: 'tc-1', ordre: 1, code: 'CDI', libelle: 'Contrat à durée indéterminée' },
] as const;

const MOTIFS_SORTIE = [{ id: 'ms-1', ordre: 1, code: 'DEMISSION', libelle: 'Démission' }] as const;

const ETABLISSEMENTS = [{ id: 'etab-1', nom: 'Siège Casablanca' } as never];

const {
  creerAvantageEnNature,
  modifierAvantageEnNature,
  impactSuppressionAvantageEnNature,
  supprimerAvantageEnNature,
  modifierContratEmploi,
} = vi.hoisted(() => ({
  creerAvantageEnNature: vi.fn(),
  modifierAvantageEnNature: vi.fn(),
  impactSuppressionAvantageEnNature: vi.fn(),
  supprimerAvantageEnNature: vi.fn(),
  modifierContratEmploi: vi.fn(),
}));

vi.mock('@/lib/api/emplois', () => ({
  modifierContratEmploi: (...args: unknown[]) => modifierContratEmploi(...args),
  modifierAffectationEmploi: vi.fn(),
  modifierRemunerationEmploi: vi.fn(),
  creerAvantageEnNature: (...args: unknown[]) => creerAvantageEnNature(...args),
  modifierAvantageEnNature: (...args: unknown[]) => modifierAvantageEnNature(...args),
  impactSuppressionEmploi: vi.fn(),
  supprimerEmploi: vi.fn(),
  impactSuppressionAvantageEnNature: (...args: unknown[]) =>
    impactSuppressionAvantageEnNature(...args),
  supprimerAvantageEnNature: (...args: unknown[]) => supprimerAvantageEnNature(...args),
  creerStatutParticulier: vi.fn(),
  modifierStatutParticulier: vi.fn(),
  impactSuppressionStatutParticulier: vi.fn(),
  supprimerStatutParticulier: vi.fn(),
  creerPrimeContractuelle: vi.fn(),
  modifierPrimeContractuelle: vi.fn(),
  supprimerPrimeContractuelle: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}));

function resolutionsVides(): EmploiFiche['resolutions'] {
  return {
    dureeContractuelle: null,
    reposHebdomadaire: null,
    teletravailAutorise: null,
    grilleHoraire: null,
    joursFeriesTravailles: null,
  };
}

function avantage(surcharges: Partial<AvantageEnNatureFiche> = {}): AvantageEnNatureFiche {
  return {
    id: 'av-1',
    natureRef: 'B02',
    montant: '3500.00',
    moisApplication: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    moisEffetDebut: '2022-03',
    moisEffetFin: null,
    etat: 'ACTIVE',
    ...surcharges,
  };
}

function emploiBase(
  id: string,
  surcharges: {
    readonly version?: number;
    readonly libellePoste?: string;
    readonly avantagesEnNature?: readonly AvantageEnNatureFiche[];
    readonly sansAvantages?: boolean;
    readonly operationsEmploi?: readonly Permission[];
  } = {}
): EmploiFiche {
  const operationsEmploi = surcharges.operationsEmploi ?? OPERATIONS_EMPLOI_REMUNERATION;
  const base: EmploiFiche = {
    id,
    version: surcharges.version ?? 5,
    numeroOrdre: 1,
    contrat: {
      libellePoste: surcharges.libellePoste ?? 'Responsable paie',
      dateDebut: '2022-03-01',
      dateFin: null,
      typeContratCode: 'CDI',
      periodeEssaiDateFin: null,
      periodeEssaiDureeJours: null,
      renouvellementEssaiDateFin: null,
      statutCadre: null,
      coefficient: null,
      position: null,
      indice: null,
      dateSortie: null,
      motifSortieCode: null,
      estOuvert: true,
    },
    affectation: {
      etablissementId: 'etab-1',
      departementRef: null,
      serviceRef: null,
      baseSaisieDuree: 'HEBDOMADAIRE',
      dureeContractuelle: null,
      dureeDansAutreBase: null,
      repartitionHoraireRef: null,
      reposHebdomadaire: null,
      suivreJoursFeriesEtablissement: true,
      teletravailAutorise: null,
    },
    statutsParticuliers: [],
    resolutions: resolutionsVides(),
    remuneration: {
      modeDeterminationSalaire: 'BRUT_MENSUEL',
      montant: '12000.00',
      masquerNombreHeures: false,
      masquerTauxHoraire: false,
      bulletinTousLesMois: true,
      moisProduction: [],
      teletravailIndemniteVersee: null,
      teletravailMontant: null,
    },
    paiement: {
      modePaiement: 'VIREMENT',
      compteBancaireId: null,
    },
  };

  if (surcharges.sansAvantages) {
    return avecOperationsEmploi(base, operationsEmploi);
  }

  if (surcharges.avantagesEnNature !== undefined) {
    return avecOperationsEmploi(
      { ...base, avantagesEnNature: surcharges.avantagesEnNature },
      operationsEmploi
    );
  }

  return avecOperationsEmploi(
    {
      ...base,
      avantagesEnNature: [
        avantage({ id: 'av-voiture', natureRef: 'B02' }),
        avantage({ id: 'av-logement', natureRef: 'B01', montant: '2000.00' }),
        avantage({
          id: 'av-nourriture',
          natureRef: 'B03',
          montant: '800.00',
          moisApplication: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          moisEffetFin: '2022-02',
          etat: 'CLOTUREE',
        }),
      ],
    },
    operationsEmploi
  );
}

function DeclarerGarde() {
  const { aModificationsNonEnregistrees, libellesRubriquesModifiees } = useRegistreFiche();
  useDeclarerSaisiePerdable(aModificationsNonEnregistrees, libellesRubriquesModifiees);
  return null;
}

function Harness({
  emploisInitiaux,
  operations,
  children,
  onEmploisChangeCapture,
}: {
  readonly emploisInitiaux: EmploiFiche[];
  readonly operations: readonly Permission[];
  readonly children?: ReactNode;
  readonly onEmploisChangeCapture?: (emplois: readonly EmploiFiche[]) => void;
}) {
  const [emplois, setEmplois] = useState(emploisInitiaux);

  return createElement(
    NavigationGardeeTestProvider,
    null,
    createElement(
      FormulaireTableauProvider,
      null,
      createElement(
        RegistreFicheProvider,
        {
          versionInitiale: 10,
          emplois: emplois.map((emploi) => ({
            id: emploi.id,
            libellePoste: emploi.contrat.libellePoste,
            version: emploi.version,
          })),
          onRechargerServeur: vi.fn(async () => undefined),
        },
        createElement(DeclarerGarde),
        createElement(BlocEmplois, {
          companyId: 'soc-test',
          emplois,
          operations,
          typesContrat: TYPES_CONTRAT,
          motifsSortie: MOTIFS_SORTIE,
          etablissements: ETABLISSEMENTS,
          banques: [],
          comptesBancaires: [],
          naturesAvantageEnNature: NATURES,
          primesReferentiel: [],
          statutsParticuliersReferentiel: [],
          onEmploisChange: (maj) => {
            setEmplois((prev) => {
              const copie = [...(typeof maj === 'function' ? maj(prev) : maj)];
              onEmploisChangeCapture?.(copie);
              return copie;
            });
          },
        }),
        children,
        createElement(RailActionsFiche, {
          operations: [...operations, 'salarie.modifier', 'salarie.supprimer'],
          companyId: 'soc-test',
          salarieId: 'sal-test',
        })
      )
    )
  );
}

function ouvrirAccordeon(emploiId: string) {
  const corps = screen.getByTestId(`accordeon-emploi-corps-${emploiId}`);
  if (corps.classList.contains('hidden')) {
    fireEvent.click(screen.getByTestId(`accordeon-emploi-entete-${emploiId}`));
  }
}

function HarnessRubriqueSeule({ emploi }: { readonly emploi: EmploiFiche }) {
  const [courant, setCourant] = useState(emploi);
  const operationsEmploi = courant.operations ?? [];

  return createElement(
    NavigationGardeeTestProvider,
    null,
    createElement(
      FormulaireTableauProvider,
      null,
      createElement(
        RegistreFicheProvider,
        {
          versionInitiale: 10,
          emplois: [
            {
              id: courant.id,
              libellePoste: courant.contrat.libellePoste,
              version: courant.version,
            },
          ],
          onRechargerServeur: vi.fn(async () => undefined),
        },
        createElement(DeclarerGarde),
        createElement(RubriqueEmploiAvantagesEnNature, {
          companyId: 'soc-test',
          emploi: courant,
          lignesServeur: courant.avantagesEnNature ?? [],
          natures: NATURES,
          operations: operationsEmploi,
          onEmploiChange: (maj) => {
            setCourant((prev) => (typeof maj === 'function' ? maj(prev) : maj));
          },
        }),
        createElement(RailActionsFiche, {
          operations: [...OPERATIONS_SALARIE_COMPLET],
          companyId: 'soc-test',
          salarieId: 'sal-test',
        })
      )
    )
  );
}

describe('Rubrique emploi — Avantages en nature', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    reinitialiserCompteurIdLocal();
    creerAvantageEnNature.mockReset();
    modifierAvantageEnNature.mockReset();
    impactSuppressionAvantageEnNature.mockReset();
    supprimerAvantageEnNature.mockReset();
    modifierContratEmploi.mockReset();
  });

  it('AN01 — affiche les libelles de nature, pas les codes', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiBase('emp-1')],
        operations: OPERATIONS_SALARIE_COMPLET,
      })
    );

    ouvrirAccordeon('emp-1');

    expect(screen.getByText('Voiture de fonction')).toBeTruthy();
    expect(screen.getByText('Logement de fonction')).toBeTruthy();
    expect(screen.getByText('Nourriture')).toBeTruthy();
    expect(screen.queryByText('B02')).toBeNull();
  });

  it('AN02 — ligne CLOTUREE grisee avec inactive depuis MM/AAAA', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiBase('emp-1')],
        operations: OPERATIONS_SALARIE_COMPLET,
      })
    );

    ouvrirAccordeon('emp-1');

    expect(screen.getByTestId('etat-ligne-av-nourriture').textContent).toBe(
      'inactive depuis 02/2022'
    );
    expect(screen.getByTestId('ligne-av-nourriture').classList.contains('opacity-60')).toBe(true);
  });

  it('AN03 — formulaire voiture : douze mois coches et Tous les mois coche', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiBase('emp-1')],
        operations: OPERATIONS_SALARIE_COMPLET,
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.click(screen.getByTestId('ligne-av-voiture'));

    const formulaire = screen.getByTestId('formulaire-av-voiture');
    expect(within(formulaire).getByLabelText('Tous les mois')).toBeTruthy();
    expect((within(formulaire).getByLabelText('Tous les mois') as HTMLInputElement).checked).toBe(
      true
    );
    for (let mois = 1; mois <= 12; mois += 1) {
      expect(
        (within(formulaire).getByLabelText(MOIS_LABELS[mois - 1]!) as HTMLInputElement).checked
      ).toBe(true);
    }
  });

  it('AN04 — decocher juin puis valider : affichage local sans appel serveur', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiBase('emp-1')],
        operations: OPERATIONS_SALARIE_COMPLET,
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.click(screen.getByTestId('ligne-av-voiture'));

    const formulaire = screen.getByTestId('formulaire-av-voiture');
    fireEvent.click(within(formulaire).getByLabelText('Juin'));
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));

    expect(modifierAvantageEnNature).not.toHaveBeenCalled();
    expect(screen.getByTestId('ligne-av-voiture').textContent).toContain('Janv.');
    expect(screen.getByTestId('ligne-av-voiture').textContent).not.toContain('Juin');
  });

  it('AN05 — enregistrer envoie la modification avec la version de l emploi', async () => {
    const emploi = emploiBase('emp-1', { version: 7 });
    modifierAvantageEnNature.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 8,
        avantagesEnNature: [
          avantage({
            id: 'av-voiture',
            moisApplication: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12],
          }),
        ],
      },
      alertes: [],
    });

    render(
      createElement(HarnessRubriqueSeule, {
        emploi,
      })
    );

    fireEvent.click(screen.getByTestId('ligne-av-voiture'));
    const formulaire = screen.getByTestId('formulaire-av-voiture');
    fireEvent.click(within(formulaire).getByLabelText('Juin'));
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));

    const boutonEnregistrer = screen.getByRole('button', { name: 'Enregistrer' });
    await waitFor(() => expect(boutonEnregistrer.hasAttribute('disabled')).toBe(false));
    fireEvent.click(boutonEnregistrer);

    await waitFor(() =>
      expect(modifierAvantageEnNature).toHaveBeenCalledWith(
        'soc-test',
        'emp-1',
        'av-voiture',
        7,
        expect.objectContaining({ moisApplication: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12] })
      )
    );
  });

  it('AN06 — Annuler fiche nomme la rubrique qualifiee', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      createElement(HarnessRubriqueSeule, {
        emploi: emploiBase('emp-1'),
      })
    );

    fireEvent.click(screen.getByTestId('ligne-av-voiture'));
    const formulaire = screen.getByTestId('formulaire-av-voiture');
    fireEvent.click(within(formulaire).getByLabelText('Juin'));
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Annuler/ }).hasAttribute('disabled')).toBe(false)
    );
    fireEvent.click(screen.getByRole('button', { name: /Annuler/ }));

    expect(confirmSpy.mock.calls[0]?.[0]).toContain('Avantages en nature — Responsable paie');
    confirmSpy.mockRestore();
  });

  it('AN07 — garde de navigation nomme la rubrique qualifiee', () => {
    render(
      createElement(
        Harness,
        {
          emploisInitiaux: [emploiBase('emp-1')],
          operations: OPERATIONS_SALARIE_COMPLET,
        },
        createElement(LienGarde, { href: '/societes/soc-test/salaries' }, 'Retour liste')
      )
    );

    ouvrirAccordeon('emp-1');
    fireEvent.click(screen.getByTestId('ligne-av-voiture'));
    const formulaire = screen.getByTestId('formulaire-av-voiture');
    fireEvent.click(within(formulaire).getByLabelText('Juin'));
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));
    fireEvent.click(screen.getByRole('link', { name: 'Retour liste' }));

    expect(screen.getByTestId('dialogue-suppression-differee-corps').textContent).toContain(
      'Avantages en nature — Responsable paie'
    );
  });

  it('AN08 — suppression immediate avec message serveur', async () => {
    const emploi = emploiBase('emp-1', { version: 4 });
    impactSuppressionAvantageEnNature.mockResolvedValueOnce({
      donnees: {
        emploiId: 'emp-1',
        ligneId: 'av-voiture',
        mode: 'supprimer',
        message: 'Cet avantage sera supprimé définitivement.',
        jetonConfirmation: 'jeton-abc',
      },
    });
    supprimerAvantageEnNature.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 5,
        avantagesEnNature: [avantage({ id: 'av-logement', natureRef: 'B01', montant: '2000.00' })],
      },
      alertes: [],
    });

    render(
      createElement(Harness, {
        emploisInitiaux: [emploi],
        operations: OPERATIONS_SALARIE_COMPLET,
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.click(screen.getByTestId('supprimer-av-voiture'));

    await waitFor(() =>
      expect(screen.getByText('Cet avantage sera supprimé définitivement.')).toBeTruthy()
    );

    fireEvent.click(screen.getByTestId('confirmer-suppression-ligne'));

    await waitFor(() => expect(supprimerAvantageEnNature).toHaveBeenCalled());
    expect(screen.queryByTestId('ligne-av-voiture')).toBeNull();
  });

  it('AN09 — emploi sans avantage : en-tete et bouton Ajouter seulement', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiBase('emp-2', { avantagesEnNature: [] })],
        operations: OPERATIONS_SALARIE_COMPLET,
      })
    );

    ouvrirAccordeon('emp-2');

    expect(screen.getByTestId('avantages-en-nature-emp-2')).toBeTruthy();
    expect(screen.getByTestId('ajouter-ligne')).toBeTruthy();
    expect(screen.queryByTestId(/ligne-av-/)).toBeNull();
  });

  it('AN10 — rubrique absente quand la cle avantagesEnNature manque de l emploi', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiBase('emp-1', { sansAvantages: true })],
        operations: ['salarie.lire'],
      })
    );

    ouvrirAccordeon('emp-1');

    expect(screen.queryByTestId('avantages-en-nature-emp-1')).toBeNull();
    expect(screen.queryByText('Avantages en nature')).toBeNull();
  });

  it('AN11 — lecture seule sans bouton Ajouter ni Supprimer', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiBase('emp-1', { operationsEmploi: ['salarie.remuneration.lire'] })],
        operations: ['salarie.lire'],
      })
    );

    ouvrirAccordeon('emp-1');

    expect(screen.getByText('Voiture de fonction')).toBeTruthy();
    expect(screen.queryByTestId('ajouter-ligne')).toBeNull();
    expect(screen.queryByTestId('supprimer-av-voiture')).toBeNull();
  });

  it('AN12 — ligne cloturee se deplie en lecture seule', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiBase('emp-1')],
        operations: OPERATIONS_SALARIE_COMPLET,
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.click(screen.getByTestId('ligne-av-nourriture'));

    expect(screen.getByTestId('formulaire-lecture-seule')).toBeTruthy();
    expect(screen.queryByTestId('valider-ligne')).toBeNull();
  });

  it('AN13 — refus metier 400 affiche le message serveur', async () => {
    modifierAvantageEnNature.mockRejectedValueOnce(
      new AppelApiEchoue(400, {
        code: 'MONTANT_INVALIDE',
        message: 'Le montant doit être strictement positif.',
        champ: 'montant',
      })
    );

    render(
      createElement(HarnessRubriqueSeule, {
        emploi: emploiBase('emp-1'),
      })
    );

    fireEvent.click(screen.getByTestId('ligne-av-voiture'));
    const formulaire = screen.getByTestId('formulaire-av-voiture');
    fireEvent.change(within(formulaire).getByLabelText('Montant'), { target: { value: '-1' } });
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));

    const boutonEnregistrer = screen.getByRole('button', { name: 'Enregistrer' });
    await waitFor(() => expect(boutonEnregistrer.hasAttribute('disabled')).toBe(false));
    fireEvent.click(boutonEnregistrer);

    await waitFor(() =>
      expect(screen.getByText('Le montant doit être strictement positif.')).toBeTruthy()
    );
  });

  it('AN14 — enregistrement conjoint contrat et avantages propage le contrat mis a jour au parent', async () => {
    const emploi = emploiBase('emp-1', { version: 7 });
    const historiqueEmplois: EmploiFiche[][] = [];

    modifierContratEmploi.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 8,
        contrat: { ...emploi.contrat, libellePoste: 'Directeur paie' },
      },
      alertes: [],
    });
    modifierAvantageEnNature.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 9,
        contrat: { ...emploi.contrat, libellePoste: 'Directeur paie' },
        avantagesEnNature: [
          avantage({
            id: 'av-voiture',
            moisApplication: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12],
          }),
        ],
      },
      alertes: [],
    });

    render(
      createElement(Harness, {
        emploisInitiaux: [emploi],
        operations: OPERATIONS_SALARIE_COMPLET,
        onEmploisChangeCapture: (prochains) => {
          historiqueEmplois.push(prochains.map((e) => structuredClone(e)));
        },
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.change(screen.getByLabelText('Libellé du poste'), {
      target: { value: 'Directeur paie' },
    });
    fireEvent.click(screen.getByTestId('ligne-av-voiture'));
    const formulaire = screen.getByTestId('formulaire-av-voiture');
    fireEvent.click(within(formulaire).getByLabelText('Juin'));
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));

    const boutonEnregistrer = screen.getByRole('button', { name: 'Enregistrer' });
    await waitFor(() => expect(boutonEnregistrer.hasAttribute('disabled')).toBe(false));
    fireEvent.click(boutonEnregistrer);

    await waitFor(() => expect(modifierContratEmploi).toHaveBeenCalled());
    await waitFor(() => expect(modifierAvantageEnNature).toHaveBeenCalled());

    expect(modifierContratEmploi).toHaveBeenCalledWith(
      'soc-test',
      'emp-1',
      7,
      expect.objectContaining({ libellePoste: 'Directeur paie' })
    );
    expect(modifierAvantageEnNature).toHaveBeenCalledWith(
      'soc-test',
      'emp-1',
      'av-voiture',
      8,
      expect.objectContaining({ moisApplication: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12] })
    );

    const dernierEmploi = historiqueEmplois.at(-1)?.[0];
    expect(dernierEmploi?.contrat.libellePoste).toBe('Directeur paie');
    expect(dernierEmploi?.version).toBe(9);
  });

  it('AN15 — suppression immediate remonte les valeurs enregistrees de la ligne A modifiee localement', async () => {
    const emploi = emploiBase('emp-1', { version: 4 });
    const historiqueEmplois: EmploiFiche[][] = [];

    impactSuppressionAvantageEnNature.mockResolvedValueOnce({
      donnees: {
        emploiId: 'emp-1',
        ligneId: 'av-logement',
        mode: 'supprimer',
        message: 'Suppression logement.',
        jetonConfirmation: 'jeton-logement',
      },
    });
    supprimerAvantageEnNature.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 5,
        avantagesEnNature: [
          avantage({ id: 'av-voiture', natureRef: 'B02', montant: '3500.00' }),
          avantage({ id: 'av-nourriture', natureRef: 'B03', montant: '800.00', etat: 'CLOTUREE' }),
        ],
      },
      alertes: [],
    });

    render(
      createElement(Harness, {
        emploisInitiaux: [emploi],
        operations: OPERATIONS_SALARIE_COMPLET,
        onEmploisChangeCapture: (prochains) => {
          historiqueEmplois.push(prochains.map((e) => structuredClone(e)));
        },
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.click(screen.getByTestId('ligne-av-voiture'));
    const formulaire = screen.getByTestId('formulaire-av-voiture');
    fireEvent.change(within(formulaire).getByLabelText('Montant'), {
      target: { value: '9999.00' },
    });
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));

    fireEvent.click(screen.getByTestId('supprimer-av-logement'));
    await waitFor(() => expect(screen.getByText('Suppression logement.')).toBeTruthy());
    fireEvent.click(screen.getByTestId('confirmer-suppression-ligne'));

    await waitFor(() => expect(supprimerAvantageEnNature).toHaveBeenCalled());

    const dernierEmploi = historiqueEmplois.at(-1)?.[0];
    const voitureParent = dernierEmploi?.avantagesEnNature?.find((l) => l.id === 'av-voiture');
    expect(voitureParent?.montant).toBe('3500.00');
    expect(dernierEmploi?.avantagesEnNature?.some((l) => l.id === 'av-logement')).toBe(false);

    expect(screen.getByTestId('ligne-av-voiture').textContent).toContain('9');
    expect(screen.getByTestId('ligne-av-voiture').textContent).toContain('999');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Enregistrer' }).hasAttribute('disabled')).toBe(
        false
      )
    );
  });

  it('AN16 — creer puis modifier envoie le PATCH sur l identifiant serveur', async () => {
    const emploi = emploiBase('emp-1', { version: 5 });
    creerAvantageEnNature.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 6,
        avantagesEnNature: [
          ...(emploi.avantagesEnNature ?? []),
          avantage({
            id: 'av-serveur-42',
            natureRef: 'B01',
            montant: '1500.00',
            moisApplication: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          }),
        ],
      },
      alertes: [],
    });
    modifierAvantageEnNature.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 7,
        avantagesEnNature: [
          ...(emploi.avantagesEnNature ?? []).filter((l) => l.id !== 'av-serveur-42'),
          avantage({
            id: 'av-serveur-42',
            natureRef: 'B01',
            montant: '1600.00',
            moisApplication: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          }),
        ],
      },
      alertes: [],
    });

    render(
      createElement(Harness, {
        emploisInitiaux: [emploi],
        operations: OPERATIONS_SALARIE_COMPLET,
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    const formulaireCreation = screen.getByTestId(/formulaire-/);
    fireEvent.change(within(formulaireCreation).getByLabelText('Montant'), {
      target: { value: '1500.00' },
    });
    fireEvent.click(within(formulaireCreation).getByLabelText('Tous les mois'));
    fireEvent.click(within(formulaireCreation).getByTestId('valider-ligne'));

    const boutonEnregistrer = screen.getByRole('button', { name: 'Enregistrer' });
    await waitFor(() => expect(boutonEnregistrer.hasAttribute('disabled')).toBe(false));
    fireEvent.click(boutonEnregistrer);
    await waitFor(() => expect(creerAvantageEnNature).toHaveBeenCalled());

    fireEvent.click(screen.getByTestId('ligne-av-serveur-42'));
    const formulaireModification = screen.getByTestId('formulaire-av-serveur-42');
    fireEvent.change(within(formulaireModification).getByLabelText('Montant'), {
      target: { value: '1600.00' },
    });
    fireEvent.click(within(formulaireModification).getByTestId('valider-ligne'));

    await waitFor(() => expect(boutonEnregistrer.hasAttribute('disabled')).toBe(false));
    fireEvent.click(boutonEnregistrer);

    await waitFor(() =>
      expect(modifierAvantageEnNature).toHaveBeenCalledWith(
        'soc-test',
        'emp-1',
        'av-serveur-42',
        6,
        expect.objectContaining({ montant: '1600.00' })
      )
    );
  });

  it('AN17 — creer puis supprimer immediatement vise l identifiant serveur', async () => {
    const emploi = emploiBase('emp-1', { version: 5 });
    creerAvantageEnNature.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 6,
        avantagesEnNature: [
          ...(emploi.avantagesEnNature ?? []),
          avantage({
            id: 'av-serveur-99',
            natureRef: 'B01',
            montant: '1200.00',
            moisApplication: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          }),
        ],
      },
      alertes: [],
    });
    impactSuppressionAvantageEnNature.mockResolvedValueOnce({
      donnees: {
        emploiId: 'emp-1',
        ligneId: 'av-serveur-99',
        mode: 'supprimer',
        message: 'Suppression nouvel avantage.',
        jetonConfirmation: 'jeton-nouveau',
      },
    });
    supprimerAvantageEnNature.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 7,
        avantagesEnNature: emploi.avantagesEnNature ?? [],
      },
      alertes: [],
    });

    render(
      createElement(Harness, {
        emploisInitiaux: [emploi],
        operations: OPERATIONS_SALARIE_COMPLET,
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    const formulaireCreation = screen.getByTestId(/formulaire-/);
    fireEvent.change(within(formulaireCreation).getByLabelText('Montant'), {
      target: { value: '1200.00' },
    });
    fireEvent.click(within(formulaireCreation).getByLabelText('Tous les mois'));
    fireEvent.click(within(formulaireCreation).getByTestId('valider-ligne'));

    const boutonEnregistrer = screen.getByRole('button', { name: 'Enregistrer' });
    await waitFor(() => expect(boutonEnregistrer.hasAttribute('disabled')).toBe(false));
    fireEvent.click(boutonEnregistrer);
    await waitFor(() => expect(creerAvantageEnNature).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId('ligne-av-serveur-99')).toBeTruthy());

    fireEvent.click(screen.getByTestId('supprimer-av-serveur-99'));
    await waitFor(() => expect(screen.getByText('Suppression nouvel avantage.')).toBeTruthy());

    expect(impactSuppressionAvantageEnNature).toHaveBeenCalledWith(
      'soc-test',
      'emp-1',
      'av-serveur-99'
    );

    fireEvent.click(screen.getByTestId('confirmer-suppression-ligne'));
    await waitFor(() =>
      expect(supprimerAvantageEnNature).toHaveBeenCalledWith(
        'soc-test',
        'emp-1',
        'av-serveur-99',
        6,
        'jeton-nouveau'
      )
    );
  });
});

const MOIS_LABELS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const;
