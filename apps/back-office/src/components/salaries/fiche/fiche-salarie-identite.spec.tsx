// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pays, SituationFamiliale } from '@paymarh/shared-types';
import { AppelApiEchoue } from '@/lib/api/client';
import type { FicheSalarieAvecOperations } from '@/lib/api/salaries';
import { FicheSalarieClient } from './fiche-salarie-client';

const {
  modifierIdentiteSalarie,
  modifierIdentifiantsLegauxSalarie,
  modifierCoordonneesSalarie,
  modifierDatesSalarie,
  lireSalarie,
  routerRefresh,
} = vi.hoisted(() => ({
  modifierIdentiteSalarie: vi.fn(),
  modifierIdentifiantsLegauxSalarie: vi.fn(),
  modifierCoordonneesSalarie: vi.fn(),
  modifierDatesSalarie: vi.fn(),
  lireSalarie: vi.fn(),
  routerRefresh: vi.fn(),
}));

vi.mock('@/lib/api/salaries', async (importOriginal) => {
  const reel = await importOriginal();
  return {
    ...(reel as Record<string, unknown>),
    modifierIdentiteSalarie: (...args: unknown[]) => modifierIdentiteSalarie(...args),
    modifierIdentifiantsLegauxSalarie: (...args: unknown[]) =>
      modifierIdentifiantsLegauxSalarie(...args),
    modifierCoordonneesSalarie: (...args: unknown[]) => modifierCoordonneesSalarie(...args),
    modifierDatesSalarie: (...args: unknown[]) => modifierDatesSalarie(...args),
    lireSalarie: (...args: unknown[]) => lireSalarie(...args),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: routerRefresh, push: vi.fn() }),
}));

const PAYS: readonly Pays[] = [
  { id: 'pays-ma', ordre: 1, codeIso: 'MA', libelle: 'Maroc' },
  { id: 'pays-fr', ordre: 2, codeIso: 'FR', libelle: 'France' },
];

const SITUATIONS: readonly SituationFamiliale[] = [
  {
    id: 'sf-1',
    code: 'CELIBATAIRE',
    libelleMasculin: 'Celibataire',
    libelleFeminin: 'Celibataire',
  },
  { id: 'sf-2', code: 'MARIE', libelleMasculin: 'Marie', libelleFeminin: 'Mariee' },
  { id: 'sf-3', code: 'DIVORCE', libelleMasculin: 'Divorce', libelleFeminin: 'Divorcee' },
  { id: 'sf-4', code: 'VEUF', libelleMasculin: 'Veuf', libelleFeminin: 'Veuve' },
];

function ficheBase(
  surcharges: Partial<FicheSalarieAvecOperations> = {}
): FicheSalarieAvecOperations {
  return {
    id: 'sal-1',
    version: 3,
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
    situationFamiliale: { code: 'MARIE', libelle: 'Mariee' },
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
    operations: ['salarie.lire', 'salarie.modifier'],
    ...surcharges,
  };
}

function reponseOk(
  fiche: FicheSalarieAvecOperations,
  alertes: { code: string; message: string; champ?: string }[] = []
) {
  return { donnees: { ...fiche, version: fiche.version + 1 }, alertes };
}

