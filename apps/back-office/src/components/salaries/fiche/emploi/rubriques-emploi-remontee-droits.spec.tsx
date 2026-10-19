// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createElement, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  EmploiFiche,
  NatureAvantageEnNature,
  Permission,
  PrimeReferentiel,
  StatutParticulier,
  StatutParticulierFiche,
} from '@paymarh/shared-types';
import { NavigationGardeeTestProvider } from '@/test/navigation-gardee-test';
import {
  OPERATIONS_EMPLOI_COMPLET,
  OPERATIONS_EMPLOI_REMUNERATION,
  OPERATIONS_EMPLOI_REMUNERATION_SANS_MODIFIER,
  OPERATIONS_SALARIE_COMPLET,
  avecOperationsEmploi,
} from '@/test/operations-harnais-fiche-emploi';
import { reponseEcritureEmploi } from '@/test/reponse-ecriture-emploi';
import { reinitialiserCompteurIdLocal } from '@/lib/fiche/statuts-particuliers-lignes';
import { RegistreFicheProvider } from '../registre-fiche-provider';
import { FormulaireTableauProvider } from '../contexte-formulaire-tableau';
import { RailActionsFiche } from '../rail-actions-fiche';
import { BlocEmplois } from '../bloc-emplois';

const {
  modifierContratEmploi,
  modifierAffectationEmploi,
  modifierRemunerationEmploi,
  creerPrimeContractuelle,
  creerStatutParticulier,
} = vi.hoisted(() => ({
  modifierContratEmploi: vi.fn(),
  modifierAffectationEmploi: vi.fn(),
  modifierRemunerationEmploi: vi.fn(),
  creerPrimeContractuelle: vi.fn(),
  creerStatutParticulier: vi.fn(),
}));

