'use client';

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
  readonly salarieId: string;
  readonly valeurs: ValeursDates;
  readonly dateSortie: string | null;
  readonly onServeurChange: (valeurs: ValeursDates, version: number) => void;
}

export function RubriqueDates({
  companyId,
  salarieId,
  valeurs,
  dateSortie,
  onServeurChange,
}: Props) {
  const rubrique = useRubriqueFiche({
    id: 'dates',
    libelle: 'Dates cles',
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
    <Rubrique id="dates" titre="Dates cles">
      <TeteRubriqueFiche
        erreur={rubrique.erreur}
        alertes={rubrique.alertes}
        testidErreur="erreur-rubrique-dates"
        testidAlertes="alertes-tete-dates"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dateEntree">Date d entree *</Label>
          <Input
            id="dateEntree"
            type="date"
            value={rubrique.courant.dateEntree.slice(0, 10)}
            onChange={(e) => rubrique.modifier({ dateEntree: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="dateEntree" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateAnciennete">Date d anciennete *</Label>
          <Input
            id="dateAnciennete"
            type="date"
            value={rubrique.courant.dateAnciennete.slice(0, 10)}
            onChange={(e) => rubrique.modifier({ dateAnciennete: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="dateAnciennete" />
        </div>
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
      </div>
    </Rubrique>
  );
}
