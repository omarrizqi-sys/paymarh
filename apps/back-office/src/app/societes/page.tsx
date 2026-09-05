import { listerSocietes } from '@/lib/api/societes';
import { chargerReferentielsFiche } from '@/lib/api/referentiels';
import { identifiantUtilisateurDev, urlApi } from '@/lib/api/client';
import { journaliserErreurServeur } from '@/lib/api/journaliser-erreur-serveur';
import { ListeSocietes } from '@/components/societes/liste-societes';
import {
  libelleForme,
  peutCreerSociete,
  type LigneSocieteListe,
} from '@/lib/affichage/liste-societes';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default async function PageListeSocietes() {
  if (!identifiantUtilisateurDev()) {
    return (
      <Alert variant="warning">
        <AlertDescription>
          Definissez NEXT_PUBLIC_PAYMARH_USER_ID dans .env (id de l administrateur de compte du
          seed).
        </AlertDescription>
      </Alert>
    );
  }

  try {
    const [{ data: liste }, refs] = await Promise.all([
      listerSocietes(),
      chargerReferentielsFiche(),
    ]);

    const lignes: LigneSocieteListe[] = liste.items.map((s) => ({
      ...s,
      libelleFormeJuridique: libelleForme(refs.formesJuridiques, s.formeJuridiqueId),
    }));

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Societes</h1>
          <p className="text-muted-foreground text-sm">Dossiers de paie du compte</p>
        </div>
        <ListeSocietes societes={lignes} peutCreer={peutCreerSociete(liste.operations)} />
      </div>
    );
  } catch (erreur) {
    journaliserErreurServeur(erreur, { methode: 'GET', url: `${urlApi()}/societes` });
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Impossible de charger les societes. Verifiez que l API tourne et que
          NEXT_PUBLIC_PAYMARH_USER_ID est correct.
        </AlertDescription>
      </Alert>
    );
  }
}
