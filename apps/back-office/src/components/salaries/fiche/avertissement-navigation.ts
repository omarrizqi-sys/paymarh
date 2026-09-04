'use client';

import { useEffect } from 'react';
import { useRegistreFiche } from './registre-fiche-provider';

/**
 * Avertissement avant de quitter la page.
 *
 * Limite connue (2.1.c-2) : beforeunload couvre fermeture/rechargement d onglet ;
 * le lien retour explicite appelle confirmerNavigationAvecModifications.
 * Next.js 16.3.3 ne fournit pas de garde router centralisee pour router.push ni le retour navigateur.
 */
export function AvertissementNavigationFiche() {
  const { rubriquesSommaire } = useRegistreFiche();
  const libellesModifies = rubriquesSommaire.filter((r) => r.modifiee).map((r) => r.libelle);
  const aModifications = libellesModifies.length > 0;

  useEffect(() => {
    if (!aModifications) return;

    const gestionnaire = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', gestionnaire);
    return () => window.removeEventListener('beforeunload', gestionnaire);
  }, [aModifications]);

  return null;
}

export function confirmerNavigationAvecModifications(libelles: readonly string[]): boolean {
  if (libelles.length === 0) return true;
  return window.confirm(
    `Des modifications non enregistrees concernent : ${libelles.join(', ')}. Quitter quand meme ?`
  );
}

export function messageConfirmationAnnuler(libelles: readonly string[]): string {
  if (libelles.length === 0) return 'Annuler les modifications ?';
  return `Annuler les modifications des rubriques : ${libelles.join(', ')} ?`;
}

export function messageConfirmationRechargement(libelles: readonly string[]): string {
  const cible = libelles.length > 0 ? libelles.join(', ') : 'toutes les rubriques';
  return `Recharger les valeurs du serveur ecrasera la saisie en cours (${cible}). Continuer ?`;
}
