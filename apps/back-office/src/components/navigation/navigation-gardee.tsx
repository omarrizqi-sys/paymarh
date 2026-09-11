'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { DialogueConfirmationSuppressionTableau } from './dialogue-confirmation-suppression-tableau';
import { useSaisiePerdableRacine } from './saisie-perdable-racine';
import type { TextesConfirmationSuppression } from './textes-suppression-tableau-historise';

interface EtatDialogueNavigation {
  readonly ouvert: boolean;
  readonly libelles: readonly string[];
  readonly action: (() => void) | null;
}

export interface NavigationGardeeContexte {
  push(href: string): void;
  replace(href: string): void;
  back(): void;
  forward(): void;
  refresh(): void;
  executerAvecGarde(action: () => void): void;
}

const ContexteNavigationGardee = createContext<NavigationGardeeContexte | null>(null);

export function textesQuitterPage(libelles: readonly string[]): TextesConfirmationSuppression {
  const suffixe = libelles.length > 0 ? `\n\nRubriques concernées : ${libelles.join(', ')}.` : '';
  return {
    variante: 'differee',
    titre: 'Quitter cette page ?',
    corps: `Vous avez des modifications non enregistrées. Quitter cette page les abandonnera.${suffixe}`,
    libelleConfirmer: 'Quitter cette page',
    libelleAnnuler: 'Rester',
  };
}

export function NavigationGardeeProvider({ children }: { readonly children?: ReactNode }) {
  const router = useRouter();
  const { lireModifications } = useSaisiePerdableRacine();
  const [dialogue, setDialogue] = useState<EtatDialogueNavigation>({
    ouvert: false,
    libelles: [],
    action: null,
  });

  const executerAvecGarde = useCallback(
    (action: () => void) => {
      const { aModifications, libelles } = lireModifications();
      if (!aModifications) {
        action();
        return;
      }
      setDialogue({ ouvert: true, libelles, action });
    },
    [lireModifications]
  );

  const valeur = useMemo(
    (): NavigationGardeeContexte => ({
      push: (href) => executerAvecGarde(() => router.push(href)),
      replace: (href) => executerAvecGarde(() => router.replace(href)),
      back: () => executerAvecGarde(() => router.back()),
      forward: () => executerAvecGarde(() => router.forward()),
      refresh: () => router.refresh(),
      executerAvecGarde,
    }),
    [executerAvecGarde, router]
  );

  const fermerDialogue = useCallback(() => {
    setDialogue({ ouvert: false, libelles: [], action: null });
  }, []);

  const confirmerQuitter = useCallback(() => {
    const action = dialogue.action;
    fermerDialogue();
    action?.();
  }, [dialogue.action, fermerDialogue]);

  return (
    <ContexteNavigationGardee.Provider value={valeur}>
      {children}
      <DialogueConfirmationSuppressionTableau
        textes={dialogue.ouvert ? textesQuitterPage(dialogue.libelles) : null}
        preambule={null}
        chargement={false}
        erreur={undefined}
        ouvert={dialogue.ouvert}
        onFermer={fermerDialogue}
        onConfirmer={confirmerQuitter}
      />
    </ContexteNavigationGardee.Provider>
  );
}

export function useNavigationGardee(): NavigationGardeeContexte {
  const contexte = useContext(ContexteNavigationGardee);
  if (contexte === null) {
    throw new Error('useNavigationGardee doit etre utilise dans NavigationGardeeProvider.');
  }
  return contexte;
}

type PropsLienGarde = Omit<ComponentProps<typeof Link>, 'href'> & {
  readonly href: string;
};

export function LienGarde({ href, onClick, ...props }: PropsLienGarde) {
  const { push } = useNavigationGardee();

  return (
    <Link
      href={href}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        ) {
          return;
        }

        event.preventDefault();
        push(href);
      }}
    />
  );
}
