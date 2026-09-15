// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement, useEffect, useState, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EmploiFiche, Permission } from '@paymarh/shared-types';
import { AppelApiEchoue } from '@/lib/api/client';
import { LienGarde } from '@/components/navigation/navigation-gardee';
import { useDeclarerSaisiePerdable } from '@/components/navigation/saisie-perdable-racine';
import { NavigationGardeeTestProvider } from '@/test/navigation-gardee-test';
import { RegistreFicheProvider, useRegistreFiche } from '../registre-fiche-provider';
import { RailActionsFiche } from '../rail-actions-fiche';
import { BlocEmplois } from '../bloc-emplois';

const routerPush = vi.fn();

const { modifierContratEmploi, modifierAffectationEmploi, modifierIdentiteSalarie } = vi.hoisted(
  () => ({
    modifierContratEmploi: vi.fn(),
    modifierAffectationEmploi: vi.fn(),
    modifierIdentiteSalarie: vi.fn(),
  })
);

vi.mock('@/lib/api/emplois', () => ({
  modifierContratEmploi: (...args: unknown[]) => modifierContratEmploi(...args),
  modifierAffectationEmploi: (...args: unknown[]) => modifierAffectationEmploi(...args),
  modifierRemunerationEmploi: vi.fn(),
  impactSuppressionEmploi: vi.fn(),
  supprimerEmploi: vi.fn(),
  impactSuppressionAvantageEnNature: vi.fn(),
  supprimerAvantageEnNature: vi.fn(),
  impactSuppressionStatutParticulier: vi.fn(),
  supprimerStatutParticulier: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: routerPush,
    refresh: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}));

vi.mock('@/lib/api/salaries', async (importOriginal) => {
  const reel = await importOriginal();
  return {
    ...(reel as Record<string, unknown>),
    modifierIdentiteSalarie: (...args: unknown[]) => modifierIdentiteSalarie(...args),
    impactSuppressionSalarie: vi.fn(),
    supprimerSalarie: vi.fn(),
  };
});

