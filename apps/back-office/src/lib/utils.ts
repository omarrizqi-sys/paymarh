import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Fusionne des classes Tailwind en resolvant les conflits.
 *
 * Utilitaire standard de shadcn/ui : sans lui, `class="p-2 p-4"` laisserait
 * les deux classes en place avec un resultat imprevisible.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
