'use client';

import { useCallback } from 'react';
import type {
  ContratEmploiFiche,
  EmploiFiche,
  MotifSortie,
  Permission,
  TypeContrat,
} from '@paymarh/shared-types';
import { Rubrique } from '@/components/formulaire/rubrique';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { MessagesAlerteChamp } from '@/components/salaries/formulaire/messages-alerte-salarie';
import { modifierContratEmploi } from '@/lib/api/emplois';
import { afficherDate } from '@/lib/affichage/dates';
import { libelleReferentielParCode, libelleStatutCadre } from '@/lib/affichage/libelles-emploi';
import {
  chaineOuNull,
  statutCadreDepuisSelect,
  valeursContratDepuisEmploi,
  type MiseAJourEmploiFiche,
  type ValeursContratEmploi,
} from '@/lib/fiche/valeurs-emploi';
import { fusionnerReponseEmploi } from '@/lib/fiche/remontee-emploi';
import { idRubriqueEmploi, libelleRubriqueEmploi } from '@/lib/fiche/ordre-rubriques-fiche-salarie';
import { possedePermission } from '@/lib/permissions';
import { TeteRubriqueFiche } from '../tete-rubrique-fiche';
import { useRubriqueFiche } from '../use-rubrique-fiche';
import { ChampLectureEmploi, ValeurLectureEmploi } from './champ-lecture-emploi';

