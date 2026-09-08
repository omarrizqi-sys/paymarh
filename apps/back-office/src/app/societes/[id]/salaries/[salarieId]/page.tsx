import { notFound } from 'next/navigation';
import { FicheSalarieClient } from '@/components/salaries/fiche/fiche-salarie-client';
import { lireSalarie } from '@/lib/api/salaries';
import {
  listerBanques,
  listerLiensParente,
  listerPays,
  listerSituationsFamiliales,
} from '@/lib/api/referentiels';
import { journaliserErreurServeur } from '@/lib/api/journaliser-erreur-serveur';

interface Props {
  readonly params: Promise<{ id: string; salarieId: string }>;
}

export default async function PageFicheSalarie({ params }: Props) {
  const { id: companyId, salarieId } = await params;

  try {
    const [reponse, pays, situations, liensParente, banques] = await Promise.all([
      lireSalarie(companyId, salarieId),
      listerPays(),
      listerSituationsFamiliales(),
      listerLiensParente(),
      listerBanques(),
    ]);

    return (
      <div className="space-y-4">
        <FicheSalarieClient
          companyId={companyId}
          salarieId={salarieId}
          initial={reponse.donnees}
          pays={pays.data.items}
          situationsFamiliales={situations.data.items}
          liensParente={liensParente.data.items}
          banques={banques.data.items}
        />
      </div>
    );
  } catch (erreur) {
    journaliserErreurServeur(erreur, {
      methode: 'GET',
      url: `/societes/${companyId}/salaries/${salarieId}`,
    });
    return notFound();
  }
}
