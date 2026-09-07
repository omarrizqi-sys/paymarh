'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppelApiEchoue } from '@/lib/api/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface Props {
  readonly titre: string;
  readonly ouvert: boolean;
  readonly onFermer: () => void;
  readonly onConfirme: () => void;
  readonly chargerApercu: () => Promise<{ message: string; jetonConfirmation: string }>;
  readonly supprimer: (jeton: string) => Promise<void>;
  readonly rubriqueModifiee: boolean;
}

const MENTION_IMMEDIATE =
  'Cette suppression part tout de suite. Le bouton Annuler de la fiche ne reviendra pas dessus.';

const MENTION_MODIFS_NON_ENREGISTREES =
  'Vos autres modifications de cette rubrique restent à enregistrer.';

/**
 * Confirmation de suppression immediate d une ligne de tableau deja enregistree.
 * Affiche le message serveur tel quel (exception CONVENTIONS §13).
 */
export function DialogueSuppressionLigneTableau({
  titre,
  ouvert,
  onFermer,
  onConfirme,
  chargerApercu,
  supprimer,
  rubriqueModifiee,
}: Props) {
  const [message, setMessage] = useState('');
  const [jeton, setJeton] = useState('');
  const [chargement, setChargement] = useState(false);
  const [situationChangee, setSituationChangee] = useState(false);
  const [erreur, setErreur] = useState<string | undefined>();

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur(undefined);
    try {
      const apercu = await chargerApercu();
      setMessage(apercu.message);
      setJeton(apercu.jetonConfirmation);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Impossible de charger l’aperçu.');
    } finally {
      setChargement(false);
    }
  }, [chargerApercu]);

  useEffect(() => {
    if (ouvert) {
      setSituationChangee(false);
      void recharger();
    }
  }, [ouvert, recharger]);

  async function confirmer(): Promise<void> {
    if (!jeton) return;
    setChargement(true);
    setErreur(undefined);
    try {
      await supprimer(jeton);
      onConfirme();
      onFermer();
    } catch (e) {
      if (e instanceof AppelApiEchoue && e.erreur.code === 'CONFIRMATION_OBSOLETE') {
        setSituationChangee(true);
        await recharger();
        return;
      }
      setErreur(e instanceof AppelApiEchoue ? e.erreur.message : 'La suppression a échoué.');
    } finally {
      setChargement(false);
    }
  }

  if (!ouvert) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialogue-suppression-ligne-titre"
      data-testid="dialogue-suppression-ligne"
    >
      <div className="bg-background max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border p-6 shadow-lg">
        <h2
          id="dialogue-suppression-ligne-titre"
          data-testid="dialogue-suppression-ligne-titre"
          className="mb-4 text-lg font-semibold"
        >
          {titre}
        </h2>

        {situationChangee ? (
          <p className="text-muted-foreground mb-3 text-sm" data-testid="mention-situation-changee">
            La situation a changé depuis l’affichage.
          </p>
        ) : null}

        {message ? (
          <p className="mb-3 text-sm" data-testid="message-apercu-suppression">
            {message}
          </p>
        ) : null}

        <p className="mb-3 text-sm" data-testid="mention-suppression-immediate">
          {MENTION_IMMEDIATE}
        </p>

        {rubriqueModifiee ? (
          <p
            className="text-muted-foreground mb-3 text-sm"
            data-testid="mention-modifs-non-enregistrees"
          >
            {MENTION_MODIFS_NON_ENREGISTREES}
          </p>
        ) : null}

        {erreur ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{erreur}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onFermer} disabled={chargement}>
            Garder la ligne
          </Button>
          <Button
            variant="destructive"
            disabled={!jeton || chargement}
            data-testid="confirmer-suppression-ligne"
            onClick={() => void confirmer()}
          >
            Supprimer
          </Button>
        </div>
      </div>
    </div>
  );
}
