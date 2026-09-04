'use client';

/**
 * RUBRIQUE JETABLE — socle 2.1.c-1 temps 2.a uniquement.
 * Sera remplacee par la vraie rubrique identite en 2.1.c-2.
 * Champs bruts (nom, prenom) sans regle d affichage, obligation ni format de la spec fiche salarie.
 */
import { Rubrique } from '@/components/formulaire/rubrique';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessagesAlerteChamp } from '@/components/salaries/formulaire/messages-alerte-salarie';
import { modifierIdentiteSalarie } from '@/lib/api/salaries';
import { useRubriqueFiche } from './use-rubrique-fiche';

interface ValeursIdentite {
  readonly nom: string;
  readonly prenom: string;
}

interface Props {
  readonly companyId: string;
  readonly salarieId: string;
  readonly valeurs: ValeursIdentite;
  readonly onServeurChange: (valeurs: ValeursIdentite, version: number) => void;
}

export function RubriqueIdentiteDemo({ companyId, salarieId, valeurs, onServeurChange }: Props) {
  const rubrique = useRubriqueFiche({
    id: 'identite',
    libelle: 'Identite',
    valeursServeur: valeurs,
    estModifiee: (courant, serveur) =>
      courant.nom !== serveur.nom || courant.prenom !== serveur.prenom,
    envoyer: async (version, courant) => {
      const reponse = await modifierIdentiteSalarie(companyId, salarieId, version, {
        nom: courant.nom,
        prenom: courant.prenom,
      });
      onServeurChange(
        { nom: reponse.donnees.nom, prenom: reponse.donnees.prenom },
        reponse.donnees.version
      );
      return { version: reponse.donnees.version, alertes: reponse.alertes };
    },
    onServeurChange,
  });

  return (
    <Rubrique
      id="identite"
      titre="Identite (jetable)"
      description="Rubrique jetable — remplacement prevu en 2.1.c-2"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="nom">Nom</Label>
          <Input
            id="nom"
            value={rubrique.courant.nom}
            onChange={(e) => rubrique.modifier({ nom: e.target.value })}
          />
          {rubrique.erreur ? (
            <p className="text-destructive text-sm" role="alert">
              {rubrique.erreur}
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="prenom">Prenom</Label>
          <Input
            id="prenom"
            value={rubrique.courant.prenom}
            onChange={(e) => rubrique.modifier({ prenom: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} />
        </div>
      </div>
    </Rubrique>
  );
}
