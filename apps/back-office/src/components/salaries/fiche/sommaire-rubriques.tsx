'use client';

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
            document
              .getElementById(rubrique.id)
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
