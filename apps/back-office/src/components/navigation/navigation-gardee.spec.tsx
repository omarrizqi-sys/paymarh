// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement, useEffect, useState, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pays, SituationFamiliale } from '@paymarh/shared-types';
import type { FicheSalarieAvecOperations } from '@/lib/api/salaries';
import { EcranCreationSalarie } from '@/components/salaries/creation/ecran-creation-salarie';
import { FicheSalarieClient } from '@/components/salaries/fiche/fiche-salarie-client';
import {
  RegistreFicheProvider,
  useRegistreFiche,
} from '@/components/salaries/fiche/registre-fiche-provider';
import { NavigationEnTete } from './navigation-en-tete';
import { LienGarde, NavigationGardeeProvider, useNavigationGardee } from './navigation-gardee';
import { SaisiePerdableRacineProvider, useDeclarerSaisiePerdable } from './saisie-perdable-racine';

const { routerPush, routerRefresh, creerSalarie, lireSalarie } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  routerRefresh: vi.fn(),
  creerSalarie: vi.fn(),
  lireSalarie: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: routerPush,
    replace: vi.fn(),
    refresh: routerRefresh,
    back: vi.fn(),
    forward: vi.fn(),
  }),
}));

vi.mock('@/lib/api/salaries', async (importOriginal) => {
  const reel = await importOriginal();
  return {
    ...(reel as Record<string, unknown>),
    creerSalarie: (...args: unknown[]) => creerSalarie(...args),
    lireSalarie: (...args: unknown[]) => lireSalarie(...args),
  };
});

const PAYS: readonly Pays[] = [{ id: 'pays-ma', ordre: 1, codeIso: 'MA', libelle: 'Maroc' }];

const SITUATIONS: readonly SituationFamiliale[] = [
  {
    id: 'sf-1',
    code: 'CELIBATAIRE',
    libelleMasculin: 'Celibataire',
    libelleFeminin: 'Celibataire',
  },
];

function ficheMinimale(): FicheSalarieAvecOperations {
  return {
    id: 'sal-1',
    version: 1,
    etat: 'ACTIF',
    moisEnCours: '2026-09',
    dateSortie: '2025-12-31',
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
    numeroPiece: null,
    numeroCnss: null,
    numeroCimr: null,
    adresse: null,
    complementAdresse: null,
    ville: null,
    codePostal: null,
    paysId: null,
    telephonePersonnel: null,
    telephoneProfessionnel: null,
    emailPersonnel: null,
    emailProfessionnel: null,
    urgencePrenom: null,
    urgenceNom: null,
    urgenceTelephone: null,
    urgenceEmail: null,
    dateEntree: '2024-01-01',
    dateAnciennete: '2024-01-01',
    emplois: [],
    nombrePersonnesACharge: 0,
    personnesACharge: [],
    prets: [],
    saisiesSurSalaire: [],
    comptesBancaires: [],
    operations: ['salarie.modifier'],
  };
}

function champ(id: string): HTMLInputElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`Champ introuvable : ${id}`);
  }
  return element;
}

function DeclarerRegistreFichePourGarde() {
  const { aModificationsNonEnregistrees, libellesRubriquesModifiees } = useRegistreFiche();
  useDeclarerSaisiePerdable(aModificationsNonEnregistrees, libellesRubriquesModifiees);
  return null;
}

function CoquilleNavigationTest({ children }: { readonly children?: ReactNode }) {
  return (
    <SaisiePerdableRacineProvider>
      <NavigationGardeeProvider>
        <NavigationEnTete />
        {children}
      </NavigationGardeeProvider>
    </SaisiePerdableRacineProvider>
  );
}

