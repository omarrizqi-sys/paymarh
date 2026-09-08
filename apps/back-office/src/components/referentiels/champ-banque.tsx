'use client';

import { useMemo, useState } from 'react';
import type { Banque } from '@paymarh/shared-types';
import { Input } from '@/components/ui/input';

export interface ValeurChampBanque {
  readonly banqueId: string | null;
  readonly texte: string;
}

interface Props {
  readonly id: string;
  readonly banques: readonly Banque[];
  readonly valeur: ValeurChampBanque;
  readonly onChange: (valeur: ValeurChampBanque) => void;
  readonly disabled?: boolean;
}

function valeurDepuisLigne(
  banqueId: string | null,
  banqueLibreSaisie: string | null,
  banques: readonly Banque[]
): ValeurChampBanque {
  if (banqueId !== null) {
    const banque = banques.find((b) => b.id === banqueId);
    return { banqueId, texte: banque?.nom ?? '' };
  }
  return { banqueId: null, texte: banqueLibreSaisie ?? '' };
}

export function valeurChampBanqueDepuisLigne(
  banqueId: string | null,
  banqueLibreSaisie: string | null,
  banques: readonly Banque[]
): ValeurChampBanque {
  return valeurDepuisLigne(banqueId, banqueLibreSaisie, banques);
}

export function ligneDepuisValeurChampBanque(
  valeur: ValeurChampBanque,
  banques: readonly Banque[]
): { banqueId: string | null; banqueLibreSaisie: string | null } {
  const correspondance = banques.find(
    (b) => b.nom.localeCompare(valeur.texte, 'fr', { sensitivity: 'base' }) === 0
  );
  if (correspondance !== undefined) {
    return { banqueId: correspondance.id, banqueLibreSaisie: null };
  }
  const texte = valeur.texte.trim();
  if (texte.length === 0) {
    return { banqueId: null, banqueLibreSaisie: null };
  }
  return { banqueId: null, banqueLibreSaisie: texte };
}

export function ChampBanque({ id, banques, valeur, onChange, disabled = false }: Props) {
  const [ouvert, setOuvert] = useState(false);

  const suggestions = useMemo(() => {
    const filtre = valeur.texte.trim().toLowerCase();
    if (filtre.length === 0) return banques.slice(0, 8);
    return banques
      .filter(
        (b) =>
          b.nom.toLowerCase().includes(filtre) ||
          (b.ancienNom?.toLowerCase().includes(filtre) ?? false)
      )
      .slice(0, 8);
  }, [banques, valeur.texte]);

  return (
    <div className="relative">
      <Input
        id={id}
        value={valeur.texte}
        disabled={disabled}
        autoComplete="off"
        onFocus={() => setOuvert(true)}
        onBlur={() => {
          setTimeout(() => setOuvert(false), 150);
        }}
        onChange={(event) => {
          const texte = event.target.value;
          const correspondance = banques.find(
            (b) => b.nom.localeCompare(texte, 'fr', { sensitivity: 'base' }) === 0
          );
          onChange({
            banqueId: correspondance?.id ?? null,
            texte,
          });
        }}
      />
      {ouvert && suggestions.length > 0 ? (
        <ul
          className="bg-popover absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border shadow-md"
          data-testid={`${id}-suggestions`}
        >
          {suggestions.map((banque) => (
            <li key={banque.id}>
              <button
                type="button"
                className="hover:bg-accent w-full px-3 py-2 text-left text-sm"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange({ banqueId: banque.id, texte: banque.nom });
                  setOuvert(false);
                }}
              >
                {banque.nom}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
