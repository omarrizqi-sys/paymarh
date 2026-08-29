import { createHash } from 'node:crypto';

/**
 * Jeton de confirmation d une suppression.
 *
 * Derive de l inventaire d impact (sans le jeton lui-meme). Si l inventaire
 * change entre l apercu et le DELETE, le jeton ne correspond plus.
 */
export function calculerJetonConfirmation(inventaireSansJeton: unknown): string {
  const canonique = JSON.stringify(inventaireSansJeton);
  return createHash('sha256').update(canonique).digest('hex').slice(0, 32);
}

export function jetonsIdentiques(attendu: string, fourni: string): boolean {
  return attendu.length > 0 && attendu === fourni;
}
