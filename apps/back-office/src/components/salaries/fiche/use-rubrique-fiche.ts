'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { AlerteApi } from '@paymarh/shared-types';
import { AppelApiEchoue } from '@/lib/api/client';
import { estConflitVersion } from '@/lib/fiche/codes-conflit';
import type { EnvoiRubriqueResultat } from '@/lib/fiche/orchestrateur-enregistrement';
import { valeursStructurellementEgales } from '@/lib/egalite-valeurs';
import { useRegistreCreationOptionnel } from '@/lib/fiche/contexte-registre-creation';
import { MESSAGE_ERREUR_GENERIQUE } from '@/lib/messages-interface';
import { useRegistreFicheOptionnel } from './registre-fiche-provider';

export interface RubriqueFicheProps<T> {
  readonly id: string;
  readonly libelle: string;
  readonly valeursServeur: T;
  readonly estModifiee: (courant: T, serveur: T) => boolean;
  readonly envoyer: (version: number, courant: T) => Promise<EnvoiRubriqueResultat>;
  readonly onServeurChange: (valeurs: T, version: number) => void;
  readonly alertesExternes?: readonly AlerteApi[];
  /** `null` = effacer ; `undefined` = la fiche n utilise pas ce canal. */
  readonly erreurExterne?: string | null;
}

