'use client';

/**
 * RUBRIQUE JETABLE — socle 2.1.c-1 temps 2.a uniquement.
 * Sera remplacee par la vraie rubrique coordonnees en 2.1.c-2.
 * Champs bruts (adresse, ville) sans regle d affichage, obligation ni format de la spec fiche salarie.
 */
import { Rubrique } from '@/components/formulaire/rubrique';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { modifierCoordonneesSalarie } from '@/lib/api/salaries';
import { useRubriqueFiche } from './use-rubrique-fiche';

interface ValeursCoordonnees {
  readonly adresse: string;
  readonly ville: string;
}

interface Props {
  readonly companyId: string;
  readonly salarieId: string;
  readonly valeurs: ValeursCoordonnees;
  readonly onServeurChange: (valeurs: ValeursCoordonnees, version: number) => void;
}

export function RubriqueCoordonneesDemo({ companyId, salarieId, valeurs, onServeurChange }: Props) {
  const rubrique = useRubriqueFiche({
    id: 'coordonnees',
    libelle: 'Coordonnees',
    valeursServeur: valeurs,
    estModifiee: (courant, serveur) =>
      courant.adresse !== serveur.adresse || courant.ville !== serveur.ville,
    envoyer: async (version, courant) => {
      const reponse = await modifierCoordonneesSalarie(companyId, salarieId, version, {
        adresse: courant.adresse,
        ville: courant.ville,
      });
      onServeurChange(
        {
          adresse: reponse.donnees.adresse ?? '',
          ville: reponse.donnees.ville ?? '',
        },
        reponse.donnees.version
      );
      return { version: reponse.donnees.version, alertes: reponse.alertes };
    },
    onServeurChange,
  });

  return (
    <Rubrique id="coordonnees" titre="Coordonnees (jetable)">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="adresse">Adresse</Label>
          <Input
            id="adresse"
            value={rubrique.courant.adresse}
            onChange={(e) => rubrique.modifier({ adresse: e.target.value })}
          />
          {rubrique.erreur ? (
            <p
              className="text-destructive text-sm"
              role="alert"
              data-testid="erreur-rubrique-coordonnees"
            >
              {rubrique.erreur}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="ville">Ville</Label>
          <Input
            id="ville"
            value={rubrique.courant.ville}
            onChange={(e) => rubrique.modifier({ ville: e.target.value })}
          />
        </div>
      </div>
    </Rubrique>
  );
}