vi.mock('@/lib/api/emplois', () => ({
  modifierContratEmploi: (...args: unknown[]) => modifierContratEmploi(...args),
  modifierAffectationEmploi: (...args: unknown[]) => modifierAffectationEmploi(...args),
  modifierRemunerationEmploi: (...args: unknown[]) => modifierRemunerationEmploi(...args),
  creerAvantageEnNature: vi.fn(),
  modifierAvantageEnNature: vi.fn(),
  impactSuppressionEmploi: vi.fn(),
  supprimerEmploi: vi.fn(),
  impactSuppressionAvantageEnNature: vi.fn(),
  supprimerAvantageEnNature: vi.fn(),
  creerStatutParticulier: (...args: unknown[]) => creerStatutParticulier(...args),
  modifierStatutParticulier: vi.fn(),
  impactSuppressionStatutParticulier: vi.fn(),
  supprimerStatutParticulier: vi.fn(),
  creerPrimeContractuelle: (...args: unknown[]) => creerPrimeContractuelle(...args),
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
] as const;

const MOTIFS_SORTIE = [{ id: 'ms-1', ordre: 1, code: 'DEMISSION', libelle: 'Démission' }] as const;

const ETABLISSEMENTS = [{ id: 'etab-1', nom: 'Siège Casablanca' } as never];

const PRIMES: readonly PrimeReferentiel[] = [
  { id: 'p1', ordre: 10, code: 'A04', libelle: 'Prime de panier' },
  { id: 'p2', ordre: 20, code: 'A15', libelle: 'Indemnité de transport' },
];

const NATURES: readonly NatureAvantageEnNature[] = [
  { id: 'n2', ordre: 2, code: 'B02', libelle: 'Voiture de fonction' },
];

const STATUTS: readonly StatutParticulier[] = [
  { id: 'st-ref-1', ordre: 1, code: 'IDMAJ', libelle: 'IDMAJ — ANAPEC' },
];

const LIGNE_SAISIE: StatutParticulierFiche = {
  id: 'st-saisie',
  statutCode: 'IDMAJ',
  dateDebut: '2022-03-01',
  dateFin: '2022-12-31',
  origine: 'SAISIE_MANUELLE',
  etat: 'CLOTUREE',
};

const LIGNE_PROPAGEE_ANCIENNE: StatutParticulierFiche = {
  id: 'st-tahfiz-ancien',
  statutCode: 'TAHFIZ',
  dateDebut: '2025-01-01',
  dateFin: null,
  origine: 'PROPAGE_SOCIETE',
  etat: 'ACTIVE',
};

function emploiBase(
  surcharges: {
    readonly operationsEmploi?: readonly Permission[];
    readonly montant?: string | null;
  } = {}
): EmploiFiche {
  return avecOperationsEmploi(
    {
      id: 'emp-1',
      version: 5,
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
      remuneration: {
        modeDeterminationSalaire: 'BRUT_MENSUEL',
        montant: surcharges.montant === undefined ? '12000.00' : surcharges.montant,
        masquerNombreHeures: false,
        masquerTauxHoraire: false,
        bulletinTousLesMois: true,
        moisProduction: [],
        teletravailIndemniteVersee: null,
        teletravailMontant: null,
      },
      paiement: { modePaiement: 'VIREMENT', compteBancaireId: null },
      primesContractuelles: [{ id: 'pc-transport', primeRef: 'A15', moisApplication: [6, 12] }],
      avantagesEnNature: [
        {
          id: 'av-voiture',
          natureRef: 'B02',
          montant: '3500.00',
          moisApplication: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          moisEffetDebut: '2022-03',
          moisEffetFin: null,
          etat: 'ACTIVE',
        },
      ],
      statutsParticuliers: [LIGNE_SAISIE, LIGNE_PROPAGEE_ANCIENNE],
      resolutions: {
        dureeContractuelle: null,
        reposHebdomadaire: null,
        teletravailAutorise: null,
        grilleHoraire: null,
        joursFeriesTravailles: null,
      },
    },
    surcharges.operationsEmploi ?? OPERATIONS_EMPLOI_COMPLET
  );
}

function Harness({
  emploi,
  historique,
}: {
  readonly emploi: EmploiFiche;
  readonly historique?: EmploiFiche[][];
}) {
  const [emplois, setEmplois] = useState<EmploiFiche[]>([emploi]);

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
          operations: OPERATIONS_SALARIE_COMPLET,
          typesContrat: TYPES_CONTRAT,
          motifsSortie: MOTIFS_SORTIE,
          etablissements: ETABLISSEMENTS,
          banques: [],
          comptesBancaires: [],
          naturesAvantageEnNature: NATURES,
          primesReferentiel: PRIMES,
          statutsParticuliersReferentiel: STATUTS,
          onEmploisChange: (maj) => {
            setEmplois((prev) => {
              const copie = [...(typeof maj === 'function' ? maj(prev) : maj)];
              historique?.push(copie.map((e) => structuredClone(e)));
              return copie;
            });
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

function boutonEnregistrer(): HTMLElement {
  return screen.getByRole('button', { name: 'Enregistrer' });
}

async function enregistrer() {
  await waitFor(() => expect(boutonEnregistrer().hasAttribute('disabled')).toBe(false));
  fireEvent.click(boutonEnregistrer());
}

function rubrique(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Rubrique ${id} absente`);
  }
  return element;
}

function champsDeSaisie(conteneur: HTMLElement): Element[] {
  return Array.from(conteneur.querySelectorAll('input, select, textarea'));
}

function attendreRubriquesEmploiModifiables() {
  expect(document.getElementById('emp-1/remuneration')).toBeTruthy();
  expect(
    within(screen.getByTestId('primes-contractuelles-emp-1')).getByTestId('ajouter-ligne')
  ).toBeTruthy();
  expect(
    within(screen.getByTestId('avantages-en-nature-emp-1')).getByTestId('ajouter-ligne')
  ).toBeTruthy();
  expect(
    within(screen.getByTestId('statuts-particuliers-emp-1')).getByTestId('ajouter-ligne')
  ).toBeTruthy();
}

describe('Rubriques emploi — remontee contrat / affectation, droits, montant vidable', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    reinitialiserCompteurIdLocal();
    modifierContratEmploi.mockReset();
    modifierAffectationEmploi.mockReset();
    modifierRemunerationEmploi.mockReset();
    creerPrimeContractuelle.mockReset();
    creerStatutParticulier.mockReset();
  });

  it('RE01 — apres le PATCH contrat (reponse sans operations) remuneration affichee, primes, avantages et statuts modifiables', async () => {
    const emploi = emploiBase();
    const historique: EmploiFiche[][] = [];
    modifierContratEmploi.mockResolvedValueOnce(
      reponseEcritureEmploi(emploi, {
        version: 6,
        contrat: { ...emploi.contrat, libellePoste: 'Directeur paie' },
      })
    );

    render(createElement(Harness, { emploi, historique }));

    fireEvent.change(screen.getByLabelText('Libellé du poste'), {
      target: { value: 'Directeur paie' },
    });
    await enregistrer();

    await waitFor(() => expect(historique.at(-1)?.[0]?.version).toBe(6));
    attendreRubriquesEmploiModifiables();
  });

  it('RE02 — apres le PATCH affectation (reponse sans operations) remuneration affichee, primes, avantages et statuts modifiables', async () => {
    const emploi = emploiBase();
    const historique: EmploiFiche[][] = [];
    modifierAffectationEmploi.mockResolvedValueOnce(
      reponseEcritureEmploi(emploi, {
        version: 6,
        affectation: { ...emploi.affectation, departementRef: 'Finance' },
      })
    );

    render(createElement(Harness, { emploi, historique }));

    fireEvent.change(screen.getByLabelText('Département'), { target: { value: 'Finance' } });
    await enregistrer();

    await waitFor(() => expect(historique.at(-1)?.[0]?.version).toBe(6));
    attendreRubriquesEmploiModifiables();
  });

  it('RE03 — apres le PATCH affectation, les resolutions affichees sont celles de la reponse', async () => {
    const emploi = emploiBase();
    modifierAffectationEmploi.mockResolvedValueOnce(
      reponseEcritureEmploi(emploi, {
        version: 6,
        affectation: { ...emploi.affectation, departementRef: 'Finance' },
        resolutions: {
          ...emploi.resolutions,
          dureeContractuelle: {
            valeur: '44',
            origine: 'ETABLISSEMENT',
            libelleEntite: 'Casablanca',
          },
        },
      })
    );

    render(createElement(Harness, { emploi }));

    expect(screen.queryByTestId('emp-1-heritage-duree-contractuelle')).toBeNull();
    fireEvent.change(screen.getByLabelText('Département'), { target: { value: 'Finance' } });
    await enregistrer();

    await waitFor(() => expect(modifierAffectationEmploi).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.queryByTestId('emp-1-heritage-duree-contractuelle')?.textContent).toBe(
        '44 h — établissement Casablanca'
      )
    );
  });

  it('RE04 — apres le PATCH contrat : lignes saisies conservees, ligne non enregistree envoyee, lignes propagees de la reponse', async () => {
    const emploi = emploiBase();
    const historique: EmploiFiche[][] = [];
    const lignePropageeReponse: StatutParticulierFiche = {
      ...LIGNE_PROPAGEE_ANCIENNE,
      id: 'st-tahfiz-resynchronise',
      dateDebut: '2025-07-01',
    };
    modifierContratEmploi.mockResolvedValueOnce(
      reponseEcritureEmploi(emploi, {
        version: 6,
        contrat: { ...emploi.contrat, libellePoste: 'Directeur paie' },
        statutsParticuliers: [{ ...LIGNE_SAISIE, dateFin: '2099-12-31' }, lignePropageeReponse],
      })
    );
    creerStatutParticulier.mockImplementation(async (_c, _e, version: number) => ({
      donnees: {
        ...emploi,
        version: version + 1,
        statutsParticuliers: [
          LIGNE_SAISIE,
          lignePropageeReponse,
          {
            id: 'st-cree',
            statutCode: 'IDMAJ',
            dateDebut: '2023-01-01',
            dateFin: null,
            origine: 'SAISIE_MANUELLE',
            etat: 'ACTIVE',
          },
        ],
      },
      alertes: [],
    }));

    render(createElement(Harness, { emploi, historique }));

    fireEvent.change(screen.getByLabelText('Libellé du poste'), {
      target: { value: 'Directeur paie' },
    });
    const statuts = screen.getByTestId('statuts-particuliers-emp-1');
    fireEvent.click(within(statuts).getByTestId('ajouter-ligne'));
    const formulaire = within(statuts).getByTestId(/formulaire-local-/);
    fireEvent.change(within(formulaire).getByLabelText('Date de début'), {
      target: { value: '2023-01-01' },
    });
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));
    await enregistrer();

    await waitFor(() => expect(creerStatutParticulier).toHaveBeenCalledTimes(1));
    expect(creerStatutParticulier).toHaveBeenCalledWith(
      'soc-test',
      'emp-1',
      6,
      expect.objectContaining({ statutCode: 'IDMAJ', dateDebut: '2023-01-01' })
    );

    const apresContrat = historique.find((liste) => liste[0]?.version === 6)?.[0];
    expect(
      apresContrat?.statutsParticuliers.filter((l) => l.origine === 'PROPAGE_SOCIETE')
    ).toEqual([lignePropageeReponse]);
    expect(
      apresContrat?.statutsParticuliers.filter((l) => l.origine !== 'PROPAGE_SOCIETE')
    ).toEqual([LIGNE_SAISIE]);
  });

  it('RE05 — contrat puis prime ajoutee : la prime part une seule fois et reste modifiable', async () => {
    const emploi = emploiBase();
    const historique: EmploiFiche[][] = [];
    modifierContratEmploi.mockResolvedValueOnce(
      reponseEcritureEmploi(emploi, {
        version: 6,
        contrat: { ...emploi.contrat, libellePoste: 'Directeur paie' },
      })
    );
    creerPrimeContractuelle.mockImplementation(async (_c, _e, version: number) => ({
      donnees: {
        ...emploi,
        version: version + 1,
        primesContractuelles: [
          ...(emploi.primesContractuelles ?? []),
          {
            id: 'pc-serveur-1',
            primeRef: 'A04',
            moisApplication: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          },
        ],
      },
      alertes: [],
    }));

    render(createElement(Harness, { emploi, historique }));

    fireEvent.change(screen.getByLabelText('Libellé du poste'), {
      target: { value: 'Directeur paie' },
    });
    const primes = screen.getByTestId('primes-contractuelles-emp-1');
    fireEvent.click(within(primes).getByTestId('ajouter-ligne'));
    const formulaire = within(primes).getByTestId(/formulaire-local-/);
    fireEvent.click(within(formulaire).getByLabelText('Tous les mois'));
    fireEvent.click(within(formulaire).getByTestId('valider-ligne'));
    await enregistrer();

    await waitFor(() => expect(historique.at(-1)?.[0]?.version).toBe(7));
    await waitFor(() => expect(boutonEnregistrer().hasAttribute('disabled')).toBe(true));
    expect(creerPrimeContractuelle).toHaveBeenCalledTimes(1);
    expect(creerPrimeContractuelle).toHaveBeenCalledWith(
      'soc-test',
      'emp-1',
      6,
      expect.objectContaining({ primeRef: 'A04' })
    );

    fireEvent.click(screen.getByTestId('ligne-pc-serveur-1'));
    expect(screen.queryByTestId('formulaire-lecture-seule')).toBeNull();
    expect(
      within(screen.getByTestId('formulaire-pc-serveur-1')).getByTestId('valider-ligne')
    ).toBeTruthy();
  });

  it('DR01 — contrat sans emploi.modifier : aucun champ de saisie, valeurs affichees', () => {
    render(
      createElement(Harness, {
        emploi: emploiBase({ operationsEmploi: OPERATIONS_EMPLOI_REMUNERATION_SANS_MODIFIER }),
      })
    );

    const contrat = rubrique('emp-1/contrat');
    expect(champsDeSaisie(contrat)).toEqual([]);
    expect(within(contrat).getByTestId('emp-1-libelle-poste').textContent).toBe('Responsable paie');
    expect(within(contrat).getByTestId('emp-1-type-contrat').textContent).toBe(
      'Contrat à durée indéterminée'
    );
    expect(within(contrat).getByTestId('emp-1-date-debut').textContent).toBe('01/03/2022');
  });

  it('DR02 — affectation sans emploi.modifier : aucun champ de saisie, valeurs affichees', () => {
    render(
      createElement(Harness, {
        emploi: emploiBase({ operationsEmploi: OPERATIONS_EMPLOI_REMUNERATION_SANS_MODIFIER }),
      })
    );

    const affectation = rubrique('emp-1/affectation');
    expect(champsDeSaisie(affectation)).toEqual([]);
    expect(within(affectation).getByTestId('emp-1-etablissement').textContent).toBe(
      'Siège Casablanca'
    );
    expect(within(affectation).getByTestId('emp-1-base-saisie-duree').textContent).toBe(
      'Hebdomadaire'
    );
    expect(within(affectation).getByTestId('emp-1-suivre-jours-feries').textContent).toBe('Oui');
  });

  it('DR03 — contrat avec emploi.modifier : champs modifiables (temoin)', () => {
    render(createElement(Harness, { emploi: emploiBase() }));

    const libelle = screen.getByLabelText('Libellé du poste') as HTMLInputElement;
    expect(libelle.tagName).toBe('INPUT');
    expect(libelle.disabled).toBe(false);
    expect(screen.getByTestId('emp-1-type-contrat-select').tagName).toBe('SELECT');
    expect(champsDeSaisie(rubrique('emp-1/affectation')).length).toBeGreaterThan(0);
  });

  it('DR04 — remuneration avec salarie.remuneration.ecrire sans emploi.modifier : lecture seule', () => {
    render(
      createElement(Harness, {
        emploi: emploiBase({ operationsEmploi: OPERATIONS_EMPLOI_REMUNERATION_SANS_MODIFIER }),
      })
    );

    const montant = screen.getByTestId('emp-1-montant');
    expect(montant.tagName).toBe('P');
    expect(montant.textContent).toBe('12\u202f000,00');
    expect(
      (screen.getByLabelText('Mode de détermination du salaire') as HTMLSelectElement).disabled
    ).toBe(true);
  });

  it('DR07 — remuneration, primes et avantages avec les deux droits : modifiables (temoin)', () => {
    render(
      createElement(Harness, {
        emploi: emploiBase({ operationsEmploi: OPERATIONS_EMPLOI_REMUNERATION }),
      })
    );

    const montant = screen.getByTestId('emp-1-montant') as HTMLInputElement;
    expect(montant.tagName).toBe('INPUT');
    expect(montant.disabled).toBe(false);
    expect(
      within(screen.getByTestId('primes-contractuelles-emp-1')).getByTestId('ajouter-ligne')
    ).toBeTruthy();
    expect(
      within(screen.getByTestId('avantages-en-nature-emp-1')).getByTestId('ajouter-ligne')
    ).toBeTruthy();
  });

  it('DR08 — contrat et affectation sans emploi.modifier ne declenchent pas Enregistrer, meme apres un clic', () => {
    render(
      createElement(Harness, {
        emploi: emploiBase({ operationsEmploi: OPERATIONS_EMPLOI_REMUNERATION_SANS_MODIFIER }),
      })
    );

    expect(boutonEnregistrer().hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByTestId('emp-1-libelle-poste'));
    fireEvent.click(screen.getByTestId('emp-1-type-contrat'));
    fireEvent.click(screen.getByTestId('emp-1-etablissement'));
    fireEvent.click(screen.getByTestId('emp-1-suivre-jours-feries'));
    fireEvent.click(screen.getByText('Libellé du poste'));

    expect(boutonEnregistrer().hasAttribute('disabled')).toBe(true);
    fireEvent.click(boutonEnregistrer());
    expect(modifierContratEmploi).not.toHaveBeenCalled();
    expect(modifierAffectationEmploi).not.toHaveBeenCalled();
  });

  it('MT01 — un montant efface est envoye null', async () => {
    const emploi = emploiBase();
    modifierRemunerationEmploi.mockResolvedValueOnce(
      reponseEcritureEmploi(emploi, {
        version: 6,
        remuneration: { ...emploi.remuneration!, montant: null },
      })
    );

    render(createElement(Harness, { emploi }));

    fireEvent.change(screen.getByTestId('emp-1-montant'), { target: { value: '' } });
    await enregistrer();

    await waitFor(() => expect(modifierRemunerationEmploi).toHaveBeenCalledTimes(1));
    expect(modifierRemunerationEmploi.mock.calls[0]?.[3]).toHaveProperty('montant', null);
  });

  it('MT02 — un montant null recu s affiche comme une case vide', () => {
    render(createElement(Harness, { emploi: emploiBase({ montant: null }) }));
    const montant = screen.getByTestId('emp-1-montant') as HTMLInputElement;
    expect(montant.tagName).toBe('INPUT');
    expect(montant.value).toBe('');
    cleanup();

    render(
      createElement(Harness, {
        emploi: emploiBase({
          montant: null,
          operationsEmploi: OPERATIONS_EMPLOI_REMUNERATION_SANS_MODIFIER,
        }),
      })
    );
    const lecture = screen.getByTestId('emp-1-montant');
    expect(lecture.tagName).toBe('P');
    expect(lecture.textContent).toBe('');
  });

  it('RE07 — apres le PATCH remuneration (reponse sans operations) remuneration affichee et modifiable, contrat, affectation, primes, avantages et statuts modifiables', async () => {
    const emploi = emploiBase();
    const historique: EmploiFiche[][] = [];
    modifierRemunerationEmploi.mockResolvedValueOnce(
      reponseEcritureEmploi(emploi, {
        version: 6,
        remuneration: { ...emploi.remuneration!, montant: '15000.00' },
      })
    );

    render(createElement(Harness, { emploi, historique }));

    fireEvent.change(screen.getByTestId('emp-1-montant'), { target: { value: '15000' } });
    await enregistrer();

    await waitFor(() => expect(historique.at(-1)?.[0]?.version).toBe(6));
    const montant = screen.queryByTestId('emp-1-montant') as HTMLInputElement | null;
    expect(montant?.tagName).toBe('INPUT');
    expect(montant?.disabled).toBe(false);
    const libelle = screen.getByLabelText('Libellé du poste') as HTMLInputElement;
    expect(libelle.tagName).toBe('INPUT');
    expect(libelle.disabled).toBe(false);
    expect(champsDeSaisie(rubrique('emp-1/affectation')).length).toBeGreaterThan(0);
    attendreRubriquesEmploiModifiables();
  });

  it('DT01 — une date du contrat en lecture seule s affiche JJ/MM/AAAA, une date vide reste vide', () => {
    const emploi = emploiBase({ operationsEmploi: OPERATIONS_EMPLOI_REMUNERATION_SANS_MODIFIER });
    render(
      createElement(Harness, {
        emploi: { ...emploi, contrat: { ...emploi.contrat, periodeEssaiDateFin: '2022-05-31' } },
      })
    );

    const contrat = rubrique('emp-1/contrat');
    expect(within(contrat).getByTestId('emp-1-date-debut').textContent).toBe('01/03/2022');
    expect(within(contrat).getByTestId('emp-1-fin-essai').textContent).toBe('31/05/2022');
    expect(within(contrat).getByTestId('emp-1-date-fin').textContent).toBe('');
  });

  it('DT02 — la ligne repliee de l accordeon affiche la date de debut JJ/MM/AAAA', () => {
    render(createElement(Harness, { emploi: emploiBase() }));

    expect(screen.getByTestId('accordeon-emploi-entete-emp-1').textContent).toBe(
      'Responsable paie · Contrat à durée indéterminée · 01/03/2022'
    );
  });
});
