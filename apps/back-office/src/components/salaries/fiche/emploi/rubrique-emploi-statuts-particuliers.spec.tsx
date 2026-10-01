// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createElement, useState, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  EmploiFiche,
  Permission,
  StatutParticulier,
  StatutParticulierFiche,
} from '@paymarh/shared-types';
import { AppelApiEchoue } from '@/lib/api/client';
import { LienGarde } from '@/components/navigation/navigation-gardee';
import { useDeclarerSaisiePerdable } from '@/components/navigation/saisie-perdable-racine';
import { NavigationGardeeTestProvider } from '@/test/navigation-gardee-test';
import { RegistreFicheProvider, useRegistreFiche } from '../registre-fiche-provider';
import { FormulaireTableauProvider } from '../contexte-formulaire-tableau';
import { RailActionsFiche } from '../rail-actions-fiche';
import { BlocEmplois } from '../bloc-emplois';
import { RubriqueEmploiStatutsParticuliers } from './rubrique-emploi-statuts-particuliers';
import { reinitialiserCompteurIdLocal } from '@/lib/fiche/statuts-particuliers-lignes';
import {
  OPERATIONS_SALARIE_COMPLET,
  avecOperationsEmploi,
} from '@/test/operations-harnais-fiche-emploi';

const STATUTS: readonly StatutParticulier[] = [
  { id: 'st-ref-1', ordre: 1, code: 'IDMAJ', libelle: 'IDMAJ — ANAPEC' },
];

const TYPES_CONTRAT = [
  { id: 'tc-1', ordre: 1, code: 'CDI', libelle: 'Contrat à durée indéterminée' },
] as const;

const MOTIFS_SORTIE = [{ id: 'ms-1', ordre: 1, code: 'DEMISSION', libelle: 'Démission' }] as const;

const ETABLISSEMENTS = [{ id: 'etab-1', nom: 'Siège Casablanca' } as never];

