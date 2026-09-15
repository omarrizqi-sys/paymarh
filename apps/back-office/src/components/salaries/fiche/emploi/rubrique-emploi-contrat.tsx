'use client';

import { useCallback, useRef } from 'react';
import type {
  ContratEmploiFiche,
  EmploiFiche,
  MotifSortie,
  TypeContrat,
} from '@paymarh/shared-types';
import { Rubrique } from '@/components/formulaire/rubrique';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { MessagesAlerteChamp } from '@/components/salaries/formulaire/messages-alerte-salarie';
import { modifierContratEmploi } from '@/lib/api/emplois';
import { libelleStatutCadre } from '@/lib/affichage/libelles-emploi';
import {
  chaineOuNull,
  statutCadreDepuisSelect,
  valeursContratDepuisEmploi,
  type ValeursContratEmploi,
} from '@/lib/fiche/valeurs-emploi';
import { idRubriqueEmploi, libelleRubriqueEmploi } from '@/lib/fiche/ordre-rubriques-fiche-salarie';
import { TeteRubriqueFiche } from '../tete-rubrique-fiche';
import { useRubriqueFiche } from '../use-rubrique-fiche';
import { ChampLectureEmploi } from './champ-lecture-emploi';

interface Props {
  readonly companyId: string;
  readonly emploi: EmploiFiche;
  readonly typesContrat: readonly TypeContrat[];
  readonly motifsSortie: readonly MotifSortie[];
  readonly onEmploiChange: (emploi: EmploiFiche) => void;
}

function estContratModifie(courant: ValeursContratEmploi, serveur: ValeursContratEmploi): boolean {
  return (
    courant.libellePoste !== serveur.libellePoste ||
    courant.dateDebut !== serveur.dateDebut ||
    courant.dateFin !== serveur.dateFin ||
    courant.typeContratCode !== serveur.typeContratCode ||
    courant.periodeEssaiDateFin !== serveur.periodeEssaiDateFin ||
    courant.renouvellementEssaiDateFin !== serveur.renouvellementEssaiDateFin ||
    courant.statutCadre !== serveur.statutCadre ||
    courant.coefficient !== serveur.coefficient ||
    courant.position !== serveur.position ||
    courant.indice !== serveur.indice ||
    courant.dateSortie !== serveur.dateSortie ||
    courant.motifSortieCode !== serveur.motifSortieCode
  );
}

function afficherNombre(valeur: number | null): string {
  if (valeur === null) {
    return '';
  }
  return String(valeur);
}

