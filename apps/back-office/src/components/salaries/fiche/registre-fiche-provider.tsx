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
  type EntitePorteuse,
  type ResultatRubriqueEnregistrement,
  type RubriqueEnregistrable,
  type VersionsParEntite,
} from '@/lib/fiche/orchestrateur-enregistrement';
import {
  assertRubriquesDansOrdre,
  ID_SOMMAIRE_EMPLOIS,
  LIBELLE_SOMMAIRE_EMPLOIS,
  ORDRE_RUBRIQUES_SALARIE,
  ordreEnregistrementFiche,
  type EmploiPourOrdre,
} from '@/lib/fiche/ordre-rubriques-fiche-salarie';
import {
  lireVersionEntite,
  mettreAJourVersionEntite,
  versionsEmploisDepuisListe,
} from '@/lib/fiche/versions-entite';

export interface EntreeSommaireRubrique {
  readonly id: string;
  readonly libelle: string;
  readonly modifiee: boolean;
  /** Entrée de navigation sans rubrique enregistrable (ex. « Emplois »). */
  readonly navigationSeule?: boolean;
}

interface RegistreFicheContexte {
  /** Version du salarié — raccourci vers versions.salarie. */
  readonly version: number;
  readonly versions: VersionsParEntite;
  readonly enregistrementEnCours: boolean;
  readonly ecritureHorsSequenceEnCours: boolean;
  readonly conflitVersion: boolean;
  readonly resultatsRecap: readonly ResultatRubriqueEnregistrement[];
  readonly alertesGlobales: readonly AlerteApi[];
  readonly rubriquesSommaire: readonly EntreeSommaireRubrique[];
  readonly nombreModifiees: number;
  aModificationsNonEnregistrees(): boolean;
  libellesRubriquesModifiees(): readonly string[];
  lireVersion(entite: EntitePorteuse): number;
  enregistrer(): Promise<void>;
  annuler(): void;
  rechargerDepuisServeur(): void;
  confirmerRechargementServeur(): Promise<void>;
  annulerRechargementServeur(): void;
  rechargementEnAttente: boolean;
  enregistrerRubrique(rubrique: RubriqueEnregistrable): () => void;
  mettreAJourVersion(version: number): void;
  synchroniserVersions(versions: VersionsParEntite): void;
  signalerVersionApresEcritureHorsSequence(nouvelleVersion: number): void;
  signalerDebutEcritureHorsSequence(): void;
  signalerFinEcritureHorsSequence(): void;
  signalerConflitVersion(): void;
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
  readonly emplois?: readonly EmploiPourOrdre[];
  readonly onRechargerServeur: () => Promise<void>;
  readonly onApresEnregistrement?: (version: number) => void;
  readonly children?: ReactNode;
}

export function emploisPourOrdre(
  emplois: readonly {
    readonly id: string;
    readonly version: number;
    readonly numeroOrdre: number;
    readonly contrat: { readonly libellePoste: string };
  }[]
): EmploiPourOrdre[] {
  return [...emplois]
    .sort((a, b) => a.numeroOrdre - b.numeroOrdre)
    .map((emploi) => ({
      id: emploi.id,
      libellePoste: emploi.contrat.libellePoste,
      version: emploi.version,
    }));
}

