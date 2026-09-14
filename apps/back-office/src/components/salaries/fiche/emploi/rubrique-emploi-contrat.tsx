import type { ContratEmploiFiche, MotifSortie, TypeContrat } from '@paymarh/shared-types';
import { Rubrique } from '@/components/formulaire/rubrique';
import { libelleReferentielParCode, libelleStatutCadre } from '@/lib/affichage/libelles-emploi';
import { idRubriqueEmploi } from '@/lib/fiche/ordre-rubriques-fiche-salarie';
import { ChampLectureEmploi } from './champ-lecture-emploi';

interface Props {
  readonly emploiId: string;
  readonly libellePoste: string;
  readonly contrat: ContratEmploiFiche;
  readonly typesContrat: readonly TypeContrat[];
  readonly motifsSortie: readonly MotifSortie[];
}

function afficherDate(valeur: string | null): string {
  return valeur ?? '';
}

function afficherNombre(valeur: number | null): string {
  if (valeur === null) {
    return '';
  }
  return String(valeur);
}

export function RubriqueEmploiContrat({
  emploiId,
  libellePoste,
  contrat,
  typesContrat,
  motifsSortie,
}: Props) {
  return (
    <Rubrique id={idRubriqueEmploi(emploiId, 'contrat')} titre={`Contrat — ${libellePoste}`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <ChampLectureEmploi label="Libellé du poste" valeur={contrat.libellePoste} />
        <ChampLectureEmploi
          label="Type de contrat"
          valeur={libelleReferentielParCode(typesContrat, contrat.typeContratCode)}
          testId={`${emploiId}-type-contrat`}
        />
        <ChampLectureEmploi label="Date de début" valeur={afficherDate(contrat.dateDebut)} />
        <ChampLectureEmploi label="Date de fin" valeur={afficherDate(contrat.dateFin)} />
        <ChampLectureEmploi
          label="Fin de période d’essai"
          valeur={afficherDate(contrat.periodeEssaiDateFin)}
        />
        <ChampLectureEmploi
          label="Durée de la période d’essai (jours)"
          valeur={afficherNombre(contrat.periodeEssaiDureeJours)}
        />
        <ChampLectureEmploi
          label="Fin du renouvellement d’essai"
          valeur={afficherDate(contrat.renouvellementEssaiDateFin)}
        />
        <ChampLectureEmploi
          label="Statut cadre"
          valeur={contrat.statutCadre !== null ? libelleStatutCadre(contrat.statutCadre) : ''}
        />
        <ChampLectureEmploi label="Coefficient" valeur={contrat.coefficient ?? ''} />
        <ChampLectureEmploi label="Position" valeur={contrat.position ?? ''} />
        <ChampLectureEmploi label="Indice" valeur={contrat.indice ?? ''} />
        <ChampLectureEmploi label="Date de sortie" valeur={afficherDate(contrat.dateSortie)} />
        <ChampLectureEmploi
          label="Motif de sortie"
          valeur={
            contrat.motifSortieCode !== null
              ? libelleReferentielParCode(motifsSortie, contrat.motifSortieCode)
              : ''
          }
          testId={`${emploiId}-motif-sortie`}
        />
      </div>
    </Rubrique>
  );
}
