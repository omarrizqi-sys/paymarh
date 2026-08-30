import type { Permission } from './permission';

/** Ressource de lecture enrichie des operations autorisees pour l appelant. */
export type RessourceAvecOperations<T> = T & {
  readonly operations: readonly Permission[];
};

/** Liste avec operations au niveau collection (ex. creer une societe). */
export interface ListResponseAvecOperations<T> {
  readonly items: readonly RessourceAvecOperations<T>[];
  readonly total: number;
  readonly operations: readonly Permission[];
}
