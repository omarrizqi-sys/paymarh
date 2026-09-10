'use client';

import { flushSync } from 'react-dom';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AlerteApi } from '@paymarh/shared-types';
import {
  compterRubriquesModifiees,
  enregistrerRubriquesModifiees,
  libellesRubriquesModifiees,
  type ResultatRubriqueEnregistrement,
  type RubriqueEnregistrable,
} from '@/lib/fiche/orchestrateur-enregistrement';
import { ORDRE_RUBRIQUES_FICHE_SALARIE } from '@/lib/fiche/ordre-rubriques-fiche-salarie';

export interface EntreeSommaireRubrique {
  readonly id: string;
  readonly libelle: string;
  readonly modifiee: boolean;
}

interface RegistreFicheContexte {
  readonly version: number;
  readonly enregistrementEnCours: boolean;
  readonly ecritureHorsSequenceEnCours: boolean;
  readonly conflitVersion: boolean;
  readonly resultatsRecap: readonly ResultatRubriqueEnregistrement[];
  readonly alertesGlobales: readonly AlerteApi[];
  readonly rubriquesSommaire: readonly EntreeSommaireRubrique[];
  readonly nombreModifiees: number;
  enregistrer(): Promise<void>;
  annuler(): void;
  rechargerDepuisServeur(): void;
  confirmerRechargementServeur(): Promise<void>;
  annulerRechargementServeur(): void;
  rechargementEnAttente: boolean;
  enregistrerRubrique(rubrique: RubriqueEnregistrable): () => void;
  mettreAJourVersion(version: number): void;
  signalerVersionApresEcritureHorsSequence(nouvelleVersion: number): void;
  signalerDebutEcritureHorsSequence(): void;
  signalerFinEcritureHorsSequence(): void;
  enregistrerAvantEnvoi(callback: () => void): () => void;
  notifierSommaire(): void;
  onRechargerServeur: () => Promise<void>;
}

const ContexteRegistreFiche = createContext<RegistreFicheContexte | null>(null);

export function useRegistreFiche(): RegistreFicheContexte {
  const contexte = useContext(ContexteRegistreFiche);
  if (contexte === null) {
    throw new Error('useRegistreFiche doit etre utilise dans RegistreFicheProvider.');
  }
  return contexte;
}

export function useRegistreFicheOptionnel(): RegistreFicheContexte | null {
  return useContext(ContexteRegistreFiche);
}

interface PropsProvider {
  readonly versionInitiale: number;
  readonly onRechargerServeur: () => Promise<void>;
  readonly onApresEnregistrement?: (version: number) => void;
  readonly children?: ReactNode;
}

