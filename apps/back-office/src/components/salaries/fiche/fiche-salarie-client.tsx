'use client';

import { flushSync } from 'react-dom';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import type {
  Banque,
  LienParente,
  Pays,
  SituationFamiliale,
  TypeSaisieSurSalaire,
} from '@paymarh/shared-types';
import type { FicheSalarieAvecOperations } from '@/lib/api/salaries';
import { lireSalarie } from '@/lib/api/salaries';
import { possedePermission } from '@/lib/permissions';
import { consommerAlertesCreationSalarie } from '@/lib/fiche/transport-alertes-creation-salarie';
import { repartirAlertesCreation } from '@/lib/fiche/repartir-alertes-creation';
import { AvertissementNavigationFiche } from './avertissement-navigation';
import { useDeclarerSaisiePerdable } from '@/components/navigation/saisie-perdable-racine';
import { RegistreFicheProvider, useRegistreFiche } from './registre-fiche-provider';
import { RubriqueIdentite, type ValeursIdentite } from './rubrique-identite';
import {
  RubriqueIdentifiantsLegaux,
  type ValeursIdentifiantsLegaux,
} from './rubrique-identifiants-legaux';
import { RubriqueCoordonnees, type ValeursCoordonnees } from './rubrique-coordonnees';
import { RubriqueDates, type ValeursDates } from './rubrique-dates';
import { RubriquePersonnesACharge } from './rubrique-personnes-a-charge';
import { RubriqueComptesBancaires } from './rubrique-comptes-bancaires';
import { RubriquePrets } from './rubrique-prets';
import { RubriqueSaisiesSurSalaire } from './rubrique-saisies-sur-salaire';
import { RubriqueRemunerationPlaceholder } from './rubrique-remuneration-placeholder';
import { FormulaireTableauProvider } from './contexte-formulaire-tableau';
import { RailActionsFiche } from './rail-actions-fiche';
import { SommaireRubriques, useDefilementRubriqueSommaire } from './sommaire-rubriques';
import { SqueletteFicheSalarie } from './squelette-fiche-salarie';
import { LienGarde, useNavigationGardee } from '@/components/navigation/navigation-gardee';

interface Props {
  readonly companyId: string;
  readonly salarieId: string;
  readonly initial: FicheSalarieAvecOperations;
  readonly pays: readonly Pays[];
  readonly situationsFamiliales: readonly SituationFamiliale[];
  readonly liensParente: readonly LienParente[];
  readonly banques: readonly Banque[];
  readonly typesSaisie: readonly TypeSaisieSurSalaire[];
}

function SyncVersion({ version }: { readonly version: number }) {
  const { mettreAJourVersion } = useRegistreFiche();
  useEffect(() => {
    mettreAJourVersion(version);
  }, [mettreAJourVersion, version]);
  return null;
}

function DeclarerSaisiePerdableFiche() {
  const { aModificationsNonEnregistrees, libellesRubriquesModifiees } = useRegistreFiche();
  useDeclarerSaisiePerdable(aModificationsNonEnregistrees, libellesRubriquesModifiees);
  return null;
}

function LienRetourListe({ companyId }: { readonly companyId: string }) {
  return (
    <LienGarde
      href={`/societes/${companyId}/salaries`}
      className="text-primary mb-4 inline-block text-sm hover:underline"
    >
      ← Retour à la liste
    </LienGarde>
  );
}

