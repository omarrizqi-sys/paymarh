'use client';

import { EtatApi } from '@/components/etat-api';
import { NavigationEnTete } from './navigation-en-tete';
import { NavigationGardeeProvider } from './navigation-gardee';
import { SaisiePerdableRacineProvider } from './saisie-perdable-racine';

export function EnveloppeNavigationRacine({ children }: { readonly children: React.ReactNode }) {
  return (
    <SaisiePerdableRacineProvider>
      <NavigationGardeeProvider>
        <header className="border-b">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <NavigationEnTete />
            <EtatApi />
          </div>
        </header>
        {children}
      </NavigationGardeeProvider>
    </SaisiePerdableRacineProvider>
  );
}