export function RegistreFicheProvider({
  versionInitiale,
  onRechargerServeur,
  onApresEnregistrement,
  children,
}: PropsProvider) {
  const rubriquesRef = useRef<Map<string, RubriqueEnregistrable>>(new Map());
  const avantEnvoiRef = useRef<Set<() => void>>(new Set());
  const [version, setVersion] = useState(versionInitiale);
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);
  const [ecritureHorsSequenceEnCours, setEcritureHorsSequenceEnCours] = useState(false);
  const [conflitVersion, setConflitVersion] = useState(false);
  const [resultatsRecap, setResultatsRecap] = useState<readonly ResultatRubriqueEnregistrement[]>(
    []
  );
  const [alertesGlobales, setAlertesGlobales] = useState<readonly AlerteApi[]>([]);
  const [revisionSommaire, setRevisionSommaire] = useState(0);
  const [rechargementEnAttente, setRechargementEnAttente] = useState(false);

  const rubriquesOrdonnees = useCallback((): RubriqueEnregistrable[] => {
    return ORDRE_RUBRIQUES_FICHE_SALARIE.map((id) => rubriquesRef.current.get(id)).filter(
      (rubrique): rubrique is RubriqueEnregistrable => rubrique !== undefined
    );
  }, []);

  const notifierSommaire = useCallback(() => {
    setRevisionSommaire((v) => v + 1);
  }, []);

  const rubriquesSommaire = useMemo((): EntreeSommaireRubrique[] => {
    void revisionSommaire;
    return rubriquesOrdonnees().map((rubrique) => ({
      id: rubrique.id,
      libelle: rubrique.libelle,
      modifiee: rubrique.estModifiee(),
    }));
  }, [revisionSommaire, rubriquesOrdonnees]);

  const nombreModifiees = useMemo(() => {
    void revisionSommaire;
    return compterRubriquesModifiees(rubriquesOrdonnees());
  }, [revisionSommaire, rubriquesOrdonnees]);

  const enregistrerRubrique = useCallback(
    (rubrique: RubriqueEnregistrable) => {
      rubriquesRef.current.set(rubrique.id, rubrique);
      notifierSommaire();
      return () => {
        rubriquesRef.current.delete(rubrique.id);
        notifierSommaire();
      };
    },
    [notifierSommaire]
  );

  const mettreAJourVersion = useCallback((nouvelleVersion: number) => {
    setVersion(nouvelleVersion);
  }, []);

  const signalerVersionApresEcritureHorsSequence = useCallback(
    (nouvelleVersion: number) => {
      setVersion(nouvelleVersion);
      onApresEnregistrement?.(nouvelleVersion);
    },
    [onApresEnregistrement]
  );

  const signalerDebutEcritureHorsSequence = useCallback(() => {
    setEcritureHorsSequenceEnCours(true);
  }, []);

  const signalerFinEcritureHorsSequence = useCallback(() => {
    setEcritureHorsSequenceEnCours(false);
  }, []);

  const enregistrerAvantEnvoi = useCallback((callback: () => void) => {
    avantEnvoiRef.current.add(callback);
    return () => {
      avantEnvoiRef.current.delete(callback);
    };
  }, []);

  const enregistrer = useCallback(async () => {
    for (const callback of avantEnvoiRef.current) {
      callback();
    }
    setEnregistrementEnCours(true);
    setConflitVersion(false);
    setResultatsRecap([]);
    try {
      const resultat = await enregistrerRubriquesModifiees(rubriquesOrdonnees(), version);
      setVersion(resultat.version);
      setResultatsRecap(resultat.resultats);
      setConflitVersion(resultat.conflit);
      const alertes = resultat.resultats.flatMap((r) => r.alertes ?? []);
      setAlertesGlobales(alertes);
      onApresEnregistrement?.(resultat.version);
      notifierSommaire();
    } finally {
      setEnregistrementEnCours(false);
    }
  }, [notifierSommaire, onApresEnregistrement, rubriquesOrdonnees, version]);

  const annuler = useCallback(() => {
    for (const rubrique of rubriquesOrdonnees()) {
      flushSync(() => {
        rubrique.reinitialiser();
      });
    }
    setConflitVersion(false);
    setResultatsRecap([]);
    setAlertesGlobales([]);
    notifierSommaire();
  }, [notifierSommaire, rubriquesOrdonnees]);

  const rechargerDepuisServeur = useCallback((): void => {
    setRechargementEnAttente(true);
  }, []);

  const confirmerRechargementServeur = useCallback(async () => {
    setRechargementEnAttente(false);
    await onRechargerServeur();
    for (const rubrique of rubriquesOrdonnees()) {
      flushSync(() => {
        rubrique.reinitialiser();
      });
    }
    setConflitVersion(false);
    setResultatsRecap([]);
    setAlertesGlobales([]);
    notifierSommaire();
  }, [notifierSommaire, onRechargerServeur, rubriquesOrdonnees]);

  const annulerRechargementServeur = useCallback(() => {
    setRechargementEnAttente(false);
  }, []);

  const valeur = useMemo(
    (): RegistreFicheContexte => ({
      version,
      enregistrementEnCours,
      ecritureHorsSequenceEnCours,
      conflitVersion,
      resultatsRecap,
      alertesGlobales,
      rubriquesSommaire,
      nombreModifiees,
      enregistrer,
      annuler,
      rechargerDepuisServeur,
      confirmerRechargementServeur,
      annulerRechargementServeur,
      rechargementEnAttente,
      enregistrerRubrique,
      mettreAJourVersion,
      signalerVersionApresEcritureHorsSequence,
      signalerDebutEcritureHorsSequence,
      signalerFinEcritureHorsSequence,
      enregistrerAvantEnvoi,
      notifierSommaire,
      onRechargerServeur,
    }),
    [
      version,
      enregistrementEnCours,
      ecritureHorsSequenceEnCours,
      conflitVersion,
      resultatsRecap,
      alertesGlobales,
      rubriquesSommaire,
      nombreModifiees,
      enregistrer,
      annuler,
      rechargerDepuisServeur,
      confirmerRechargementServeur,
      annulerRechargementServeur,
      rechargementEnAttente,
      enregistrerRubrique,
      mettreAJourVersion,
      signalerVersionApresEcritureHorsSequence,
      signalerDebutEcritureHorsSequence,
      signalerFinEcritureHorsSequence,
      enregistrerAvantEnvoi,
      notifierSommaire,
      onRechargerServeur,
    ]
  );

  return <ContexteRegistreFiche.Provider value={valeur}>{children}</ContexteRegistreFiche.Provider>;
}

export function libellesModifiesDepuisRegistre(
  rubriques: readonly RubriqueEnregistrable[]
): string[] {
  return libellesRubriquesModifiees(rubriques);
}
