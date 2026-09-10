// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pays, SituationFamiliale } from '@paymarh/shared-types';
import { AppelApiEchoue } from '@/lib/api/client';
import { EcranCreationSalarie } from './ecran-creation-salarie';
import { consommerAlertesCreationSalarie } from '@/lib/fiche/transport-alertes-creation-salarie';

const { creerSalarie, routerPush } = vi.hoisted(() => ({
  creerSalarie: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock('@/lib/api/salaries', async (importOriginal) => {
  const reel = await importOriginal();
  return {
    ...(reel as Record<string, unknown>),
    creerSalarie: (...args: unknown[]) => creerSalarie(...args),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush }),
}));

const PAYS: readonly Pays[] = [{ id: 'pays-ma', ordre: 1, codeIso: 'MA', libelle: 'Maroc' }];

const SITUATIONS: readonly SituationFamiliale[] = [
  {
    id: 'sf-1',
    code: 'CELIBATAIRE',
    libelleMasculin: 'Celibataire',
    libelleFeminin: 'Celibataire',
  },
];

function champ(id: string): HTMLInputElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`Champ introuvable : ${id}`);
  }
  return element;
}

function select(id: string): HTMLSelectElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLSelectElement)) {
    throw new Error(`Liste deroulante introuvable : ${id}`);
  }
  return element;
}

function rendre() {
  return render(
    <EcranCreationSalarie companyId="soc-1" pays={PAYS} situationsFamiliales={SITUATIONS} />
  );
}

function remplirIdentiteMinimale() {
  fireEvent.change(champ('nom'), { target: { value: 'Benali' } });
  fireEvent.change(champ('prenom'), { target: { value: 'Sara' } });
  fireEvent.change(champ('dateNaissance'), { target: { value: '1990-05-12' } });
  fireEvent.change(champ('dateEntree'), { target: { value: '2024-01-15' } });
}

function remplirSalarieComplet() {
  remplirIdentiteMinimale();
  fireEvent.change(select('sexe'), { target: { value: 'FEMME' } });
  fireEvent.change(champ('villeNaissance'), { target: { value: 'Rabat' } });
  fireEvent.change(select('paysNaissanceId'), { target: { value: 'pays-ma' } });
  fireEvent.change(select('nationaliteId'), { target: { value: 'pays-ma' } });
  fireEvent.change(select('situationFamilialeCode'), { target: { value: 'CELIBATAIRE' } });
  fireEvent.change(champ('matricule'), { target: { value: 'EMP001' } });
  fireEvent.change(champ('numeroPiece'), { target: { value: 'AB123456' } });
  fireEvent.change(champ('numeroCnss'), { target: { value: '001122' } });
  fireEvent.change(champ('numeroCimr'), { target: { value: '3344' } });
  fireEvent.change(champ('adresse'), { target: { value: '1 rue Atlas' } });
  fireEvent.change(champ('complementAdresse'), { target: { value: 'Appt 2' } });
  fireEvent.change(champ('codePostal'), { target: { value: '10000' } });
  fireEvent.change(champ('ville'), { target: { value: 'Rabat' } });
  fireEvent.change(select('paysId'), { target: { value: 'pays-ma' } });
  fireEvent.change(champ('telephonePersonnel'), { target: { value: '0611223344' } });
  fireEvent.change(champ('telephoneProfessionnel'), { target: { value: '0537001122' } });
  fireEvent.change(champ('emailPersonnel'), { target: { value: 'sara@ex.ma' } });
  fireEvent.change(champ('emailProfessionnel'), { target: { value: 'pro@ex.ma' } });
  fireEvent.change(champ('urgencePrenom'), { target: { value: 'Lina' } });
  fireEvent.change(champ('urgenceNom'), { target: { value: 'Amrani' } });
  fireEvent.change(champ('urgenceTelephone'), { target: { value: '0666778899' } });
  fireEvent.change(champ('urgenceEmail'), { target: { value: 'u@ex.ma' } });
  fireEvent.change(champ('dateAnciennete'), { target: { value: '2023-06-01' } });
}

