// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import type { Pays, SituationFamiliale } from '@paymarh/shared-types';
import {
  RubriqueIdentite,
  type ValeursIdentite,
} from '@/components/salaries/fiche/rubrique-identite';
import {
  RubriqueIdentifiantsLegaux,
  type ValeursIdentifiantsLegaux,
} from '@/components/salaries/fiche/rubrique-identifiants-legaux';
import {
  RubriqueCoordonnees,
  type ValeursCoordonnees,
} from '@/components/salaries/fiche/rubrique-coordonnees';
import { RubriqueDates, type ValeursDates } from '@/components/salaries/fiche/rubrique-dates';
import { useRegistreCreation } from '@/lib/fiche/contexte-registre-creation';
import { RegistreCreationProvider } from './registre-creation-provider';

const PAYS: readonly Pays[] = [{ id: 'pays-ma', ordre: 1, codeIso: 'MA', libelle: 'Maroc' }];

const SITUATIONS: readonly SituationFamiliale[] = [
  {
    id: 'sf-1',
    code: 'CELIBATAIRE',
    libelleMasculin: 'Celibataire',
    libelleFeminin: 'Celibataire',
  },
];

const IDENTITE_VIDE: ValeursIdentite = {
  nom: '',
  prenom: '',
  sexe: 'HOMME',
  dateNaissance: '',
  villeNaissance: '',
  paysNaissanceId: '',
  nationaliteId: '',
  situationFamilialeCode: '',
};

const IDENTIFIANTS_VIDES: ValeursIdentifiantsLegaux = {
  matricule: '',
  numeroPiece: '',
  numeroCnss: '',
  numeroCimr: '',
};

const COORDONNEES_VIDES: ValeursCoordonnees = {
  adresse: '',
  complementAdresse: '',
  codePostal: '',
  ville: '',
  paysId: '',
  telephonePersonnel: '',
  telephoneProfessionnel: '',
  emailPersonnel: '',
  emailProfessionnel: '',
  urgencePrenom: '',
  urgenceNom: '',
  urgenceTelephone: '',
  urgenceEmail: '',
};

const DATES_VIDES: ValeursDates = {
  dateEntree: '',
  dateAnciennete: '',
};

function Capturer({ id }: { readonly id: string }) {
  const { lireValeurs } = useRegistreCreation();
  return (
    <button
      type="button"
      onClick={() => {
        const noeud = document.getElementById(`valeurs-${id}`);
        if (noeud) noeud.textContent = JSON.stringify(lireValeurs(id));
      }}
    >
      capturer
    </button>
  );
}

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

function envelopper(contenu: ReactNode, id: string) {
  return render(
    <RegistreCreationProvider companyId="soc-1">
      {contenu}
      <pre id={`valeurs-${id}`} />
      <Capturer id={id} />
    </RegistreCreationProvider>
  );
}

