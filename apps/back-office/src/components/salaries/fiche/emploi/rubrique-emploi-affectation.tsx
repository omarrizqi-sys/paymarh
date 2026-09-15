'use client';

import { useCallback, useRef } from 'react';
import type { EmploiFiche, Etablissement, JourSemaine } from '@paymarh/shared-types';
import { Rubrique } from '@/components/formulaire/rubrique';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MessagesAlerteChamp } from '@/components/salaries/formulaire/messages-alerte-salarie';
import { modifierAffectationEmploi } from '@/lib/api/emplois';
import { libelleJourSemaine } from '@/lib/affichage/libelles';
import { libelleBaseSaisieDuree } from '@/lib/affichage/libelles-emploi';
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
  type ValeursAffectationEmploi,
} from '@/lib/fiche/valeurs-emploi';
import { idRubriqueEmploi, libelleRubriqueEmploi } from '@/lib/fiche/ordre-rubriques-fiche-salarie';
import { TeteRubriqueFiche } from '../tete-rubrique-fiche';
import { useRubriqueFiche } from '../use-rubrique-fiche';
import { ChampLectureEmploi } from './champ-lecture-emploi';
import { LigneHeritageChamp } from './ligne-heritage-champ';

interface Props {
  readonly companyId: string;
  readonly emploi: EmploiFiche;
  readonly etablissements: readonly Etablissement[];
  readonly onEmploiChange: (emploi: EmploiFiche) => void;
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

export function RubriqueEmploiAffectation({
  companyId,
  emploi,
  etablissements,
  onEmploiChange,
}: Props) {
  const emploiRef = useRef(emploi);
  emploiRef.current = emploi;

  const { id: emploiId, affectation, contrat, resolutions } = emploi;
  const libellePoste = contrat.libellePoste;
  const valeursServeur = valeursAffectationDepuisEmploi(affectation);

  const onServeurChange = useCallback(
    (valeurs: ValeursAffectationEmploi, version: number) => {
      const base = emploiRef.current;
      onEmploiChange({
        ...base,
        version,
        affectation: {
          ...base.affectation,
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
      });
    },
    [onEmploiChange]
  );

  const rubrique = useRubriqueFiche({
    id: idRubriqueEmploi(emploiId, 'affectation'),
    libelle: libelleRubriqueEmploi('affectation', libellePoste),
    entite: { kind: 'emploi', emploiId },
    valeursServeur,
    estModifiee: estAffectationModifiee,
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
      onEmploiChange(reponse.donnees);
      return { version: reponse.donnees.version, alertes: reponse.alertes };
    },
    onServeurChange,
  });

  const heritageDuree = phraseHeritageDuree(resolutions.dureeContractuelle);
  const heritageRepos = phraseHeritageJourSemaine(resolutions.reposHebdomadaire);
  const heritageRepartition = phraseHeritageGrilleHoraire(resolutions.grilleHoraire);
  const heritageTeletravail = phraseHeritageBoolean(resolutions.teletravailAutorise);

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
          <Select
            id={`${emploiId}-etablissement`}
            value={rubrique.courant.etablissementId}
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
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="etablissementId" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-departement`}>Département</Label>
          <Input
            id={`${emploiId}-departement`}
            value={rubrique.courant.departementRef}
            disabled={rubrique.verrouille}
            onChange={(e) => rubrique.modifier({ departementRef: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="departementRef" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-service`}>Service</Label>
          <Input
            id={`${emploiId}-service`}
            value={rubrique.courant.serviceRef}
            disabled={rubrique.verrouille}
            onChange={(e) => rubrique.modifier({ serviceRef: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="serviceRef" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-base-saisie-duree`}>Base de saisie de la durée</Label>
          <Select
            id={`${emploiId}-base-saisie-duree`}
            value={rubrique.courant.baseSaisieDuree}
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
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="baseSaisieDuree" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-duree-contractuelle`}>Durée contractuelle</Label>
          <Input
            id={`${emploiId}-duree-contractuelle`}
            value={rubrique.courant.dureeContractuelle}
            disabled={rubrique.verrouille}
            onChange={(e) => rubrique.modifier({ dureeContractuelle: e.target.value })}
            data-testid={`${emploiId}-duree-contractuelle`}
          />
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
          <Input
            id={`${emploiId}-repartition-horaire`}
            value={rubrique.courant.repartitionHoraireRef}
            disabled={rubrique.verrouille}
            onChange={(e) => rubrique.modifier({ repartitionHoraireRef: e.target.value })}
          />
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="repartitionHoraireRef" />
          <LigneHeritageChamp
            heritage={heritageRepartition}
            testId={`${emploiId}-heritage-repartition-horaire`}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-repos-hebdomadaire`}>Repos hebdomadaire</Label>
          <Select
            id={`${emploiId}-repos-hebdomadaire`}
            value={rubrique.courant.reposHebdomadaire}
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
          <MessagesAlerteChamp alertes={rubrique.alertes} champ="reposHebdomadaire" />
          <LigneHeritageChamp
            heritage={heritageRepos}
            testId={`${emploiId}-heritage-repos-hebdomadaire`}
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${emploiId}-suivre-jours-feries`}
            checked={rubrique.courant.suivreJoursFeriesEtablissement}
            disabled={rubrique.verrouille}
            onChange={(e) =>
              rubrique.modifier({ suivreJoursFeriesEtablissement: e.target.checked })
            }
          />
          <Label htmlFor={`${emploiId}-suivre-jours-feries`}>
            Suivre les jours fériés de l’établissement
          </Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${emploiId}-teletravail-autorise`}>Télétravail autorisé</Label>
          <Select
            id={`${emploiId}-teletravail-autorise`}
            value={rubrique.courant.teletravailAutorise}
            disabled={rubrique.verrouille}
            onChange={(e) => rubrique.modifier({ teletravailAutorise: e.target.value })}
          >
            <option value=""></option>
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </Select>
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
