'use client';

import { useEffect } from 'react';
import { useRegistreCreation } from '@/lib/fiche/contexte-registre-creation';
import { useRegistreFiche } from './registre-fiche-provider';

/**
 * Avertissement avant de quitter la page.
 *
 * Limite connue (2.1.c-2) : beforeunload couvre fermeture/rechargement d onglet ;
 * la navigation interne passe par navigation-gardee (LienGarde, useNavigationGardee).
 * Next.js 16.3.3 ne fournit pas de garde router centralisee pour router.push ni le retour navigateur.
 */
function useAvertissementBeforeUnload(aModifications: boolean): void {
  useEffect(() => {
    if (!aModifications) return;

    const gestionnaire = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', gestionnaire);
    return () => window.removeEventListener('beforeunload', gestionnaire);
  }, [aModifications]);
}

export function AvertissementNavigationFiche() {
  const { rubriquesSommaire } = useRegistreFiche();
  const aModifications = rubriquesSommaire.some((rubrique) => rubrique.modifiee);
  useAvertissementBeforeUnload(aModifications);
  return null;
}

export function AvertissementNavigationCreation() {
  const { rubriquesSommaire } = useRegistreCreation();
  const aModifications = rubriquesSommaire.some((rubrique) => rubrique.modifiee);
  useAvertissementBeforeUnload(aModifications);
  return null;
}

export function messageConfirmationAnnuler(libelles: readonly string[]): string {
  if (libelles.length === 0) return 'Annuler les modifications ?';
  return `Annuler les modifications des rubriques : ${libelles.join(', ')} ?`;
}

export function messageConfirmationRechargement(libelles: readonly string[]): string {
  const cible = libelles.length > 0 ? libelles.join(', ') : 'toutes les rubriques';
  return `Recharger les valeurs du serveur écrasera la saisie en cours (${cible}). Continuer ?`;
}
