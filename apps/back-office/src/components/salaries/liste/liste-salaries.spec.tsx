// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ListeSalariesDonnees, LigneListeSalarie } from '@/lib/api/salaries';
import { ListeSalariesClient } from './liste-salaries-client';

const { listerSalaries, routerPush } = vi.hoisted(() => ({
  listerSalaries: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock('@/lib/api/salaries', () => ({
  listerSalaries: (...args: unknown[]) => listerSalaries(...args),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush }),
}));

function ligne(id: string, surcharges: Partial<LigneListeSalarie> = {}): LigneListeSalarie {
  return {
    id,
    matricule: `MAT-${id}`,
    nom: 'Benali',
    prenom: 'Sara',
    etat: 'ACTIF',
    dateEntree: '2025-01-15',
    poste: 'Comptable',
    nombreEmploisOuverts: 1,
    etablissement: { id: 'etab-1', libelle: 'Siege Casablanca' },
    ...surcharges,
  };
}

function donneesInitiales(surcharges: Partial<ListeSalariesDonnees> = {}): ListeSalariesDonnees {
  return {
    items: [],
    prochainCurseur: null,
    operations: [],
    ...surcharges,
  };
}

function rendre(
  initial: ListeSalariesDonnees = donneesInitiales(),
  societeSansSalaries = initial.items.length === 0
) {
  return render(
    <ListeSalariesClient
      companyId="soc-1"
      initial={initial}
      etablissements={[{ id: 'etab-1', nom: 'Siege Casablanca' } as never]}
      societeSansSalaries={societeSansSalaries}
    />
  );
}

describe('ListeSalariesClient', () => {
  beforeEach(() => {
    listerSalaries.mockReset();
    routerPush.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('12 — recherche et pagination par curseur combinees', async () => {
    listerSalaries.mockResolvedValue({
      donnees: {
        items: [ligne('1')],
        prochainCurseur: 'curseur-page-2',
        operations: [],
      },
    });

    rendre(donneesInitiales({ items: [ligne('0')], prochainCurseur: null }), false);

    fireEvent.change(screen.getByLabelText('Rechercher un salarie'), {
      target: { value: 'benali' },
    });

    await waitFor(
      () => {
        expect(listerSalaries).toHaveBeenCalledWith('soc-1', {
          recherche: 'benali',
          etat: undefined,
          etablissementId: undefined,
          curseur: undefined,
        });
      },
      { timeout: 2000 }
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Charger plus' })).toBeTruthy();
    });

    listerSalaries.mockResolvedValue({
      donnees: {
        items: [ligne('2')],
        prochainCurseur: null,
        operations: [],
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Charger plus' }));

    await waitFor(() => {
      expect(listerSalaries).toHaveBeenLastCalledWith('soc-1', {
        recherche: 'benali',
        etat: undefined,
        etablissementId: undefined,
        curseur: 'curseur-page-2',
      });
    });
  });

  it('13 — une colonne non triable cote serveur n offre pas de tri', () => {
    rendre(donneesInitiales({ items: [ligne('1')] }), false);

    expect(screen.queryByText('↑')).toBeNull();
    expect(screen.queryByText('↓')).toBeNull();

    const entetes = screen.getAllByRole('columnheader');
    expect(entetes).toHaveLength(7);
    for (const entete of entetes) {
      expect(within(entete).queryByRole('button')).toBeNull();
    }
  });

  it('14 — ecran vide societe et ecran vide recherche affichent deux messages distincts', () => {
    const { unmount } = rendre(donneesInitiales(), true);
    expect(screen.getByTestId('vide-societe').textContent).toContain(
      'Aucun salarie dans cette societe. Commencez par en creer un.'
    );
    expect(screen.queryByTestId('vide-recherche')).toBeNull();
    unmount();

    rendre(donneesInitiales(), false);
    fireEvent.change(screen.getByLabelText('Rechercher un salarie'), {
      target: { value: 'introuvable' },
    });
    expect(screen.getByTestId('vide-recherche').textContent).toContain(
      'Aucun salarie ne correspond a votre recherche.'
    );
    expect(screen.queryByTestId('vide-societe')).toBeNull();
  });

  it('21 — le bouton Charger plus disparait quand prochainCurseur est nul', () => {
    rendre(donneesInitiales({ items: [ligne('1')], prochainCurseur: 'suite' }), false);
    expect(screen.getByRole('button', { name: 'Charger plus' })).toBeTruthy();
    cleanup();

    rendre(donneesInitiales({ items: [ligne('1')], prochainCurseur: null }), false);
    expect(screen.queryByRole('button', { name: 'Charger plus' })).toBeNull();
  });

  it('aucun appel API au premier affichage — aucun filtre envoye', () => {
    rendre(donneesInitiales({ items: [ligne('1')] }), false);

    expect(listerSalaries).not.toHaveBeenCalled();
  });

  it('filtre etat Actifs envoie etat ACTIF a l API', async () => {
    listerSalaries.mockResolvedValue({
      donnees: donneesInitiales({ items: [ligne('1')] }),
    });

    rendre(donneesInitiales({ items: [ligne('0')] }), false);

    fireEvent.change(screen.getByLabelText('Filtrer par etat'), { target: { value: 'ACTIF' } });

    await waitFor(() => {
      expect(listerSalaries).toHaveBeenCalledWith('soc-1', {
        recherche: undefined,
        etat: 'ACTIF',
        etablissementId: undefined,
        curseur: undefined,
      });
    });
  });

  it('filtre etat Inactifs envoie etat INACTIF a l API', async () => {
    listerSalaries.mockResolvedValue({
      donnees: donneesInitiales({ items: [ligne('1')] }),
    });

    rendre(donneesInitiales({ items: [ligne('0')] }), false);

    fireEvent.change(screen.getByLabelText('Filtrer par etat'), { target: { value: 'INACTIF' } });

    await waitFor(() => {
      expect(listerSalaries).toHaveBeenCalledWith('soc-1', {
        recherche: undefined,
        etat: 'INACTIF',
        etablissementId: undefined,
        curseur: undefined,
      });
    });
  });

  it('filtre etablissement envoie etablissementId et non le libelle', async () => {
    listerSalaries.mockResolvedValue({
      donnees: donneesInitiales({ items: [ligne('1')] }),
    });

    rendre(donneesInitiales({ items: [ligne('0')] }), false);

    fireEvent.change(screen.getByLabelText('Filtrer par etablissement'), {
      target: { value: 'etab-1' },
    });

    await waitFor(() => {
      expect(listerSalaries).toHaveBeenCalledWith('soc-1', {
        recherche: undefined,
        etat: undefined,
        etablissementId: 'etab-1',
        curseur: undefined,
      });
    });

    const appels = listerSalaries.mock.calls.flat();
    expect(
      appels.some(
        (valeur) =>
          typeof valeur === 'object' &&
          'etablissementId' in valeur &&
          valeur.etablissementId === 'Siege Casablanca'
      )
    ).toBe(false);
  });

  it('filtre combine recherche et etat envoie les deux parametres', async () => {
    listerSalaries.mockResolvedValue({
      donnees: donneesInitiales({ items: [ligne('1')] }),
    });

    rendre(donneesInitiales({ items: [ligne('0')] }), false);

    fireEvent.change(screen.getByLabelText('Filtrer par etat'), { target: { value: 'ACTIF' } });
    fireEvent.change(screen.getByLabelText('Rechercher un salarie'), {
      target: { value: 'benali' },
    });

    await waitFor(
      () => {
        expect(listerSalaries).toHaveBeenCalledWith('soc-1', {
          recherche: 'benali',
          etat: 'ACTIF',
          etablissementId: undefined,
          curseur: undefined,
        });
      },
      { timeout: 2000 }
    );
  });

  it('transmet le companyId recu en prop a listerSalaries', async () => {
    listerSalaries.mockResolvedValue({
      donnees: donneesInitiales({ items: [ligne('1')] }),
    });

    render(
      <ListeSalariesClient
        companyId="soc-depuis-url"
        initial={donneesInitiales({ items: [ligne('0')] })}
        etablissements={[{ id: 'etab-1', nom: 'Siege Casablanca' } as never]}
        societeSansSalaries={false}
      />
    );

    fireEvent.change(screen.getByLabelText('Filtrer par etat'), { target: { value: 'ACTIF' } });

    await waitFor(() => {
      expect(listerSalaries).toHaveBeenCalledWith('soc-depuis-url', expect.any(Object));
    });
  });

  it('affiche les sept colonnes attendues sur une ligne', () => {
    rendre(
      donneesInitiales({
        items: [
          ligne('1', {
            matricule: 'M-001',
            nom: 'Alami',
            prenom: 'Karim',
            etat: 'INACTIF',
            dateEntree: '2024-06-01',
            poste: 'Developpeur',
            nombreEmploisOuverts: 1,
            etablissement: { id: 'etab-2', libelle: 'Agence Rabat' },
          }),
        ],
      }),
      false
    );

    for (const libelle of [
      'Matricule',
      'Nom',
      'Prenom',
      'Etat',
      'Date d entree',
      'Poste',
      'Etablissement',
    ]) {
      expect(screen.getByRole('columnheader', { name: libelle })).toBeTruthy();
    }

    expect(screen.getByRole('link', { name: 'M-001' })).toBeTruthy();
    expect(screen.getByText('Alami')).toBeTruthy();
    expect(screen.getByText('Karim')).toBeTruthy();
    expect(screen.getByText('Inactif')).toBeTruthy();
    expect(screen.getByText('2024-06-01')).toBeTruthy();
    expect(screen.getByText('Developpeur')).toBeTruthy();
    expect(screen.getByText('Agence Rabat')).toBeTruthy();
  });

  it('affiche N emplois dans la colonne poste quand plusieurs emplois ouverts', () => {
    rendre(
      donneesInitiales({
        items: [ligne('1', { poste: 'Analyste', nombreEmploisOuverts: 2 })],
      }),
      false
    );

    expect(screen.getByText('2 emplois')).toBeTruthy();
  });

  it('changer un filtre apres accumulation reinitialise liste et curseur', async () => {
    rendre(
      donneesInitiales({
        items: [ligne('page-1-a'), ligne('page-1-b')],
        prochainCurseur: 'curseur-page-2',
      }),
      false
    );

    listerSalaries.mockResolvedValueOnce({
      donnees: {
        items: [ligne('page-2-a')],
        prochainCurseur: null,
        operations: [],
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Charger plus' }));

    await waitFor(() => {
      expect(listerSalaries).toHaveBeenCalledWith('soc-1', {
        recherche: undefined,
        etat: undefined,
        etablissementId: undefined,
        curseur: 'curseur-page-2',
      });
    });
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'MAT-page-2-a' })).toBeTruthy();
    });

    listerSalaries.mockResolvedValueOnce({
      donnees: {
        items: [ligne('actif-seul', { etat: 'ACTIF', matricule: 'ACT-001' })],
        prochainCurseur: 'nouveau-curseur',
        operations: [],
      },
    });

    fireEvent.change(screen.getByLabelText('Filtrer par etat'), { target: { value: 'ACTIF' } });

    await waitFor(() => {
      expect(listerSalaries).toHaveBeenLastCalledWith('soc-1', {
        recherche: undefined,
        etat: 'ACTIF',
        etablissementId: undefined,
        curseur: undefined,
      });
    });

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'ACT-001' })).toBeTruthy();
    });
    expect(screen.queryByRole('link', { name: 'MAT-page-1-a' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'MAT-page-1-b' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'MAT-page-2-a' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Charger plus' })).toBeTruthy();
  });

  it('le matricule est un lien vers la fiche du salarie', () => {
    rendre(
      donneesInitiales({
        items: [ligne('salarie-abc', { matricule: 'M-001' })],
      }),
      false
    );

    const lien = screen.getByRole('link', { name: 'M-001' });
    expect(lien.getAttribute('href')).toBe('/societes/soc-1/salaries/salarie-abc');
  });

  it('un clic sur le matricule ne declenche pas aussi la navigation de la ligne', () => {
    rendre(
      donneesInitiales({
        items: [ligne('salarie-abc', { matricule: 'M-001' })],
      }),
      false
    );

    fireEvent.click(screen.getByRole('link', { name: 'M-001' }));

    expect(routerPush).not.toHaveBeenCalled();
  });

  it('Creer un salarie est absent du DOM sans salarie.creer', () => {
    rendre(donneesInitiales({ operations: ['salarie.lire'] }), true);
    expect(screen.queryByRole('button', { name: 'Creer un salarie' })).toBeNull();
  });

  it('Creer un salarie est present avec salarie.creer', () => {
    rendre(donneesInitiales({ operations: ['salarie.lire', 'salarie.creer'] }), true);
    expect(screen.getByRole('button', { name: 'Creer un salarie' })).toBeTruthy();
  });
});
