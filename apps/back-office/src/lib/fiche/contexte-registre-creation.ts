'use client';

import { createContext, useContext } from 'react';
import type { AlerteApi } from '@paymarh/shared-types';
import type { RubriqueCreable } from './rubrique-creable';

export interface EntreeSommaireCreation {
  readonly id: string;
  readonly libelle: string;
}

export type ResultatCreationSalarie =
  | {
      readonly ok: true;
      readonly salarieId: string;
      readonly alertes: readonly AlerteApi[];
    }
  | {
      readonly ok: false;
      readonly alertes: readonly AlerteApi[];
      readonly erreurGenerique?: string;
    };

export interface RegistreCreationContexte {
  readonly enregistrementEnCours: boolean;
  readonly rubriquesSommaire: readonly EntreeSommaireCreation[];
  enregistrerRubrique(rubrique: RubriqueCreable): () => void;
  lireValeurs<T>(id: string): T;
  notifierSommaire(): void;
  creer(): Promise<ResultatCreationSalarie>;
  annuler(): void;
}

export const ContexteRegistreCreation = createContext<RegistreCreationContexte | null>(null);

export function useRegistreCreation(): RegistreCreationContexte {
  const contexte = useContext(ContexteRegistreCreation);
  if (contexte === null) {
    throw new Error('useRegistreCreation doit etre utilise dans RegistreCreationProvider.');
  }
  return contexte;
}

export function useRegistreCreationOptionnel(): RegistreCreationContexte | null {
  return useContext(ContexteRegistreCreation);
}
