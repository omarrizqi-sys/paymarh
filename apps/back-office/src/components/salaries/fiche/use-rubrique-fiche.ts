'use client';

import { useEffect, useRef, useState } from 'react';
import type { AlerteApi } from '@paymarh/shared-types';
import { AppelApiEchoue } from '@/lib/api/client';
import { estConflitVersion } from '@/lib/fiche/codes-conflit';
import type { EnvoiRubriqueResultat } from '@/lib/fiche/orchestrateur-enregistrement';
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
  courantRef.current = courant;
  const envoyerRef = useRef(envoyer);
  envoyerRef.current = envoyer;
  const estModifieeRef = useRef(estModifiee);
  estModifieeRef.current = estModifiee;
  const valeursServeurRef = useRef(valeursServeur);
  valeursServeurRef.current = valeursServeur;

  useEffect(() => {
    setCourant(valeursServeur);
  }, [valeursServeur]);

  useEffect(() => {
    const desenregistrer = enregistrerRubrique({
      id,
      libelle,
      estModifiee: () => estModifieeRef.current(courantRef.current, valeursServeurRef.current),
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
    setCourant((prev) => ({ ...prev, ...patch }));
    notifierSommaire();
  };

  const reinitialiser = () => {
    setCourant(valeursServeur);
    setErreur(undefined);
    setAlertes([]);
    notifierSommaire();
  };

  return {
    courant,
    modifier,
    reinitialiser,
    erreur,
    alertes,
    version,
    modifiee: estModifiee(courant, valeursServeur),
    appliquerServeur: (valeurs: T, nouvelleVersion: number) => {
      setCourant(valeurs);
      setErreur(undefined);
      setAlertes([]);
      onServeurChange(valeurs, nouvelleVersion);
      notifierSommaire();
    },
  };
}