describe('Ecran de creation d un salarie', () => {
  beforeEach(() => {
    creerSalarie.mockReset();
    routerPush.mockReset();
    consommerAlertesCreationSalarie('sal-new');
  });

  afterEach(() => {
    cleanup();
    consommerAlertesCreationSalarie('sal-new');
  });

  it('une creation complete n emet qu un seul appel reseau', async () => {
    creerSalarie.mockResolvedValue({
      donnees: { id: 'sal-new' },
      alertes: [],
    });
    rendre();
    remplirSalarieComplet();
    fireEvent.click(screen.getByRole('button', { name: 'Créer le salarié' }));

    await waitFor(() => expect(creerSalarie).toHaveBeenCalledTimes(1));
    expect(creerSalarie).toHaveBeenCalledTimes(1);
  });

  it('un matricule laisse vide est absent du corps envoye', async () => {
    creerSalarie.mockResolvedValue({
      donnees: { id: 'sal-new' },
      alertes: [],
    });
    rendre();
    remplirIdentiteMinimale();
    fireEvent.change(champ('matricule'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le salarié' }));

    await waitFor(() => expect(creerSalarie).toHaveBeenCalled());
    const corps = creerSalarie.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(corps).not.toHaveProperty('matricule');
  });

  it('refus 400 avec nom de champ : alerte sous le champ, saisie conservee, on reste', async () => {
    creerSalarie.mockRejectedValue(
      new AppelApiEchoue(400, {
        code: 'VALEUR_INDISPONIBLE',
        message: "Cette valeur n'est pas disponible.",
        champ: 'matricule',
      })
    );
    rendre();
    remplirIdentiteMinimale();
    fireEvent.change(champ('matricule'), { target: { value: 'PRIS' } });
    fireEvent.change(champ('nom'), { target: { value: 'Alaoui' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le salarié' }));

    await waitFor(() =>
      expect(screen.getByText("Cette valeur n'est pas disponible.")).toBeTruthy()
    );
    expect(champ('matricule').parentElement?.textContent).toContain(
      "Cette valeur n'est pas disponible."
    );
    expect(champ('nom')).toHaveProperty('value', 'Alaoui');
    expect(screen.getByRole('heading', { name: 'Nouveau salarié' })).toBeTruthy();
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('refus 400 sans nom de champ : alerte en tete du bloc Identite', async () => {
    creerSalarie.mockRejectedValue(
      new AppelApiEchoue(400, {
        code: 'REEMBAUCHE',
        message: 'Un salarie inactif correspond deja.',
      })
    );
    rendre();
    remplirIdentiteMinimale();
    fireEvent.click(screen.getByRole('button', { name: 'Créer le salarié' }));

    await waitFor(() =>
      expect(screen.getByTestId('alertes-tete-identite').textContent).toContain(
        'Un salarie inactif correspond deja.'
      )
    );
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('creation reussie portant une alerte : navigation vers la fiche et alerte transmise', async () => {
    const alerte = {
      code: 'HOMONYME',
      message: 'Un homonyme existe deja.',
      champ: 'nom',
    };
    creerSalarie.mockResolvedValue({
      donnees: { id: 'sal-new' },
      alertes: [alerte],
    });
    rendre();
    remplirIdentiteMinimale();
    fireEvent.click(screen.getByRole('button', { name: 'Créer le salarié' }));

    await waitFor(() =>
      expect(routerPush).toHaveBeenCalledWith('/societes/soc-1/salaries/sal-new')
    );
    expect(consommerAlertesCreationSalarie('sal-new')).toEqual([alerte]);
  });

  it('la date de sortie est absente du DOM de l ecran de creation', () => {
    rendre();
    expect(document.getElementById('dateSortie')).toBeNull();
    expect(screen.queryByLabelText('Date de sortie')).toBeNull();
  });

  it('la date d anciennete ne porte pas la marque des champs obligatoires', () => {
    rendre();
    expect(screen.getByLabelText('Date d’ancienneté')).toBeTruthy();
    expect(screen.queryByLabelText('Date d’ancienneté *')).toBeNull();
  });

  it('la date de naissance ne porte pas la marque des champs obligatoires', () => {
    rendre();
    expect(screen.getByLabelText('Date de naissance')).toBeTruthy();
    expect(screen.queryByLabelText('Date de naissance *')).toBeNull();
  });

  it('une date de naissance laissee vide est absente du corps envoye', async () => {
    creerSalarie.mockResolvedValue({
      donnees: { id: 'sal-new' },
      alertes: [],
    });
    rendre();
    fireEvent.change(champ('nom'), { target: { value: 'Benali' } });
    fireEvent.change(champ('prenom'), { target: { value: 'Sara' } });
    fireEvent.change(champ('dateEntree'), { target: { value: '2024-01-15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le salarié' }));

    await waitFor(() => expect(creerSalarie).toHaveBeenCalled());
    const corps = creerSalarie.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(corps).not.toHaveProperty('dateNaissance');
  });

  it('Annuler vide le formulaire sans appel serveur ni changement d ecran', () => {
    rendre();
    fireEvent.change(champ('nom'), { target: { value: 'Alaoui' } });
    fireEvent.change(champ('matricule'), { target: { value: 'X1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(champ('nom')).toHaveProperty('value', '');
    expect(champ('matricule')).toHaveProperty('value', '');
    expect(creerSalarie).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Nouveau salarié' })).toBeTruthy();
  });
});
