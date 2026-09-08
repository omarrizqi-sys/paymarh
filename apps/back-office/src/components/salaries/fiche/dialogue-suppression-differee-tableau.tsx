'use client';

import { Button } from '@/components/ui/button';

interface Props {
  readonly titre: string;
  readonly corps: string;
  readonly libelleConfirmer: string;
  readonly libelleAnnuler: string;
  readonly ouvert: boolean;
  readonly onFermer: () => void;
  readonly onConfirmer: () => void;
}

export function DialogueSuppressionDiffereeTableau({
  titre,
  corps,
  libelleConfirmer,
  libelleAnnuler,
  ouvert,
  onFermer,
  onConfirmer,
}: Props) {
  if (!ouvert) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialogue-suppression-differee-titre"
      data-testid="dialogue-suppression-differee"
    >
      <div className="bg-background max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border p-6 shadow-lg">
        <h2
          id="dialogue-suppression-differee-titre"
          data-testid="dialogue-suppression-differee-titre"
          className="mb-4 text-lg font-semibold"
        >
          {titre}
        </h2>
        <p className="mb-4 text-sm" data-testid="dialogue-suppression-differee-corps">
          {corps}
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onFermer}
            data-testid="dialogue-suppression-differee-annuler"
          >
            {libelleAnnuler}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirmer}
            data-testid="dialogue-suppression-differee-confirmer"
          >
            {libelleConfirmer}
          </Button>
        </div>
      </div>
    </div>
  );
}