export function RegistreFicheProvider({
  versionInitiale,
  emplois = [],
  onRechargerServeur,
  onApresEnregistrement,
  children,
}: PropsProvider) {
  const rubriquesRef = useRef<Map<string, RubriqueEnregistrable>>(new Map());
  const avantEnvoiRef = useRef<Set<() => void>>(new Set());
  const emploisRef = useRef(emplois);
  emploisRef.current = emplois;

  const [versions, setVersions] = useState<VersionsParEntite>(() => ({
    salarie: versionInitiale,
    emplois: versionsEmploisDepuisListe(emplois),
  }));
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);
  const [ecritureHorsSequenceEnCours, setEcritureHorsSequenceEnCours] = useState(false);
  const [conflitVersion, setConflitVersion] = useState(false);
  const [resultatsRecap, setResultatsRecap] = useState<readonly ResultatRubriqueEnregistrement[]>(
    []
  );
  const [alertesGlobales, setAlertesGlobales] = useState<readonly AlerteApi[]>([]);
  const [revisionSommaire, setRevisionSommaire] = useState(0);
  const [rechargementEnAttente, setRechargementEnAttente] = useState(false);

  const ordreEnregistrement = useCallback((): readonly string[] => {
    return ordreEnregistrementFiche(emploisRef.current);
  }, []);

  const verifierCoherenceOrdre = useCallback(() => {
    assertRubriquesDansOrdre(rubriquesRef.current.keys(), ordreEnregistrement());
  }, [ordreEnregistrement]);

  const rubriquesOrdonnees = useCallback((): RubriqueEnregistrable[] => {
    verifierCoherenceOrdre();
    return ordreEnregistrement()
      .map((id) => rubriquesRef.current.get(id))
      .filter((rubrique): rubrique is RubriqueEnregistrable => rubrique !== undefined);
  }, [ordreEnregistrement, verifierCoherenceOrdre]);

  const emploisModifies = useCallback((): boolean => {
    for (const rubrique of rubriquesRef.current.values()) {
      if (rubrique.entite.kind === 'emploi' && rubrique.estModifiee()) {
        return true;
      }
    }
    return false;
  }, []);

  const notifierSommaire = useCallback(() => {
    setRevisionSommaire((v) => v + 1);
  }, []);

  const rubriquesSommaire = useMemo((): EntreeSommaireRubrique[] => {
    void revisionSommaire;
    const salarie = ORDRE_RUBRIQUES_SALARIE.map((id) => rubriquesRef.current.get(id))
      .filter((rubrique): rubrique is RubriqueEnregistrable => rubrique !== undefined)
      .map((rubrique) => ({
        id: rubrique.id,
        libelle: rubrique.libelle,
        modifiee: rubrique.estModifiee(),
      }));

    return [
      ...salarie,
      {
        id: ID_SOMMAIRE_EMPLOIS,
        libelle: LIBELLE_SOMMAIRE_EMPLOIS,
        modifiee: emploisModifies(),
        navigationSeule: true,
      },
    ];
  }, [emploisModifies, revisionSommaire]);

  const nombreModifiees = useMemo(() => {
    void revisionSommaire;
    return compterRubriquesModifiees(rubriquesOrdonnees());
  }, [revisionSommaire, rubriquesOrdonnees]);

  const aModificationsNonEnregistrees = useCallback((): boolean => {
    return compterRubriquesModifiees(rubriquesOrdonnees()) > 0;
  }, [rubriquesOrdonnees]);

  const libellesRubriquesModifieesDepuisRegistre = useCallback((): readonly string[] => {
    return libellesRubriquesModifiees(rubriquesOrdonnees());
  }, [rubriquesOrdonnees]);

  const lireVersion = useCallback(
    (entite: EntitePorteuse): number => {
      const version = lireVersionEntite(versions, entite);
      if (version === undefined) {
        throw new Error(
          `Version introuvable pour l entite ${entite.kind === 'emploi' ? entite.emploiId : 'salarie'}.`
        );
      }
      return version;
    },
    [versions]
  );

  const enregistrerRubrique = useCallback(
    (rubrique: RubriqueEnregistrable) => {
      rubriquesRef.current.set(rubrique.id, rubrique);
      assertRubriquesDansOrdre([rubrique.id], ordreEnregistrement());
      notifierSommaire();
      return () => {
        rubriquesRef.current.delete(rubrique.id);
        notifierSommaire();
      };
    },
    [notifierSommaire, ordreEnregistrement]
  );

  const mettreAJourVersion = useCallback((nouvelleVersion: number) => {
    setVersions((prev) => mettreAJourVersionEntite(prev, { kind: 'salarie' }, nouvelleVersion));
  }, []);

  const synchroniserVersions = useCallback((nouvelles: VersionsParEntite) => {
    setVersions(nouvelles);
  }, []);

  const signalerVersionApresEcritureHorsSequence = useCallback(
    (nouvelleVersion: number) => {
      setVersions((prev) => mettreAJourVersionEntite(prev, { kind: 'salarie' }, nouvelleVersion));
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

  const signalerConflitVersion = useCallback(() => {
    setConflitVersion(true);
  }, []);

  const enregistrerAvantEnvoi = useCallback((callback: () => void) => {
    avantEnvoiRef.current.add(callback);
    return () => {
      avantEnvoiRef.current.delete(callback);
    };
  }, []);

  const enregistrer = useCallback(async () => {
    verifierCoherenceOrdre();
    for (const callback of avantEnvoiRef.current) {
      callback();
    }
    setEnregistrementEnCours(true);
    setConflitVersion(false);
    setResultatsRecap([]);
    try {
      const resultat = await enregistrerRubriquesModifiees(rubriquesOrdonnees(), versions);
      setVersions(resultat.versions);
      setResultatsRecap(resultat.resultats);
      setConflitVersion(resultat.conflit);
      const alertes = resultat.resultats.flatMap((r) => r.alertes ?? []);
      setAlertesGlobales(alertes);
      onApresEnregistrement?.(resultat.versions.salarie);
      notifierSommaire();
    } finally {
      setEnregistrementEnCours(false);
    }
  }, [
    notifierSommaire,
    onApresEnregistrement,
    rubriquesOrdonnees,
    verifierCoherenceOrdre,
    versions,
  ]);

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
      version: versions.salarie,
      versions,
      enregistrementEnCours,
      ecritureHorsSequenceEnCours,
      conflitVersion,
      resultatsRecap,
      alertesGlobales,
      rubriquesSommaire,
      nombreModifiees,
      aModificationsNonEnregistrees,
      libellesRubriquesModifiees: libellesRubriquesModifieesDepuisRegistre,
      lireVersion,
      enregistrer,
      annuler,
      rechargerDepuisServeur,
      confirmerRechargementServeur,
      annulerRechargementServeur,
      rechargementEnAttente,
      enregistrerRubrique,
      mettreAJourVersion,
      synchroniserVersions,
      signalerVersionApresEcritureHorsSequence,
      signalerDebutEcritureHorsSequence,
      signalerFinEcritureHorsSequence,
      signalerConflitVersion,
      enregistrerAvantEnvoi,
      notifierSommaire,
      onRechargerServeur,
    }),
    [
      versions,
      enregistrementEnCours,
      ecritureHorsSequenceEnCours,
      conflitVersion,
      resultatsRecap,
      alertesGlobales,
      rubriquesSommaire,
      nombreModifiees,
      aModificationsNonEnregistrees,
      libellesRubriquesModifieesDepuisRegistre,
      lireVersion,
      enregistrer,
      annuler,
      rechargerDepuisServeur,
      confirmerRechargementServeur,
      annulerRechargementServeur,
      rechargementEnAttente,
      enregistrerRubrique,
      mettreAJourVersion,
      synchroniserVersions,
      signalerVersionApresEcritureHorsSequence,
      signalerDebutEcritureHorsSequence,
      signalerFinEcritureHorsSequence,
      signalerConflitVersion,
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
