'use client';

import { useRouter } from 'next/navigation';
import type { Permission } from '@paymarh/shared-types';
import { possedePermission } from '@/lib/permissions';
import { Button } from '@/components/ui/button';

interface Props {
  readonly operations: readonly Permission[];
  readonly companyId: string;
  readonly modeCompact?: boolean;
}

/** Rail liste — bouton creation vers l ecran nouveau salarie. */
export function RailActionsListe({ operations, companyId, modeCompact = false }: Props) {
  const router = useRouter();
  if (!possedePermission(operations, 'salarie.creer')) {
    return null;
  }

  return (
    <Button
      type="button"
      aria-label="Créer un salarié"
      onClick={() => router.push(`/societes/${companyId}/salaries/nouveau`)}
    >
      {modeCompact ? '+' : 'Créer un salarié'}
    </Button>
  );
}
