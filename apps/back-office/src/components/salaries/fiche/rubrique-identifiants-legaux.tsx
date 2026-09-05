'use client';

import { Rubrique } from '@/components/formulaire/rubrique';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessagesAlerteChamp } from '@/components/salaries/formulaire/messages-alerte-salarie';
import { modifierIdentifiantsLegauxSalarie } from '@/lib/api/salaries';
import { TeteRubriqueFiche } from './tete-rubrique-fiche';
import { useRubriqueFiche } from './use-rubrique-fiche';

export interface ValeursIdentifiantsLegaux {
  readonly matricule: string;
  readonly numeroPiece: string;
  readonly numeroCnss: string;
  readonly numeroCimr: string;
}

interface Props {
  readonly companyId: string;
  readonly salarieId: string;
  readonly valeurs: ValeursIdentifiantsLegaux;
  readonly typePieceIdentite: string | null;
  readonly onServeurChange: (valeurs: ValeursIdentifiantsLegaux, version: number) => void;
}

function videOuNull(valeur: string): string | null {
  return valeur === '' ? null : valeur;
}

export function RubriqueIdentifiantsLegaux({
  companyId,
  salarieId,
  valeurs,
  typePieceIdentite,
  onServeurChange,
}: Props) {
  const rubrique = useRubriqueFiche({
    id: 'identifiants-legaux',
    libelle: 'Identifiants et immatriculations',
    valeursServeur: valeurs,
    estModifiee: (courant, serveur) =>
      courant.matricule !== serveur.matricule ||
      courant.numeroPiece !== serveur.numeroPiece ||
      courant.numeroCnss !== serveur.numeroCnss ||
      courant.numeroCimr !== serveur.numeroCimr,
    envoyer: async (version, courant) => {
      const reponse = await modifierIdentifiantsLegauxSalarie(companyId, salarieId, version, {
        matricule: courant.matricule,
        numeroPiece: videOuNull(courant.numeroPiece),
        numeroCnss: videOuNull(courant.numeroCnss),
        numeroCimr: videOuNull(courant.numeroCimr),
      });
      onServeurChange(
        {
          matricule: reponse.donnees.matricule,
          numeroPiece: reponse.donnees.numeroPiece ?? '',
          numeroCnss: reponse.donnees.numeroCnss ?? '',
          numeroCimr: reponse.donnees.numeroCimr ?? '',
        },
        reponse.donnees.version
      );
      return { version: reponse.donnees.version, alertes: reponse.alertes };
    },
    onServeurChange,
  });

  return (
    <Rubrique id="identifiants-legaux" titre="Identifiants et immatriculations">
      <TeteRubriqueFiche
        erreur={rubrique.erreur}
        alertes={rubrique.alertes}
        testidErreur="erreur-rubrique-identifiants-legaux"
        testidAlertes="alertes-tete-identifiants-legaux"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="matricule">Matricule *</Label>
          <Input
            id="matricule"
            type="text"
            inputMode="text"
            value={rubrique.courant.matricule}
            onChange={(e) => rubrique.modifier({ matricule: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="matricule" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="typePieceIdentite">Type de piece d identite</Label>
          <Input
            id="typePieceIdentite"
            data-testid="type-piece-identite"
            type="text"
            value={typePieceIdentite ?? ''}
            readOnly
            disabled
          />
          <p className="text-muted-foreground text-xs" data-testid="mention-type-piece">
            mis a jour a l enregistrement
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="numeroPiece">Numero de piece</Label>
          <Input
            id="numeroPiece"
            type="text"
            inputMode="text"
            value={rubrique.courant.numeroPiece}
            onChange={(e) => rubrique.modifier({ numeroPiece: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="numeroPiece" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="numeroCnss">Numero CNSS</Label>
          <Input
            id="numeroCnss"
            type="text"
            inputMode="text"
            value={rubrique.courant.numeroCnss}
            onChange={(e) => rubrique.modifier({ numeroCnss: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="numeroCnss" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="numeroCimr">Numero CIMR</Label>
          <Input
            id="numeroCimr"
            type="text"
            inputMode="text"
            value={rubrique.courant.numeroCimr}
            onChange={(e) => rubrique.modifier({ numeroCimr: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="numeroCimr" />
        </div>
      </div>
    </Rubrique>
  );
}
