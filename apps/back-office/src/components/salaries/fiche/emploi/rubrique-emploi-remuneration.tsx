import type { EmploiFiche, RemunerationEmploiFiche } from '@paymarh/shared-types';
import { Rubrique } from '@/components/formulaire/rubrique';
import { formaterMoisClotureConges } from '@/lib/affichage/libelles';
import { afficherBoolean, libelleModeDeterminationSalaire } from '@/lib/affichage/libelles-emploi';
import { phraseHeritageBoolean, phraseHeritageMontant } from '@/lib/affichage/heritage-emploi';
import { idRubriqueEmploi } from '@/lib/fiche/ordre-rubriques-fiche-salarie';
import { ChampLectureEmploi } from './champ-lecture-emploi';

interface Props {
  readonly emploi: EmploiFiche;
  readonly remuneration: RemunerationEmploiFiche;
}

function afficherMoisProduction(mois: readonly number[]): string {
  if (mois.length === 0) {
    return '';
  }
  return mois.map((numero) => formaterMoisClotureConges(numero)).join(', ');
}

export function RubriqueEmploiRemuneration({ emploi, remuneration }: Props) {
  const { contrat, resolutions } = emploi;
  const resolutionsRemuneration = resolutions as EmploiFiche['resolutions'] & {
    readonly teletravailIndemniteVersee?: EmploiFiche['resolutions']['teletravailIndemniteVersee'];
    readonly teletravailMontant?: EmploiFiche['resolutions']['teletravailMontant'];
  };

  const heritageIndemnite =
    'teletravailIndemniteVersee' in resolutionsRemuneration
      ? phraseHeritageBoolean(resolutionsRemuneration.teletravailIndemniteVersee ?? null)
      : null;

  const heritageMontant =
    'teletravailMontant' in resolutionsRemuneration
      ? phraseHeritageMontant(resolutionsRemuneration.teletravailMontant ?? null)
      : null;

  return (
    <Rubrique
      id={idRubriqueEmploi(emploi.id, 'remuneration')}
      titre={`Rémunération — ${contrat.libellePoste}`}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <ChampLectureEmploi
          label="Mode de détermination du salaire"
          valeur={libelleModeDeterminationSalaire(remuneration.modeDeterminationSalaire)}
        />
        <ChampLectureEmploi label="Montant" valeur={remuneration.montant} />
        <ChampLectureEmploi
          label="Masquer le nombre d’heures"
          valeur={afficherBoolean(remuneration.masquerNombreHeures)}
        />
        <ChampLectureEmploi
          label="Masquer le taux horaire"
          valeur={afficherBoolean(remuneration.masquerTauxHoraire)}
        />
        <ChampLectureEmploi
          label="Bulletin tous les mois"
          valeur={afficherBoolean(remuneration.bulletinTousLesMois)}
        />
        <ChampLectureEmploi
          label="Mois de production"
          valeur={afficherMoisProduction(remuneration.moisProduction)}
        />
        <ChampLectureEmploi
          label="Indemnité de télétravail versée"
          valeur={afficherBoolean(remuneration.teletravailIndemniteVersee)}
          heritage={heritageIndemnite}
          heritageTestId={`${emploi.id}-heritage-teletravail-indemnite`}
        />
        <ChampLectureEmploi
          label="Montant de l’indemnité de télétravail"
          valeur={remuneration.teletravailMontant ?? ''}
          heritage={heritageMontant}
          heritageTestId={`${emploi.id}-heritage-teletravail-montant`}
        />
      </div>
    </Rubrique>
  );
}
