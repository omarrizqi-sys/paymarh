'use client';

import type { JourSemaine, TypeHeure } from '@paymarh/shared-types';
import { afficherNombreDecimal, sommerDurees } from '@/lib/affichage/nombres';
import { libelleJourSemaine } from '@/lib/affichage/libelles';
import { Input } from '@/components/ui/input';

const JOURS: readonly JourSemaine[] = [
  'LUNDI',
  'MARDI',
  'MERCREDI',
  'JEUDI',
  'VENDREDI',
  'SAMEDI',
  'DIMANCHE',
];

interface Props {
  readonly typesHeures: readonly TypeHeure[];
  readonly valeurs: Record<string, string>;
  readonly onChange: (cle: string, valeur: string) => void;
  readonly lectureSeule?: boolean;
  readonly dureeHebdomadaire?: string;
}

/** Grille horaire hebdomadaire — lignes depuis le referentiel TypeHeure. */
export function GrilleHoraireDefaut({
  typesHeures,
  valeurs,
  onChange,
  lectureSeule,
  dureeHebdomadaire,
}: Props) {
  const typesTries = [...typesHeures].sort((a, b) => a.ordre - b.ordre);
  const toutesHeures = Object.values(valeurs);
  const total = sommerDurees(toutesHeures);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left font-medium">Jour</th>
              {typesTries.map((t) => (
                <th key={t.id} className="p-2 text-left font-medium">
                  {t.libelle}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {JOURS.map((jour) => (
              <tr key={jour} className="border-b">
                <td className="p-2">{libelleJourSemaine(jour)}</td>
                {typesTries.map((type) => {
                  const cle = `${jour}-${type.id}`;
                  return (
                    <td key={cle} className="p-2">
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="h-8 w-20"
                        value={valeurs[cle] ?? '0'}
                        disabled={lectureSeule}
                        onChange={(e) => onChange(cle, e.target.value)}
                        aria-label={`${libelleJourSemaine(jour)} — ${type.libelle}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-muted-foreground text-sm">
        Total de controle : <strong>{afficherNombreDecimal(total.toString())}</strong> h / semaine
        {dureeHebdomadaire ? (
          <> (duree hebdomadaire declaree : {afficherNombreDecimal(dureeHebdomadaire)} h)</>
        ) : null}
      </p>
    </div>
  );
}

export function construireCleGrille(jour: JourSemaine, typeHeureId: string): string {
  return `${jour}-${typeHeureId}`;
}

export function extraireGrilleDepuisParametrage(
  lignes: readonly { jourSemaine: JourSemaine; typeHeureId: string; nombreHeures: string }[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of lignes) {
    map[construireCleGrille(l.jourSemaine, l.typeHeureId)] = l.nombreHeures;
  }
  return map;
}

export function serialiserGrille(
  valeurs: Record<string, string>,
  typesHeures: readonly TypeHeure[]
): { jourSemaine: JourSemaine; typeHeureId: string; nombreHeures: string }[] {
  const result: { jourSemaine: JourSemaine; typeHeureId: string; nombreHeures: string }[] = [];
  for (const jour of JOURS) {
    for (const type of typesHeures) {
      const cle = construireCleGrille(jour, type.id);
      result.push({
        jourSemaine: jour,
        typeHeureId: type.id,
        nombreHeures: valeurs[cle] ?? '0',
      });
    }
  }
  return result;
}
