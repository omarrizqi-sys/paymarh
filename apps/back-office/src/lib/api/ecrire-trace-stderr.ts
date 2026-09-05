/**
 * Ecriture brute d une trace d appel API sur process.stderr.
 *
 * Pas de console.* : Next relaie console vers le navigateur en developpement.
 * Cote navigateur, process.stderr n existe pas : no-op, rien ne fuit.
 */

export interface ContexteAppel {
  readonly methode: string;
  readonly url: string;
}

/** Journalise une erreur d appel sans jamais jeter ni toucher au navigateur. */
export function journaliserErreurServeur(erreur: unknown, appel: ContexteAppel): void {
  if (typeof process === 'undefined' || typeof process.stderr?.write !== 'function') {
    return;
  }

  try {
    process.stderr.write(formaterTrace(erreur, appel));
  } catch {
    // Un journal qui jette masquerait l ecran metier. On avale.
  }
}

function formaterTrace(erreur: unknown, appel: ContexteAppel): string {
  const lignes = [
    `[paymarh-api] ${appel.methode} ${appel.url}`,
    `nom=${nomErreur(erreur)}`,
    `message=${messageErreur(erreur)}`,
    `cause=${decrireCause(erreur)}`,
    `pile=${pileErreur(erreur)}`,
  ];

  const statut = statutHttp(erreur);
  if (statut !== undefined) {
    lignes.splice(3, 0, `statut=${statut}`);
  }

  return `${lignes.join('\n')}\n`;
}

function nomErreur(erreur: unknown): string {
  return erreur instanceof Error ? erreur.name : typeof erreur;
}

function messageErreur(erreur: unknown): string {
  if (erreur instanceof Error) {
    return erreur.message;
  }
  if (typeof erreur === 'string') {
    return erreur;
  }
  return String(erreur);
}

function pileErreur(erreur: unknown): string {
  if (erreur instanceof Error && typeof erreur.stack === 'string') {
    return erreur.stack;
  }
  return '—';
}

function statutHttp(erreur: unknown): number | undefined {
  if (typeof erreur === 'object' && erreur !== null && 'statut' in erreur) {
    const statut = (erreur as { statut: unknown }).statut;
    return typeof statut === 'number' ? statut : undefined;
  }
  return undefined;
}

function decrireCause(erreur: unknown): string {
  if (!(erreur instanceof Error) || erreur.cause === undefined) {
    return extraireChampsNode(erreur) ?? '—';
  }

  const cause = erreur.cause;
  const champs = extraireChampsNode(cause);
  if (cause instanceof Error) {
    return champs
      ? `${cause.name}: ${cause.message} (${champs})`
      : `${cause.name}: ${cause.message}`;
  }

  return champs ? `${String(cause)} (${champs})` : String(cause);
}

function extraireChampsNode(valeur: unknown): string | undefined {
  if (typeof valeur !== 'object' || valeur === null) {
    return undefined;
  }

  const e = valeur as NodeJS.ErrnoException & { address?: string; port?: number };
  const parts: string[] = [];
  if (typeof e.code === 'string') {
    parts.push(`code=${e.code}`);
  }
  if (typeof e.syscall === 'string') {
    parts.push(`syscall=${e.syscall}`);
  }
  if (typeof e.address === 'string') {
    parts.push(`address=${e.address}`);
  }
  if (typeof e.port === 'number') {
    parts.push(`port=${e.port}`);
  }

  return parts.length > 0 ? parts.join(' ') : undefined;
}
