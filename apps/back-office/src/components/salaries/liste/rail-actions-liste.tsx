'use client';

import type { Permission } from '@paymarh/shared-types';
import { possedePermission } from '@/lib/permissions';
import { Button } from '@/components/ui/button';

interface Props {
  readonly operations: readonly Permission[];
  readonly modeCompact?: boolean;
}

/** Rail liste — bouton creation uniquement, sans destination (2.1.c-2). */
export function RailActionsListe({ operations, modeCompact = false }: Props) {
  if (!possedePermission(operations, 'salarie.creer')) {
    return null;
  }

  return (
    <Button type="button" aria-label="Creer un salarie">
      {modeCompact ? '+' : 'Creer un salarie'}
    </Button>
  );
}
