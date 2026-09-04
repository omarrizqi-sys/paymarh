import { notFound } from 'next/navigation';
import { FicheSalarieClient } from '@/components/salaries/fiche/fiche-salarie-client';
import { lireSalarie } from '@/lib/api/salaries';

interface Props {
  readonly params: Promise<{ id: string; salarieId: string }>;
}

export default async function PageFicheSalarie({ params }: Props) {
  const { id: companyId, salarieId } = await params;

  try {
    const reponse = await lireSalarie(companyId, salarieId);

    return (
      <div className="space-y-4">
        <FicheSalarieClient companyId={companyId} salarieId={salarieId} initial={reponse.donnees} />
      </div>
    );
  } catch {
    return notFound();
  }
}
