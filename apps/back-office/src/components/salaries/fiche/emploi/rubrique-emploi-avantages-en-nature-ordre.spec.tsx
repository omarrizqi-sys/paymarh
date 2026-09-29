// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { createElement, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EmploiFiche, Permission } from '@paymarh/shared-types';
import { NavigationGardeeTestProvider } from '@/test/navigation-gardee-test';
import { RegistreFicheProvider } from '../registre-fiche-provider';
import { FormulaireTableauProvider } from '../contexte-formulaire-tableau';
import { BlocEmplois } from '../bloc-emplois';
vi.mock('@/lib/api/emplois', () => ({
  modifierContratEmploi: vi.fn(),
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

const TYPES_CONTRAT = [
  { id: 'tc-1', ordre: 1, code: 'CDI', libelle: 'Contrat à durée indéterminée' },
] as const;

const MOTIFS_SORTIE = [{ id: 'ms-1', ordre: 1, code: 'DEMISSION', libelle: 'Démission' }] as const;

const ETABLISSEMENTS = [{ id: 'etab-1', nom: 'Siège Casablanca' } as never];

function emploiAvecAvantages(id: string): EmploiFiche {
  return {
    id,
    version: 3,
    numeroOrdre: 1,
    contrat: {
      libellePoste: 'Responsable paie',
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
    resolutions: {
      dureeContractuelle: null,
      reposHebdomadaire: null,
      teletravailAutorise: null,
      grilleHoraire: null,
      joursFeriesTravailles: null,
    },
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
    avantagesEnNature: [
      {
        id: 'av-1',
        natureRef: 'B02',
        montant: '3500.00',
        moisApplication: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        moisEffetDebut: '2022-03',
        moisEffetFin: null,
        etat: 'ACTIVE',
      },
    ],
  };
}

describe('Rubrique emploi — ordre registre avantages en nature', () => {
  afterEach(() => cleanup());

  it('ORD-AN01 — montage avec registre exige avantages-en-nature dans ORDRE_RUBRIQUES_EMPLOI', () => {
    const emploi = emploiAvecAvantages('emp-1');
    const operations: readonly Permission[] = [
      'salarie.lire',
      'salarie.remuneration.lire',
      'salarie.remuneration.ecrire',
    ];

    function Harness() {
      const [emplois, setEmplois] = useState([emploi]);
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
              emplois: emplois.map((e) => ({
                id: e.id,
                libellePoste: e.contrat.libellePoste,
                version: e.version,
              })),
              onRechargerServeur: vi.fn(async () => undefined),
            },
            createElement(BlocEmplois, {
              companyId: 'soc-test',
              emplois,
              operations,
              typesContrat: TYPES_CONTRAT,
              motifsSortie: MOTIFS_SORTIE,
              etablissements: ETABLISSEMENTS,
              banques: [],
              comptesBancaires: [],
              naturesAvantageEnNature: [
                { id: 'n1', ordre: 1, code: 'B02', libelle: 'Voiture de fonction' },
              ],
              onEmploisChange: (maj) => {
                setEmplois((prev) => [...(typeof maj === 'function' ? maj(prev) : maj)]);
              },
            })
          )
        )
      );
    }

    render(createElement(Harness));
    expect(screen.getByTestId('avantages-en-nature-emp-1')).toBeTruthy();
  });
});
