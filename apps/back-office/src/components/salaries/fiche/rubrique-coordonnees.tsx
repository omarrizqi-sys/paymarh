'use client';

import type { Pays } from '@paymarh/shared-types';
import { Rubrique } from '@/components/formulaire/rubrique';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { MessagesAlerteChamp } from '@/components/salaries/formulaire/messages-alerte-salarie';
import { modifierCoordonneesSalarie } from '@/lib/api/salaries';
import { TeteRubriqueFiche } from './tete-rubrique-fiche';
import { useRubriqueFiche } from './use-rubrique-fiche';

export interface ValeursCoordonnees {
  readonly adresse: string;
  readonly complementAdresse: string;
  readonly codePostal: string;
  readonly ville: string;
  readonly paysId: string;
  readonly telephonePersonnel: string;
  readonly telephoneProfessionnel: string;
  readonly emailPersonnel: string;
  readonly emailProfessionnel: string;
  readonly urgencePrenom: string;
  readonly urgenceNom: string;
  readonly urgenceTelephone: string;
  readonly urgenceEmail: string;
}

interface Props {
  readonly companyId: string;
  readonly salarieId: string;
  readonly valeurs: ValeursCoordonnees;
  readonly pays: readonly Pays[];
  readonly onServeurChange: (valeurs: ValeursCoordonnees, version: number) => void;
}

function videOuNull(valeur: string): string | null {
  return valeur === '' ? null : valeur;
}

