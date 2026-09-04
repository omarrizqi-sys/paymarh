import { notFound } from 'next/navigation';
import { listerEtablissements } from '@/lib/api/etablissements';
import { listerSalaries } from '@/lib/api/salaries';
import {
  LienRetourFicheSociete,
  ListeSalariesClient,
} from '@/components/salaries/liste/liste-salaries-client';

interface Props {
  readonly params: Promise<{ id: string }>;
}

export default async function PageListeSalaries({ params }: Props) {
  const { id: companyId } = await params;

  try {
    const [listeRes, etabsRes] = await Promise.all([
      listerSalaries(companyId),
      listerEtablissements(companyId),
    ]);

    return (
      <div className="space-y-4">
        <LienRetourFicheSociete companyId={companyId} />
        <ListeSalariesClient
          companyId={companyId}
          initial={listeRes.donnees}
          etablissements={etabsRes.data.items}
          societeSansSalaries={listeRes.donnees.items.length === 0}
        />
      </div>
    );
  } catch {
    return notFound();
  }
}
