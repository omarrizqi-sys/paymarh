'use client';

import type { AlerteApi } from '@paymarh/shared-types';
import { Rubrique } from '@/components/formulaire/rubrique';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessagesAlerteChamp } from '@/components/salaries/formulaire/messages-alerte-salarie';
import { modifierDatesSalarie } from '@/lib/api/salaries';
import { TeteRubriqueFiche } from './tete-rubrique-fiche';
import { useRubriqueFiche } from './use-rubrique-fiche';

export interface ValeursDates {
  readonly dateEntree: string;
  readonly dateAnciennete: string;
}

interface Props {
  readonly companyId: string;
  readonly salarieId?: string;
  readonly valeurs: ValeursDates;
  readonly dateSortie?: string | null;
  readonly afficherDateSortie?: boolean;
  readonly alertesExternes?: readonly AlerteApi[];
  readonly onServeurChange: (valeurs: ValeursDates, version: number) => void;
}

export function RubriqueDates({
  companyId,
  salarieId,
  valeurs,
  dateSortie,
  afficherDateSortie = true,
  alertesExternes,
  onServeurChange,
}: Props) {
  const rubrique = useRubriqueFiche({
    id: 'dates',
    libelle: 'Dates clés',
    valeursServeur: valeurs,
    alertesExternes,
    estModifiee: (courant, serveur) =>
      courant.dateEntree !== serveur.dateEntree ||
      courant.dateAnciennete !== serveur.dateAnciennete,
    envoyer: async (version, courant) => {
      if (salarieId === undefined) {
        throw new Error('La rubrique Dates ne s’envoie pas à la création.');
      }
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
    <Rubrique id="dates" titre="Dates clés">
      <TeteRubriqueFiche
        erreur={rubrique.erreur}
        alertes={rubrique.alertes}
        testidErreur="erreur-rubrique-dates"
        testidAlertes="alertes-tete-dates"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dateEntree">Date d’entrée *</Label>
          <Input
            id="dateEntree"
            type="date"
            value={rubrique.courant.dateEntree.slice(0, 10)}
            disabled={rubrique.verrouille}
            onChange={(e) => rubrique.modifier({ dateEntree: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="dateEntree" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateAnciennete">Date d’ancienneté</Label>
          <Input
            id="dateAnciennete"
            type="date"
            value={rubrique.courant.dateAnciennete.slice(0, 10)}
            disabled={rubrique.verrouille}
            onChange={(e) => rubrique.modifier({ dateAnciennete: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="dateAnciennete" />
        </div>
        {afficherDateSortie ? (
          <div className="space-y-2">
            <Label htmlFor="dateSortie">Date de sortie</Label>
            <Input
              id="dateSortie"
              type="date"
              value={dateSortie?.slice(0, 10) ?? ''}
              readOnly
              disabled
            />
          </div>
        ) : null}
      </div>
    </Rubrique>
  );
}