function ContenuFicheSalarie({
  companyId,
  salarieId,
  fiche,
  pays,
  situationsFamiliales,
  liensParente,
  banques,
  typesSaisie,
  onFicheChange,
}: {
  readonly companyId: string;
  readonly salarieId: string;
  readonly fiche: FicheSalarieAvecOperations;
  readonly pays: readonly Pays[];
  readonly situationsFamiliales: readonly SituationFamiliale[];
  readonly liensParente: readonly LienParente[];
  readonly banques: readonly Banque[];
  readonly typesSaisie: readonly TypeSaisieSurSalaire[];
  readonly onFicheChange: Dispatch<SetStateAction<FicheSalarieAvecOperations>>;
}) {
  const [rubriqueVisibleId, setRubriqueVisibleId] = useState<string | undefined>();
  const [alertesCreation] = useState(() => consommerAlertesCreationSalarie(salarieId) ?? []);
  const alertesParBloc = useMemo(() => repartirAlertesCreation(alertesCreation), [alertesCreation]);

  useDefilementRubriqueSommaire(rubriqueVisibleId);

  const appliquerSlice = useCallback(
    (patch: Partial<FicheSalarieAvecOperations>) => {
      onFicheChange((prev) => ({ ...prev, ...patch }));
    },
    [onFicheChange]
  );

  const valeursIdentite = useMemo(
    (): ValeursIdentite => ({
      nom: fiche.nom,
      prenom: fiche.prenom,
      sexe: fiche.sexe,
      dateNaissance: fiche.dateNaissance ?? '',
      villeNaissance: fiche.villeNaissance ?? '',
      paysNaissanceId: fiche.paysNaissanceId ?? '',
      nationaliteId: fiche.nationaliteId ?? '',
      situationFamilialeCode: fiche.situationFamiliale.code ?? '',
    }),
    [
      fiche.nom,
      fiche.prenom,
      fiche.sexe,
      fiche.dateNaissance,
      fiche.villeNaissance,
      fiche.paysNaissanceId,
      fiche.nationaliteId,
      fiche.situationFamiliale.code,
    ]
  );

  const valeursIdentifiantsLegaux = useMemo(
    (): ValeursIdentifiantsLegaux => ({
      matricule: fiche.matricule,
      numeroPiece: fiche.numeroPiece ?? '',
      numeroCnss: fiche.numeroCnss ?? '',
      numeroCimr: fiche.numeroCimr ?? '',
    }),
    [fiche.matricule, fiche.numeroPiece, fiche.numeroCnss, fiche.numeroCimr]
  );

  const valeursCoordonnees = useMemo(
    (): ValeursCoordonnees => ({
      adresse: fiche.adresse ?? '',
      complementAdresse: fiche.complementAdresse ?? '',
      codePostal: fiche.codePostal ?? '',
      ville: fiche.ville ?? '',
      paysId: fiche.paysId ?? '',
      telephonePersonnel: fiche.telephonePersonnel ?? '',
      telephoneProfessionnel: fiche.telephoneProfessionnel ?? '',
      emailPersonnel: fiche.emailPersonnel ?? '',
      emailProfessionnel: fiche.emailProfessionnel ?? '',
      urgencePrenom: fiche.urgencePrenom ?? '',
      urgenceNom: fiche.urgenceNom ?? '',
      urgenceTelephone: fiche.urgenceTelephone ?? '',
      urgenceEmail: fiche.urgenceEmail ?? '',
    }),
    [
      fiche.adresse,
      fiche.complementAdresse,
      fiche.codePostal,
      fiche.ville,
      fiche.paysId,
      fiche.telephonePersonnel,
      fiche.telephoneProfessionnel,
      fiche.emailPersonnel,
      fiche.emailProfessionnel,
      fiche.urgencePrenom,
      fiche.urgenceNom,
      fiche.urgenceTelephone,
      fiche.urgenceEmail,
    ]
  );

  const valeursDates = useMemo(
    (): ValeursDates => ({
      dateEntree: fiche.dateEntree,
      dateAnciennete: fiche.dateAnciennete,
    }),
    [fiche.dateEntree, fiche.dateAnciennete]
  );

  return (
    <div className="space-y-4">
      <SyncVersion version={fiche.version} />
      <AvertissementNavigationFiche />

      <header className="space-y-1">
        <p className="text-muted-foreground text-sm">
          {fiche.matricule} — {fiche.etat} — mois {fiche.moisEnCours}
        </p>
        <h1 className="text-2xl font-semibold">
          {fiche.prenom} {fiche.nom}
        </h1>
      </header>

      <SqueletteFicheSalarie
        sommaire={
          <SommaireRubriques
            rubriqueVisibleId={rubriqueVisibleId}
            onRubriqueVisibleChange={setRubriqueVisibleId}
          />
        }
        rubriques={
          <>
            {possedePermission(fiche.operations, 'salarie.modifier') ? (
              <>
                <RubriqueIdentite
                  companyId={companyId}
                  salarieId={salarieId}
                  valeurs={valeursIdentite}
                  pays={pays}
                  situationsFamiliales={situationsFamiliales}
                  alertesExternes={
                    alertesParBloc.identite.length > 0 ? alertesParBloc.identite : undefined
                  }
                  onServeurChange={(valeurs, version, extras) =>
                    appliquerSlice({
                      nom: valeurs.nom,
                      prenom: valeurs.prenom,
                      sexe: valeurs.sexe,
                      dateNaissance: valeurs.dateNaissance === '' ? null : valeurs.dateNaissance,
                      villeNaissance: valeurs.villeNaissance === '' ? null : valeurs.villeNaissance,
                      paysNaissanceId:
                        valeurs.paysNaissanceId === '' ? null : valeurs.paysNaissanceId,
                      nationaliteId: valeurs.nationaliteId === '' ? null : valeurs.nationaliteId,
                      situationFamiliale: extras.situationFamiliale,
                      typePieceIdentite: extras.typePieceIdentite,
                      version,
                    })
                  }
                />
                <RubriqueIdentifiantsLegaux
                  companyId={companyId}
                  salarieId={salarieId}
                  valeurs={valeursIdentifiantsLegaux}
                  typePieceIdentite={fiche.typePieceIdentite}
                  alertesExternes={
                    alertesParBloc['identifiants-legaux'].length > 0
                      ? alertesParBloc['identifiants-legaux']
                      : undefined
                  }
                  onServeurChange={(valeurs, version) => appliquerSlice({ ...valeurs, version })}
                />
                <RubriqueCoordonnees
                  companyId={companyId}
                  salarieId={salarieId}
                  valeurs={valeursCoordonnees}
                  pays={pays}
                  alertesExternes={
                    alertesParBloc.coordonnees.length > 0 ? alertesParBloc.coordonnees : undefined
                  }
                  onServeurChange={(valeurs, version) => appliquerSlice({ ...valeurs, version })}
                />
                <RubriquePersonnesACharge
                  companyId={companyId}
                  salarieId={salarieId}
                  lignesServeur={fiche.personnesACharge}
                  liensParente={liensParente}
                  onVersionChange={(version) => appliquerSlice({ version })}
                />
                {'comptesBancaires' in fiche ? (
                  <RubriqueComptesBancaires
                    companyId={companyId}
                    salarieId={salarieId}
                    comptesServeur={fiche.comptesBancaires ?? []}
                    banques={banques}
                    operations={fiche.operations}
                    onComptesChange={(comptes, version) =>
                      appliquerSlice({ comptesBancaires: comptes, version })
                    }
                  />
                ) : null}
                <RubriqueDates
                  companyId={companyId}
                  salarieId={salarieId}
                  valeurs={valeursDates}
                  dateSortie={fiche.dateSortie}
                  alertesExternes={
                    alertesParBloc.dates.length > 0 ? alertesParBloc.dates : undefined
                  }
                  onServeurChange={(valeurs, version) => appliquerSlice({ ...valeurs, version })}
                />
                <RubriquePrets
                  companyId={companyId}
                  salarieId={salarieId}
                  lignesServeur={fiche.prets}
                  onVersionChange={(version) => appliquerSlice({ version })}
                />
                <RubriqueSaisiesSurSalaire
                  companyId={companyId}
                  salarieId={salarieId}
                  lignesServeur={fiche.saisiesSurSalaire}
                  typesSaisie={typesSaisie}
                  onVersionChange={(version) => appliquerSlice({ version })}
                />
              </>
            ) : null}
            <RubriqueRemunerationPlaceholder operations={fiche.operations} />
          </>
        }
        renderRail={(compact) => (
          <RailActionsFiche
            operations={fiche.operations}
            companyId={companyId}
            salarieId={salarieId}
            modeCompact={compact}
          />
        )}
      />
    </div>
  );
}

