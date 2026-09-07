'use client';

import { useEffect } from 'react';
import { useRegistreFiche } from './registre-fiche-provider';

interface Props {
  readonly rubriqueVisibleId?: string;
  readonly onRubriqueVisibleChange?: (id: string) => void;
}

export function SommaireRubriques({ rubriqueVisibleId, onRubriqueVisibleChange }: Props) {
  const { rubriquesSommaire } = useRegistreFiche();

  return (
    <nav aria-label="Sommaire des rubriques" className="space-y-1">
      {rubriquesSommaire.map((rubrique) => (
        <button
          key={rubrique.id}
          type="button"
          data-testid={`sommaire-${rubrique.id}`}
          className={`block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted ${
            rubriqueVisibleId === rubrique.id ? 'bg-muted font-medium' : ''
          }`}
          onClick={() => {
            onRubriqueVisibleChange?.(rubrique.id);
          }}
        >
          {rubrique.libelle}
          {rubrique.modifiee ? ' *' : ''}
        </button>
      ))}
    </nav>
  );
}

/** Defile vers la rubrique apres stabilisation de la mise en page (surbrillance sommaire). */
export function useDefilementRubriqueSommaire(rubriqueVisibleId: string | undefined): void {
  useEffect(() => {
    if (rubriqueVisibleId === undefined) return;

    const cible = rubriqueVisibleId;
    let annule = false;
    let secondFrame = 0;
    const premierFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        if (annule) return;
        document.getElementById(cible)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    return () => {
      annule = true;
      cancelAnimationFrame(premierFrame);
      if (secondFrame !== 0) cancelAnimationFrame(secondFrame);
    };
  }, [rubriqueVisibleId]);
}
