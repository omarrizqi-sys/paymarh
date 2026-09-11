'use client';

import { flushSync } from 'react-dom';
import { useMemo, useState } from 'react';
import type { AlerteApi, Pays, SituationFamiliale } from '@paymarh/shared-types';
import { SqueletteFicheSalarie } from '@/components/salaries/fiche/squelette-fiche-salarie';
import {
  SommaireRubriques,
  useDefilementRubriqueSommaire,
} from '@/components/salaries/fiche/sommaire-rubriques';
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
import { repartirAlertesCreation } from '@/lib/fiche/repartir-alertes-creation';
import { deposerAlertesCreationSalarie } from '@/lib/fiche/transport-alertes-creation-salarie';
import { RailActionsCreation } from './rail-actions-creation';
import { RegistreCreationProvider, useRegistreCreation } from './registre-creation-provider';
import { AvertissementNavigationCreation } from '@/components/salaries/fiche/avertissement-navigation';
import { LienGarde, useNavigationGardee } from '@/components/navigation/navigation-gardee';
import { useDeclarerSaisiePerdable } from '@/components/navigation/saisie-perdable-racine';

const VALEURS_IDENTITE_VIDES: ValeursIdentite = {
  nom: '',
  prenom: '',
  sexe: 'HOMME',
  dateNaissance: '',
  villeNaissance: '',
  paysNaissanceId: '',
  nationaliteId: '',
  situationFamilialeCode: '',
};

const VALEURS_IDENTIFIANTS_VIDES: ValeursIdentifiantsLegaux = {
  matricule: '',
  numeroPiece: '',
  numeroCnss: '',
  numeroCimr: '',
};

const VALEURS_COORDONNEES_VIDES: ValeursCoordonnees = {
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

const VALEURS_DATES_VIDES: ValeursDates = {
  dateEntree: '',
  dateAnciennete: '',
};

function noopServeurChange(): void {
  return undefined;
}

interface Props {
  readonly companyId: string;
  readonly pays: readonly Pays[];
  readonly situationsFamiliales: readonly SituationFamiliale[];
}

function DeclarerSaisiePerdableCreation() {
  const { aModificationsNonEnregistrees, libellesRubriquesModifiees } = useRegistreCreation();
  useDeclarerSaisiePerdable(aModificationsNonEnregistrees, libellesRubriquesModifiees);
  return null;
}

function ContenuCreationSalarie({ companyId, pays, situationsFamiliales }: Props) {
  const { push } = useNavigationGardee();
  const { creer, annuler, rubriquesSommaire } = useRegistreCreation();
  const [alertesRefus, setAlertesRefus] = useState<readonly AlerteApi[]>([]);
  const [erreurGenerique, setErreurGenerique] = useState<string | undefined>();
  const [rubriqueVisibleId, setRubriqueVisibleId] = useState<string | undefined>();

  useDefilementRubriqueSommaire(rubriqueVisibleId);

  const parBloc = useMemo(() => repartirAlertesCreation(alertesRefus), [alertesRefus]);

  const entreesSommaire = useMemo(() => rubriquesSommaire, [rubriquesSommaire]);

  async function soumettre(): Promise<void> {
    setAlertesRefus([]);
    setErreurGenerique(undefined);
    const resultat = await creer();
    if (resultat.ok) {
      deposerAlertesCreationSalarie(resultat.salarieId, resultat.alertes);
      annuler();
      push(`/societes/${companyId}/salaries/${resultat.salarieId}`);
      return;
    }
    flushSync(() => {
      setAlertesRefus(resultat.alertes);
      setErreurGenerique(resultat.erreurGenerique);
    });
  }

  return (
    <div className="space-y-4">
      <AvertissementNavigationCreation />
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Nouveau salarié</h1>
      </header>

      <SqueletteFicheSalarie
        sommaire={
          <SommaireRubriques
            entrees={entreesSommaire}
            rubriqueVisibleId={rubriqueVisibleId}
            onRubriqueVisibleChange={setRubriqueVisibleId}
          />
        }
        rubriques={
          <>
            <RubriqueIdentite
              companyId={companyId}
              valeurs={VALEURS_IDENTITE_VIDES}
              pays={pays}
              situationsFamiliales={situationsFamiliales}
              alertesExternes={parBloc.identite.length > 0 ? parBloc.identite : undefined}
              erreurExterne={erreurGenerique ?? null}
              onServeurChange={noopServeurChange}
            />
            <RubriqueIdentifiantsLegaux
              companyId={companyId}
              valeurs={VALEURS_IDENTIFIANTS_VIDES}
              typePieceIdentite={null}
              matriculeFacultatif
              alertesExternes={
                parBloc['identifiants-legaux'].length > 0
                  ? parBloc['identifiants-legaux']
                  : undefined
              }
              onServeurChange={noopServeurChange}
            />
            <RubriqueCoordonnees
              companyId={companyId}
              valeurs={VALEURS_COORDONNEES_VIDES}
              pays={pays}
              alertesExternes={parBloc.coordonnees.length > 0 ? parBloc.coordonnees : undefined}
              onServeurChange={noopServeurChange}
            />
            <RubriqueDates
              companyId={companyId}
              valeurs={VALEURS_DATES_VIDES}
              afficherDateSortie={false}
              alertesExternes={parBloc.dates.length > 0 ? parBloc.dates : undefined}
              onServeurChange={noopServeurChange}
            />
          </>
        }
        renderRail={(compact) => (
          <RailActionsCreation
            modeCompact={compact}
            onCreer={() => void soumettre()}
            onAnnuler={() => {
              setAlertesRefus([]);
              setErreurGenerique(undefined);
            }}
          />
        )}
      />
    </div>
  );
}

export function EcranCreationSalarie(props: Props) {
  return (
    <RegistreCreationProvider companyId={props.companyId}>
      <DeclarerSaisiePerdableCreation />
      <LienGarde
        href={`/societes/${props.companyId}/salaries`}
        className="text-primary mb-4 inline-block text-sm hover:underline"
      >
        ← Retour à la liste
      </LienGarde>
      <ContenuCreationSalarie {...props} />
    </RegistreCreationProvider>
  );
}
