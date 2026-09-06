import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppelApiEchoue } from './client';
import {
  estSignalisationUsageServeurDynamiqueNext,
  journaliserErreurServeur,
} from './ecrire-trace-stderr';

describe('estSignalisationUsageServeurDynamiqueNext', () => {
  it('reconnait le signal Next.js de bascule en route dynamique', () => {
    expect(
      estSignalisationUsageServeurDynamiqueNext(
        new Error(
          "Dynamic server usage: Route /societes couldn't be rendered statically because it used no-store fetch http://localhost:3001/societes /societes."
        )
      )
    ).toBe(true);
  });

  it('ignore les erreurs qui ne sont pas ce signal Next.js', () => {
    expect(
      estSignalisationUsageServeurDynamiqueNext(
        new AppelApiEchoue(503, {
          code: 'ERREUR',
          message: 'Service indisponible.',
        })
      )
    ).toBe(false);
    expect(estSignalisationUsageServeurDynamiqueNext('Dynamic server usage: pas une Error')).toBe(
      false
    );
  });
});

describe('journaliserErreurServeur', () => {
  const ecritureStderr = vi.spyOn(process.stderr, 'write');

  afterEach(() => {
    ecritureStderr.mockClear();
  });

  it('B1 — une vraie erreur d appel API est toujours tracee', () => {
    journaliserErreurServeur(
      new AppelApiEchoue(503, { code: 'ERREUR', message: 'Service indisponible.' }),
      { methode: 'GET', url: 'http://localhost:3001/societes' }
    );

    expect(ecritureStderr).toHaveBeenCalledOnce();
    const trace = String(ecritureStderr.mock.calls[0]?.[0] ?? '');
    expect(trace).toContain('[paymarh-api] GET http://localhost:3001/societes');
    expect(trace).toContain('statut=503');
    expect(trace).toContain('Service indisponible.');
  });

  it('ne trace pas la signalisation Next.js d usage serveur dynamique', () => {
    journaliserErreurServeur(
      new Error(
        "Dynamic server usage: Route /societes couldn't be rendered statically because it used revalidate: 0 fetch http://localhost:3001/societes /societes."
      ),
      { methode: 'GET', url: 'http://localhost:3001/societes' }
    );

    expect(ecritureStderr).not.toHaveBeenCalled();
  });
});