function RubriqueModifiable({ id, libelle }: { readonly id: string; readonly libelle: string }) {
  const { enregistrerRubrique, notifierSommaire } = useRegistreFiche();
  const [modifiee, setModifiee] = useState(false);

  useEffect(() => {
    return enregistrerRubrique({
      id,
      libelle,
      estModifiee: () => modifiee,
      envoyer: vi.fn(async () => ({ version: 2, alertes: [] })),
      reinitialiser: () => setModifiee(false),
    });
  }, [enregistrerRubrique, id, libelle, modifiee]);

  return createElement(
    'button',
    {
      type: 'button',
      'data-testid': `marquer-${id}`,
      onClick: () => {
        setModifiee(true);
        notifierSommaire();
      },
    },
    `Marquer ${libelle}`
  );
}

function DeclencheurRefresh() {
  const { refresh } = useNavigationGardee();
  return createElement(
    'button',
    { type: 'button', 'data-testid': 'declencher-refresh', onClick: () => refresh() },
    'Rafraichir'
  );
}

describe('Navigation gardee — fiche salarie', () => {
  beforeEach(() => {
    routerPush.mockReset();
    routerRefresh.mockReset();
    lireSalarie.mockReset();
  });

  afterEach(() => cleanup());

  it('NG01 — avec modification, le lien retour ouvre la fenetre sans naviguer', () => {
    render(
      createElement(
        SaisiePerdableRacineProvider,
        null,
        createElement(
          NavigationGardeeProvider,
          null,
          createElement(
            RegistreFicheProvider,
            { versionInitiale: 1, onRechargerServeur: vi.fn() },
            createElement(DeclarerRegistreFichePourGarde),
            createElement(RubriqueModifiable, { id: 'identite', libelle: 'Identite' }),
            createElement(LienGarde, { href: '/societes/soc-1/salaries' }, 'Retour liste')
          )
        )
      )
    );

    fireEvent.click(screen.getByTestId('marquer-identite'));
    fireEvent.click(screen.getByRole('link', { name: 'Retour liste' }));

    expect(screen.getByTestId('dialogue-suppression-differee')).toBeTruthy();
    expect(screen.getByText('Quitter cette page ?')).toBeTruthy();
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('NG02 — Rester ferme la fenetre et conserve la saisie', () => {
    render(
      createElement(
        SaisiePerdableRacineProvider,
        null,
        createElement(
          NavigationGardeeProvider,
          null,
          createElement(
            RegistreFicheProvider,
            { versionInitiale: 1, onRechargerServeur: vi.fn() },
            createElement(DeclarerRegistreFichePourGarde),
            createElement(RubriqueModifiable, { id: 'identite', libelle: 'Identite' }),
            createElement(LienGarde, { href: '/societes/soc-1/salaries' }, 'Retour liste')
          )
        )
      )
    );

    fireEvent.click(screen.getByTestId('marquer-identite'));
    fireEvent.click(screen.getByRole('link', { name: 'Retour liste' }));
    fireEvent.click(screen.getByTestId('dialogue-suppression-differee-annuler'));

    expect(screen.queryByTestId('dialogue-suppression-differee')).toBeNull();
    expect(routerPush).not.toHaveBeenCalled();
    expect(screen.getByTestId('marquer-identite')).toBeTruthy();
  });

  it('NG03 — Quitter cette page declenche la navigation', () => {
    render(
      createElement(
        SaisiePerdableRacineProvider,
        null,
        createElement(
          NavigationGardeeProvider,
          null,
          createElement(
            RegistreFicheProvider,
            { versionInitiale: 1, onRechargerServeur: vi.fn() },
            createElement(DeclarerRegistreFichePourGarde),
            createElement(RubriqueModifiable, { id: 'identite', libelle: 'Identite' }),
            createElement(LienGarde, { href: '/societes/soc-1/salaries' }, 'Retour liste')
          )
        )
      )
    );

    fireEvent.click(screen.getByTestId('marquer-identite'));
    fireEvent.click(screen.getByRole('link', { name: 'Retour liste' }));
    fireEvent.click(screen.getByTestId('dialogue-suppression-differee-confirmer'));

    expect(routerPush).toHaveBeenCalledWith('/societes/soc-1/salaries');
  });

  it('NG04 — sans modification, le lien retour navigue sans fenetre', () => {
    render(
      createElement(
        SaisiePerdableRacineProvider,
        null,
        createElement(
          NavigationGardeeProvider,
          null,
          createElement(
            RegistreFicheProvider,
            { versionInitiale: 1, onRechargerServeur: vi.fn() },
            createElement(DeclarerRegistreFichePourGarde),
            createElement(LienGarde, { href: '/societes/soc-1/salaries' }, 'Retour liste')
          )
        )
      )
    );

    fireEvent.click(screen.getByRole('link', { name: 'Retour liste' }));

    expect(screen.queryByTestId('dialogue-suppression-differee')).toBeNull();
    expect(routerPush).toHaveBeenCalledWith('/societes/soc-1/salaries');
  });

  it('NG07 — le rafraichissement n ouvre pas la fenetre malgre une modification', () => {
    render(
      createElement(
        SaisiePerdableRacineProvider,
        null,
        createElement(
          NavigationGardeeProvider,
          null,
          createElement(
            RegistreFicheProvider,
            { versionInitiale: 1, onRechargerServeur: vi.fn() },
            createElement(DeclarerRegistreFichePourGarde),
            createElement(RubriqueModifiable, { id: 'identite', libelle: 'Identite' }),
            createElement(DeclencheurRefresh)
          )
        )
      )
    );

    fireEvent.click(screen.getByTestId('marquer-identite'));
    fireEvent.click(screen.getByTestId('declencher-refresh'));

    expect(screen.queryByTestId('dialogue-suppression-differee')).toBeNull();
    expect(routerRefresh).toHaveBeenCalledTimes(1);
  });
});

describe('Navigation gardee — ecran de creation', () => {
  beforeEach(() => {
    routerPush.mockReset();
    creerSalarie.mockReset();
  });

  afterEach(() => cleanup());

  function renderCreation() {
    return render(
      <CoquilleNavigationTest>
        <EcranCreationSalarie companyId="soc-1" pays={PAYS} situationsFamiliales={SITUATIONS} />
      </CoquilleNavigationTest>
    );
  }

  it('NG05 — avec saisie, le lien retour ouvre la fenetre puis Rester conserve l ecran', () => {
    renderCreation();

    fireEvent.change(champ('nom'), { target: { value: 'Benali' } });
    fireEvent.click(screen.getByRole('link', { name: /Retour à la liste/ }));

    expect(screen.getByTestId('dialogue-suppression-differee')).toBeTruthy();
    expect(routerPush).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('dialogue-suppression-differee-annuler'));
    expect(screen.getByRole('heading', { name: 'Nouveau salarié' })).toBeTruthy();
    expect(champ('nom')).toHaveProperty('value', 'Benali');
  });

  it('NG06 — Quitter cette page depuis la creation navigue vers la liste', () => {
    renderCreation();

    fireEvent.change(champ('nom'), { target: { value: 'Benali' } });
    fireEvent.click(screen.getByRole('link', { name: /Retour à la liste/ }));
    fireEvent.click(screen.getByTestId('dialogue-suppression-differee-confirmer'));

    expect(routerPush).toHaveBeenCalledWith('/societes/soc-1/salaries');
  });

  it('NG08 — sans saisie, le lien retour navigue directement', () => {
    renderCreation();

    fireEvent.click(screen.getByRole('link', { name: /Retour à la liste/ }));

    expect(screen.queryByTestId('dialogue-suppression-differee')).toBeNull();
    expect(routerPush).toHaveBeenCalledWith('/societes/soc-1/salaries');
  });

  it('NG09 — creation reussie : navigation vers la fiche sans fenetre intermediaire', async () => {
    creerSalarie.mockResolvedValue({
      donnees: { id: 'sal-new' },
      alertes: [],
    });

    renderCreation();

    fireEvent.change(champ('nom'), { target: { value: 'Benali' } });
    fireEvent.change(champ('prenom'), { target: { value: 'Sara' } });
    fireEvent.change(champ('dateEntree'), { target: { value: '2024-01-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le salarié' }));

    await waitFor(() =>
      expect(routerPush).toHaveBeenCalledWith('/societes/soc-1/salaries/sal-new')
    );
    expect(screen.queryByTestId('dialogue-suppression-differee')).toBeNull();
  });

  it('NG16 — creation enregistre beforeunload quand la saisie est modifiee', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    renderCreation();

    fireEvent.change(champ('nom'), { target: { value: 'Benali' } });

    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    addSpy.mockRestore();
  });
});