const {
  creerStatutParticulier,
  modifierStatutParticulier,
  impactSuppressionStatutParticulier,
  supprimerStatutParticulier,
  modifierContratEmploi,
} = vi.hoisted(() => ({
  creerStatutParticulier: vi.fn(),
  modifierStatutParticulier: vi.fn(),
  impactSuppressionStatutParticulier: vi.fn(),
  supprimerStatutParticulier: vi.fn(),
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
  creerStatutParticulier: (...args: unknown[]) => creerStatutParticulier(...args),
  modifierStatutParticulier: (...args: unknown[]) => modifierStatutParticulier(...args),
  impactSuppressionStatutParticulier: (...args: unknown[]) =>
    impactSuppressionStatutParticulier(...args),
  supprimerStatutParticulier: (...args: unknown[]) => supprimerStatutParticulier(...args),
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

function ligneStatut(surcharges: Partial<StatutParticulierFiche> = {}): StatutParticulierFiche {
  return {
    id: 'st-1',
    statutCode: 'IDMAJ',
    dateDebut: '2021-06-01',
    dateFin: '2022-12-31',
    origine: 'SAISIE_MANUELLE',
    etat: 'CLOTUREE',
    ...surcharges,
  };
}

function emploiYoussef(
  id: string,
  surcharges: {
    readonly version?: number;
    readonly libellePoste?: string;
    readonly statutsParticuliers?: readonly StatutParticulierFiche[];
    readonly sansRemuneration?: boolean;
    readonly operationsEmploi?: readonly Permission[];
  } = {}
): EmploiFiche {
  const statuts = surcharges.statutsParticuliers ?? [
    ligneStatut({
      id: 'st-idmaj-cloture',
      dateDebut: '2021-06-01',
      dateFin: '2022-12-31',
      etat: 'CLOTUREE',
    }),
    ligneStatut({
      id: 'st-idmaj-futur',
      dateDebut: '2023-01-01',
      dateFin: null,
      etat: 'PAS_ENCORE_EFFECTIVE',
    }),
    ligneStatut({
      id: 'st-tahfiz-propage',
      statutCode: 'TAHFIZ',
      dateDebut: '2025-07-01',
      dateFin: null,
      origine: 'PROPAGE_SOCIETE',
      etat: 'PAS_ENCORE_EFFECTIVE',
    }),
  ];

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
    statutsParticuliers: statuts,
    resolutions: resolutionsVides(),
  };

  const operationsEmploi = surcharges.operationsEmploi ?? (['emploi.modifier'] as const);

  if (surcharges.sansRemuneration) {
    return avecOperationsEmploi(base, operationsEmploi);
  }

  return avecOperationsEmploi(
    {
      ...base,
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
      primesContractuelles: [],
      avantagesEnNature: [],
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
          naturesAvantageEnNature: [],
          primesReferentiel: [],
          statutsParticuliersReferentiel: STATUTS,
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
        createElement(RubriqueEmploiStatutsParticuliers, {
          companyId: 'soc-test',
          emploi: courant,
          lignesServeur: courant.statutsParticuliers,
          statutsReferentiel: STATUTS,
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

function ouvrirAccordeon(emploiId: string) {
  const corps = screen.getByTestId(`accordeon-emploi-corps-${emploiId}`);
  if (corps.classList.contains('hidden')) {
    fireEvent.click(screen.getByTestId(`accordeon-emploi-entete-${emploiId}`));
  }
}

describe('Rubrique emploi — Statuts particuliers', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    reinitialiserCompteurIdLocal();
    creerStatutParticulier.mockReset();
    modifierStatutParticulier.mockReset();
    impactSuppressionStatutParticulier.mockReset();
    supprimerStatutParticulier.mockReset();
    modifierContratEmploi.mockReset();
  });

  it('SP01 — deux lignes IDMAJ visibles, ligne propagee absente du DOM', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiYoussef('emp-1')],
        operations: OPERATIONS_SALARIE_COMPLET,
      })
    );

    ouvrirAccordeon('emp-1');

    expect(screen.getAllByText('IDMAJ — ANAPEC')).toHaveLength(2);
    expect(screen.queryByText('TAHFIZ')).toBeNull();
    expect(screen.queryByTestId('ligne-st-tahfiz-propage')).toBeNull();
  });

  it('SP03 — seule ligne propagee : en-tete et Ajouter sans ligne affichee', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [
          emploiYoussef('emp-2', {
            statutsParticuliers: [
              ligneStatut({
                id: 'st-propage-seul',
                statutCode: 'TAHFIZ',
                origine: 'PROPAGE_SOCIETE',
                dateDebut: '2025-07-01',
              }),
            ],
          }),
        ],
        operations: OPERATIONS_SALARIE_COMPLET,
      })
    );

    ouvrirAccordeon('emp-2');

    expect(screen.getByTestId('statuts-particuliers-emp-2')).toBeTruthy();
    expect(screen.getByTestId('ajouter-ligne')).toBeTruthy();
    expect(screen.queryByTestId(/ligne-st-/)).toBeNull();
  });

  it('SP04 — dates au format JJ/MM/AAAA et fin vide sans tiret', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiYoussef('emp-1')],
        operations: OPERATIONS_SALARIE_COMPLET,
      })
    );

    ouvrirAccordeon('emp-1');

    const cloturee = screen.getByTestId('ligne-st-idmaj-cloture');
    expect(cloturee.textContent).toContain('01/06/2021');
    expect(cloturee.textContent).toContain('31/12/2022');

    const future = screen.getByTestId('ligne-st-idmaj-futur');
    expect(future.textContent).toContain('01/01/2023');
    expect(future.textContent).not.toMatch(/01\/01\/2023.*—/);
  });

  it('SP05 — ligne CLOTUREE grisee, inactive depuis, lecture seule sans Supprimer', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiYoussef('emp-1')],
        operations: OPERATIONS_SALARIE_COMPLET,
      })
    );

    ouvrirAccordeon('emp-1');

    expect(screen.getByTestId('etat-ligne-st-idmaj-cloture').textContent).toBe(
      'inactive depuis 12/2022'
    );
    expect(screen.getByTestId('ligne-st-idmaj-cloture').classList.contains('opacity-60')).toBe(
      true
    );

    fireEvent.click(screen.getByTestId('ligne-st-idmaj-cloture'));
    expect(screen.getByTestId('formulaire-lecture-seule')).toBeTruthy();
    expect(screen.queryByTestId('supprimer-st-idmaj-cloture')).toBeNull();
  });

  it('SP06 — ligne PAS_ENCORE_EFFECTIVE sans mention et modifiable', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiYoussef('emp-1')],
        operations: OPERATIONS_SALARIE_COMPLET,
      })
    );

    ouvrirAccordeon('emp-1');

    expect(screen.queryByTestId('etat-ligne-st-idmaj-futur')).toBeNull();
    expect(screen.getByTestId('supprimer-st-idmaj-futur')).toBeTruthy();
  });

  it('SP07 — validation locale sans appel serveur et rail actif', () => {
    render(
      createElement(HarnessRubriqueSeule, {
        emploi: emploiYoussef('emp-1'),
      })
    );

    fireEvent.click(screen.getByTestId('ligne-st-idmaj-futur'));
    const formulaire = screen.getByTestId('formulaire-st-idmaj-futur');
    fireEvent.change(within(formulaire).getByLabelText('Date de début'), {
      target: { value: '2023-02-01' },
    });
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));

    expect(modifierStatutParticulier).not.toHaveBeenCalled();
    expect(screen.getByTestId('ligne-st-idmaj-futur').textContent).toContain('01/02/2023');
    expect(screen.getByRole('button', { name: 'Enregistrer' }).hasAttribute('disabled')).toBe(
      false
    );
  });

  it('SP08 — enregistrer envoie la version de l emploi', async () => {
    const emploi = emploiYoussef('emp-1', { version: 7 });
    modifierStatutParticulier.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 8,
        statutsParticuliers: emploi.statutsParticuliers.map((l) =>
          l.id === 'st-idmaj-futur' ? { ...l, dateDebut: '2023-02-01' } : l
        ),
      },
      alertes: [],
    });

    render(
      createElement(HarnessRubriqueSeule, {
        emploi,
      })
    );

    fireEvent.click(screen.getByTestId('ligne-st-idmaj-futur'));
    const formulaire = screen.getByTestId('formulaire-st-idmaj-futur');
    fireEvent.change(within(formulaire).getByLabelText('Date de début'), {
      target: { value: '2023-02-01' },
    });
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));

    const boutonEnregistrer = screen.getByRole('button', { name: 'Enregistrer' });
    await waitFor(() => expect(boutonEnregistrer.hasAttribute('disabled')).toBe(false));
    fireEvent.click(boutonEnregistrer);

    await waitFor(() =>
      expect(modifierStatutParticulier).toHaveBeenCalledWith(
        'soc-test',
        'emp-1',
        'st-idmaj-futur',
        7,
        expect.objectContaining({ dateDebut: '2023-02-01' })
      )
    );
  });

  it('SP09 — vider la date de fin envoie dateFin null', async () => {
    const emploi = emploiYoussef('emp-1', {
      version: 4,
      statutsParticuliers: [
        ligneStatut({
          id: 'st-avec-fin',
          dateDebut: '2024-01-01',
          dateFin: '2024-06-30',
          etat: 'ACTIVE',
        }),
      ],
    });
    modifierStatutParticulier.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 5,
        statutsParticuliers: [
          ligneStatut({
            id: 'st-avec-fin',
            dateDebut: '2020-01-01',
            dateFin: null,
            etat: 'ACTIVE',
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

    fireEvent.click(screen.getByTestId('ligne-st-avec-fin'));
    const formulaire = screen.getByTestId('formulaire-st-avec-fin');
    fireEvent.change(within(formulaire).getByLabelText('Date de fin'), { target: { value: '' } });
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() =>
      expect(modifierStatutParticulier).toHaveBeenCalledWith(
        'soc-test',
        'emp-1',
        'st-avec-fin',
        4,
        expect.objectContaining({ dateFin: null })
      )
    );
  });

  it('SP10 — Annuler et garde nomment Statuts particuliers qualifie', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      createElement(
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
                  id: 'emp-1',
                  libellePoste: 'Responsable paie',
                  version: 5,
                },
              ],
              onRechargerServeur: vi.fn(async () => undefined),
            },
            createElement(DeclarerGarde),
            createElement(RubriqueEmploiStatutsParticuliers, {
              companyId: 'soc-test',
              emploi: emploiYoussef('emp-1'),
              lignesServeur: emploiYoussef('emp-1').statutsParticuliers,
              statutsReferentiel: STATUTS,
              operations: emploiYoussef('emp-1').operations ?? [],
              onEmploiChange: vi.fn(),
            }),
            createElement(RailActionsFiche, {
              operations: [...OPERATIONS_SALARIE_COMPLET],
              companyId: 'soc-test',
              salarieId: 'sal-test',
            }),
            createElement(LienGarde, { href: '/autre', children: 'Quitter' })
          )
        )
      )
    );

    fireEvent.click(screen.getByTestId('ligne-st-idmaj-futur'));
    const formulaire = screen.getByTestId('formulaire-st-idmaj-futur');
    fireEvent.change(within(formulaire).getByLabelText('Date de début'), {
      target: { value: '2024-01-01' },
    });
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    await waitFor(() =>
      expect(confirmSpy).toHaveBeenCalledWith(
        expect.stringContaining('Statuts particuliers — Responsable paie')
      )
    );

    fireEvent.click(screen.getByText('Quitter'));
    await waitFor(() =>
      expect(confirmSpy).toHaveBeenCalledWith(
        expect.stringContaining('Statuts particuliers — Responsable paie')
      )
    );

    confirmSpy.mockRestore();
  });

  it('SP11 — suppression avec apercu, jeton et version emploi', async () => {
    impactSuppressionStatutParticulier.mockResolvedValueOnce({
      donnees: {
        emploiId: 'emp-1',
        ligneId: 'st-idmaj-futur',
        mode: 'supprimer',
        message: 'Message serveur suppression statut.',
        jetonConfirmation: 'jeton-statut',
      },
    });
    supprimerStatutParticulier.mockResolvedValueOnce({
      donnees: {
        ...emploiYoussef('emp-1'),
        version: 6,
        statutsParticuliers: [
          ligneStatut({ id: 'st-idmaj-cloture' }),
          ligneStatut({
            id: 'st-tahfiz-propage',
            statutCode: 'TAHFIZ',
            origine: 'PROPAGE_SOCIETE',
            dateDebut: '2025-07-01',
          }),
        ],
      },
      alertes: [],
    });

    render(
      createElement(Harness, {
        emploisInitiaux: [emploiYoussef('emp-1', { version: 5 })],
        operations: OPERATIONS_SALARIE_COMPLET,
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.click(screen.getByTestId('supprimer-st-idmaj-futur'));
    await waitFor(() =>
      expect(screen.getByText('Message serveur suppression statut.')).toBeTruthy()
    );
    fireEvent.click(screen.getByTestId('confirmer-suppression-ligne'));

    await waitFor(() =>
      expect(supprimerStatutParticulier).toHaveBeenCalledWith(
        'soc-test',
        'emp-1',
        'st-idmaj-futur',
        5,
        'jeton-statut'
      )
    );
    expect(screen.queryByTestId('ligne-st-idmaj-futur')).toBeNull();
  });

  it('SP12 — suppression locale sans fenetre ni appel', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiYoussef('emp-1')],
        operations: OPERATIONS_SALARIE_COMPLET,
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.click(screen.getByTestId('ajouter-ligne'));
    const formulaire = screen.getByTestId('formulaire-local-1');
    fireEvent.change(within(formulaire).getByLabelText('Date de début'), {
      target: { value: '2026-01-01' },
    });
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));

    fireEvent.click(screen.getByTestId('supprimer-local-1'));

    expect(impactSuppressionStatutParticulier).not.toHaveBeenCalled();
    expect(supprimerStatutParticulier).not.toHaveBeenCalled();
    expect(screen.queryByTestId('ligne-local-1')).toBeNull();
  });

  it('SP13 — sans remuneration.lire : statuts present, primes et avantages absents', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiYoussef('emp-1', { sansRemuneration: true })],
        operations: OPERATIONS_SALARIE_COMPLET,
      })
    );

    ouvrirAccordeon('emp-1');

    expect(screen.getByTestId('statuts-particuliers-emp-1')).toBeTruthy();
    expect(screen.queryByTestId('primes-contractuelles-emp-1')).toBeNull();
    expect(screen.queryByTestId('avantages-en-nature-emp-1')).toBeNull();
  });

  it('SP14a — avec emploi.modifier sans salarie.remuneration.ecrire : Ajouter et depli modifiable', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiYoussef('emp-1', { operationsEmploi: ['emploi.modifier'] })],
        operations: OPERATIONS_SALARIE_COMPLET,
      })
    );

    ouvrirAccordeon('emp-1');

    const rubrique = screen.getByTestId('statuts-particuliers-emp-1');
    expect(within(rubrique).getByTestId('ajouter-ligne')).toBeTruthy();

    fireEvent.click(screen.getByTestId('ligne-st-idmaj-futur'));
    expect(screen.queryByTestId('formulaire-lecture-seule')).toBeNull();
    expect(screen.getByTestId('formulaire-st-idmaj-futur')).toBeTruthy();
    expect(
      within(screen.getByTestId('formulaire-st-idmaj-futur')).getByTestId('valider-ligne')
    ).toBeTruthy();
  });

  it('SP14b — avec salarie.remuneration.ecrire sans emploi.modifier : lecture seule', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [
          emploiYoussef('emp-1', {
            operationsEmploi: ['salarie.remuneration.lire', 'salarie.remuneration.ecrire'],
          }),
        ],
        operations: OPERATIONS_SALARIE_COMPLET,
      })
    );

    ouvrirAccordeon('emp-1');

    const rubrique = screen.getByTestId('statuts-particuliers-emp-1');
    expect(within(rubrique).queryByTestId('ajouter-ligne')).toBeNull();
    expect(within(rubrique).queryByTestId('supprimer-st-idmaj-futur')).toBeNull();

    fireEvent.click(screen.getByTestId('ligne-st-idmaj-futur'));
    expect(screen.getByTestId('formulaire-lecture-seule')).toBeTruthy();
  });

  it('SP22 — fiche sans emploi.modifier, emploi.operations avec emploi.modifier : statuts modifiables', () => {
    render(
      createElement(Harness, {
        emploisInitiaux: [emploiYoussef('emp-1', { operationsEmploi: ['emploi.modifier'] })],
        operations: OPERATIONS_SALARIE_COMPLET,
      })
    );

    ouvrirAccordeon('emp-1');

    const rubrique = screen.getByTestId('statuts-particuliers-emp-1');
    expect(within(rubrique).getByTestId('ajouter-ligne')).toBeTruthy();

    fireEvent.click(screen.getByTestId('ligne-st-idmaj-futur'));
    expect(screen.queryByTestId('formulaire-lecture-seule')).toBeNull();
    expect(screen.getByTestId('formulaire-st-idmaj-futur')).toBeTruthy();
    expect(
      within(screen.getByTestId('formulaire-st-idmaj-futur')).getByTestId('valider-ligne')
    ).toBeTruthy();
  });

  it('SP15 — refus chevauchement 400 affiche le message et conserve la saisie', async () => {
    modifierStatutParticulier.mockRejectedValueOnce(
      new AppelApiEchoue(400, {
        code: 'CHEVAUCHEMENT_STATUTS',
        message: 'Deux statuts particuliers ont des périodes qui se chevauchent.',
      })
    );

    const emploi = emploiYoussef('emp-1', {
      statutsParticuliers: [
        ligneStatut({
          id: 'st-a',
          dateDebut: '2021-01-01',
          dateFin: '2021-12-31',
          etat: 'CLOTUREE',
        }),
        ligneStatut({
          id: 'st-b',
          dateDebut: '2022-01-01',
          dateFin: null,
          etat: 'PAS_ENCORE_EFFECTIVE',
        }),
      ],
    });

    render(
      createElement(HarnessRubriqueSeule, {
        emploi,
      })
    );

    fireEvent.click(screen.getByTestId('ligne-st-b'));
    const formulaire = screen.getByTestId('formulaire-st-b');
    fireEvent.change(within(formulaire).getByLabelText('Date de début'), {
      target: { value: '2021-06-01' },
    });
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() =>
      expect(
        screen.getByText('Deux statuts particuliers ont des périodes qui se chevauchent.')
      ).toBeTruthy()
    );
    expect(screen.getByTestId('ligne-st-b').textContent).toContain('01/06/2021');
  });

  it('SP16 — apres enregistrement le parent conserve la ligne propagee', async () => {
    const emploi = emploiYoussef('emp-1', { version: 3 });
    const historique: EmploiFiche[][] = [];

    modifierStatutParticulier.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 4,
        statutsParticuliers: emploi.statutsParticuliers.map((l) =>
          l.id === 'st-idmaj-futur' ? { ...l, dateDebut: '2023-03-01' } : l
        ),
      },
      alertes: [],
    });

    render(
      createElement(Harness, {
        emploisInitiaux: [emploi],
        operations: OPERATIONS_SALARIE_COMPLET,
        onEmploisChangeCapture: (e) => historique.push(e.map((x) => structuredClone(x))),
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.click(screen.getByTestId('ligne-st-idmaj-futur'));
    const formulaire = screen.getByTestId('formulaire-st-idmaj-futur');
    fireEvent.change(within(formulaire).getByLabelText('Date de début'), {
      target: { value: '2023-03-01' },
    });
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(modifierStatutParticulier).toHaveBeenCalled());

    const parent = historique.at(-1)?.[0];
    expect(parent?.statutsParticuliers.some((l) => l.id === 'st-tahfiz-propage')).toBe(true);
    expect(parent?.statutsParticuliers.find((l) => l.id === 'st-tahfiz-propage')?.origine).toBe(
      'PROPAGE_SOCIETE'
    );
  });

  it('SP17 — enregistrement conjoint contrat et statuts avec versions en chaine', async () => {
    const emploi = emploiYoussef('emp-1', { version: 7 });
    const historique: EmploiFiche[][] = [];

    modifierContratEmploi.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 8,
        contrat: { ...emploi.contrat, libellePoste: 'Directeur paie' },
      },
      alertes: [],
    });
    modifierStatutParticulier.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 9,
        contrat: { ...emploi.contrat, libellePoste: 'Directeur paie' },
        statutsParticuliers: emploi.statutsParticuliers.map((l) =>
          l.id === 'st-idmaj-futur' ? { ...l, dateDebut: '2023-04-01' } : l
        ),
      },
      alertes: [],
    });

    render(
      createElement(Harness, {
        emploisInitiaux: [emploi],
        operations: OPERATIONS_SALARIE_COMPLET,
        onEmploisChangeCapture: (e) => historique.push(e.map((x) => structuredClone(x))),
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.change(screen.getByLabelText('Libellé du poste'), {
      target: { value: 'Directeur paie' },
    });
    fireEvent.click(screen.getByTestId('ligne-st-idmaj-futur'));
    const formulaire = screen.getByTestId('formulaire-st-idmaj-futur');
    fireEvent.change(within(formulaire).getByLabelText('Date de début'), {
      target: { value: '2023-04-01' },
    });
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(modifierContratEmploi).toHaveBeenCalled());
    await waitFor(() => expect(modifierStatutParticulier).toHaveBeenCalled());

    expect(modifierStatutParticulier).toHaveBeenCalledWith(
      'soc-test',
      'emp-1',
      'st-idmaj-futur',
      8,
      expect.objectContaining({ dateDebut: '2023-04-01' })
    );

    const parent = historique.at(-1)?.[0];
    expect(parent?.contrat.libellePoste).toBe('Directeur paie');
    expect(parent?.version).toBe(9);
  });

  it('SP18 — ligne A modifiee localement, suppression de B : parent garde A enregistree', async () => {
    const emploi = emploiYoussef('emp-1', {
      version: 4,
      statutsParticuliers: [
        ligneStatut({
          id: 'st-a',
          dateDebut: '2022-01-01',
          dateFin: null,
          etat: 'ACTIVE',
        }),
        ligneStatut({
          id: 'st-b',
          dateDebut: '2022-06-01',
          dateFin: null,
          etat: 'ACTIVE',
        }),
        ligneStatut({
          id: 'st-tahfiz-propage',
          statutCode: 'TAHFIZ',
          origine: 'PROPAGE_SOCIETE',
          dateDebut: '2025-07-01',
        }),
      ],
    });
    const historique: EmploiFiche[][] = [];

    impactSuppressionStatutParticulier.mockResolvedValueOnce({
      donnees: {
        emploiId: 'emp-1',
        ligneId: 'st-b',
        mode: 'supprimer',
        message: 'Suppression B.',
        jetonConfirmation: 'jeton-b',
      },
    });
    supprimerStatutParticulier.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 5,
        statutsParticuliers: [
          ligneStatut({ id: 'st-a', dateDebut: '2022-01-01', dateFin: null, etat: 'ACTIVE' }),
          ligneStatut({
            id: 'st-tahfiz-propage',
            statutCode: 'TAHFIZ',
            origine: 'PROPAGE_SOCIETE',
            dateDebut: '2025-07-01',
          }),
        ],
      },
      alertes: [],
    });

    render(
      createElement(Harness, {
        emploisInitiaux: [emploi],
        operations: OPERATIONS_SALARIE_COMPLET,
        onEmploisChangeCapture: (e) => historique.push(e.map((x) => structuredClone(x))),
      })
    );

    ouvrirAccordeon('emp-1');
    fireEvent.click(screen.getByTestId('ligne-st-a'));
    const formulaire = screen.getByTestId('formulaire-st-a');
    fireEvent.change(within(formulaire).getByLabelText('Date de début'), {
      target: { value: '2022-03-01' },
    });
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));

    fireEvent.click(screen.getByTestId('supprimer-st-b'));
    await waitFor(() => expect(screen.getByText('Suppression B.')).toBeTruthy());
    fireEvent.click(screen.getByTestId('confirmer-suppression-ligne'));

    await waitFor(() => expect(supprimerStatutParticulier).toHaveBeenCalled());

    const parent = historique.at(-1)?.[0];
    const ligneAParent = parent?.statutsParticuliers.find((l) => l.id === 'st-a');
    expect(ligneAParent?.dateDebut).toBe('2022-01-01');

    expect(screen.getByTestId('ligne-st-a').textContent).toContain('01/03/2022');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Enregistrer' }).hasAttribute('disabled')).toBe(
        false
      )
    );
  });

  it('SP19 — creer puis modifier vise l identifiant serveur', async () => {
    const emploi = emploiYoussef('emp-1', { version: 5, statutsParticuliers: [] });
    creerStatutParticulier.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 6,
        statutsParticuliers: [
          ligneStatut({
            id: 'st-serveur-42',
            dateDebut: '2024-01-01',
            dateFin: null,
            etat: 'ACTIVE',
          }),
        ],
      },
      alertes: [],
    });
    modifierStatutParticulier.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 7,
        statutsParticuliers: [
          ligneStatut({
            id: 'st-serveur-42',
            dateDebut: '2024-02-01',
            dateFin: null,
            etat: 'ACTIVE',
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
    fireEvent.change(within(formulaireCreation).getByLabelText('Date de début'), {
      target: { value: '2024-01-01' },
    });
    fireEvent.click(within(formulaireCreation).getByTestId('valider-ligne'));

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(creerStatutParticulier).toHaveBeenCalled());

    fireEvent.click(screen.getByTestId('ligne-st-serveur-42'));
    const formulaireModif = screen.getByTestId('formulaire-st-serveur-42');
    fireEvent.change(within(formulaireModif).getByLabelText('Date de début'), {
      target: { value: '2024-02-01' },
    });
    fireEvent.click(within(formulaireModif).getByTestId('valider-ligne'));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() =>
      expect(modifierStatutParticulier).toHaveBeenCalledWith(
        'soc-test',
        'emp-1',
        'st-serveur-42',
        6,
        expect.objectContaining({ dateDebut: '2024-02-01' })
      )
    );
  });

  it('SP20 — creer puis supprimer vise l identifiant serveur', async () => {
    const emploi = emploiYoussef('emp-1', { version: 5, statutsParticuliers: [] });
    creerStatutParticulier.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 6,
        statutsParticuliers: [
          ligneStatut({
            id: 'st-serveur-99',
            dateDebut: '2024-03-01',
            dateFin: null,
            etat: 'ACTIVE',
          }),
        ],
      },
      alertes: [],
    });
    impactSuppressionStatutParticulier.mockResolvedValueOnce({
      donnees: {
        emploiId: 'emp-1',
        ligneId: 'st-serveur-99',
        mode: 'supprimer',
        message: 'Suppression nouvelle ligne.',
        jetonConfirmation: 'jeton-nouveau',
      },
    });
    supprimerStatutParticulier.mockResolvedValueOnce({
      donnees: { ...emploi, version: 7, statutsParticuliers: [] },
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
    fireEvent.change(within(formulaireCreation).getByLabelText('Date de début'), {
      target: { value: '2024-03-01' },
    });
    fireEvent.click(within(formulaireCreation).getByTestId('valider-ligne'));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(creerStatutParticulier).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId('ligne-st-serveur-99')).toBeTruthy());

    fireEvent.click(screen.getByTestId('supprimer-st-serveur-99'));
    await waitFor(() => expect(screen.getByText('Suppression nouvelle ligne.')).toBeTruthy());
    expect(impactSuppressionStatutParticulier).toHaveBeenCalledWith(
      'soc-test',
      'emp-1',
      'st-serveur-99'
    );

    fireEvent.click(screen.getByTestId('confirmer-suppression-ligne'));
    await waitFor(() =>
      expect(supprimerStatutParticulier).toHaveBeenCalledWith(
        'soc-test',
        'emp-1',
        'st-serveur-99',
        6,
        'jeton-nouveau'
      )
    );
  });
});
