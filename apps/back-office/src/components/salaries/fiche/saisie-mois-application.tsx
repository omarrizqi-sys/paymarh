'use client';

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MOIS_APPLICATION } from '@/lib/fiche/mois-application-commun';

export const MOIS_LABELS_FORMULAIRE = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const;

interface Props {
  readonly idPrefix: string;
  readonly moisApplication: readonly number[];
  readonly onChange: (moisApplication: readonly number[]) => void;
}

export function SaisieMoisApplication({ idPrefix, moisApplication, onChange }: Props) {
  const tousLesMoisCoches = moisApplication.length === 12;

  const basculerMois = (mois: number, coche: boolean) => {
    const courants = new Set(moisApplication);
    if (coche) {
      courants.add(mois);
    } else {
      courants.delete(mois);
    }
    onChange([...courants].sort((a, b) => a - b));
  };

  const basculerTousLesMois = (coche: boolean) => {
    onChange(coche ? [...MOIS_APPLICATION] : []);
  };

  return (
    <div className="space-y-2">
      <Label>Mois d’application</Label>
      <div className="flex items-center gap-2">
        <Checkbox
          id={`tous-les-mois-${idPrefix}`}
          checked={tousLesMoisCoches}
          onChange={(e) => basculerTousLesMois(e.target.checked)}
        />
        <Label htmlFor={`tous-les-mois-${idPrefix}`}>Tous les mois</Label>
      </div>
      <div className="flex flex-wrap gap-3">
        {MOIS_APPLICATION.map((mois) => (
          <div key={mois} className="flex items-center gap-2">
            <Checkbox
              id={`mois-${idPrefix}-${mois}`}
              checked={moisApplication.includes(mois)}
              onChange={(e) => basculerMois(mois, e.target.checked)}
            />
            <Label htmlFor={`mois-${idPrefix}-${mois}`}>{MOIS_LABELS_FORMULAIRE[mois - 1]}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}