export function useRubriqueFiche<T>({
  id,
  libelle,
  valeursServeur,
  estModifiee,
  envoyer,
  onServeurChange,
  alertesExternes,
  erreurExterne,
}: RubriqueFicheProps<T>) {
  const fiche = useRegistreFicheOptionnel();
  const creation = useRegistreCreationOptionnel();

  const enregistrerRubriqueFiche = fiche?.enregistrerRubrique;
  const enregistrerRubriqueCreation = creation?.enregistrerRubrique;
  const notifierSommaire =
    fiche?.notifierSommaire ?? creation?.notifierSommaire ?? (() => undefined);
  const version = fiche?.version ?? 0;
  const enregistrementEnCours =
    fiche?.enregistrementEnCours ?? creation?.enregistrementEnCours ?? false;

  const [courant, setCourant] = useState(valeursServeur);
  const [erreur, setErreur] = useState<string | undefined>();
  const [alertes, setAlertes] = useState<readonly AlerteApi[]>(
    alertesExternes !== undefined ? alertesExternes : []
  );
  // Copie pendant le rendu (pas un effect) : le test de forme ValidationPipe
  // lit l alerte des le retour de fetch, avant le prochain effect.
  const [alertesExternesVues, setAlertesExternesVues] = useState(alertesExternes);
  if (alertesExternes !== alertesExternesVues) {
    setAlertesExternesVues(alertesExternes);
    if (alertesExternes !== undefined) {
      setAlertes(alertesExternes);
    }
  }
  const courantRef = useRef(courant);
  const envoyerRef = useRef(envoyer);
  envoyerRef.current = envoyer;
  const estModifieeRef = useRef(estModifiee);
  estModifieeRef.current = estModifiee;
  const valeursServeurRef = useRef(valeursServeur);
  const saisieUtilisateurRef = useRef(false);
  const notifierApresCommitRef = useRef(false);
  const reinitialiserRef = useRef(() => {
    courantRef.current = valeursServeurRef.current;
    setCourant(valeursServeurRef.current);
    setErreur(undefined);
    setAlertes([]);
    saisieUtilisateurRef.current = false;
    notifierApresCommitRef.current = true;
  });
  reinitialiserRef.current = () => {
    courantRef.current = valeursServeurRef.current;
    setCourant(valeursServeurRef.current);
    setErreur(undefined);
    setAlertes([]);
    saisieUtilisateurRef.current = false;
    notifierApresCommitRef.current = true;
  };

  useLayoutEffect(() => {
    if (valeursStructurellementEgales(valeursServeur, valeursServeurRef.current)) {
      valeursServeurRef.current = valeursServeur;
      return;
    }

    const ancienServeur = valeursServeurRef.current;
    const saisieLocale = saisieUtilisateurRef.current;

    valeursServeurRef.current = valeursServeur;

    if (saisieLocale && !valeursStructurellementEgales(valeursServeur, courantRef.current)) {
      return;
    }

    if (
      saisieLocale &&
      valeursStructurellementEgales(valeursServeur, courantRef.current) &&
      !valeursStructurellementEgales(ancienServeur, valeursServeur)
    ) {
      saisieUtilisateurRef.current = false;
    }

    courantRef.current = valeursServeur;
    setCourant(valeursServeur);
    saisieUtilisateurRef.current = false;
    notifierApresCommitRef.current = true;
  }, [valeursServeur]);

  useLayoutEffect(() => {
    if (!notifierApresCommitRef.current) {
      return;
    }
    notifierApresCommitRef.current = false;
    notifierSommaire();
  });

  useEffect(() => {
    if (erreurExterne === undefined) return;
    setErreur(erreurExterne === null ? undefined : erreurExterne);
  }, [erreurExterne]);

  useEffect(() => {
    if (enregistrerRubriqueCreation !== undefined) {
      return enregistrerRubriqueCreation({
        id,
        libelle,
        valeurs: () => courantRef.current,
        reinitialiser: () => reinitialiserRef.current(),
      });
    }

    if (enregistrerRubriqueFiche === undefined) {
      return undefined;
    }

    const lireEstModifiee = () =>
      estModifieeRef.current(courantRef.current, valeursServeurRef.current);

    return enregistrerRubriqueFiche({
      id,
      libelle,
      estModifiee: lireEstModifiee,
      reinitialiser: () => reinitialiserRef.current(),
      envoyer: async (versionEnvoi) => {
        setErreur(undefined);
        try {
          const resultat = await envoyerRef.current(versionEnvoi, courantRef.current);
          setAlertes(resultat.alertes);
          return resultat;
        } catch (erreurApi) {
          if (erreurApi instanceof AppelApiEchoue && estConflitVersion(erreurApi.erreur.code)) {
            throw erreurApi;
          }
          if (erreurApi instanceof AppelApiEchoue) {
            if (erreurApi.statut >= 500 || erreurApi.erreur.code === 'ERREUR') {
              setErreur(MESSAGE_ERREUR_GENERIQUE);
            } else if (erreurApi.erreur.champ !== undefined && erreurApi.erreur.champ.length > 0) {
              setAlertes([
                {
                  code: erreurApi.erreur.code,
                  message: erreurApi.erreur.message,
                  champ: erreurApi.erreur.champ,
                },
              ]);
            } else {
              setErreur(erreurApi.erreur.message);
            }
          } else if (erreurApi instanceof Error) {
            setErreur(erreurApi.message);
          }
          throw erreurApi;
        }
      },
    });
  }, [enregistrerRubriqueCreation, enregistrerRubriqueFiche, id, libelle]);

  if (fiche === null && creation === null) {
    throw new Error('useRubriqueFiche exige un registre de fiche ou de creation.');
  }

  const modifier = (patch: Partial<T>) => {
    if (enregistrementEnCours) return;
    setCourant((prev) => {
      const suivant = { ...prev, ...patch };
      courantRef.current = suivant;
      return suivant;
    });
    saisieUtilisateurRef.current = true;
    setAlertes([]);
    notifierApresCommitRef.current = true;
  };

  const reinitialiser = () => {
    reinitialiserRef.current();
  };

  const modifiee = estModifiee(courant, valeursServeur);

  return {
    courant,
    modifier,
    reinitialiser,
    erreur,
    alertes,
    version,
    modifiee,
    verrouille: enregistrementEnCours,
    appliquerServeur: (valeurs: T, nouvelleVersion: number) => {
      courantRef.current = valeurs;
      setCourant(valeurs);
      setErreur(undefined);
      setAlertes([]);
      saisieUtilisateurRef.current = false;
      valeursServeurRef.current = valeurs;
      onServeurChange(valeurs, nouvelleVersion);
    },
  };
}