describe('Livraison des valeurs au registre de creation', () => {
  afterEach(() => cleanup());

  it('le bloc Identite livre ses valeurs saisies au registre de creation', () => {
    envelopper(
      <RubriqueIdentite
        companyId="soc-1"
        valeurs={IDENTITE_VIDE}
        pays={PAYS}
        situationsFamiliales={SITUATIONS}
        onServeurChange={() => undefined}
      />,
      'identite'
    );

    fireEvent.change(champ('nom'), { target: { value: 'Alaoui' } });
    fireEvent.change(champ('prenom'), { target: { value: 'Karim' } });
    fireEvent.change(select('sexe'), { target: { value: 'FEMME' } });
    fireEvent.change(champ('dateNaissance'), { target: { value: '1991-03-04' } });
    fireEvent.change(champ('villeNaissance'), { target: { value: 'Fes' } });
    fireEvent.change(select('paysNaissanceId'), { target: { value: 'pays-ma' } });
    fireEvent.change(select('nationaliteId'), { target: { value: 'pays-ma' } });
    fireEvent.change(select('situationFamilialeCode'), { target: { value: 'CELIBATAIRE' } });
    fireEvent.click(screen.getByRole('button', { name: 'capturer' }));

    expect(JSON.parse(document.getElementById('valeurs-identite')?.textContent ?? '')).toEqual({
      nom: 'Alaoui',
      prenom: 'Karim',
      sexe: 'FEMME',
      dateNaissance: '1991-03-04',
      villeNaissance: 'Fes',
      paysNaissanceId: 'pays-ma',
      nationaliteId: 'pays-ma',
      situationFamilialeCode: 'CELIBATAIRE',
    });
  });

  it('le bloc Identifiants livre ses valeurs saisies au registre de creation', () => {
    envelopper(
      <RubriqueIdentifiantsLegaux
        companyId="soc-1"
        valeurs={IDENTIFIANTS_VIDES}
        typePieceIdentite={null}
        matriculeFacultatif
        onServeurChange={() => undefined}
      />,
      'identifiants-legaux'
    );

    fireEvent.change(champ('matricule'), { target: { value: 'M-99' } });
    fireEvent.change(champ('numeroPiece'), { target: { value: 'AB123' } });
    fireEvent.change(champ('numeroCnss'), { target: { value: '001122' } });
    fireEvent.change(champ('numeroCimr'), { target: { value: '3344' } });
    fireEvent.click(screen.getByRole('button', { name: 'capturer' }));

    expect(
      JSON.parse(document.getElementById('valeurs-identifiants-legaux')?.textContent ?? '')
    ).toEqual({
      matricule: 'M-99',
      numeroPiece: 'AB123',
      numeroCnss: '001122',
      numeroCimr: '3344',
    });
  });

  it('le bloc Coordonnees livre ses valeurs saisies au registre de creation', () => {
    envelopper(
      <RubriqueCoordonnees
        companyId="soc-1"
        valeurs={COORDONNEES_VIDES}
        pays={PAYS}
        onServeurChange={() => undefined}
      />,
      'coordonnees'
    );

    fireEvent.change(champ('adresse'), { target: { value: '12 rue Atlas' } });
    fireEvent.change(champ('complementAdresse'), { target: { value: 'Appt 4' } });
    fireEvent.change(champ('codePostal'), { target: { value: '20000' } });
    fireEvent.change(champ('ville'), { target: { value: 'Casablanca' } });
    fireEvent.change(select('paysId'), { target: { value: 'pays-ma' } });
    fireEvent.change(champ('telephonePersonnel'), { target: { value: '0611223344' } });
    fireEvent.change(champ('telephoneProfessionnel'), { target: { value: '0522001122' } });
    fireEvent.change(champ('emailPersonnel'), { target: { value: 'p@ex.ma' } });
    fireEvent.change(champ('emailProfessionnel'), { target: { value: 'pro@ex.ma' } });
    fireEvent.change(champ('urgencePrenom'), { target: { value: 'Lina' } });
    fireEvent.change(champ('urgenceNom'), { target: { value: 'Amrani' } });
    fireEvent.change(champ('urgenceTelephone'), { target: { value: '0666778899' } });
    fireEvent.change(champ('urgenceEmail'), { target: { value: 'u@ex.ma' } });
    fireEvent.click(screen.getByRole('button', { name: 'capturer' }));

    expect(JSON.parse(document.getElementById('valeurs-coordonnees')?.textContent ?? '')).toEqual({
      adresse: '12 rue Atlas',
      complementAdresse: 'Appt 4',
      codePostal: '20000',
      ville: 'Casablanca',
      paysId: 'pays-ma',
      telephonePersonnel: '0611223344',
      telephoneProfessionnel: '0522001122',
      emailPersonnel: 'p@ex.ma',
      emailProfessionnel: 'pro@ex.ma',
      urgencePrenom: 'Lina',
      urgenceNom: 'Amrani',
      urgenceTelephone: '0666778899',
      urgenceEmail: 'u@ex.ma',
    });
  });

  it('le bloc Dates livre ses valeurs saisies au registre de creation', () => {
    envelopper(
      <RubriqueDates
        companyId="soc-1"
        valeurs={DATES_VIDES}
        afficherDateSortie={false}
        onServeurChange={() => undefined}
      />,
      'dates'
    );

    fireEvent.change(champ('dateEntree'), { target: { value: '2024-01-15' } });
    fireEvent.change(champ('dateAnciennete'), { target: { value: '2023-06-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'capturer' }));

    expect(JSON.parse(document.getElementById('valeurs-dates')?.textContent ?? '')).toEqual({
      dateEntree: '2024-01-15',
      dateAnciennete: '2023-06-01',
    });
  });
});