const TYPES_CONTRAT = [
  { id: 'tc-1', ordre: 1, code: 'CDI', libelle: 'Contrat à durée indéterminée' },
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
    readonly version?: number;
    readonly libellePoste?: string;
    readonly numeroOrdre?: number;
    readonly dureeContractuelle?: string | null;
  } = {}
): EmploiFiche {
  return {
    id,
    version: surcharges.version ?? 5,
    numeroOrdre: surcharges.numeroOrdre ?? 1,
    contrat: {
      libellePoste: surcharges.libellePoste ?? `Poste ${id}`,
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
    },
    affectation: {
      etablissementId: 'etab-1',
      departementRef: null,
      serviceRef: null,
      baseSaisieDuree: 'HEBDOMADAIRE',
      dureeContractuelle: surcharges.dureeContractuelle ?? null,
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
}

function DeclarerGarde() {
  const { aModificationsNonEnregistrees, libellesRubriquesModifiees } = useRegistreFiche();
  useDeclarerSaisiePerdable(aModificationsNonEnregistrees, libellesRubriquesModifiees);
  return null;
}

function RubriqueIdentiteModifiable() {
  const { enregistrerRubrique, notifierSommaire } = useRegistreFiche();
  const [modifiee, setModifiee] = useState(false);

  useEffect(() => {
    return enregistrerRubrique({
      id: 'identite',
      libelle: 'Identité',
      entite: { kind: 'salarie' },
      estModifiee: () => modifiee,
      envoyer: async (version) => {
        await modifierIdentiteSalarie('soc-test', 'sal-test', version, { nom: 'Test' });
        return { version: version + 1, alertes: [] };
      },
      reinitialiser: () => {
        setModifiee(false);
        notifierSommaire();
      },
    });
  }, [enregistrerRubrique, modifiee, notifierSommaire]);

  return createElement(
    'button',
    {
      type: 'button',
      'data-testid': 'marquer-identite',
      onClick: () => {
        setModifiee(true);
        notifierSommaire();
      },
    },
    'Marquer identite'
  );
}

function HarnessEmplois({
  emploisInitiaux,
  operations,
  children,
  avecIdentite = false,
}: {
  readonly emploisInitiaux: EmploiFiche[];
  readonly operations: readonly Permission[];
  readonly children?: ReactNode;
  readonly avecIdentite?: boolean;
}) {
  const [emplois, setEmplois] = useState(emploisInitiaux);

  return createElement(
    NavigationGardeeTestProvider,
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
      avecIdentite ? createElement(RubriqueIdentiteModifiable) : null,
      createElement(BlocEmplois, {
        companyId: 'soc-test',
        emplois,
        operations,
        typesContrat: TYPES_CONTRAT,
        motifsSortie: MOTIFS_SORTIE,
        etablissements: ETABLISSEMENTS,
        banques: [],
        comptesBancaires: [],
        onEmploisChange: (prochains) => setEmplois([...prochains]),
      }),
      children,
      createElement(RailActionsFiche, {
        operations: [...operations, 'salarie.modifier', 'salarie.supprimer'],
        companyId: 'soc-test',
        salarieId: 'sal-test',
      })
    )
  );
}

describe('Rubriques emploi — enregistrement', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    routerPush.mockReset();
    modifierContratEmploi.mockReset();
    modifierAffectationEmploi.mockReset();
    modifierIdentiteSalarie.mockReset();
  });

  it('E01 — une rubrique d emploi modifiee est envoyee avec le numero de version de son emploi', async () => {
    const emploi = emploiBase('emp-1', { version: 7 });
    modifierContratEmploi.mockResolvedValueOnce({
      donnees: { ...emploi, version: 8, contrat: { ...emploi.contrat, libellePoste: 'Nouveau' } },
      alertes: [],
    });

    render(
      createElement(HarnessEmplois, { emploisInitiaux: [emploi], operations: ['salarie.lire'] })
    );

    fireEvent.change(screen.getByLabelText('Libellé du poste'), {
      target: { value: 'Nouveau' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() =>
      expect(modifierContratEmploi).toHaveBeenCalledWith(
        'soc-test',
        'emp-1',
        7,
        expect.objectContaining({ libellePoste: 'Nouveau' })
      )
    );
  });

  it('E02 — deux emplois modifies : chacun recoit son numero de version', async () => {
    const empA = emploiBase('emp-a', { version: 3, numeroOrdre: 1 });
    const empB = emploiBase('emp-b', { version: 9, numeroOrdre: 2, libellePoste: 'Poste B' });

    modifierContratEmploi.mockImplementation(async (_c, id, version) => ({
      donnees: {
        ...(id === 'emp-a' ? empA : empB),
        version: version + 1,
        contrat: {
          ...(id === 'emp-a' ? empA : empB).contrat,
          libellePoste: id === 'emp-a' ? 'A modifie' : 'B modifie',
        },
      },
      alertes: [],
    }));

    render(
      createElement(HarnessEmplois, {
        emploisInitiaux: [empA, empB],
        operations: ['salarie.lire'],
      })
    );

    fireEvent.click(screen.getByTestId('accordeon-emploi-entete-emp-a'));
    fireEvent.change(document.getElementById('emp-a-libelle-poste')!, {
      target: { value: 'A modifie' },
    });
    fireEvent.click(screen.getByTestId('accordeon-emploi-entete-emp-b'));
    fireEvent.change(document.getElementById('emp-b-libelle-poste')!, {
      target: { value: 'B modifie' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(modifierContratEmploi).toHaveBeenCalledTimes(2));
    expect(modifierContratEmploi).toHaveBeenNthCalledWith(
      1,
      'soc-test',
      'emp-a',
      3,
      expect.any(Object)
    );
    expect(modifierContratEmploi).toHaveBeenNthCalledWith(
      2,
      'soc-test',
      'emp-b',
      9,
      expect.any(Object)
    );
  });

  it('E03 — vider un champ heritable envoie null explicite', async () => {
    const emploi = emploiBase('emp-1', { version: 4, dureeContractuelle: '40' });

    modifierAffectationEmploi.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 5,
        affectation: { ...emploi.affectation, dureeContractuelle: null },
      },
      alertes: [],
    });

    render(
      createElement(HarnessEmplois, { emploisInitiaux: [emploi], operations: ['salarie.lire'] })
    );

    fireEvent.change(screen.getByTestId('emp-1-duree-contractuelle'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() =>
      expect(modifierAffectationEmploi).toHaveBeenCalledWith(
        'soc-test',
        'emp-1',
        4,
        expect.objectContaining({ dureeContractuelle: null })
      )
    );
  });

  it('E04 — refus metier sur une rubrique d emploi affiche le message et la sequence continue', async () => {
    const emploi = emploiBase('emp-1', { dureeContractuelle: null });
    modifierContratEmploi.mockRejectedValueOnce(
      new AppelApiEchoue(400, {
        code: 'CHAMP_OBLIGATOIRE',
        message: 'Le libellé est obligatoire.',
        champ: 'libellePoste',
      })
    );
    modifierAffectationEmploi.mockResolvedValueOnce({
      donnees: {
        ...emploi,
        version: 6,
        affectation: { ...emploi.affectation, dureeContractuelle: '35' },
      },
      alertes: [],
    });

    render(
      createElement(HarnessEmplois, { emploisInitiaux: [emploi], operations: ['salarie.lire'] })
    );

    fireEvent.change(screen.getByLabelText('Libellé du poste'), { target: { value: '' } });
    fireEvent.change(screen.getByTestId('emp-1-duree-contractuelle'), { target: { value: '35' } });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(modifierAffectationEmploi).toHaveBeenCalled());
    expect(screen.getByText('Le libellé est obligatoire.')).toBeTruthy();
    expect(screen.queryByTestId('bandeau-conflit-version')).toBeNull();
  });

  it('E05 — conflit de version sur une rubrique d emploi arrete la sequence', async () => {
    const emploi = emploiBase('emp-1');
    modifierContratEmploi.mockRejectedValueOnce(
      new AppelApiEchoue(409, {
        code: 'CONFLIT_VERSION',
        message: 'La fiche a ete modifiee entre-temps.',
      })
    );

    render(
      createElement(HarnessEmplois, { emploisInitiaux: [emploi], operations: ['salarie.lire'] })
    );

    fireEvent.change(screen.getByLabelText('Libellé du poste'), { target: { value: 'Modifie' } });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(screen.getByTestId('bandeau-conflit-version')).toBeTruthy());
    expect(modifierAffectationEmploi).not.toHaveBeenCalled();
  });

  it('E06 — sans salarie.remuneration.ecrire la rubrique remuneration n est pas modifiable', () => {
    render(
      createElement(HarnessEmplois, {
        emploisInitiaux: [emploiBase('emp-1')],
        operations: ['salarie.lire', 'salarie.remuneration.lire'],
      })
    );

    const montant = screen.getByTestId('emp-1-montant');
    expect(montant.tagName).toBe('P');
    expect(montant.textContent).toBe('12\u202f000,00');
  });

  it('E07 — ordre d envoi : rubriques salarie puis emploi', async () => {
    const emploi = emploiBase('emp-1', { version: 5 });
    modifierIdentiteSalarie.mockResolvedValueOnce({
      donnees: { version: 11 },
      alertes: [],
    });
    modifierContratEmploi.mockResolvedValueOnce({
      donnees: { ...emploi, version: 6 },
      alertes: [],
    });

    render(
      createElement(HarnessEmplois, {
        emploisInitiaux: [emploi],
        operations: ['salarie.lire'],
        avecIdentite: true,
      })
    );

    fireEvent.click(screen.getByTestId('marquer-identite'));
    fireEvent.change(screen.getByLabelText('Libellé du poste'), { target: { value: 'Modifie' } });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(modifierContratEmploi).toHaveBeenCalled());
    expect(modifierIdentiteSalarie.mock.invocationCallOrder[0]).toBeLessThan(
      modifierContratEmploi.mock.invocationCallOrder[0]!
    );
  });

  it('E08 — le garde de navigation liste les rubriques d emploi modifiees', () => {
    render(
      createElement(
        HarnessEmplois,
        { emploisInitiaux: [emploiBase('emp-1')], operations: ['salarie.lire'] },
        createElement(LienGarde, { href: '/societes/soc-test/salaries' }, 'Retour liste')
      )
    );

    fireEvent.change(screen.getByLabelText('Libellé du poste'), { target: { value: 'Modifie' } });
    fireEvent.click(screen.getByRole('link', { name: 'Retour liste' }));

    expect(screen.getByTestId('dialogue-suppression-differee')).toBeTruthy();
    expect(screen.getByTestId('dialogue-suppression-differee-corps').textContent).toContain(
      'Contrat — Poste emp-1'
    );
  });
});
