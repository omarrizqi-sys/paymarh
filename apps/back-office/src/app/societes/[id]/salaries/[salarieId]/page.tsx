import { notFound } from 'next/navigation';
import { FicheSalarieClient } from '@/components/salaries/fiche/fiche-salarie-client';
import { lireSalarie } from '@/lib/api/salaries';
import { listerPays, listerSituationsFamiliales } from '@/lib/api/referentiels';

interface Props {
  readonly params: Promise<{ id: string; salarieId: string }>;
}

export default async function PageFicheSalarie({ params }: Props) {
  const { id: companyId, salarieId } = await params;

  try {
    const [reponse, pays, situations] = await Promise.all([
      lireSalarie(companyId, salarieId),
      listerPays(),
      listerSituationsFamiliales(),
    ]);

    return (
      <div className="space-y-4">
        <FicheSalarieClient
          companyId={companyId}
          salarieId={salarieId}
          initial={reponse.donnees}
          pays={pays.data.items}
          situationsFamiliales={situations.data.items}
        />
      </div>
    );
  } catch {
    return notFound();
  }
}
