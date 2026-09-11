'use client';

import { LienGarde } from './navigation-gardee';

export function NavigationEnTete() {
  return (
    <nav className="flex items-center gap-6">
      <LienGarde href="/" className="font-semibold tracking-tight">
        VECTA
      </LienGarde>
      <LienGarde
        href="/societes"
        className="text-muted-foreground hover:text-foreground text-sm"
      >
        Sociétés
      </LienGarde>
    </nav>
  );
}
