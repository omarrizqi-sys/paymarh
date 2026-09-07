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

interface ContexteFormulaireTableau {
  readonly formulaireOuvertId: string | null;
  ouvrirFormulaire(id: string): void;
  fermerFormulaire(): void;
  enregistrerAvantEnvoi(): void;
  enregistrerCallback(callback: (() => void) | null): void;
}

const Contexte = createContext<ContexteFormulaireTableau | null>(null);

export function useFormulaireTableau(): ContexteFormulaireTableau {
  const contexte = useContext(Contexte);
  if (contexte === null) {
    throw new Error('useFormulaireTableau doit etre utilise dans FormulaireTableauProvider.');
  }
  return contexte;
}

export function FormulaireTableauProvider({ children }: { readonly children?: ReactNode }) {
  const [formulaireOuvertId, setFormulaireOuvertId] = useState<string | null>(null);
  const avantEnvoiRef = useRef<(() => void) | null>(null);

  const ouvrirFormulaire = useCallback((id: string) => {
    setFormulaireOuvertId(id);
  }, []);

  const fermerFormulaire = useCallback(() => {
    setFormulaireOuvertId(null);
  }, []);

  const enregistrerCallback = useCallback((callback: (() => void) | null) => {
    avantEnvoiRef.current = callback;
  }, []);

  const enregistrerAvantEnvoi = useCallback(() => {
    avantEnvoiRef.current?.();
    setFormulaireOuvertId(null);
  }, []);

  const valeur = useMemo(
    (): ContexteFormulaireTableau => ({
      formulaireOuvertId,
      ouvrirFormulaire,
      fermerFormulaire,
      enregistrerAvantEnvoi,
      enregistrerCallback,
    }),
    [
      enregistrerAvantEnvoi,
      enregistrerCallback,
      fermerFormulaire,
      formulaireOuvertId,
      ouvrirFormulaire,
    ]
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}
