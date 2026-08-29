import { EtatApi } from '@/components/etat-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VERSION_BACK_OFFICE } from '@/lib/version';

/**
 * Page d accueil technique du back-office.
 *
 * MODULE 0 : c est la SEULE page de l application, et elle ne contient
 * volontairement aucune fonctionnalite metier. Elle sert uniquement a prouver
 * que le socle tourne : le front s affiche, et il joint l API.
 */
export default function PageAccueil() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">PaymaRH — Back-office</h1>
        <p className="text-muted-foreground text-sm">
          Logiciel de paie marocain pour le secteur prive. Socle technique, module 0.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Liaison avec l&apos;API</CardTitle>
          <CardDescription>
            Le back-office n&apos;est qu&apos;un client : toute la logique vit dans l&apos;API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EtatApi />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Etat du socle</CardTitle>
          <CardDescription>
            Ce qui est en place, et ce qui ne l&apos;est pas encore.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Version du back-office</dt>
            <dd className="font-mono text-xs">{VERSION_BACK_OFFICE}</dd>

            <dt className="text-muted-foreground">Authentification</dt>
            <dd>Non implementee (coquille Auth.js desactivee)</dd>

            <dt className="text-muted-foreground">Fonctionnalites de paie</dt>
            <dd>Aucune — elles arriveront par modules</dd>
          </dl>
        </CardContent>
      </Card>
    </main>
  );
}
