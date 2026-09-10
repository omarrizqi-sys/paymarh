'use client';

import { Button } from '@/components/ui/button';
import { useRegistreCreation } from './registre-creation-provider';

interface Props {
  readonly modeCompact?: boolean;
  readonly onCreer: () => void;
  readonly onAnnuler?: () => void;
}

export function RailActionsCreation({ modeCompact = false, onCreer, onAnnuler }: Props) {
  const { enregistrementEnCours, annuler } = useRegistreCreation();

  return (
    <div className="space-y-3" data-testid={modeCompact ? 'rail-compact' : 'rail-etendu'}>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          size={modeCompact ? 'icon' : 'default'}
          aria-label="Créer le salarié"
          disabled={enregistrementEnCours}
          onClick={onCreer}
        >
          {modeCompact ? '+' : 'Créer le salarié'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size={modeCompact ? 'icon' : 'default'}
          aria-label="Annuler"
          disabled={enregistrementEnCours}
          onClick={() => {
            onAnnuler?.();
            annuler();
          }}
        >
          {modeCompact ? '↩' : 'Annuler'}
        </Button>
      </div>
    </div>
  );
}