export function RubriqueEmploiContrat({
  companyId,
  emploi,
  typesContrat,
  motifsSortie,
  onEmploiChange,
}: Props) {
  const emploiRef = useRef(emploi);
  emploiRef.current = emploi;

  const { id: emploiId, contrat } = emploi;
  const libellePoste = contrat.libellePoste;
  const valeursServeur = valeursContratDepuisEmploi(contrat);

  const onServeurChange = useCallback(
    (valeurs: ValeursContratEmploi, version: number) => {
      const base = emploiRef.current;
      onEmploiChange({
        ...base,
        version,
        contrat: {
          ...base.contrat,
          libellePoste: valeurs.libellePoste,
          dateDebut: valeurs.dateDebut,
          dateFin: chaineOuNull(valeurs.dateFin),
          typeContratCode: valeurs.typeContratCode,
          periodeEssaiDateFin: chaineOuNull(valeurs.periodeEssaiDateFin),
          renouvellementEssaiDateFin: chaineOuNull(valeurs.renouvellementEssaiDateFin),
          statutCadre: statutCadreDepuisSelect(valeurs.statutCadre),
          coefficient: chaineOuNull(valeurs.coefficient),
          position: chaineOuNull(valeurs.position),
          indice: chaineOuNull(valeurs.indice),
          dateSortie: chaineOuNull(valeurs.dateSortie),
          motifSortieCode: chaineOuNull(valeurs.motifSortieCode),
        },
      });
    },
    [onEmploiChange]
  );

  const rubrique = useRubriqueFiche({
    id: idRubriqueEmploi(emploiId, 'contrat'),
    libelle: libelleRubriqueEmploi('contrat', libellePoste),
    entite: { kind: 'emploi', emploiId },
    valeursServeur,
    estModifiee: estContratModifie,
    envoyer: async (version, courant) => {
      const reponse = await modifierContratEmploi(companyId, emploiId, version, {
        libellePoste: courant.libellePoste,
        dateDebut: courant.dateDebut,
        dateFin: chaineOuNull(courant.dateFin),
        typeContratCode: courant.typeContratCode,
        periodeEssaiDateFin: chaineOuNull(courant.periodeEssaiDateFin),
        renouvellementEssaiDateFin: chaineOuNull(courant.renouvellementEssaiDateFin),
        statutCadre: statutCadreDepuisSelect(courant.statutCadre),
        coefficient: chaineOuNull(courant.coefficient),
        position: chaineOuNull(courant.position),
        indice: chaineOuNull(courant.indice),
        dateSortie: chaineOuNull(courant.dateSortie),
        motifSortieCode: chaineOuNull(courant.motifSortieCode),
      });
      onEmploiChange(reponse.donnees);
      return { version: reponse.donnees.version, alertes: reponse.alertes };
    },
    onServeurChange,
  });

  const contratServeur: ContratEmploiFiche = emploi.contrat;

  return (
    <Rubrique id={idRubriqueEmploi(emploiId, 'contrat')} titre={`Contrat — ${libellePoste}`}>
      <TeteRubriqueFiche
        erreur={rubrique.erreur}
        alertes={rubrique.alertes}
        testidErreur={`erreur-rubrique-${emploiId}-contrat`}
        testidAlertes={`alertes-tete-${emploiId}-contrat`}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-libelle-poste`}>Libellé du poste</Label>
          <Input
            id={`${emploiId}-libelle-poste`}
            value={rubrique.courant.libellePoste}
            disabled={rubrique.verrouille}
            onChange={(e) => rubrique.modifier({ libellePoste: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="libellePoste" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-type-contrat`}>Type de contrat</Label>
          <Select
            id={`${emploiId}-type-contrat`}
            value={rubrique.courant.typeContratCode}
            disabled={rubrique.verrouille}
            onChange={(e) => rubrique.modifier({ typeContratCode: e.target.value })}
            data-testid={`${emploiId}-type-contrat-select`}
          >
            {typesContrat.map((type) => (
              <option key={type.code} value={type.code}>
                {type.libelle}
              </option>
            ))}
          </Select>
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="typeContratCode" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-date-debut`}>Date de début</Label>
          <Input
            id={`${emploiId}-date-debut`}
            type="date"
            value={rubrique.courant.dateDebut.slice(0, 10)}
            disabled={rubrique.verrouille}
            onChange={(e) => rubrique.modifier({ dateDebut: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="dateDebut" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-date-fin`}>Date de fin</Label>
          <Input
            id={`${emploiId}-date-fin`}
            type="date"
            value={rubrique.courant.dateFin.slice(0, 10)}
            disabled={rubrique.verrouille}
            onChange={(e) => rubrique.modifier({ dateFin: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="dateFin" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-fin-essai`}>Fin de période d’essai</Label>
          <Input
            id={`${emploiId}-fin-essai`}
            type="date"
            value={rubrique.courant.periodeEssaiDateFin.slice(0, 10)}
            disabled={rubrique.verrouille}
            onChange={(e) => rubrique.modifier({ periodeEssaiDateFin: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="periodeEssaiDateFin" />
        </div>
        <ChampLectureEmploi
          label="Durée de la période d’essai (jours)"
          valeur={afficherNombre(contratServeur.periodeEssaiDureeJours)}
        />
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-fin-renouvellement-essai`}>
            Fin du renouvellement d’essai
          </Label>
          <Input
            id={`${emploiId}-fin-renouvellement-essai`}
            type="date"
            value={rubrique.courant.renouvellementEssaiDateFin.slice(0, 10)}
            disabled={rubrique.verrouille}
            onChange={(e) => rubrique.modifier({ renouvellementEssaiDateFin: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="renouvellementEssaiDateFin" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-statut-cadre`}>Statut cadre</Label>
          <Select
            id={`${emploiId}-statut-cadre`}
            value={rubrique.courant.statutCadre}
            disabled={rubrique.verrouille}
            onChange={(e) => rubrique.modifier({ statutCadre: e.target.value })}
          >
            <option value=""></option>
            <option value="CADRE">{libelleStatutCadre('CADRE')}</option>
            <option value="NON_CADRE">{libelleStatutCadre('NON_CADRE')}</option>
          </Select>
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="statutCadre" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-coefficient`}>Coefficient</Label>
          <Input
            id={`${emploiId}-coefficient`}
            value={rubrique.courant.coefficient}
            disabled={rubrique.verrouille}
            onChange={(e) => rubrique.modifier({ coefficient: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="coefficient" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-position`}>Position</Label>
          <Input
            id={`${emploiId}-position`}
            value={rubrique.courant.position}
            disabled={rubrique.verrouille}
            onChange={(e) => rubrique.modifier({ position: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="position" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-indice`}>Indice</Label>
          <Input
            id={`${emploiId}-indice`}
            value={rubrique.courant.indice}
            disabled={rubrique.verrouille}
            onChange={(e) => rubrique.modifier({ indice: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="indice" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-date-sortie`}>Date de sortie</Label>
          <Input
            id={`${emploiId}-date-sortie`}
            type="date"
            value={rubrique.courant.dateSortie.slice(0, 10)}
            disabled={rubrique.verrouille}
            onChange={(e) => rubrique.modifier({ dateSortie: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="dateSortie" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-motif-sortie`}>Motif de sortie</Label>
          <Select
            id={`${emploiId}-motif-sortie`}
            value={rubrique.courant.motifSortieCode}
            disabled={rubrique.verrouille}
            onChange={(e) => rubrique.modifier({ motifSortieCode: e.target.value })}
            data-testid={`${emploiId}-motif-sortie-select`}
          >
            <option value=""></option>
            {motifsSortie.map((motif) => (
              <option key={motif.code} value={motif.code}>
                {motif.libelle}
              </option>
            ))}
          </Select>
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="motifSortieCode" />
        </div>
      </div>
    </Rubrique>
  );
}
