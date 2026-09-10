import { notFound } from 'next/navigation';
import { EcranCreationSalarie } from '@/components/salaries/creation/ecran-creation-salarie';
import { listerPays, listerSituationsFamiliales } from '@/lib/api/referentiels';
import { journaliserErreurServeur } from '@/lib/api/journaliser-erreur-serveur';

interface Props {
  readonly params: Promise<{ id: string }>;
}

export default async function PageCreationSalarie({ params }: Props) {
  const { id: companyId } = await params;

  try {
    const [pays, situations] = await Promise.all([listerPays(), listerSituationsFamiliales()]);

    return (
      <div className="space-y-4">
        <EcranCreationSalarie
          companyId={companyId}
          pays={pays.data.items}
          situationsFamiliales={situations.data.items}
        />
      </div>
    );
  } catch (erreur) {
    journaliserErreurServeur(erreur, {
      methode: 'GET',
      url: `/societes/${companyId}/salaries/nouveau`,
    });
    return notFound();
  }
}
