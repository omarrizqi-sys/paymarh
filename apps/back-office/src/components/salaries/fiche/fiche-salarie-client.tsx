'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { flushSync } from 'react-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Pays, SituationFamiliale } from '@paymarh/shared-types';
import type { FicheSalarieAvecOperations } from '@/lib/api/salaries';
import { lireSalarie } from '@/lib/api/salaries';
import { possedePermission } from '@/lib/permissions';
import {
  AvertissementNavigationFiche,
  confirmerNavigationAvecModifications,
} from './avertissement-navigation';
import { RegistreFicheProvider, useRegistreFiche } from './registre-fiche-provider';
import { RubriqueIdentite, type ValeursIdentite } from './rubrique-identite';
import {
  RubriqueIdentifiantsLegaux,
  type ValeursIdentifiantsLegaux,
} from './rubrique-identifiants-legaux';
import { RubriqueCoordonnees, type ValeursCoordonnees } from './rubrique-coordonnees';
import { RubriqueDates, type ValeursDates } from './rubrique-dates';
import { RubriqueRemunerationPlaceholder } from './rubrique-remuneration-placeholder';
import { RailActionsFiche } from './rail-actions-fiche';
import { SommaireRubriques } from './sommaire-rubriques';
import { SqueletteFicheSalarie } from './squelette-fiche-salarie';

interface Props {
  readonly companyId: string;
  readonly salarieId: string;
  readonly initial: FicheSalarieAvecOperations;
  readonly pays: readonly Pays[];
  readonly situationsFamiliales: readonly SituationFamiliale[];
}

function SyncVersion({ version }: { readonly version: number }) {
  const { mettreAJourVersion } = useRegistreFiche();
  useEffect(() => {
    mettreAJourVersion(version);
  }, [mettreAJourVersion, version]);
  return null;
}

function LienRetourListe({ companyId }: { readonly companyId: string }) {
  const { rubriquesSommaire } = useRegistreFiche();
  const libelles = rubriquesSommaire.filter((r) => r.modifiee).map((r) => r.libelle);

  return (
    <Link
      href={`/societes/${companyId}/salaries`}
      className="text-primary mb-4 inline-block text-sm hover:underline"
      onClick={(event) => {
        if (!confirmerNavigationAvecModifications(libelles)) {
          event.preventDefault();
        }
      }}
    >
      ← Retour a la liste
    </Link>
  );
}

function ContenuFicheSalarie({
  companyId,
  salarieId,
  fiche,
  pays,
  situationsFamiliales,
  onFicheChange,
}: {
  readonly companyId: string;
  readonly salarieId: string;
  readonly fiche: FicheSalarieAvecOperations;
  readonly pays: readonly Pays[];
  readonly situationsFamiliales: readonly SituationFamiliale[];
  readonly onFicheChange: (fiche: FicheSalarieAvecOperations) => void;
}) {
  const [rubriqueVisibleId, setRubriqueVisibleId] = useState<string | undefined>();

  const appliquerSlice = useCallback(
    (patch: Partial<FicheSalarieAvecOperations>) => {
      onFicheChange({ ...fiche, ...patch });
    },
    [fiche, onFicheChange]
  );

  const valeursIdentite = useMemo(
    (): ValeursIdentite => ({
      nom: fiche.nom,
      prenom: fiche.prenom,
      sexe: fiche.sexe,
      dateNaissance: fiche.dateNaissance,
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
                  libelleSituationEnregistree={fiche.situationFamiliale.libelle}
                  onServeurChange={(valeurs, version, extras) =>
                    appliquerSlice({
                      nom: valeurs.nom,
                      prenom: valeurs.prenom,
                      sexe: valeurs.sexe,
                      dateNaissance: valeurs.dateNaissance,
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
                  onServeurChange={(valeurs, version) => appliquerSlice({ ...valeurs, version })}
                />
                <RubriqueCoordonnees
                  companyId={companyId}
                  salarieId={salarieId}
                  valeurs={valeursCoordonnees}
                  pays={pays}
                  onServeurChange={(valeurs, version) => appliquerSlice({ ...valeurs, version })}
                />
                <RubriqueDates
                  companyId={companyId}
                  salarieId={salarieId}
                  valeurs={valeursDates}
                  dateSortie={fiche.dateSortie}
                  onServeurChange={(valeurs, version) => appliquerSlice({ ...valeurs, version })}
                />
              </>
            ) : null}
            <RubriqueRemunerationPlaceholder operations={fiche.operations} />
          </>
        }
        renderRail={(compact) => (
          <RailActionsFiche operations={fiche.operations} modeCompact={compact} />
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
}: Props) {
  const router = useRouter();
  const [fiche, setFiche] = useState(initial);

  const rechargerServeur = useCallback(async () => {
    const reponse = await lireSalarie(companyId, salarieId);
    flushSync(() => {
      setFiche(reponse.donnees);
    });
    router.refresh();
  }, [companyId, router, salarieId]);

  return (
    <RegistreFicheProvider
      versionInitiale={initial.version}
      onRechargerServeur={rechargerServeur}
      onApresEnregistrement={(version) => setFiche((prev) => ({ ...prev, version }))}
    >
      <LienRetourListe companyId={companyId} />
      <ContenuFicheSalarie
        companyId={companyId}
        salarieId={salarieId}
        fiche={fiche}
        pays={pays}
        situationsFamiliales={situationsFamiliales}
        onFicheChange={setFiche}
      />
    </RegistreFicheProvider>
  );
}
