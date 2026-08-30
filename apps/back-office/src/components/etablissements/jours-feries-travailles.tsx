'use client';

import type { JourFerie } from '@paymarh/shared-types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Props {
  readonly joursFeries: readonly JourFerie[];
  readonly coches: ReadonlySet<string>;
  readonly onToggle: (id: string, coche: boolean) => void;
  readonly lectureSeule?: boolean;
}

/** Cases a cocher jours feries travailles — referentiel, sans date reelle. */
export function JoursFeriesTravailles({ joursFeries, coches, onToggle, lectureSeule }: Props) {
  const civils = joursFeries.filter((j) => j.type === 'CIVIL');
  const religieux = joursFeries.filter((j) => j.type === 'RELIGIEUX');

  function colonne(titre: string, items: readonly JourFerie[]) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium">{titre}</h4>
        <ul className="space-y-2">
          {items.map((jf) => (
            <li key={jf.id} className="flex items-start gap-2">
              <Checkbox
                id={`jf-${jf.id}`}
                checked={coches.has(jf.id)}
                disabled={lectureSeule}
                onChange={(e) => onToggle(jf.id, e.target.checked)}
              />
              <Label htmlFor={`jf-${jf.id}`} className="cursor-pointer leading-snug font-normal">
                {jf.libelle}
                <span className="text-muted-foreground block text-xs">{jf.referenceDate}</span>
              </Label>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {colonne('Fetes civiles', civils)}
      {colonne('Fetes religieuses', religieux)}
    </div>
  );
}
