'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, PanelLeft, PanelRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  readonly sommaire?: ReactNode;
  readonly rubriques: ReactNode;
  readonly renderRail: (compact: boolean) => ReactNode;
  readonly afficherSommaire?: boolean;
}

export function SqueletteFicheSalarie({
  sommaire,
  rubriques,
  renderRail,
  afficherSommaire = true,
}: Props) {
  const [sommaireReplie, setSommaireReplie] = useState(false);
  const [railReplie, setRailReplie] = useState(false);

  return (
    <div className="flex min-h-[70vh] gap-4">
      {afficherSommaire && sommaire !== undefined ? (
        <aside
          className={
            sommaireReplie ? 'hidden w-10 shrink-0 lg:block' : 'hidden w-56 shrink-0 lg:block'
          }
          data-testid="colonne-sommaire"
        >
          {sommaireReplie ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Deplier le sommaire"
              onClick={() => setSommaireReplie(false)}
            >
              <PanelLeft className="size-4" />
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Sommaire</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Replier le sommaire"
                  onClick={() => setSommaireReplie(true)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
              </div>
              {sommaire}
            </div>
          )}
        </aside>
      ) : null}

      <main className="min-w-0 flex-1 space-y-6" data-testid="colonne-rubriques">
        {rubriques}
      </main>

      <aside
        className={railReplie ? 'w-12 shrink-0' : 'hidden w-52 shrink-0 md:block'}
        data-testid="colonne-rail"
      >
        {railReplie ? (
          <div className="flex flex-col items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Deplier le rail d actions"
              data-testid="deplier-rail"
              onClick={() => setRailReplie(false)}
            >
              <PanelRight className="size-4" />
            </Button>
            <div data-testid="rail-icones">{renderRail(true)}</div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Actions</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Replier le rail d actions"
                data-testid="replier-rail"
                onClick={() => setRailReplie(true)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
            {renderRail(false)}
          </div>
        )}
      </aside>
    </div>
  );
}
