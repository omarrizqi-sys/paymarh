'use client';

import { useCallback } from 'react';
import type { EmploiFiche, Etablissement, JourSemaine, Permission } from '@paymarh/shared-types';
import { Rubrique } from '@/components/formulaire/rubrique';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MessagesAlerteChamp } from '@/components/salaries/formulaire/messages-alerte-salarie';
import { modifierAffectationEmploi } from '@/lib/api/emplois';
import { libelleJourSemaine } from '@/lib/affichage/libelles';
import { afficherBoolean, libelleBaseSaisieDuree } from '@/lib/affichage/libelles-emploi';
import {
  phraseHeritageBoolean,
  phraseHeritageDuree,
  phraseHeritageGrilleHoraire,
  phraseHeritageJourSemaine,
} from '@/lib/affichage/heritage-emploi';
import {
  booleanNullableDepuisSelect,
  chaineOuNull,
  JOURS_SEMAINE,
  valeursAffectationDepuisEmploi,
  type MiseAJourEmploiFiche,
  type ValeursAffectationEmploi,
} from '@/lib/fiche/valeurs-emploi';
import { fusionnerReponseEmploi } from '@/lib/fiche/remontee-emploi';
import { idRubriqueEmploi, libelleRubriqueEmploi } from '@/lib/fiche/ordre-rubriques-fiche-salarie';
import { possedePermission } from '@/lib/permissions';
import { TeteRubriqueFiche } from '../tete-rubrique-fiche';
import { useRubriqueFiche } from '../use-rubrique-fiche';
import { ChampLectureEmploi, ValeurLectureEmploi } from './champ-lecture-emploi';
import { LigneHeritageChamp } from './ligne-heritage-champ';

interface Props {
  readonly companyId: string;
  readonly emploi: EmploiFiche;
  readonly etablissements: readonly Etablissement[];
  readonly operations: readonly Permission[];
  readonly onEmploiChange: (maj: MiseAJourEmploiFiche) => void;
}

function estAffectationModifiee(
  courant: ValeursAffectationEmploi,
  serveur: ValeursAffectationEmploi
): boolean {
  return (
    courant.etablissementId !== serveur.etablissementId ||
    courant.departementRef !== serveur.departementRef ||
    courant.serviceRef !== serveur.serviceRef ||
    courant.baseSaisieDuree !== serveur.baseSaisieDuree ||
    courant.dureeContractuelle !== serveur.dureeContractuelle ||
    courant.repartitionHoraireRef !== serveur.repartitionHoraireRef ||
    courant.reposHebdomadaire !== serveur.reposHebdomadaire ||
    courant.suivreJoursFeriesEtablissement !== serveur.suivreJoursFeriesEtablissement ||
    courant.teletravailAutorise !== serveur.teletravailAutorise
  );
}

function afficherEtablissement(id: string, etablissements: readonly Etablissement[]): string {
  return etablissements.find((etablissement) => etablissement.id === id)?.nom ?? '';
}

