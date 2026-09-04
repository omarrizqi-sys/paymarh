import Link from 'next/link';

interface Props {
  readonly params: Promise<{ id: string }>;
}

/** Placeholder liste salariés — implémentation complète au temps 2.b. */
export default async function PageListeSalaries({ params }: Props) {
  const { id: companyId } = await params;

  return (
    <div className="space-y-4">
      <Link href={`/societes/${companyId}`} className="text-primary text-sm hover:underline">
        ← Retour a la fiche societe
      </Link>
      <h1 className="text-2xl font-semibold">Salaries</h1>
      <p className="text-muted-foreground text-sm">
        Liste des salaries — a implementer au temps 2.b.
      </p>
    </div>
  );
}