interface Props {
  readonly companyId: string;
  readonly emploi: EmploiFiche;
  readonly typesContrat: readonly TypeContrat[];
  readonly motifsSortie: readonly MotifSortie[];
  readonly operations: readonly Permission[];
  readonly onEmploiChange: (maj: MiseAJourEmploiFiche) => void;
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

function afficherStatutCadre(valeur: string): string {
  const statut = statutCadreDepuisSelect(valeur);
  return statut === null ? '' : libelleStatutCadre(statut);
}

function afficherMotifSortie(code: string, motifs: readonly MotifSortie[]): string {
  return code === '' ? '' : libelleReferentielParCode(motifs, code);
}

export function RubriqueEmploiContrat({
  companyId,
  emploi,
  typesContrat,
  motifsSortie,
  operations,
  onEmploiChange,
}: Props) {
  const peutModifier = possedePermission(operations, 'emploi.modifier');
  const { id: emploiId, contrat } = emploi;
  const libellePoste = contrat.libellePoste;
  const valeursServeur = valeursContratDepuisEmploi(contrat);

  const onServeurChange = useCallback(
    (valeurs: ValeursContratEmploi, version: number) => {
      onEmploiChange((courant) => {
        if (courant.id !== emploiId) {
          return courant;
        }
        return {
          ...courant,
          version,
          contrat: {
            ...courant.contrat,
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
        };
      });
    },
    [emploiId, onEmploiChange]
  );

  const rubrique = useRubriqueFiche({
    id: idRubriqueEmploi(emploiId, 'contrat'),
    libelle: libelleRubriqueEmploi('contrat', libellePoste),
    entite: { kind: 'emploi', emploiId },
    valeursServeur,
    estModifiee: (courant, serveur) => peutModifier && estContratModifie(courant, serveur),
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
      onEmploiChange((emploiCourant) =>
        fusionnerReponseEmploi(emploiCourant, reponse.donnees, 'contrat')
      );
      return { version: reponse.donnees.version, alertes: reponse.alertes };
    },
    onServeurChange,
  });

  const contratServeur: ContratEmploiFiche = emploi.contrat;
  const courant = rubrique.courant;

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
          {peutModifier ? (
            <Input
              id={`${emploiId}-libelle-poste`}
              value={courant.libellePoste}
              disabled={rubrique.verrouille}
              onChange={(e) => rubrique.modifier({ libellePoste: e.target.value })}
            />
          ) : (
            <ValeurLectureEmploi
              valeur={courant.libellePoste}
              testId={`${emploiId}-libelle-poste`}
            />
          )}
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="libellePoste" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-type-contrat`}>Type de contrat</Label>
          {peutModifier ? (
            <Select
              id={`${emploiId}-type-contrat`}
              value={courant.typeContratCode}
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
          ) : (
            <ValeurLectureEmploi
              valeur={libelleReferentielParCode(typesContrat, courant.typeContratCode)}
              testId={`${emploiId}-type-contrat`}
            />
          )}
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="typeContratCode" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-date-debut`}>Date de début</Label>
          {peutModifier ? (
            <Input
              id={`${emploiId}-date-debut`}
              type="date"
              value={courant.dateDebut.slice(0, 10)}
              disabled={rubrique.verrouille}
              onChange={(e) => rubrique.modifier({ dateDebut: e.target.value })}
            />
          ) : (
            <ValeurLectureEmploi
              valeur={afficherDate(courant.dateDebut)}
              testId={`${emploiId}-date-debut`}
            />
          )}
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="dateDebut" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-date-fin`}>Date de fin</Label>
          {peutModifier ? (
            <Input
              id={`${emploiId}-date-fin`}
              type="date"
              value={courant.dateFin.slice(0, 10)}
              disabled={rubrique.verrouille}
              onChange={(e) => rubrique.modifier({ dateFin: e.target.value })}
            />
          ) : (
            <ValeurLectureEmploi
              valeur={afficherDate(courant.dateFin)}
              testId={`${emploiId}-date-fin`}
            />
          )}
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="dateFin" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-fin-essai`}>Fin de période d’essai</Label>
          {peutModifier ? (
            <Input
              id={`${emploiId}-fin-essai`}
              type="date"
              value={courant.periodeEssaiDateFin.slice(0, 10)}
              disabled={rubrique.verrouille}
              onChange={(e) => rubrique.modifier({ periodeEssaiDateFin: e.target.value })}
            />
          ) : (
            <ValeurLectureEmploi
              valeur={afficherDate(courant.periodeEssaiDateFin)}
              testId={`${emploiId}-fin-essai`}
            />
          )}
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
          {peutModifier ? (
            <Input
              id={`${emploiId}-fin-renouvellement-essai`}
              type="date"
              value={courant.renouvellementEssaiDateFin.slice(0, 10)}
              disabled={rubrique.verrouille}
              onChange={(e) => rubrique.modifier({ renouvellementEssaiDateFin: e.target.value })}
            />
          ) : (
            <ValeurLectureEmploi
              valeur={afficherDate(courant.renouvellementEssaiDateFin)}
              testId={`${emploiId}-fin-renouvellement-essai`}
            />
          )}
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="renouvellementEssaiDateFin" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-statut-cadre`}>Statut cadre</Label>
          {peutModifier ? (
            <Select
              id={`${emploiId}-statut-cadre`}
              value={courant.statutCadre}
              disabled={rubrique.verrouille}
              onChange={(e) => rubrique.modifier({ statutCadre: e.target.value })}
            >
              <option value=""></option>
              <option value="CADRE">{libelleStatutCadre('CADRE')}</option>
              <option value="NON_CADRE">{libelleStatutCadre('NON_CADRE')}</option>
            </Select>
          ) : (
            <ValeurLectureEmploi
              valeur={afficherStatutCadre(courant.statutCadre)}
              testId={`${emploiId}-statut-cadre`}
            />
          )}
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="statutCadre" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-coefficient`}>Coefficient</Label>
          {peutModifier ? (
            <Input
              id={`${emploiId}-coefficient`}
              value={courant.coefficient}
              disabled={rubrique.verrouille}
              onChange={(e) => rubrique.modifier({ coefficient: e.target.value })}
            />
          ) : (
            <ValeurLectureEmploi valeur={courant.coefficient} testId={`${emploiId}-coefficient`} />
          )}
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="coefficient" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-position`}>Position</Label>
          {peutModifier ? (
            <Input
              id={`${emploiId}-position`}
              value={courant.position}
              disabled={rubrique.verrouille}
              onChange={(e) => rubrique.modifier({ position: e.target.value })}
            />
          ) : (
            <ValeurLectureEmploi valeur={courant.position} testId={`${emploiId}-position`} />
          )}
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="position" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-indice`}>Indice</Label>
          {peutModifier ? (
            <Input
              id={`${emploiId}-indice`}
              value={courant.indice}
              disabled={rubrique.verrouille}
              onChange={(e) => rubrique.modifier({ indice: e.target.value })}
            />
          ) : (
            <ValeurLectureEmploi valeur={courant.indice} testId={`${emploiId}-indice`} />
          )}
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="indice" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-date-sortie`}>Date de sortie</Label>
          {peutModifier ? (
            <Input
              id={`${emploiId}-date-sortie`}
              type="date"
              value={courant.dateSortie.slice(0, 10)}
              disabled={rubrique.verrouille}
              onChange={(e) => rubrique.modifier({ dateSortie: e.target.value })}
            />
          ) : (
            <ValeurLectureEmploi
              valeur={afficherDate(courant.dateSortie)}
              testId={`${emploiId}-date-sortie`}
            />
          )}
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="dateSortie" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-motif-sortie`}>Motif de sortie</Label>
          {peutModifier ? (
            <Select
              id={`${emploiId}-motif-sortie`}
              value={courant.motifSortieCode}
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
          ) : (
            <ValeurLectureEmploi
              valeur={afficherMotifSortie(courant.motifSortieCode, motifsSortie)}
              testId={`${emploiId}-motif-sortie`}
            />
          )}
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="motifSortieCode" />
        </div>
      </div>
    </Rubrique>
  );
}
