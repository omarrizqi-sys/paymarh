// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createElement, useState, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  EmploiFiche,
  Permission,
  PrimeContractuelleFiche,
  PrimeReferentiel,
} from '@paymarh/shared-types';
import { AppelApiEchoue } from '@/lib/api/client';
import { LienGarde } from '@/components/navigation/navigation-gardee';
import { useDeclarerSaisiePerdable } from '@/components/navigation/saisie-perdable-racine';
import { NavigationGardeeTestProvider } from '@/test/navigation-gardee-test';
import { RegistreFicheProvider, useRegistreFiche } from '../registre-fiche-provider';
import { FormulaireTableauProvider } from '../contexte-formulaire-tableau';
import { RailActionsFiche } from '../rail-actions-fiche';
import { BlocEmplois } from '../bloc-emplois';
import { RubriqueEmploiPrimesContractuelles } from './rubrique-emploi-primes-contractuelles';
import { reinitialiserCompteurIdLocal } from '@/lib/fiche/primes-contractuelles-lignes';

const PRIMES: readonly PrimeReferentiel[] = [
  { id: 'p1', ordre: 10, code: 'A04', libelle: 'Prime de panier' },
  { id: 'p2', ordre: 20, code: 'A15', libelle: 'Indemnité de transport' },
  { id: 'p3', ordre: 30, code: 'A24', libelle: 'Indemnité de représentation' },
];

const TYPES_CONTRAT = [
  { id: 'tc-1', ordre: 1, code: 'CDI', libelle: 'Contrat à durée indéterminée' },
] as const;

const MOTIFS_SORTIE = [{ id: 'ms-1', ordre: 1, code: 'DEMISSION', libelle: 'Démission' }] as const;

const ETABLISSEMENTS = [{ id: 'etab-1', nom: 'Siège Casablanca' } as never];

const {
  creerPrimeContractuelle,
  modifierPrimeContractuelle,
  supprimerPrimeContractuelle,
  modifierContratEmploi,
} = vi.hoisted(() => ({
  creerPrimeContractuelle: vi.fn(),
  modifierPrimeContractuelle: vi.fn(),
  supprimerPrimeContractuelle: vi.fn(),
  modifierContratEmploi: vi.fn(),
}));

