'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { recupererSante, urlApi, type ResultatSante } from '@/lib/api/health';

/**
 * Temoin de connexion a l API.
 *
 * Composant client : l appel a `GET /health` est fait depuis le navigateur,
 * apres l affichage de la page. Consequence utile : le back-office se
 * construit et s affiche meme lorsque l API est arretee, et signale
 * simplement qu il ne la joint pas.
 */
export function EtatApi() {
  const [resultat, setResultat] = useState<ResultatSante>({
    etat: 'verification',
    reponse: null,
    message: "Verification de la liaison avec l'API...",
  });

  useEffect(() => {
    let actif = true;

    void recupererSante().then((nouveau) => {
      // Evite de mettre a jour un composant demonte si l utilisateur a
      // quitte la page pendant l appel.
      if (actif) {
        setResultat(nouveau);
      }
    });

    return () => {
      actif = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {resultat.etat === 'verification' && (
          <Badge variant="secondary">
            <Loader2 className="size-3.5 animate-spin" />
            Verification
          </Badge>
        )}
        {resultat.etat === 'en-ligne' && (
          <Badge variant="success">
            <CheckCircle2 className="size-3.5" />
            API en ligne
          </Badge>
        )}
        {resultat.etat === 'hors-ligne' && (
          <Badge variant="destructive">
            <XCircle className="size-3.5" />
            API injoignable
          </Badge>
        )}
      </div>

      <p className="text-muted-foreground text-sm">{resultat.message}</p>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">Adresse de l&apos;API</dt>
        <dd className="font-mono text-xs">{urlApi()}</dd>

        {resultat.reponse && (
          <>
            <dt className="text-muted-foreground">Version de l&apos;API</dt>
            <dd className="font-mono text-xs">{resultat.reponse.version}</dd>

            <dt className="text-muted-foreground">Horodatage</dt>
            <dd className="font-mono text-xs">{resultat.reponse.timestamp}</dd>
          </>
        )}
      </dl>
    </div>
  );
}