export function RubriqueEmploiAffectation({
  companyId,
  emploi,
  etablissements,
  operations,
  onEmploiChange,
}: Props) {
  const peutModifier = possedePermission(operations, 'emploi.modifier');
  const { id: emploiId, affectation, contrat, resolutions } = emploi;
  const libellePoste = contrat.libellePoste;
  const valeursServeur = valeursAffectationDepuisEmploi(affectation);

  const onServeurChange = useCallback(
    (valeurs: ValeursAffectationEmploi, version: number) => {
      onEmploiChange((courant) => {
        if (courant.id !== emploiId) {
          return courant;
        }
        return {
          ...courant,
          version,
          affectation: {
            ...courant.affectation,
            etablissementId: valeurs.etablissementId,
            departementRef: chaineOuNull(valeurs.departementRef),
            serviceRef: chaineOuNull(valeurs.serviceRef),
            baseSaisieDuree: valeurs.baseSaisieDuree,
            dureeContractuelle: chaineOuNull(valeurs.dureeContractuelle),
            repartitionHoraireRef: chaineOuNull(valeurs.repartitionHoraireRef),
            reposHebdomadaire:
              (chaineOuNull(valeurs.reposHebdomadaire) as JourSemaine | null) ?? null,
            suivreJoursFeriesEtablissement: valeurs.suivreJoursFeriesEtablissement,
            teletravailAutorise: booleanNullableDepuisSelect(valeurs.teletravailAutorise),
          },
        };
      });
    },
    [emploiId, onEmploiChange]
  );

  const rubrique = useRubriqueFiche({
    id: idRubriqueEmploi(emploiId, 'affectation'),
    libelle: libelleRubriqueEmploi('affectation', libellePoste),
    entite: { kind: 'emploi', emploiId },
    valeursServeur,
    estModifiee: (courant, serveur) => peutModifier && estAffectationModifiee(courant, serveur),
    envoyer: async (version, courant) => {
      const reponse = await modifierAffectationEmploi(companyId, emploiId, version, {
        etablissementId: courant.etablissementId,
        departementRef: chaineOuNull(courant.departementRef),
        serviceRef: chaineOuNull(courant.serviceRef),
        baseSaisieDuree: courant.baseSaisieDuree,
        dureeContractuelle: chaineOuNull(courant.dureeContractuelle),
        repartitionHoraireRef: chaineOuNull(courant.repartitionHoraireRef),
        reposHebdomadaire: (chaineOuNull(courant.reposHebdomadaire) as JourSemaine | null) ?? null,
        suivreJoursFeriesEtablissement: courant.suivreJoursFeriesEtablissement,
        teletravailAutorise: booleanNullableDepuisSelect(courant.teletravailAutorise),
      });
      onEmploiChange((emploiCourant) =>
        fusionnerReponseEmploi(emploiCourant, reponse.donnees, 'affectation')
      );
      return { version: reponse.donnees.version, alertes: reponse.alertes };
    },
    onServeurChange,
  });

  const heritageDuree = phraseHeritageDuree(resolutions.dureeContractuelle);
  const heritageRepos = phraseHeritageJourSemaine(resolutions.reposHebdomadaire);
  const heritageRepartition = phraseHeritageGrilleHoraire(resolutions.grilleHoraire);
  const heritageTeletravail = phraseHeritageBoolean(resolutions.teletravailAutorise);
  const courant = rubrique.courant;

  return (
    <Rubrique
      id={idRubriqueEmploi(emploiId, 'affectation')}
      titre={`Affectation — ${libellePoste}`}
    >
      <TeteRubriqueFiche
        erreur={rubrique.erreur}
        alertes={rubrique.alertes}
        testidErreur={`erreur-rubrique-${emploiId}-affectation`}
        testidAlertes={`alertes-tete-${emploiId}-affectation`}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-etablissement`}>Établissement</Label>
          {peutModifier ? (
            <Select
              id={`${emploiId}-etablissement`}
              value={courant.etablissementId}
              disabled={rubrique.verrouille}
              onChange={(e) => rubrique.modifier({ etablissementId: e.target.value })}
              data-testid={`${emploiId}-etablissement-select`}
            >
              {etablissements.map((etablissement) => (
                <option key={etablissement.id} value={etablissement.id}>
                  {etablissement.nom}
                </option>
              ))}
            </Select>
          ) : (
            <ValeurLectureEmploi
              valeur={afficherEtablissement(courant.etablissementId, etablissements)}
              testId={`${emploiId}-etablissement`}
            />
          )}
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="etablissementId" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-departement`}>Département</Label>
          {peutModifier ? (
            <Input
              id={`${emploiId}-departement`}
              value={courant.departementRef}
              disabled={rubrique.verrouille}
              onChange={(e) => rubrique.modifier({ departementRef: e.target.value })}
            />
          ) : (
            <ValeurLectureEmploi
              valeur={courant.departementRef}
              testId={`${emploiId}-departement`}
            />
          )}
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="departementRef" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-service`}>Service</Label>
          {peutModifier ? (
            <Input
              id={`${emploiId}-service`}
              value={courant.serviceRef}
              disabled={rubrique.verrouille}
              onChange={(e) => rubrique.modifier({ serviceRef: e.target.value })}
            />
          ) : (
            <ValeurLectureEmploi valeur={courant.serviceRef} testId={`${emploiId}-service`} />
          )}
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="serviceRef" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-base-saisie-duree`}>Base de saisie de la durée</Label>
          {peutModifier ? (
            <Select
              id={`${emploiId}-base-saisie-duree`}
              value={courant.baseSaisieDuree}
              disabled={rubrique.verrouille}
              onChange={(e) =>
                rubrique.modifier({
                  baseSaisieDuree: e.target.value as ValeursAffectationEmploi['baseSaisieDuree'],
                })
              }
            >
              <option value="HEBDOMADAIRE">{libelleBaseSaisieDuree('HEBDOMADAIRE')}</option>
              <option value="MENSUELLE">{libelleBaseSaisieDuree('MENSUELLE')}</option>
            </Select>
          ) : (
            <ValeurLectureEmploi
              valeur={libelleBaseSaisieDuree(courant.baseSaisieDuree)}
              testId={`${emploiId}-base-saisie-duree`}
            />
          )}
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="baseSaisieDuree" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-duree-contractuelle`}>Durée contractuelle</Label>
          {peutModifier ? (
            <Input
              id={`${emploiId}-duree-contractuelle`}
              value={courant.dureeContractuelle}
              disabled={rubrique.verrouille}
              onChange={(e) => rubrique.modifier({ dureeContractuelle: e.target.value })}
              data-testid={`${emploiId}-duree-contractuelle`}
            />
          ) : (
            <ValeurLectureEmploi
              valeur={courant.dureeContractuelle}
              testId={`${emploiId}-duree-contractuelle`}
            />
          )}
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="dureeContractuelle" />
          <LigneHeritageChamp
            heritage={heritageDuree}
            testId={`${emploiId}-heritage-duree-contractuelle`}
          />
        </div>
        <ChampLectureEmploi
          label="Durée dans l’autre base"
          valeur={affectation.dureeDansAutreBase ?? ''}
        />
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-repartition-horaire`}>Répartition horaire</Label>
          {peutModifier ? (
            <Input
              id={`${emploiId}-repartition-horaire`}
              value={courant.repartitionHoraireRef}
              disabled={rubrique.verrouille}
              onChange={(e) => rubrique.modifier({ repartitionHoraireRef: e.target.value })}
            />
          ) : (
            <ValeurLectureEmploi
              valeur={courant.repartitionHoraireRef}
              testId={`${emploiId}-repartition-horaire`}
            />
          )}
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="repartitionHoraireRef" />
          <LigneHeritageChamp
            heritage={heritageRepartition}
            testId={`${emploiId}-heritage-repartition-horaire`}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-repos-hebdomadaire`}>Repos hebdomadaire</Label>
          {peutModifier ? (
            <Select
              id={`${emploiId}-repos-hebdomadaire`}
              value={courant.reposHebdomadaire}
              disabled={rubrique.verrouille}
              onChange={(e) => rubrique.modifier({ reposHebdomadaire: e.target.value })}
            >
              <option value=""></option>
              {JOURS_SEMAINE.map((jour) => (
                <option key={jour} value={jour}>
                  {libelleJourSemaine(jour)}
                </option>
              ))}
            </Select>
          ) : (
            <ValeurLectureEmploi
              valeur={
                courant.reposHebdomadaire === ''
                  ? ''
                  : libelleJourSemaine(courant.reposHebdomadaire)
              }
              testId={`${emploiId}-repos-hebdomadaire`}
            />
          )}
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="reposHebdomadaire" />
          <LigneHeritageChamp
            heritage={heritageRepos}
            testId={`${emploiId}-heritage-repos-hebdomadaire`}
          />
        </div>
        {peutModifier ? (
          <div className="flex items-center gap-2">
            <Checkbox
              id={`${emploiId}-suivre-jours-feries`}
              checked={courant.suivreJoursFeriesEtablissement}
              disabled={rubrique.verrouille}
              onChange={(e) =>
                rubrique.modifier({ suivreJoursFeriesEtablissement: e.target.checked })
              }
            />
            <Label htmlFor={`${emploiId}-suivre-jours-feries`}>
              Suivre les jours fériés de l’établissement
            </Label>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor={`${emploiId}-suivre-jours-feries`}>
              Suivre les jours fériés de l’établissement
            </Label>
            <ValeurLectureEmploi
              valeur={afficherBoolean(courant.suivreJoursFeriesEtablissement)}
              testId={`${emploiId}-suivre-jours-feries`}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-teletravail-autorise`}>Télétravail autorisé</Label>
          {peutModifier ? (
            <Select
              id={`${emploiId}-teletravail-autorise`}
              value={courant.teletravailAutorise}
              disabled={rubrique.verrouille}
              onChange={(e) => rubrique.modifier({ teletravailAutorise: e.target.value })}
            >
              <option value=""></option>
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </Select>
          ) : (
            <ValeurLectureEmploi
              valeur={afficherBoolean(booleanNullableDepuisSelect(courant.teletravailAutorise))}
              testId={`${emploiId}-teletravail-autorise`}
            />
          )}
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="teletravailAutorise" />
          <LigneHeritageChamp
            heritage={heritageTeletravail}
            testId={`${emploiId}-heritage-teletravail-autorise`}
          />
        </div>
      </div>
    </Rubrique>
  );
}
