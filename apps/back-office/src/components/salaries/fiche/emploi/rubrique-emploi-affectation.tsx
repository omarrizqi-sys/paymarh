import type { Etablissement, EmploiFiche } from '@paymarh/shared-types';
import { Rubrique } from '@/components/formulaire/rubrique';
import { libelleJourSemaine } from '@/lib/affichage/libelles';
import { afficherBoolean, libelleBaseSaisieDuree } from '@/lib/affichage/libelles-emploi';
import {
  phraseHeritageBoolean,
  phraseHeritageDuree,
  phraseHeritageJourSemaine,
} from '@/lib/affichage/heritage-emploi';
import { idRubriqueEmploi } from '@/lib/fiche/ordre-rubriques-fiche-salarie';
import { ChampLectureEmploi } from './champ-lecture-emploi';

interface Props {
  readonly emploi: EmploiFiche;
  readonly etablissements: readonly Etablissement[];
}

function libelleEtablissement(
  etablissements: readonly Etablissement[],
  etablissementId: string
): string {
  return etablissements.find((etablissement) => etablissement.id === etablissementId)?.nom ?? '';
}

export function RubriqueEmploiAffectation({ emploi, etablissements }: Props) {
  const { affectation, contrat, resolutions } = emploi;

  return (
    <Rubrique
      id={idRubriqueEmploi(emploi.id, 'affectation')}
      titre={`Affectation — ${contrat.libellePoste}`}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <ChampLectureEmploi
          label="Établissement"
          valeur={libelleEtablissement(etablissements, affectation.etablissementId)}
          testId={`${emploi.id}-etablissement`}
        />
        <ChampLectureEmploi label="Département" valeur={affectation.departementRef ?? ''} />
        <ChampLectureEmploi label="Service" valeur={affectation.serviceRef ?? ''} />
        <ChampLectureEmploi
          label="Base de saisie de la durée"
          valeur={libelleBaseSaisieDuree(affectation.baseSaisieDuree)}
        />
        <ChampLectureEmploi
          label="Durée contractuelle"
          valeur={affectation.dureeContractuelle ?? ''}
          heritage={phraseHeritageDuree(resolutions.dureeContractuelle)}
          heritageTestId={`${emploi.id}-heritage-duree-contractuelle`}
        />
        <ChampLectureEmploi
          label="Durée dans l’autre base"
          valeur={affectation.dureeDansAutreBase ?? ''}
        />
        <ChampLectureEmploi
          label="Répartition horaire"
          valeur={affectation.repartitionHoraireRef ?? ''}
        />
        <ChampLectureEmploi
          label="Repos hebdomadaire"
          valeur={
            affectation.reposHebdomadaire !== null
              ? libelleJourSemaine(affectation.reposHebdomadaire)
              : ''
          }
          heritage={phraseHeritageJourSemaine(resolutions.reposHebdomadaire)}
          heritageTestId={`${emploi.id}-heritage-repos-hebdomadaire`}
        />
        <ChampLectureEmploi
          label="Suivre les jours fériés de l’établissement"
          valeur={afficherBoolean(affectation.suivreJoursFeriesEtablissement)}
        />
        <ChampLectureEmploi
          label="Télétravail autorisé"
          valeur={afficherBoolean(affectation.teletravailAutorise)}
          heritage={phraseHeritageBoolean(resolutions.teletravailAutorise)}
          heritageTestId={`${emploi.id}-heritage-teletravail-autorise`}
        />
      </div>
    </Rubrique>
  );
}
