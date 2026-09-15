// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EmploiFiche, Permission } from '@paymarh/shared-types';
import { BlocEmplois } from './bloc-emplois';
import { RegistreFicheProvider } from './registre-fiche-provider';

const TYPES_CONTRAT = [
  { id: 'tc-1', ordre: 1, code: 'CDI', libelle: 'Contrat à durée indéterminée' },
  { id: 'tc-2', ordre: 2, code: 'CDD', libelle: 'Contrat à durée déterminée' },
] as const;

const MOTIFS_SORTIE = [{ id: 'ms-1', ordre: 1, code: 'DEMISSION', libelle: 'Démission' }] as const;

const ETABLISSEMENTS = [{ id: 'etab-1', nom: 'Siège Casablanca' } as never];

function resolutionsVides(): EmploiFiche['resolutions'] {
  return {
    dureeContractuelle: null,
    reposHebdomadaire: null,
    teletravailAutorise: null,
    grilleHoraire: null,
    joursFeriesTravailles: null,
  };
}

function emploiBase(
  id: string,
  surcharges: {
    readonly contrat?: Partial<EmploiFiche['contrat']>;
    readonly numeroOrdre?: number;
    readonly remuneration?: EmploiFiche['remuneration'];
    readonly paiement?: EmploiFiche['paiement'];
    readonly affectation?: Partial<EmploiFiche['affectation']>;
    readonly resolutions?: EmploiFiche['resolutions'];
  } = {}
): EmploiFiche {
  return {
    id,
    version: 1,
    numeroOrdre: surcharges.numeroOrdre ?? 1,
    contrat: {
      libellePoste: `Poste ${id}`,
      dateDebut: '2025-01-01',
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
      ...surcharges.contrat,
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
      ...surcharges.affectation,
    },
    statutsParticuliers: [],
    resolutions: surcharges.resolutions ?? resolutionsVides(),
    remuneration: surcharges.remuneration ?? {
      modeDeterminationSalaire: 'BRUT_MENSUEL',
      montant: '12000.00',
      masquerNombreHeures: false,
      masquerTauxHoraire: false,
      bulletinTousLesMois: true,
      moisProduction: [],
      teletravailIndemniteVersee: null,
      teletravailMontant: null,
    },
    paiement: surcharges.paiement ?? {
      modePaiement: 'VIREMENT',
      compteBancaireId: null,
    },
  };
}

function rendre(
  emplois: readonly EmploiFiche[],
  operations: readonly Permission[] = ['salarie.lire', 'salarie.remuneration.lire'],
  onEmploisChange = vi.fn()
) {
  return render(
    <RegistreFicheProvider
      versionInitiale={1}
      emplois={emplois.map((emploi) => ({
        id: emploi.id,
        libellePoste: emploi.contrat.libellePoste,
        version: emploi.version,
      }))}
      onRechargerServeur={vi.fn(async () => undefined)}
    >
      <BlocEmplois
        companyId="soc-test"
        emplois={emplois}
        operations={operations}
        typesContrat={TYPES_CONTRAT}
        motifsSortie={MOTIFS_SORTIE}
        etablissements={ETABLISSEMENTS}
        banques={[]}
        onEmploisChange={onEmploisChange}
      />
    </RegistreFicheProvider>
  );
}

