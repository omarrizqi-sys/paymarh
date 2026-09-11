'use client';

import { flushSync } from 'react-dom';
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AlerteApi } from '@paymarh/shared-types';
import { AppelApiEchoue } from '@/lib/api/client';
import { creerSalarie } from '@/lib/api/salaries';
import { MESSAGE_ERREUR_GENERIQUE } from '@/lib/messages-interface';
import {
  ContexteRegistreCreation,
  type EntreeSommaireCreation,
  type ResultatCreationSalarie,
} from '@/lib/fiche/contexte-registre-creation';
import { ORDRE_RUBRIQUES_CREATION_SALARIE } from '@/lib/fiche/ordre-rubriques-creation-salarie';
import type { RubriqueCreable } from '@/lib/fiche/rubrique-creable';
import type { ValeursIdentite } from '@/components/salaries/fiche/rubrique-identite';
import type { ValeursIdentifiantsLegaux } from '@/components/salaries/fiche/rubrique-identifiants-legaux';
import type { ValeursCoordonnees } from '@/components/salaries/fiche/rubrique-coordonnees';
import type { ValeursDates } from '@/components/salaries/fiche/rubrique-dates';
import { assemblerCorpsCreationSalarie } from './assembler-corps-creation-salarie';

export { useRegistreCreation } from '@/lib/fiche/contexte-registre-creation';

interface Props {
  readonly companyId: string;
  readonly children?: ReactNode;
}

function alerteDepuisRefus(erreur: AppelApiEchoue): AlerteApi {
  return {
    code: erreur.erreur.code,
    message: erreur.erreur.message,
    champ: erreur.erreur.champ,
  };
}

export function RegistreCreationProvider({ companyId, children }: Props) {
  const rubriquesRef = useRef<Map<string, RubriqueCreable>>(new Map());
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);
  const [revisionSommaire, setRevisionSommaire] = useState(0);

  const notifierSommaire = useCallback(() => {
    setRevisionSommaire((v) => v + 1);
  }, []);

  const enregistrerRubrique = useCallback(
    (rubrique: RubriqueCreable) => {
      rubriquesRef.current.set(rubrique.id, rubrique);
      notifierSommaire();
      return () => {
        rubriquesRef.current.delete(rubrique.id);
        notifierSommaire();
      };
    },
    [notifierSommaire]
  );

  const lireValeurs = useCallback(<T,>(id: string): T => {
    const rubrique = rubriquesRef.current.get(id);
    if (rubrique === undefined) {
      throw new Error(`Rubrique de creation absente : ${id}`);
    }
    return rubrique.valeurs() as T;
  }, []);

  const rubriquesSommaire = useMemo((): readonly EntreeSommaireCreation[] => {
    void revisionSommaire;
    return ORDRE_RUBRIQUES_CREATION_SALARIE.flatMap((id) => {
      const rubrique = rubriquesRef.current.get(id);
      return rubrique === undefined
        ? []
        : [{ id: rubrique.id, libelle: rubrique.libelle, modifiee: rubrique.estModifiee() }];
    });
  }, [revisionSommaire]);

  const nombreModifiees = useMemo(() => {
    void revisionSommaire;
    let total = 0;
    for (const id of ORDRE_RUBRIQUES_CREATION_SALARIE) {
      const rubrique = rubriquesRef.current.get(id);
      if (rubrique !== undefined && rubrique.estModifiee()) {
        total += 1;
      }
    }
    return total;
  }, [revisionSommaire]);

  const aModificationsNonEnregistrees = useCallback((): boolean => {
    for (const id of ORDRE_RUBRIQUES_CREATION_SALARIE) {
      const rubrique = rubriquesRef.current.get(id);
      if (rubrique !== undefined && rubrique.estModifiee()) {
        return true;
      }
    }
    return false;
  }, []);

  const libellesRubriquesModifieesDepuisRegistre = useCallback((): readonly string[] => {
    return ORDRE_RUBRIQUES_CREATION_SALARIE.flatMap((id) => {
      const rubrique = rubriquesRef.current.get(id);
      return rubrique !== undefined && rubrique.estModifiee() ? [rubrique.libelle] : [];
    });
  }, []);

  const creer = useCallback(async (): Promise<ResultatCreationSalarie> => {
    setEnregistrementEnCours(true);
    try {
      const corps = assemblerCorpsCreationSalarie(
        lireValeurs<ValeursIdentite>('identite'),
        lireValeurs<ValeursIdentifiantsLegaux>('identifiants-legaux'),
        lireValeurs<ValeursCoordonnees>('coordonnees'),
        lireValeurs<ValeursDates>('dates')
      );
      const reponse = await creerSalarie(companyId, corps);
      return { ok: true, salarieId: reponse.donnees.id, alertes: reponse.alertes };
    } catch (erreur) {
      if (erreur instanceof AppelApiEchoue) {
        if (erreur.statut >= 500 || erreur.erreur.code === 'ERREUR') {
          return { ok: false, alertes: [], erreurGenerique: MESSAGE_ERREUR_GENERIQUE };
        }
        return { ok: false, alertes: [alerteDepuisRefus(erreur)] };
      }
      return { ok: false, alertes: [], erreurGenerique: MESSAGE_ERREUR_GENERIQUE };
    } finally {
      setEnregistrementEnCours(false);
    }
  }, [companyId, lireValeurs]);

  const annuler = useCallback(() => {
    for (const id of ORDRE_RUBRIQUES_CREATION_SALARIE) {
      const rubrique = rubriquesRef.current.get(id);
      if (rubrique === undefined) continue;
      flushSync(() => {
        rubrique.reinitialiser();
      });
    }
    notifierSommaire();
  }, [notifierSommaire]);

  const valeur = useMemo(
    () => ({
      enregistrementEnCours,
      rubriquesSommaire,
      nombreModifiees,
      aModificationsNonEnregistrees,
      libellesRubriquesModifiees: libellesRubriquesModifieesDepuisRegistre,
      enregistrerRubrique,
      lireValeurs,
      notifierSommaire,
      creer,
      annuler,
    }),
    [
      enregistrementEnCours,
      rubriquesSommaire,
      nombreModifiees,
      aModificationsNonEnregistrees,
      libellesRubriquesModifieesDepuisRegistre,
      enregistrerRubrique,
      lireValeurs,
      notifierSommaire,
      creer,
      annuler,
    ]
  );

  return (
    <ContexteRegistreCreation.Provider value={valeur}>{children}</ContexteRegistreCreation.Provider>
  );
}