function rendre(fiche: FicheSalarieAvecOperations = ficheBase()) {
  return render(
    <FicheSalarieClient
      companyId="soc-1"
      salarieId="sal-1"
      initial={fiche}
      pays={PAYS}
      situationsFamiliales={SITUATIONS}
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

describe('Fiche salarie — blocs identite', () => {
  beforeEach(() => {
    modifierIdentiteSalarie.mockReset();
    modifierIdentifiantsLegauxSalarie.mockReset();
    modifierCoordonneesSalarie.mockReset();
    modifierDatesSalarie.mockReset();
    lireSalarie.mockReset();
    routerRefresh.mockReset();
  });

  afterEach(() => cleanup());

  it('Annuler restaure la saisie locale sans relire le serveur', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    rendre();

    await act(async () => {
      fireEvent.change(champ('nom'), { target: { value: 'Alaoui' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    });

    await waitFor(() => expect(champ('nom')).toHaveProperty('value', 'Benali'));
    expect(lireSalarie).not.toHaveBeenCalled();
    expect(routerRefresh).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it('U5 — les quatre blocs se declarent au registre et l ordre d envoi suit l ordre de la page', async () => {
    const fiche = ficheBase();
    modifierIdentiteSalarie.mockResolvedValue(reponseOk(fiche));
    modifierIdentifiantsLegauxSalarie.mockResolvedValue(reponseOk(fiche));
    modifierCoordonneesSalarie.mockResolvedValue(reponseOk(fiche));
    modifierDatesSalarie.mockResolvedValue(reponseOk(fiche));

    rendre(fiche);

    expect(screen.getByTestId('sommaire-identite').textContent).toContain('Identite');
    expect(screen.getByTestId('sommaire-identifiants-legaux').textContent).toContain(
      'Identifiants et immatriculations'
    );
    expect(screen.getByTestId('sommaire-coordonnees').textContent).toContain('Coordonnees');
    expect(screen.getByTestId('sommaire-dates').textContent).toContain('Dates cles');

    fireEvent.change(champ('nom'), { target: { value: 'Alaoui' } });
    fireEvent.change(champ('matricule'), { target: { value: 'EMP002' } });
    fireEvent.change(champ('ville'), { target: { value: 'Fes' } });
    fireEvent.change(champ('dateEntree'), { target: { value: '2021-02-01' } });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(modifierDatesSalarie).toHaveBeenCalled());
    const ordre = [
      modifierIdentiteSalarie,
      modifierIdentifiantsLegauxSalarie,
      modifierCoordonneesSalarie,
      modifierDatesSalarie,
    ].map((fn) => fn.mock.invocationCallOrder[0]);
    expect(ordre[0]).toBeLessThan(ordre[1] ?? Infinity);
    expect(ordre[1]).toBeLessThan(ordre[2] ?? Infinity);
    expect(ordre[2]).toBeLessThan(ordre[3] ?? Infinity);
  });

  it('U6 — modifier un champ du bloc Coordonnees ne rend pas les trois autres blocs modifies', async () => {
    rendre();
    await act(async () => {
      fireEvent.change(champ('ville'), { target: { value: 'Fes' } });
    });
    await waitFor(() =>
      expect(screen.getByTestId('sommaire-coordonnees').textContent).toContain('*')
    );
    expect(screen.getByTestId('sommaire-identite').textContent).not.toContain('*');
    expect(screen.getByTestId('sommaire-identifiants-legaux').textContent).not.toContain('*');
    expect(screen.getByTestId('sommaire-dates').textContent).not.toContain('*');
  });

  it('U7 — Enregistrer n envoie que les blocs modifies', async () => {
    const fiche = ficheBase();
    modifierCoordonneesSalarie.mockResolvedValue(reponseOk(fiche));
    rendre(fiche);

    expect(champ('ville').value).toBe('Casablanca');
    fireEvent.change(champ('ville'), { target: { value: 'Fes' } });
    expect(champ('ville').value).toBe('Fes');
    expect(screen.getByRole('button', { name: /Enregistrer/ }).hasAttribute('disabled')).toBe(
      false
    );
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(modifierCoordonneesSalarie).toHaveBeenCalledTimes(1));
    expect(modifierIdentiteSalarie).not.toHaveBeenCalled();
    expect(modifierIdentifiantsLegauxSalarie).not.toHaveBeenCalled();
    expect(modifierDatesSalarie).not.toHaveBeenCalled();
  });

  it('U8 — une alerte portant un nom de champ s affiche sous ce champ', async () => {
    const fiche = ficheBase();
    modifierIdentiteSalarie.mockResolvedValue(
      reponseOk(fiche, [
        { code: 'FORMAT_CONTACT_INVALIDE', message: 'Format de mail inattendu.', champ: 'nom' },
      ])
    );
    rendre(fiche);

    fireEvent.change(champ('nom'), { target: { value: 'Alaoui' } });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(screen.getByText('Format de mail inattendu.')).toBeTruthy());
    const champNom = champ('nom').parentElement;
    expect(champNom?.textContent).toContain('Format de mail inattendu.');
    expect(screen.queryByTestId('alertes-tete-identite')).toBeNull();
  });

  it('U9 — une alerte sans nom de champ s affiche en tete de son bloc', async () => {
    const fiche = ficheBase();
    modifierIdentiteSalarie.mockResolvedValue(
      reponseOk(fiche, [
        {
          code: 'HOMONYME',
          message: 'Un salarie actif porte deja ce nom et ce prenom dans la societe.',
        },
      ])
    );
    rendre(fiche);

    fireEvent.change(champ('nom'), { target: { value: 'Alaoui' } });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(screen.getByTestId('alertes-tete-identite')).toBeTruthy());
    expect(
      within(screen.getByTestId('alertes-tete-identite')).getByText(
        'Un salarie actif porte deja ce nom et ce prenom dans la societe.'
      )
    ).toBeTruthy();
  });

  it('U10 — modifier un champ du bloc Identite fait disparaitre ses alertes et laisse intactes celles de Coordonnees', async () => {
    const fiche = ficheBase();
    modifierIdentiteSalarie.mockResolvedValue(
      reponseOk(fiche, [{ code: 'HOMONYME', message: 'Alerte identite.' }])
    );
    modifierCoordonneesSalarie.mockResolvedValue(
      reponseOk(fiche, [
        { code: 'FORMAT_CONTACT_INVALIDE', message: 'Alerte coordonnees.', champ: 'ville' },
      ])
    );
    rendre(fiche);

    fireEvent.change(champ('nom'), { target: { value: 'Alaoui' } });
    fireEvent.change(champ('ville'), { target: { value: 'Fes' } });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(screen.getByText('Alerte identite.')).toBeTruthy());
    expect(screen.getByText('Alerte coordonnees.')).toBeTruthy();

    fireEvent.change(champ('prenom'), { target: { value: 'Nadia' } });

    expect(screen.queryByText('Alerte identite.')).toBeNull();
    expect(screen.getByText('Alerte coordonnees.')).toBeTruthy();
  });

  it('U11 — changer la nationalite sans enregistrer ne modifie pas le type de piece affiche', () => {
    rendre();
    expect(screen.getByTestId('type-piece-identite')).toHaveProperty('value', 'CIN');
    fireEvent.change(document.getElementById('nationaliteId')!, { target: { value: 'pays-fr' } });
    expect(screen.getByTestId('type-piece-identite')).toHaveProperty('value', 'CIN');
    expect(screen.getByTestId('mention-type-piece').textContent).toContain(
      'mis a jour a l enregistrement'
    );
  });

  it('U12 — le type de piece et la date de sortie ne sont jamais envoyes au serveur', async () => {
    const fiche = ficheBase();
    modifierIdentifiantsLegauxSalarie.mockResolvedValue(reponseOk(fiche));
    modifierDatesSalarie.mockResolvedValue(reponseOk(fiche));
    rendre(fiche);

    fireEvent.change(champ('matricule'), { target: { value: 'EMP009' } });
    fireEvent.change(champ('dateEntree'), { target: { value: '2021-03-01' } });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(modifierDatesSalarie).toHaveBeenCalled());
    const corpsIdentifiants = modifierIdentifiantsLegauxSalarie.mock.calls[0]?.[3] as Record<
      string,
      unknown
    >;
    const corpsDates = modifierDatesSalarie.mock.calls[0]?.[3] as Record<string, unknown>;
    expect(corpsIdentifiants).not.toHaveProperty('typePieceIdentite');
    expect(corpsDates).not.toHaveProperty('dateSortie');
  });

  it('U13 — refus metier sur le bloc 2 : le bloc 3 est quand meme envoye, le bloc 2 conserve sa saisie', async () => {
    const fiche = ficheBase();
    modifierIdentifiantsLegauxSalarie.mockRejectedValue(
      new AppelApiEchoue(400, {
        code: 'VALEUR_INDISPONIBLE',
        message: "Cette valeur n'est pas disponible.",
      })
    );
    modifierCoordonneesSalarie.mockResolvedValue(reponseOk(fiche));
    rendre(fiche);

    fireEvent.change(champ('matricule'), { target: { value: 'EMP-DUP' } });
    fireEvent.change(champ('ville'), { target: { value: 'Fes' } });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(modifierCoordonneesSalarie).toHaveBeenCalledTimes(1));
    expect(modifierIdentifiantsLegauxSalarie).toHaveBeenCalledTimes(1);
    expect(champ('matricule')).toHaveProperty('value', 'EMP-DUP');
  });

  it('U14 — le message affiche apres un refus est exactement celui du serveur, sans ajout', async () => {
    modifierIdentifiantsLegauxSalarie.mockRejectedValue(
      new AppelApiEchoue(400, {
        code: 'VALEUR_INDISPONIBLE',
        message: "Cette valeur n'est pas disponible.",
      })
    );
    rendre();

    fireEvent.change(champ('matricule'), { target: { value: 'EMP-DUP' } });
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() =>
      expect(screen.getByTestId('erreur-rubrique-identifiants-legaux')).toBeTruthy()
    );
    expect(screen.getByTestId('erreur-rubrique-identifiants-legaux').textContent).toBe(
      "Cette valeur n'est pas disponible."
    );
  });
});
