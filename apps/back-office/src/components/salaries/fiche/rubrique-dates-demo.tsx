'use client';

/**
 * RUBRIQUE JETABLE — socle 2.1.c-1 temps 2.a uniquement.
 * Sera remplacee par la vraie rubrique dates en 2.1.c-2.
 * Champs bruts (dateEntree, dateAnciennete) sans regle d affichage, obligation ni format de la spec fiche salarie.
 */
import { Rubrique } from '@/components/formulaire/rubrique';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { modifierDatesSalarie } from '@/lib/api/salaries';
import { useRubriqueFiche } from './use-rubrique-fiche';

interface ValeursDates {
  readonly dateEntree: string;
  readonly dateAnciennete: string;
}

interface Props {
  readonly companyId: string;
  readonly salarieId: string;
  readonly valeurs: ValeursDates;
  readonly onServeurChange: (valeurs: ValeursDates, version: number) => void;
}

export function RubriqueDatesDemo({ companyId, salarieId, valeurs, onServeurChange }: Props) {
  const rubrique = useRubriqueFiche({
    id: 'dates',
    libelle: 'Dates',
    valeursServeur: valeurs,
    estModifiee: (courant, serveur) =>
      courant.dateEntree !== serveur.dateEntree ||
      courant.dateAnciennete !== serveur.dateAnciennete,
    envoyer: async (version, courant) => {
      const reponse = await modifierDatesSalarie(companyId, salarieId, version, {
        dateEntree: courant.dateEntree,
        dateAnciennete: courant.dateAnciennete,
      });
      onServeurChange(
        {
          dateEntree: reponse.donnees.dateEntree,
          dateAnciennete: reponse.donnees.dateAnciennete,
        },
        reponse.donnees.version
      );
      return { version: reponse.donnees.version, alertes: reponse.alertes };
    },
    onServeurChange,
  });

  return (
    <Rubrique id="dates" titre="Dates (jetable)">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="dateEntree">Date d entree</Label>
          <Input
            id="dateEntree"
            type="date"
            value={rubrique.courant.dateEntree}
            onChange={(e) => rubrique.modifier({ dateEntree: e.target.value })}
          />
          {rubrique.erreur ? (
            <p className="text-destructive text-sm" role="alert">
              {rubrique.erreur}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="dateAnciennete">Date d anciennete</Label>
          <Input
            id="dateAnciennete"
            type="date"
            value={rubrique.courant.dateAnciennete}
            onChange={(e) => rubrique.modifier({ dateAnciennete: e.target.value })}
          />
        </div>
      </div>
    </Rubrique>
  );
}