describe('Navigation gardee — fiche client (lien retour integre)', () => {
  beforeEach(() => {
    routerPush.mockReset();
  });

  afterEach(() => cleanup());

  it('NG10 — le lien Retour a la liste de la fiche ouvre la fenetre applicative', () => {
    render(
      <CoquilleNavigationTest>
        <FicheSalarieClient
          companyId="soc-1"
          salarieId="sal-1"
          initial={ficheMinimale()}
          pays={PAYS}
          situationsFamiliales={SITUATIONS}
          liensParente={[]}
          banques={[]}
          typesSaisie={[]}
        />
      </CoquilleNavigationTest>
    );

    fireEvent.change(champ('nom'), { target: { value: 'Modifie' } });
    fireEvent.click(screen.getByRole('link', { name: /Retour à la liste/ }));

    expect(screen.getByTestId('dialogue-suppression-differee')).toBeTruthy();
    expect(routerPush).not.toHaveBeenCalled();
  });
});

describe('Navigation gardee — en-tete global', () => {
  beforeEach(() => {
    routerPush.mockReset();
  });

  afterEach(() => cleanup());

  it('NG11 — depuis la fiche modifiee, Societes ouvre la fenetre sans naviguer', () => {
    render(
      <CoquilleNavigationTest>
        <FicheSalarieClient
          companyId="soc-1"
          salarieId="sal-1"
          initial={ficheMinimale()}
          pays={PAYS}
          situationsFamiliales={SITUATIONS}
          liensParente={[]}
          banques={[]}
          typesSaisie={[]}
        />
      </CoquilleNavigationTest>
    );

    fireEvent.change(champ('nom'), { target: { value: 'Modifie' } });
    fireEvent.click(screen.getByRole('link', { name: 'Sociétés' }));

    expect(screen.getByTestId('dialogue-suppression-differee')).toBeTruthy();
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('NG12 — depuis la creation modifiee, Societes ouvre la fenetre sans naviguer', () => {
    render(
      <CoquilleNavigationTest>
        <EcranCreationSalarie companyId="soc-1" pays={PAYS} situationsFamiliales={SITUATIONS} />
      </CoquilleNavigationTest>
    );

    fireEvent.change(champ('nom'), { target: { value: 'Benali' } });
    fireEvent.click(screen.getByRole('link', { name: 'Sociétés' }));

    expect(screen.getByTestId('dialogue-suppression-differee')).toBeTruthy();
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('NG14 — sans saisie, Societes navigue directement', () => {
    render(
      <CoquilleNavigationTest>
        <p>Liste sans saisie</p>
      </CoquilleNavigationTest>
    );

    fireEvent.click(screen.getByRole('link', { name: 'Sociétés' }));

    expect(screen.queryByTestId('dialogue-suppression-differee')).toBeNull();
    expect(routerPush).toHaveBeenCalledWith('/societes');
  });

  it('NG15 — le logo VECTA porte le meme garde que Societes', () => {
    render(
      <CoquilleNavigationTest>
        <FicheSalarieClient
          companyId="soc-1"
          salarieId="sal-1"
          initial={ficheMinimale()}
          pays={PAYS}
          situationsFamiliales={SITUATIONS}
          liensParente={[]}
          banques={[]}
          typesSaisie={[]}
        />
      </CoquilleNavigationTest>
    );

    fireEvent.change(champ('nom'), { target: { value: 'Modifie' } });
    fireEvent.click(screen.getByRole('link', { name: 'VECTA' }));

    expect(screen.getByTestId('dialogue-suppression-differee')).toBeTruthy();
    expect(routerPush).not.toHaveBeenCalled();
  });
});
