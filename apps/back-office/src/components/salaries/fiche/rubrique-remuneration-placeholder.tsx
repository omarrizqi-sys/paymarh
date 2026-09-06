'use client';

import { possedePermission } from '@/lib/permissions';
import type { Permission } from '@paymarh/shared-types';
import { Rubrique } from '@/components/formulaire/rubrique';

/** Placeholder remuneration — absent du DOM si permission refusee. */
export function RubriqueRemunerationPlaceholder({
  operations,
}: {
  readonly operations: readonly Permission[];
}) {
  if (!possedePermission(operations, 'salarie.remuneration.lire')) {
    return null;
  }

  return (
    <Rubrique id="remuneration" titre="Rémunération" description="Rubrique à venir">
      <p className="text-muted-foreground text-sm">Contenu à implémenter.</p>
    </Rubrique>
  );
}