describe('BlocEmplois', () => {
  afterEach(() => cleanup());

  it('aucun emploi : phrase sobre et rien d autre', () => {
    rendre([]);

    expect(screen.getByTestId('emplois-vide').textContent).toBe('Aucun emploi n’est enregistré.');
    expect(screen.queryByTestId(/accordeon-emploi-/)).toBeNull();
    expect(screen.queryByTestId('basculer-emplois-termines')).toBeNull();
  });

  it('un seul emploi : deplie a l ouverture', () => {
    rendre([emploiBase('emp-1')]);

    expect(screen.getByTestId('accordeon-emploi-corps-emp-1').classList.contains('hidden')).toBe(
      false
    );
  });

  it('plusieurs emplois : aucun deplie a l ouverture', () => {
    rendre([
      emploiBase('emp-1', { numeroOrdre: 1 }),
      emploiBase('emp-2', {
        numeroOrdre: 2,
        contrat: { libellePoste: 'Second poste', dateDebut: '2024-01-01' },
      }),
    ]);

    expect(screen.getByTestId('accordeon-emploi-corps-emp-1').classList.contains('hidden')).toBe(
      true
    );
    expect(screen.getByTestId('accordeon-emploi-corps-emp-2').classList.contains('hidden')).toBe(
      true
    );
  });

  it('deplier un emploi replie le precedent', () => {
    rendre([
      emploiBase('emp-1', { numeroOrdre: 1 }),
      emploiBase('emp-2', {
        numeroOrdre: 2,
        contrat: { libellePoste: 'Second poste', dateDebut: '2024-06-01' },
      }),
    ]);

    fireEvent.click(screen.getByTestId('accordeon-emploi-entete-emp-2'));
    expect(screen.getByTestId('accordeon-emploi-corps-emp-2').classList.contains('hidden')).toBe(
      false
    );
    expect(screen.getByTestId('accordeon-emploi-corps-emp-1').classList.contains('hidden')).toBe(
      true
    );

    fireEvent.click(screen.getByTestId('accordeon-emploi-entete-emp-1'));
    expect(screen.getByTestId('accordeon-emploi-corps-emp-1').classList.contains('hidden')).toBe(
      false
    );
    expect(screen.getByTestId('accordeon-emploi-corps-emp-2').classList.contains('hidden')).toBe(
      true
    );
  });

  it('aucun emploi termine : la bascule est absente du DOM', () => {
    rendre([emploiBase('emp-1')]);

    expect(screen.queryByTestId('basculer-emplois-termines')).toBeNull();
  });

  it('au moins un emploi termine : la bascule revele l emploi', () => {
    rendre([
      emploiBase('emp-ouvert'),
      emploiBase('emp-termine', {
        contrat: {
          estOuvert: false,
          dateSortie: '2024-12-31',
          motifSortieCode: 'DEMISSION',
        },
      }),
    ]);

    expect(screen.getByTestId('basculer-emplois-termines')).toBeTruthy();
    expect(screen.queryByTestId('accordeon-emploi-emp-termine')).toBeNull();

    fireEvent.click(screen.getByTestId('basculer-emplois-termines'));
    expect(screen.getByTestId('accordeon-emploi-emp-termine')).toBeTruthy();
  });

  it('sans salarie.remuneration.lire : la rubrique remuneration absente du DOM', () => {
    rendre([emploiBase('emp-1')], ['salarie.lire']);

    expect(document.getElementById('emp-1/contrat')).toBeTruthy();
    expect(document.getElementById('emp-1/affectation')).toBeTruthy();
    expect(document.getElementById('emp-1/remuneration')).toBeNull();
  });

  it('affiche la phrase d heritage quand resolutions est fourni en prop', () => {
    rendre([
      emploiBase('emp-1', {
        resolutions: {
          ...resolutionsVides(),
          dureeContractuelle: {
            valeur: '44',
            origine: 'ETABLISSEMENT',
            libelleEntite: 'Casablanca',
          },
        },
      }),
    ]);

    expect(screen.getByTestId('emp-1-heritage-duree-contractuelle').textContent).toBe(
      '44 h — établissement Casablanca'
    );
  });

  it('aucune valeur heritee : rien sous le champ', () => {
    rendre([
      emploiBase('emp-1', {
        resolutions: {
          ...resolutionsVides(),
          dureeContractuelle: null,
        },
      }),
    ]);

    expect(screen.queryByTestId('emp-1-heritage-duree-contractuelle')).toBeNull();
  });

  it('resolution masquee : rien sous le champ indemnite', () => {
    rendre([
      emploiBase('emp-1', {
        resolutions: resolutionsVides(),
      }),
    ]);

    expect(screen.queryByTestId('emp-1-heritage-teletravail-indemnite')).toBeNull();
  });

  it('les codes s affichent par leur libelle', () => {
    rendre([
      emploiBase('emp-1', {
        contrat: {
          typeContratCode: 'CDI',
          motifSortieCode: 'DEMISSION',
          dateSortie: '2025-06-30',
          estOuvert: true,
        },
      }),
    ]);

    expect((screen.getByTestId('emp-1-type-contrat-select') as HTMLSelectElement).value).toBe(
      'CDI'
    );
    expect((screen.getByTestId('emp-1-motif-sortie-select') as HTMLSelectElement).value).toBe(
      'DEMISSION'
    );
  });

  it('porte l identifiant attendu par le sommaire', () => {
    rendre([emploiBase('emp-1')]);

    expect(document.getElementById('emplois')).toBeTruthy();
  });

  it('affiche la phrase d heritage sous la repartition horaire', () => {
    rendre([
      emploiBase('emp-1', {
        resolutions: {
          ...resolutionsVides(),
          grilleHoraire: {
            valeur: [{ jourSemaine: 'LUNDI', typeHeureId: 'n', nombreHeures: '8' }],
            origine: 'ETABLISSEMENT',
            libelleEntite: 'Siège',
          },
        },
      }),
    ]);

    expect(screen.getByTestId('emp-1-heritage-repartition-horaire').textContent).toBe(
      '1 ligne de grille horaire — établissement Siège'
    );
  });

  it('affiche le montant formate en lecture seule sans droit d ecriture remuneration', () => {
    rendre([emploiBase('emp-1')], ['salarie.lire', 'salarie.remuneration.lire']);

    expect(screen.getByTestId('emp-1-montant').textContent).toBe('12\u202f000,00');
  });
});
