'use client';

import type { ReactNode } from 'react';

import { NavigationGardeeProvider } from '@/components/navigation/navigation-gardee';

import { SaisiePerdableRacineProvider } from '@/components/navigation/saisie-perdable-racine';

/** Enveloppe les tests qui montent RailActionsFiche ou un lien garde hors FicheSalarieClient. */

export function NavigationGardeeTestProvider({ children }: { readonly children?: ReactNode }) {
  return (
    <SaisiePerdableRacineProvider>
      <NavigationGardeeProvider>{children}</NavigationGardeeProvider>
    </SaisiePerdableRacineProvider>
  );
}
