'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface LecteurSaisiePerdable {
  readonly aModifications: () => boolean;
  readonly libellesModifies: () => readonly string[];
}

export interface ModificationsSaisiePerdable {
  readonly aModifications: boolean;
  readonly libelles: readonly string[];
}

interface SaisiePerdableRacineContexte {
  readonly lireModifications: () => ModificationsSaisiePerdable;
  readonly declarer: (lecteur: LecteurSaisiePerdable) => void;
  readonly retirer: (lecteur: LecteurSaisiePerdable) => void;
}

const ContexteSaisiePerdableRacine = createContext<SaisiePerdableRacineContexte | null>(null);

export function SaisiePerdableRacineProvider({ children }: { readonly children?: ReactNode }) {
  const lecteurActifRef = useRef<LecteurSaisiePerdable | null>(null);
  const [, setRevision] = useState(0);

  const declarer = useCallback((lecteur: LecteurSaisiePerdable) => {
    lecteurActifRef.current = lecteur;
    setRevision((revision) => revision + 1);
  }, []);

  const retirer = useCallback((lecteur: LecteurSaisiePerdable) => {
    if (lecteurActifRef.current === lecteur) {
      lecteurActifRef.current = null;
      setRevision((revision) => revision + 1);
    }
  }, []);

  const lireModifications = useCallback((): ModificationsSaisiePerdable => {
    const lecteur = lecteurActifRef.current;
    if (lecteur === null) {
      return { aModifications: false, libelles: [] };
    }
    return {
      aModifications: lecteur.aModifications(),
      libelles: lecteur.libellesModifies(),
    };
  }, []);

  const valeur = useMemo(
    (): SaisiePerdableRacineContexte => ({
      lireModifications,
      declarer,
      retirer,
    }),
    [declarer, lireModifications, retirer]
  );

  return (
    <ContexteSaisiePerdableRacine.Provider value={valeur}>
      {children}
    </ContexteSaisiePerdableRacine.Provider>
  );
}

export function useSaisiePerdableRacine(): SaisiePerdableRacineContexte {
  const contexte = useContext(ContexteSaisiePerdableRacine);
  if (contexte === null) {
    throw new Error('useSaisiePerdableRacine doit etre utilise dans SaisiePerdableRacineProvider.');
  }
  return contexte;
}

export function useDeclarerSaisiePerdable(
  aModifications: () => boolean,
  libellesModifies: () => readonly string[]
): void {
  const { declarer, retirer } = useSaisiePerdableRacine();

  useEffect(() => {
    const lecteur: LecteurSaisiePerdable = { aModifications, libellesModifies };
    declarer(lecteur);
    return () => retirer(lecteur);
  }, [aModifications, declarer, libellesModifies, retirer]);
}
