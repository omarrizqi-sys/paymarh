'use client';

import type {
  Pays,
  SituationFamiliale,
  SituationFamilialeSalarie,
  SexePersonne,
} from '@paymarh/shared-types';
import { Rubrique } from '@/components/formulaire/rubrique';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { MessagesAlerteChamp } from '@/components/salaries/formulaire/messages-alerte-salarie';
import { modifierIdentiteSalarie } from '@/lib/api/salaries';
import { TeteRubriqueFiche } from './tete-rubrique-fiche';
import { useRubriqueFiche } from './use-rubrique-fiche';

export interface ValeursIdentite {
  readonly nom: string;
  readonly prenom: string;
  readonly sexe: SexePersonne;
  readonly dateNaissance: string;
  readonly villeNaissance: string;
  readonly paysNaissanceId: string;
  readonly nationaliteId: string;
  readonly situationFamilialeCode: string;
}

interface Props {
  readonly companyId: string;
  readonly salarieId: string;
  readonly valeurs: ValeursIdentite;
  readonly pays: readonly Pays[];
  readonly situationsFamiliales: readonly SituationFamiliale[];
  /** Libelle accorde renvoye par la lecture — affiche tel quel, jamais recalcule. */
  readonly libelleSituationEnregistree: string | null;
  readonly onServeurChange: (
    valeurs: ValeursIdentite,
    version: number,
    extras: {
      readonly typePieceIdentite: string | null;
      readonly situationFamiliale: SituationFamilialeSalarie;
    }
  ) => void;
}

function videOuNull(valeur: string): string | null {
  return valeur === '' ? null : valeur;
}

function libelleOptionSituation(
  situation: SituationFamiliale,
  sexe: SexePersonne,
  codeEnregistre: string,
  libelleEnregistre: string | null
): string {
  if (situation.code === codeEnregistre && libelleEnregistre !== null && libelleEnregistre !== '') {
    return libelleEnregistre;
  }
  return sexe === 'FEMME' ? situation.libelleFeminin : situation.libelleMasculin;
}

export function RubriqueIdentite({
  companyId,
  salarieId,
  valeurs,
  pays,
  situationsFamiliales,
  libelleSituationEnregistree,
  onServeurChange,
}: Props) {
  const rubrique = useRubriqueFiche({
    id: 'identite',
    libelle: 'Identite',
    valeursServeur: valeurs,
    estModifiee: (courant, serveur) =>
      courant.nom !== serveur.nom ||
      courant.prenom !== serveur.prenom ||
      courant.sexe !== serveur.sexe ||
      courant.dateNaissance !== serveur.dateNaissance ||
      courant.villeNaissance !== serveur.villeNaissance ||
      courant.paysNaissanceId !== serveur.paysNaissanceId ||
      courant.nationaliteId !== serveur.nationaliteId ||
      courant.situationFamilialeCode !== serveur.situationFamilialeCode,
    envoyer: async (version, courant) => {
      const reponse = await modifierIdentiteSalarie(companyId, salarieId, version, {
        nom: courant.nom,
        prenom: courant.prenom,
        sexe: courant.sexe,
        dateNaissance: courant.dateNaissance,
        villeNaissance: videOuNull(courant.villeNaissance),
        paysNaissanceId: videOuNull(courant.paysNaissanceId),
        nationaliteId: videOuNull(courant.nationaliteId),
        situationFamilialeCode: videOuNull(courant.situationFamilialeCode),
      });
      onServeurChange(
        {
          nom: reponse.donnees.nom,
          prenom: reponse.donnees.prenom,
          sexe: reponse.donnees.sexe,
          dateNaissance: reponse.donnees.dateNaissance,
          villeNaissance: reponse.donnees.villeNaissance ?? '',
          paysNaissanceId: reponse.donnees.paysNaissanceId ?? '',
          nationaliteId: reponse.donnees.nationaliteId ?? '',
          situationFamilialeCode: reponse.donnees.situationFamiliale.code ?? '',
        },
        reponse.donnees.version,
        {
          typePieceIdentite: reponse.donnees.typePieceIdentite,
          situationFamiliale: reponse.donnees.situationFamiliale,
        }
      );
      return { version: reponse.donnees.version, alertes: reponse.alertes };
    },
    onServeurChange: () => undefined,
  });

  return (
    <Rubrique id="identite" titre="Identite">
      <TeteRubriqueFiche
        erreur={rubrique.erreur}
        alertes={rubrique.alertes}
        testidErreur="erreur-rubrique-identite"
        testidAlertes="alertes-tete-identite"
      />

      <h3 className="text-sm font-medium">Identification</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nom">Nom *</Label>
          <Input
            id="nom"
            value={rubrique.courant.nom}
            onChange={(e) => rubrique.modifier({ nom: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="nom" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prenom">Prenom *</Label>
          <Input
            id="prenom"
            value={rubrique.courant.prenom}
            onChange={(e) => rubrique.modifier({ prenom: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="prenom" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sexe">Sexe *</Label>
          <Select
            id="sexe"
            value={rubrique.courant.sexe}
            onChange={(e) => rubrique.modifier({ sexe: e.target.value as SexePersonne })}
          >
            <option value="HOMME">Homme</option>
            <option value="FEMME">Femme</option>
          </Select>
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="sexe" />
        </div>
      </div>

      <h3 className="text-sm font-medium">Etat civil</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dateNaissance">Date de naissance *</Label>
          <Input
            id="dateNaissance"
            type="date"
            value={rubrique.courant.dateNaissance.slice(0, 10)}
            onChange={(e) => rubrique.modifier({ dateNaissance: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="dateNaissance" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="villeNaissance">Ville de naissance</Label>
          <Input
            id="villeNaissance"
            value={rubrique.courant.villeNaissance}
            onChange={(e) => rubrique.modifier({ villeNaissance: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="villeNaissance" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paysNaissanceId">Pays de naissance</Label>
          <Select
            id="paysNaissanceId"
            value={rubrique.courant.paysNaissanceId}
            onChange={(e) => rubrique.modifier({ paysNaissanceId: e.target.value })}
          >
            <option value=""></option>
            {pays.map((p) => (
              <option key={p.id} value={p.id}>
                {p.libelle}
              </option>
            ))}
          </Select>
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="paysNaissanceId" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nationaliteId">Nationalite</Label>
          <Select
            id="nationaliteId"
            value={rubrique.courant.nationaliteId}
            onChange={(e) => rubrique.modifier({ nationaliteId: e.target.value })}
          >
            <option value=""></option>
            {pays.map((p) => (
              <option key={p.id} value={p.id}>
                {p.libelle}
              </option>
            ))}
          </Select>
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="nationaliteId" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="situationFamilialeCode">Situation familiale</Label>
          <Select
            id="situationFamilialeCode"
            value={rubrique.courant.situationFamilialeCode}
            onChange={(e) => rubrique.modifier({ situationFamilialeCode: e.target.value })}
          >
            <option value=""></option>
            {situationsFamiliales.map((s) => (
              <option key={s.code} value={s.code}>
                {libelleOptionSituation(
                  s,
                  rubrique.courant.sexe,
                  valeurs.situationFamilialeCode,
                  libelleSituationEnregistree
                )}
              </option>
            ))}
          </Select>
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="situationFamilialeCode" />
        </div>
      </div>
    </Rubrique>
  );
}
