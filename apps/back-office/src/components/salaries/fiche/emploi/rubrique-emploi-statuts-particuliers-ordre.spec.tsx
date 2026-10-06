// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { createElement, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EmploiFiche, Permission } from '@paymarh/shared-types';
import { NavigationGardeeTestProvider } from '@/test/navigation-gardee-test';
import { RegistreFicheProvider } from '../registre-fiche-provider';
import { FormulaireTableauProvider } from '../contexte-formulaire-tableau';
import {
  OPERATIONS_EMPLOI_COMPLET,
  OPERATIONS_SALARIE_COMPLET,
  avecOperationsEmploi,
} from '@/test/operations-harnais-fiche-emploi';
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

const TYPES_CONTRAT = [
  { id: 'tc-1', ordre: 1, code: 'CDI', libelle: 'Contrat à durée indéterminée' },
  { id: 'tc-7', ordre: 7, code: 'INSERTION', libelle: 'Contrat d’insertion' },
] as const;

const MOTIFS_SORTIE = [{ id: 'ms-1', ordre: 1, code: 'DEMISSION', libelle: 'Démission' }] as const;

const ETABLISSEMENTS = [{ id: 'etab-1', nom: 'Siège Casablanca' } as never];

function emploiAvecStatuts(id: string): EmploiFiche {
  return {
    id,
    version: 3,
    numeroOrdre: 1,
    contrat: {
      libellePoste: 'Responsable paie',
      dateDebut: '2022-03-01',
      dateFin: null,
      typeContratCode: 'INSERTION',
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
    statutsParticuliers: [
      {
        id: 'st-1',
        statutCode: 'IDMAJ',
        dateDebut: '2021-06-01',
        dateFin: null,
        origine: 'SAISIE_MANUELLE',
        etat: 'ACTIVE',
      },
    ],
    resolutions: {
      dureeContractuelle: null,
      reposHebdomadaire: null,
      teletravailAutorise: null,
      grilleHoraire: null,
      joursFeriesTravailles: null,
    },
  };
}

describe('Rubrique emploi — ordre registre statuts particuliers', () => {
  afterEach(() => cleanup());

  it('SP21 — montage avec registre exige statuts-particuliers dans ORDRE_RUBRIQUES_EMPLOI', () => {
    const emploi = avecOperationsEmploi(emploiAvecStatuts('emp-1'), OPERATIONS_EMPLOI_COMPLET);
    const operations: readonly Permission[] = [...OPERATIONS_SALARIE_COMPLET];

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
              naturesAvantageEnNature: [],
              primesReferentiel: [],
              statutsParticuliersReferentiel: [
                { id: 'st-ref', ordre: 1, code: 'IDMAJ', libelle: 'IDMAJ — ANAPEC' },
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
    expect(screen.getByTestId('statuts-particuliers-emp-1')).toBeTruthy();
  });
});