vi.mock('@/lib/api/emplois', () => ({
  modifierContratEmploi: (...args: unknown[]) => modifierContratEmploi(...args),
  modifierAffectationEmploi: vi.fn(),
  modifierRemunerationEmploi: vi.fn(),
  creerAvantageEnNature: vi.fn(),
  modifierAvantageEnNature: vi.fn(),
  impactSuppressionEmploi: vi.fn(),
  supprimerEmploi: vi.fn(),
  impactSuppressionAvantageEnNature: vi.fn(),
  supprimerAvantageEnNature: vi.fn(),
  impactSuppressionStatutParticulier: vi.fn(),
  supprimerStatutParticulier: vi.fn(),
  creerPrimeContractuelle: (...args: unknown[]) => creerPrimeContractuelle(...args),
  modifierPrimeContractuelle: (...args: unknown[]) => modifierPrimeContractuelle(...args),
  supprimerPrimeContractuelle: (...args: unknown[]) => supprimerPrimeContractuelle(...args),
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

function prime(surcharges: Partial<PrimeContractuelleFiche> = {}): PrimeContractuelleFiche {
  return {
    id: 'pc-1',
    primeRef: 'A15',
    moisApplication: [6, 12],
    ...surcharges,
  };
}

function emploiBase(
  id: string,
  surcharges: {
    readonly version?: number;
    readonly libellePoste?: string;
    readonly primesContractuelles?: readonly PrimeContractuelleFiche[];
    readonly sansPrimes?: boolean;
  } = {}
): EmploiFiche {
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

  if (surcharges.sansPrimes) {
    return base;
  }

  if (surcharges.primesContractuelles !== undefined) {
    return { ...base, primesContractuelles: surcharges.primesContractuelles };
  }

  return {
    ...base,
    primesContractuelles: [
      prime({ id: 'pc-transport', primeRef: 'A15', moisApplication: [6, 12] }),
      prime({
        id: 'pc-tous',
        primeRef: 'A04',
        moisApplication: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      }),
      prime({ id: 'pc-vide', primeRef: 'A24', moisApplication: [] }),
    ],
  };
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
          naturesAvantageEnNature: [],
          primesReferentiel: PRIMES,
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

function HarnessRubriqueSeule({
  emploi,
  operations,
}: {
  readonly emploi: EmploiFiche;
  readonly operations: readonly Permission[];
}) {
  const [courant, setCourant] = useState(emploi);

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
        createElement(RubriqueEmploiPrimesContractuelles, {
          companyId: 'soc-test',
          emploi: courant,
          lignesServeur: courant.primesContractuelles ?? [],
          primes: PRIMES,
          operations,
          onEmploiChange: (maj) => {
            setCourant((prev) => (typeof maj === 'function' ? maj(prev) : maj));
          },
        }),
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

describe('Rubrique emploi — Primes contractuelles', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    reinitialiserCompteurIdLocal();
    creerPrimeContractuelle.mockReset();
    modifierPrimeContractuelle.mockReset();
    supprimerPrimeContractuelle.mockReset();
    modifierContratEmploi.mockReset();
  });

  it('PC01 — affiche les libelles de prime, pas les codes', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiBase('emp-1')],
        operations: ['salarie.lire', 'salarie.remuneration.lire', 'salarie.remuneration.ecrire'],
      })
    );

    ouvrirAccordeon('emp-1');

    expect(screen.getByText('Indemnité de transport')).toBeTruthy();
    expect(screen.getByText('Prime de panier')).toBeTruthy();
    expect(screen.queryByText('A15')).toBeNull();
  });

  it('PC02 — affichage des mois d application', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiBase('emp-1')],
        operations: ['salarie.lire', 'salarie.remuneration.lire', 'salarie.remuneration.ecrire'],
      })
    );

    ouvrirAccordeon('emp-1');

    expect(screen.getByTestId('ligne-pc-transport').textContent).toContain('Juin');
    expect(screen.getByTestId('ligne-pc-transport').textContent).toContain('Déc.');
    expect(screen.getByTestId('ligne-pc-tous').textContent).toContain('Tous les mois');
    const cellulesVide = screen.getByTestId('ligne-pc-vide').querySelectorAll('td');
    expect(cellulesVide[1]?.textContent?.trim()).toBe('');
  });

  it('PC03 — aucune ligne grisee ni mention d etat', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiBase('emp-1')],
        operations: ['salarie.lire', 'salarie.remuneration.lire', 'salarie.remuneration.ecrire'],
      })
    );

    ouvrirAccordeon('emp-1');

    expect(screen.queryByTestId(/etat-ligne-/)).toBeNull();
    expect(screen.queryByText(/inactive depuis/i)).toBeNull();
    expect(screen.queryByText(/non enregistrée/i)).toBeNull();
    for (const id of ['pc-transport', 'pc-tous', 'pc-vide']) {
      expect(screen.getByTestId(`ligne-${id}`).classList.contains('opacity-60')).toBe(false);
    }
  });

  it('PC04 — formulaire ouvert avec prime et mois corrects', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiBase('emp-1')],
        operations: ['salarie.lire', 'salarie.remuneration.lire', 'salarie.remuneration.ecrire'],
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.click(screen.getByTestId('ligne-pc-transport'));

    const formulaire = screen.getByTestId('formulaire-pc-transport');
    expect((within(formulaire).getByLabelText('Prime') as HTMLSelectElement).value).toBe('A15');
    expect((within(formulaire).getByLabelText('Tous les mois') as HTMLInputElement).checked).toBe(
      false
    );
    expect((within(formulaire).getByLabelText('Juin') as HTMLInputElement).checked).toBe(true);
    expect((within(formulaire).getByLabelText('Décembre') as HTMLInputElement).checked).toBe(true);
  });

  it('PC05 — valider une ligne met a jour l affichage sans appel serveur', async () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiBase('emp-1')],
        operations: ['salarie.lire', 'salarie.remuneration.lire', 'salarie.remuneration.ecrire'],
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.click(screen.getByTestId('ligne-pc-tous'));
    const formulaire = screen.getByTestId('formulaire-pc-tous');
    fireEvent.click(within(formulaire).getByLabelText('Janvier'));
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));

    expect(modifierPrimeContractuelle).not.toHaveBeenCalled();
    expect(screen.getByTestId('ligne-pc-tous').textContent).not.toContain('Tous les mois');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Enregistrer' }).hasAttribute('disabled')).toBe(
        false
      )
    );
  });

  it('PC06 — enregistrer envoie la modification avec la version de l emploi', async () => {
    const emploi = emploiBase('emp-1', { version: 7 });
    modifierPrimeContractuelle.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 8,
        primesContractuelles: [
          prime({
            id: 'pc-tous',
            primeRef: 'A04',
            moisApplication: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          }),
        ],
      },
      alertes: [],
    });

    render(
      createElement(HarnessRubriqueSeule, {
        emploi,
        operations: ['salarie.lire', 'salarie.remuneration.lire', 'salarie.remuneration.ecrire'],
      })
    );

    fireEvent.click(screen.getByTestId('ligne-pc-tous'));
    const formulaire = screen.getByTestId('formulaire-pc-tous');
    fireEvent.click(within(formulaire).getByLabelText('Janvier'));
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));

    const boutonEnregistrer = screen.getByRole('button', { name: 'Enregistrer' });
    await waitFor(() => expect(boutonEnregistrer.hasAttribute('disabled')).toBe(false));
    fireEvent.click(boutonEnregistrer);

    await waitFor(() =>
      expect(modifierPrimeContractuelle).toHaveBeenCalledWith(
        'soc-test',
        'emp-1',
        'pc-tous',
        7,
        expect.objectContaining({
          moisApplication: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        })
      )
    );
  });

  it('PC07 — Annuler fiche nomme la rubrique qualifiee', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      createElement(HarnessRubriqueSeule, {
        emploi: emploiBase('emp-1'),
        operations: ['salarie.lire', 'salarie.remuneration.lire', 'salarie.remuneration.ecrire'],
      })
    );

    fireEvent.click(screen.getByTestId('ligne-pc-transport'));
    const formulaire = screen.getByTestId('formulaire-pc-transport');
    fireEvent.click(within(formulaire).getByLabelText('Juillet'));
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Annuler/ }).hasAttribute('disabled')).toBe(false)
    );
    fireEvent.click(screen.getByRole('button', { name: /Annuler/ }));

    expect(confirmSpy.mock.calls[0]?.[0]).toContain('Primes contractuelles — Responsable paie');
    confirmSpy.mockRestore();
  });

  it('PC08 — garde de navigation nomme la rubrique qualifiee', () => {
    render(
      createElement(
        Harness,
        {
          emploisInitiaux: [emploiBase('emp-1')],
          operations: ['salarie.lire', 'salarie.remuneration.lire', 'salarie.remuneration.ecrire'],
        },
        createElement(LienGarde, { href: '/societes/soc-test/salaries' }, 'Retour liste')
      )
    );

    ouvrirAccordeon('emp-1');
    fireEvent.click(screen.getByTestId('ligne-pc-transport'));
    const formulaire = screen.getByTestId('formulaire-pc-transport');
    fireEvent.click(within(formulaire).getByLabelText('Juillet'));
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));
    fireEvent.click(screen.getByRole('link', { name: 'Retour liste' }));

    expect(screen.getByTestId('dialogue-suppression-differee-corps').textContent).toContain(
      'Primes contractuelles — Responsable paie'
    );
  });

  it('PC09 — suppression immediate avec message compose par l ecran', async () => {
    const emploi = emploiBase('emp-1', { version: 4 });
    supprimerPrimeContractuelle.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 5,
        primesContractuelles: [prime({ id: 'pc-tous', primeRef: 'A04' })],
      },
      alertes: [],
    });

    render(
      createElement(Harness, {
        emploisInitiaux: [emploi],
        operations: ['salarie.lire', 'salarie.remuneration.lire', 'salarie.remuneration.ecrire'],
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.click(screen.getByTestId('supprimer-pc-transport'));

    expect(supprimerPrimeContractuelle).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(screen.getByTestId('dialogue-suppression-differee-titre').textContent).toContain(
        'Supprimer la prime « Indemnité de transport » ? La suppression est immédiate et définitive.'
      )
    );

    fireEvent.click(screen.getByTestId('dialogue-suppression-differee-confirmer'));

    await waitFor(() =>
      expect(supprimerPrimeContractuelle).toHaveBeenCalledWith(
        'soc-test',
        'emp-1',
        'pc-transport',
        4
      )
    );
    expect(screen.queryByTestId('ligne-pc-transport')).toBeNull();
  });

  it('PC10 — suppression locale d une ligne jamais enregistree', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiBase('emp-1')],
        operations: ['salarie.lire', 'salarie.remuneration.lire', 'salarie.remuneration.ecrire'],
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    expect(screen.getByTestId('ligne-local-1')).toBeTruthy();
    fireEvent.click(screen.getByTestId('supprimer-local-1'));

    expect(supprimerPrimeContractuelle).not.toHaveBeenCalled();
    expect(screen.queryByTestId('ligne-local-1')).toBeNull();
    expect(screen.queryByTestId('dialogue-suppression-differee')).toBeNull();
  });

  it('PC11 — emploi sans prime : en-tete et bouton Ajouter seulement', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiBase('emp-2', { primesContractuelles: [] })],
        operations: ['salarie.lire', 'salarie.remuneration.lire', 'salarie.remuneration.ecrire'],
      })
    );

    ouvrirAccordeon('emp-2');

    expect(screen.getByTestId('primes-contractuelles-emp-2')).toBeTruthy();
    expect(screen.getByTestId('ajouter-ligne')).toBeTruthy();
    expect(screen.queryByTestId(/ligne-pc-/)).toBeNull();
  });

  it('PC12 — rubrique absente quand la cle primesContractuelles manque de l emploi', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiBase('emp-1', { sansPrimes: true })],
        operations: ['salarie.lire'],
      })
    );

    ouvrirAccordeon('emp-1');

    expect(screen.queryByTestId('primes-contractuelles-emp-1')).toBeNull();
    expect(screen.queryByText('Primes contractuelles')).toBeNull();
  });

  it('PC13 — lecture seule sans bouton Ajouter ni Supprimer', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiBase('emp-1')],
        operations: ['salarie.lire', 'salarie.remuneration.lire'],
      })
    );

    ouvrirAccordeon('emp-1');

    expect(screen.getByText('Indemnité de transport')).toBeTruthy();
    expect(screen.queryByTestId('ajouter-ligne')).toBeNull();
    expect(screen.queryByTestId('supprimer-pc-transport')).toBeNull();
  });

  it('PC14 — refus metier 400 affiche le message serveur', async () => {
    modifierPrimeContractuelle.mockRejectedValueOnce(
      new AppelApiEchoue(400, {
        code: 'MOIS_INVALIDE',
        message: 'Au moins un mois d’application est requis.',
        champ: 'moisApplication',
      })
    );

    render(
      createElement(HarnessRubriqueSeule, {
        emploi: emploiBase('emp-1'),
        operations: ['salarie.lire', 'salarie.remuneration.lire', 'salarie.remuneration.ecrire'],
      })
    );

    fireEvent.click(screen.getByTestId('ligne-pc-transport'));
    const formulaire = screen.getByTestId('formulaire-pc-transport');
    fireEvent.click(within(formulaire).getByLabelText('Décembre'));
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));

    const boutonEnregistrer = screen.getByRole('button', { name: 'Enregistrer' });
    await waitFor(() => expect(boutonEnregistrer.hasAttribute('disabled')).toBe(false));
    fireEvent.click(boutonEnregistrer);

    await waitFor(() =>
      expect(screen.getByText('Au moins un mois d’application est requis.')).toBeTruthy()
    );
  });

  it('PC15 — enregistrement conjoint contrat et prime propage le contrat mis a jour', async () => {
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
    modifierPrimeContractuelle.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 9,
        contrat: { ...emploi.contrat, libellePoste: 'Directeur paie' },
        primesContractuelles: [prime({ id: 'pc-transport', moisApplication: [6] })],
      },
      alertes: [],
    });

    render(
      createElement(Harness, {
        emploisInitiaux: [emploi],
        operations: ['salarie.lire', 'salarie.remuneration.lire', 'salarie.remuneration.ecrire'],
        onEmploisChangeCapture: (prochains) => {
          historiqueEmplois.push(prochains.map((e) => structuredClone(e)));
        },
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.change(screen.getByLabelText('Libellé du poste'), {
      target: { value: 'Directeur paie' },
    });
    fireEvent.click(screen.getByTestId('ligne-pc-transport'));
    const formulaire = screen.getByTestId('formulaire-pc-transport');
    fireEvent.click(within(formulaire).getByLabelText('Décembre'));
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));

    const boutonEnregistrer = screen.getByRole('button', { name: 'Enregistrer' });
    await waitFor(() => expect(boutonEnregistrer.hasAttribute('disabled')).toBe(false));
    fireEvent.click(boutonEnregistrer);

    await waitFor(() => expect(modifierContratEmploi).toHaveBeenCalled());
    await waitFor(() => expect(modifierPrimeContractuelle).toHaveBeenCalled());

    expect(modifierPrimeContractuelle).toHaveBeenCalledWith(
      'soc-test',
      'emp-1',
      'pc-transport',
      8,
      expect.objectContaining({ moisApplication: [6] })
    );

    const dernierEmploi = historiqueEmplois.at(-1)?.[0];
    expect(dernierEmploi?.contrat.libellePoste).toBe('Directeur paie');
    expect(dernierEmploi?.version).toBe(9);
  });

  it('PC16 — suppression immediate remonte les valeurs enregistrees de la ligne A modifiee localement', async () => {
    const emploi = emploiBase('emp-1', { version: 4 });
    const historiqueEmplois: EmploiFiche[][] = [];

    supprimerPrimeContractuelle.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 5,
        primesContractuelles: [
          prime({ id: 'pc-transport', primeRef: 'A15', moisApplication: [6, 12] }),
        ],
      },
      alertes: [],
    });

    render(
      createElement(Harness, {
        emploisInitiaux: [emploi],
        operations: ['salarie.lire', 'salarie.remuneration.lire', 'salarie.remuneration.ecrire'],
        onEmploisChangeCapture: (prochains) => {
          historiqueEmplois.push(prochains.map((e) => structuredClone(e)));
        },
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.click(screen.getByTestId('ligne-pc-tous'));
    const formulaire = screen.getByTestId('formulaire-pc-tous');
    fireEvent.click(within(formulaire).getByLabelText('Janvier'));
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));

    fireEvent.click(screen.getByTestId('supprimer-pc-vide'));
    await waitFor(() =>
      expect(screen.getByTestId('dialogue-suppression-differee-titre').textContent).toContain(
        'Indemnité de représentation'
      )
    );
    fireEvent.click(screen.getByTestId('dialogue-suppression-differee-confirmer'));

    await waitFor(() => expect(supprimerPrimeContractuelle).toHaveBeenCalled());

    const dernierEmploi = historiqueEmplois.at(-1)?.[0];
    const tousParent = dernierEmploi?.primesContractuelles?.find((l) => l.id === 'pc-tous');
    expect(tousParent?.moisApplication.length).toBe(12);
    expect(dernierEmploi?.primesContractuelles?.some((l) => l.id === 'pc-vide')).toBe(false);

    expect(screen.getByTestId('ligne-pc-tous').textContent).not.toContain('Tous les mois');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Enregistrer' }).hasAttribute('disabled')).toBe(
        false
      )
    );
  });

  it('PC17 — creer puis modifier envoie le PATCH sur l identifiant serveur', async () => {
    const emploi = emploiBase('emp-1', {
      version: 5,
      primesContractuelles: [prime({ id: 'pc-transport' })],
    });
    creerPrimeContractuelle.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 6,
        primesContractuelles: [
          prime({ id: 'pc-transport' }),
          prime({
            id: 'pc-serveur-42',
            primeRef: 'A04',
            moisApplication: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          }),
        ],
      },
      alertes: [],
    });
    modifierPrimeContractuelle.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 7,
        primesContractuelles: [
          prime({ id: 'pc-transport' }),
          prime({
            id: 'pc-serveur-42',
            primeRef: 'A24',
            moisApplication: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          }),
        ],
      },
      alertes: [],
    });

    render(
      createElement(Harness, {
        emploisInitiaux: [emploi],
        operations: ['salarie.lire', 'salarie.remuneration.lire', 'salarie.remuneration.ecrire'],
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    const formulaireCreation = screen.getByTestId(/formulaire-local-/);
    fireEvent.click(within(formulaireCreation).getByLabelText('Tous les mois'));
    fireEvent.click(within(formulaireCreation).getByTestId('valider-ligne'));

    const boutonEnregistrer = screen.getByRole('button', { name: 'Enregistrer' });
    await waitFor(() => expect(boutonEnregistrer.hasAttribute('disabled')).toBe(false));
    fireEvent.click(boutonEnregistrer);
    await waitFor(() => expect(creerPrimeContractuelle).toHaveBeenCalled());

    fireEvent.click(screen.getByTestId('ligne-pc-serveur-42'));
    const formulaireModification = screen.getByTestId('formulaire-pc-serveur-42');
    fireEvent.change(within(formulaireModification).getByLabelText('Prime'), {
      target: { value: 'A24' },
    });
    fireEvent.click(within(formulaireModification).getByTestId('valider-ligne'));

    await waitFor(() => expect(boutonEnregistrer.hasAttribute('disabled')).toBe(false));
    fireEvent.click(boutonEnregistrer);

    await waitFor(() =>
      expect(modifierPrimeContractuelle).toHaveBeenCalledWith(
        'soc-test',
        'emp-1',
        'pc-serveur-42',
        6,
        expect.objectContaining({ primeRef: 'A24' })
      )
    );
  });

  it('PC18 — creer puis supprimer immediatement vise l identifiant serveur', async () => {
    const emploi = emploiBase('emp-1', {
      version: 5,
      primesContractuelles: [prime({ id: 'pc-transport' })],
    });
    creerPrimeContractuelle.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 6,
        primesContractuelles: [
          prime({ id: 'pc-transport' }),
          prime({
            id: 'pc-serveur-99',
            primeRef: 'A04',
            moisApplication: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          }),
        ],
      },
      alertes: [],
    });
    supprimerPrimeContractuelle.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 7,
        primesContractuelles: [prime({ id: 'pc-transport' })],
      },
      alertes: [],
    });

    render(
      createElement(Harness, {
        emploisInitiaux: [emploi],
        operations: ['salarie.lire', 'salarie.remuneration.lire', 'salarie.remuneration.ecrire'],
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    const formulaireCreation = screen.getByTestId(/formulaire-local-/);
    fireEvent.click(within(formulaireCreation).getByLabelText('Tous les mois'));
    fireEvent.click(within(formulaireCreation).getByTestId('valider-ligne'));

    const boutonEnregistrer = screen.getByRole('button', { name: 'Enregistrer' });
    await waitFor(() => expect(boutonEnregistrer.hasAttribute('disabled')).toBe(false));
    fireEvent.click(boutonEnregistrer);
    await waitFor(() => expect(creerPrimeContractuelle).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId('ligne-pc-serveur-99')).toBeTruthy());

    fireEvent.click(screen.getByTestId('supprimer-pc-serveur-99'));
    await waitFor(() =>
      expect(screen.getByTestId('dialogue-suppression-differee-titre')).toBeTruthy()
    );
    fireEvent.click(screen.getByTestId('dialogue-suppression-differee-confirmer'));

    await waitFor(() =>
      expect(supprimerPrimeContractuelle).toHaveBeenCalledWith(
        'soc-test',
        'emp-1',
        'pc-serveur-99',
        6
      )
    );
  });

  it('PC19 — deux fois la meme prime : affichage et enregistrement sans avertissement', async () => {
    const emploi = emploiBase('emp-1', {
      version: 3,
      primesContractuelles: [
        prime({ id: 'pc-a', primeRef: 'A15', moisApplication: [1] }),
        prime({ id: 'pc-b', primeRef: 'A15', moisApplication: [2] }),
      ],
    });
    modifierPrimeContractuelle.mockResolvedValue({
      donnees: { ...emploi, version: 4, primesContractuelles: emploi.primesContractuelles },
      alertes: [],
    });

    render(
      createElement(HarnessRubriqueSeule, {
        emploi,
        operations: ['salarie.lire', 'salarie.remuneration.lire', 'salarie.remuneration.ecrire'],
      })
    );

    expect(screen.getAllByText('Indemnité de transport').length).toBe(2);
    expect(screen.queryByText(/avertissement/i)).toBeNull();

    fireEvent.click(screen.getByTestId('ligne-pc-a'));
    fireEvent.click(within(screen.getByTestId('formulaire-pc-a')).getByLabelText('Mars'));
    fireEvent.click(within(screen.getByTestId('formulaire-pc-a')).getByTestId('valider-ligne'));

    const boutonEnregistrer = screen.getByRole('button', { name: 'Enregistrer' });
    await waitFor(() => expect(boutonEnregistrer.hasAttribute('disabled')).toBe(false));
    fireEvent.click(boutonEnregistrer);

    await waitFor(() => expect(modifierPrimeContractuelle).toHaveBeenCalled());
  });
});