export function FicheSalarieClient({
  companyId,
  salarieId,
  initial,
  pays,
  situationsFamiliales,
  liensParente,
  banques,
  typesSaisie,
}: Props) {
  const [fiche, setFiche] = useState(initial);
  const refreshRef = useRef<() => void>(() => undefined) as MutableRefObject<() => void>;

  const onRechargerServeur = useCallback(async () => {
    const reponse = await lireSalarie(companyId, salarieId);
    flushSync(() => {
      setFiche(reponse.donnees);
    });
    refreshRef.current();
  }, [companyId, salarieId]);

  return (
    <RegistreFicheProvider
      versionInitiale={initial.version}
      onRechargerServeur={onRechargerServeur}
      onApresEnregistrement={(version) => setFiche((prev) => ({ ...prev, version }))}
    >
      <DeclarerSaisiePerdableFiche />
      <LiaisonRefreshNavigation refreshRef={refreshRef} />
      <LienRetourListe companyId={companyId} />
      <FormulaireTableauProvider>
        <ContenuFicheSalarie
          companyId={companyId}
          salarieId={salarieId}
          fiche={fiche}
          pays={pays}
          situationsFamiliales={situationsFamiliales}
          liensParente={liensParente}
          banques={banques}
          typesSaisie={typesSaisie}
          onFicheChange={setFiche}
        />
      </FormulaireTableauProvider>
    </RegistreFicheProvider>
  );
}

function LiaisonRefreshNavigation({
  refreshRef,
}: {
  readonly refreshRef: MutableRefObject<() => void>;
}) {
  const { refresh } = useNavigationGardee();
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh, refreshRef]);
  return null;
}