export function RubriqueCoordonnees({
  companyId,
  salarieId,
  valeurs,
  pays,
  onServeurChange,
}: Props) {
  const rubrique = useRubriqueFiche({
    id: 'coordonnees',
    libelle: 'Coordonnees',
    valeursServeur: valeurs,
    estModifiee: (courant, serveur) =>
      courant.adresse !== serveur.adresse ||
      courant.complementAdresse !== serveur.complementAdresse ||
      courant.codePostal !== serveur.codePostal ||
      courant.ville !== serveur.ville ||
      courant.paysId !== serveur.paysId ||
      courant.telephonePersonnel !== serveur.telephonePersonnel ||
      courant.telephoneProfessionnel !== serveur.telephoneProfessionnel ||
      courant.emailPersonnel !== serveur.emailPersonnel ||
      courant.emailProfessionnel !== serveur.emailProfessionnel ||
      courant.urgencePrenom !== serveur.urgencePrenom ||
      courant.urgenceNom !== serveur.urgenceNom ||
      courant.urgenceTelephone !== serveur.urgenceTelephone ||
      courant.urgenceEmail !== serveur.urgenceEmail,
    envoyer: async (version, courant) => {
      const reponse = await modifierCoordonneesSalarie(companyId, salarieId, version, {
        adresse: videOuNull(courant.adresse),
        complementAdresse: videOuNull(courant.complementAdresse),
        codePostal: videOuNull(courant.codePostal),
        ville: videOuNull(courant.ville),
        paysId: videOuNull(courant.paysId),
        telephonePersonnel: videOuNull(courant.telephonePersonnel),
        telephoneProfessionnel: videOuNull(courant.telephoneProfessionnel),
        emailPersonnel: videOuNull(courant.emailPersonnel),
        emailProfessionnel: videOuNull(courant.emailProfessionnel),
        urgencePrenom: videOuNull(courant.urgencePrenom),
        urgenceNom: videOuNull(courant.urgenceNom),
        urgenceTelephone: videOuNull(courant.urgenceTelephone),
        urgenceEmail: videOuNull(courant.urgenceEmail),
      });
      onServeurChange(
        {
          adresse: reponse.donnees.adresse ?? '',
          complementAdresse: reponse.donnees.complementAdresse ?? '',
          codePostal: reponse.donnees.codePostal ?? '',
          ville: reponse.donnees.ville ?? '',
          paysId: reponse.donnees.paysId ?? '',
          telephonePersonnel: reponse.donnees.telephonePersonnel ?? '',
          telephoneProfessionnel: reponse.donnees.telephoneProfessionnel ?? '',
          emailPersonnel: reponse.donnees.emailPersonnel ?? '',
          emailProfessionnel: reponse.donnees.emailProfessionnel ?? '',
          urgencePrenom: reponse.donnees.urgencePrenom ?? '',
          urgenceNom: reponse.donnees.urgenceNom ?? '',
          urgenceTelephone: reponse.donnees.urgenceTelephone ?? '',
          urgenceEmail: reponse.donnees.urgenceEmail ?? '',
        },
        reponse.donnees.version
      );
      return { version: reponse.donnees.version, alertes: reponse.alertes };
    },
    onServeurChange,
  });

  return (
    <Rubrique id="coordonnees" titre="Coordonnees">
      <TeteRubriqueFiche
        erreur={rubrique.erreur}
        alertes={rubrique.alertes}
        testidErreur="erreur-rubrique-coordonnees"
        testidAlertes="alertes-tete-coordonnees"
      />

      <h3 className="text-sm font-medium">Adresse</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="adresse">Adresse</Label>
          <Input
            id="adresse"
            value={rubrique.courant.adresse}
            onChange={(e) => rubrique.modifier({ adresse: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="adresse" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="complementAdresse">Complement d adresse</Label>
          <Input
            id="complementAdresse"
            value={rubrique.courant.complementAdresse}
            onChange={(e) => rubrique.modifier({ complementAdresse: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="complementAdresse" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="codePostal">Code postal</Label>
          <Input
            id="codePostal"
            type="text"
            inputMode="text"
            value={rubrique.courant.codePostal}
            onChange={(e) => rubrique.modifier({ codePostal: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="codePostal" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ville">Ville</Label>
          <Input
            id="ville"
            value={rubrique.courant.ville}
            onChange={(e) => rubrique.modifier({ ville: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="ville" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paysId">Pays</Label>
          <Select
            id="paysId"
            value={rubrique.courant.paysId}
            onChange={(e) => rubrique.modifier({ paysId: e.target.value })}
          >
            <option value=""></option>
            {pays.map((p) => (
              <option key={p.id} value={p.id}>
                {p.libelle}
              </option>
            ))}
          </Select>
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="paysId" />
        </div>
      </div>

      <h3 className="text-sm font-medium">Contact</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="telephonePersonnel">Telephone personnel</Label>
          <Input
            id="telephonePersonnel"
            type="text"
            value={rubrique.courant.telephonePersonnel}
            onChange={(e) => rubrique.modifier({ telephonePersonnel: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="telephonePersonnel" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telephoneProfessionnel">Telephone professionnel</Label>
          <Input
            id="telephoneProfessionnel"
            type="text"
            value={rubrique.courant.telephoneProfessionnel}
            onChange={(e) => rubrique.modifier({ telephoneProfessionnel: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="telephoneProfessionnel" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emailPersonnel">Email personnel</Label>
          <Input
            id="emailPersonnel"
            type="text"
            value={rubrique.courant.emailPersonnel}
            onChange={(e) => rubrique.modifier({ emailPersonnel: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="emailPersonnel" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emailProfessionnel">Email professionnel</Label>
          <Input
            id="emailProfessionnel"
            type="text"
            value={rubrique.courant.emailProfessionnel}
            onChange={(e) => rubrique.modifier({ emailProfessionnel: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="emailProfessionnel" />
        </div>
      </div>

      <h3 className="text-sm font-medium">Contact d urgence</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="urgencePrenom">Prenom</Label>
          <Input
            id="urgencePrenom"
            value={rubrique.courant.urgencePrenom}
            onChange={(e) => rubrique.modifier({ urgencePrenom: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="urgencePrenom" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="urgenceNom">Nom</Label>
          <Input
            id="urgenceNom"
            value={rubrique.courant.urgenceNom}
            onChange={(e) => rubrique.modifier({ urgenceNom: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="urgenceNom" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="urgenceTelephone">Telephone</Label>
          <Input
            id="urgenceTelephone"
            type="text"
            value={rubrique.courant.urgenceTelephone}
            onChange={(e) => rubrique.modifier({ urgenceTelephone: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="urgenceTelephone" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="urgenceEmail">Email</Label>
          <Input
            id="urgenceEmail"
            type="text"
            value={rubrique.courant.urgenceEmail}
            onChange={(e) => rubrique.modifier({ urgenceEmail: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="urgenceEmail" />
        </div>
      </div>
    </Rubrique>
  );
}
