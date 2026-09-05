'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { AlerteApi } from '@paymarh/shared-types';
import { AppelApiEchoue } from '@/lib/api/client';
import { estConflitVersion } from '@/lib/fiche/codes-conflit';
import type { EnvoiRubriqueResultat } from '@/lib/fiche/orchestrateur-enregistrement';
import { valeursStructurellementEgales } from '@/lib/egalite-valeurs';
import { useRegistreFiche } from './registre-fiche-provider';

export interface RubriqueFicheProps<T> {
  readonly id: string;
  readonly libelle: string;
  readonly valeursServeur: T;
  readonly estModifiee: (courant: T, serveur: T) => boolean;
  readonly envoyer: (version: number, courant: T) => Promise<EnvoiRubriqueResultat>;
  readonly onServeurChange: (valeurs: T, version: number) => void;
}

export function useRubriqueFiche<T>({
  id,
  libelle,
  valeursServeur,
  estModifiee,
  envoyer,
  onServeurChange,
}: RubriqueFicheProps<T>) {
  const { enregistrerRubrique, notifierSommaire, version } = useRegistreFiche();
  const [courant, setCourant] = useState(valeursServeur);
  const [erreur, setErreur] = useState<string | undefined>();
  const [alertes, setAlertes] = useState<readonly AlerteApi[]>([]);
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
    const lireEstModifiee = () =>
      estModifieeRef.current(courantRef.current, valeursServeurRef.current);

    const desenregistrer = enregistrerRubrique({
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
          if (erreurApi instanceof Error) {
            setErreur(erreurApi.message);
          }
          throw erreurApi;
        }
      },
    });
    return desenregistrer;
  }, [enregistrerRubrique, id, libelle]);

  const modifier = (patch: Partial<T>) => {
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
