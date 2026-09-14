import type {
  Banque,
  CompteBancaireSalarie,
  EmploiFiche,
  PaiementEmploiFiche,
} from '@paymarh/shared-types';
import { Rubrique } from '@/components/formulaire/rubrique';
import { libelleModePaiement } from '@/lib/affichage/libelles-emploi';
import { idRubriqueEmploi } from '@/lib/fiche/ordre-rubriques-fiche-salarie';
import { ChampLectureEmploi } from './champ-lecture-emploi';

interface Props {
  readonly emploi: EmploiFiche;
  readonly paiement: PaiementEmploiFiche;
  readonly comptesBancaires?: readonly CompteBancaireSalarie[];
  readonly banques: readonly Banque[];
}

function libelleCompteBancaire(
  compteId: string | null,
  comptes: readonly CompteBancaireSalarie[] | undefined,
  banques: readonly Banque[]
): string {
  if (compteId === null || comptes === undefined) {
    return '';
  }
  const compte = comptes.find((entry) => entry.id === compteId);
  if (compte === undefined) {
    return '';
  }
  const segments: string[] = [];
  if (compte.banqueId !== null) {
    const banque = banques.find((entry) => entry.id === compte.banqueId)?.nom;
    if (banque !== undefined && banque.length > 0) {
      segments.push(banque);
    }
  } else if (compte.banqueLibreSaisie !== null && compte.banqueLibreSaisie.length > 0) {
    segments.push(compte.banqueLibreSaisie);
  }
  if (compte.titulaire !== null && compte.titulaire.length > 0) {
    segments.push(compte.titulaire);
  }
  if (compte.rib !== null && compte.rib.length > 0) {
    segments.push(compte.rib);
  }
  return segments.join(' — ');
}

export function RubriqueEmploiPaiement({ emploi, paiement, comptesBancaires, banques }: Props) {
  return (
    <Rubrique
      id={idRubriqueEmploi(emploi.id, 'paiement')}
      titre={`Paiement — ${emploi.contrat.libellePoste}`}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <ChampLectureEmploi
          label="Mode de paiement"
          valeur={paiement.modePaiement !== null ? libelleModePaiement(paiement.modePaiement) : ''}
        />
        <ChampLectureEmploi
          label="Compte bancaire"
          valeur={libelleCompteBancaire(paiement.compteBancaireId, comptesBancaires, banques)}
        />
      </div>
    </Rubrique>
  );
}
