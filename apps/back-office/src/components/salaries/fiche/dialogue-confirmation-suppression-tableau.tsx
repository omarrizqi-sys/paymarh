'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  MENTION_MODIFS_NON_ENREGISTREES,
  MENTION_SUPPRESSION_IMMEDIATE,
  type TextesConfirmationSuppression,
} from './textes-suppression-tableau-historise';

interface Props {
  readonly textes: TextesConfirmationSuppression | null;
  readonly preambule: string | null;
  readonly chargement: boolean;
  readonly erreur: string | undefined;
  readonly ouvert: boolean;
  readonly onFermer: () => void;
  readonly onConfirmer: () => void;
}

export function DialogueConfirmationSuppressionTableau({
  textes,
  preambule,
  chargement,
  erreur,
  ouvert,
  onFermer,
  onConfirmer,
}: Props) {
  if (!ouvert || textes === null) return null;

  const varianteHistorise = textes.variante === 'historise';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={
        varianteHistorise
          ? 'dialogue-suppression-ligne-titre'
          : 'dialogue-suppression-differee-titre'
      }
      data-testid={
        varianteHistorise ? 'dialogue-suppression-ligne' : 'dialogue-suppression-differee'
      }
    >
      <div className="bg-background max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border p-6 shadow-lg">
        <h2
          id={
            varianteHistorise
              ? 'dialogue-suppression-ligne-titre'
              : 'dialogue-suppression-differee-titre'
          }
          data-testid={
            varianteHistorise
              ? 'dialogue-suppression-ligne-titre'
              : 'dialogue-suppression-differee-titre'
          }
          className="mb-4 text-lg font-semibold"
        >
          {textes.titre}
        </h2>

        {preambule ? (
          <p className="text-muted-foreground mb-3 text-sm" data-testid="mention-situation-changee">
            {preambule}
          </p>
        ) : null}

        {varianteHistorise ? (
          <>
            {textes.messageServeur ? (
              <p className="mb-3 text-sm" data-testid="message-apercu-suppression">
                {textes.messageServeur}
              </p>
            ) : null}

            <p className="mb-3 text-sm" data-testid="mention-suppression-immediate">
              {MENTION_SUPPRESSION_IMMEDIATE}
            </p>

            {textes.rubriqueModifiee ? (
              <p
                className="text-muted-foreground mb-3 text-sm"
                data-testid="mention-modifs-non-enregistrees"
              >
                {MENTION_MODIFS_NON_ENREGISTREES}
              </p>
            ) : null}
          </>
        ) : (
          <p className="mb-4 text-sm" data-testid="dialogue-suppression-differee-corps">
            {textes.corps}
          </p>
        )}

        {erreur ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{erreur}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onFermer}
            disabled={chargement}
            data-testid={varianteHistorise ? undefined : 'dialogue-suppression-differee-annuler'}
          >
            {textes.libelleAnnuler}
          </Button>
          <Button
            variant="destructive"
            disabled={chargement || (varianteHistorise && !textes.messageServeur)}
            data-testid={
              varianteHistorise
                ? 'confirmer-suppression-ligne'
                : 'dialogue-suppression-differee-confirmer'
            }
            onClick={onConfirmer}
          >
            {textes.libelleConfirmer}
          </Button>
        </div>
      </div>
    </div>
  );
}
