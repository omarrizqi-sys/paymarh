'use client';

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

export interface EntreeSommaireRubrique {
  readonly id: string;
  readonly libelle: string;
  readonly modifiee: boolean;
}

interface RegistreFicheContexte {
  readonly version: number;
  readonly enregistrementEnCours: boolean;
  readonly conflitVersion: boolean;
  readonly resultatsRecap: readonly ResultatRubriqueEnregistrement[];
  readonly alertesGlobales: readonly AlerteApi[];
  readonly rubriquesSommaire: readonly EntreeSommaireRubrique[];
  readonly nombreModifiees: number;
  enregistrer(): Promise<void>;
  annuler(): Promise<void>;
  rechargerDepuisServeur(): void;
  confirmerRechargementServeur(): Promise<void>;
  annulerRechargementServeur(): void;
  rechargementEnAttente: boolean;
  enregistrerRubrique(rubrique: RubriqueEnregistrable): () => void;
  mettreAJourVersion(version: number): void;
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
  const ordreRef = useRef<string[]>([]);
  const [version, setVersion] = useState(versionInitiale);
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);
  const [conflitVersion, setConflitVersion] = useState(false);
  const [resultatsRecap, setResultatsRecap] = useState<readonly ResultatRubriqueEnregistrement[]>(
    []
  );
  const [alertesGlobales, setAlertesGlobales] = useState<readonly AlerteApi[]>([]);
  const [revisionSommaire, setRevisionSommaire] = useState(0);
  const [rechargementEnAttente, setRechargementEnAttente] = useState(false);

  const rubriquesOrdonnees = useCallback((): RubriqueEnregistrable[] => {
    return ordreRef.current
      .map((id) => rubriquesRef.current.get(id))
      .filter((rubrique): rubrique is RubriqueEnregistrable => rubrique !== undefined);
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
      if (!ordreRef.current.includes(rubrique.id)) {
        ordreRef.current.push(rubrique.id);
      }
      notifierSommaire();
      return () => {
        rubriquesRef.current.delete(rubrique.id);
        ordreRef.current = ordreRef.current.filter((id) => id !== rubrique.id);
        notifierSommaire();
      };
    },
    [notifierSommaire]
  );

  const mettreAJourVersion = useCallback((nouvelleVersion: number) => {
    setVersion(nouvelleVersion);
  }, []);

  const enregistrer = useCallback(async () => {
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

  const annuler = useCallback(async () => {
    await onRechargerServeur();
    setConflitVersion(false);
    setResultatsRecap([]);
    setAlertesGlobales([]);
    notifierSommaire();
  }, [notifierSommaire, onRechargerServeur]);

  const rechargerDepuisServeur = useCallback((): void => {
    setRechargementEnAttente(true);
  }, []);

  const confirmerRechargementServeur = useCallback(async () => {
    setRechargementEnAttente(false);
    await onRechargerServeur();
    setConflitVersion(false);
    setResultatsRecap([]);
    setAlertesGlobales([]);
    notifierSommaire();
  }, [notifierSommaire, onRechargerServeur]);

  const annulerRechargementServeur = useCallback(() => {
    setRechargementEnAttente(false);
  }, []);

  const valeur = useMemo(
    (): RegistreFicheContexte => ({
      version,
      enregistrementEnCours,
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
      notifierSommaire,
      onRechargerServeur,
    }),
    [
      version,
      enregistrementEnCours,
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
