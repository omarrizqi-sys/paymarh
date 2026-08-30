import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VERSION_BACK_OFFICE } from '@/lib/version';

export default function PageAccueil() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">PaymaRH — Back-office</h1>
        <p className="text-muted-foreground text-sm">
          Logiciel de paie marocain pour le secteur prive.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Fiches societe</CardTitle>
          <CardDescription>
            Module 1 — creer et parametrer les dossiers de paie du compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/societes">
            <Button>Ouvrir la liste des societes</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Socle technique</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Version</dt>
            <dd className="font-mono text-xs">{VERSION_BACK_OFFICE}</dd>
            <dt className="text-muted-foreground">Authentification</dt>
            <dd>Non implementee (relais x-paymarh-user-id en dev)</dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
