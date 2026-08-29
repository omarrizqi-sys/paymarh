import { describe, expect, it } from 'vitest';
import { estHealthResponse, interpreterReponse } from './health';

// Le back-office ne contient aucune logique metier : ce qu il y a de plus
// "logique" chez lui, c est l interpretation de la reponse de l API. C est
// donc cela que l on teste.

describe('interpreterReponse', () => {
  const reponseValide = {
    status: 'ok',
    timestamp: '2026-01-01T00:00:00.000Z',
    version: '0.1.0',
  };

  it('considere l API en ligne sur un 200 bien forme', () => {
    const resultat = interpreterReponse(200, reponseValide);

    expect(resultat.etat).toBe('en-ligne');
    expect(resultat.reponse?.version).toBe('0.1.0');
  });

  it('considere l API hors ligne sur un code non 200', () => {
    expect(interpreterReponse(503, reponseValide).etat).toBe('hors-ligne');
  });

  it('refuse un corps de reponse mal forme, meme avec un code 200', () => {
    expect(interpreterReponse(200, { status: 'degraded' }).etat).toBe('hors-ligne');
    expect(interpreterReponse(200, null).etat).toBe('hors-ligne');
  });
});

describe('estHealthResponse', () => {
  it('rejette tout ce qui n est pas exactement la forme attendue', () => {
    expect(estHealthResponse(null)).toBe(false);
    expect(estHealthResponse('ok')).toBe(false);
    expect(estHealthResponse({ status: 'ok' })).toBe(false);
    expect(estHealthResponse({ status: 'ok', timestamp: 1, version: '1' })).toBe(false);
  });

  it('accepte une reponse complete', () => {
    expect(
      estHealthResponse({ status: 'ok', timestamp: '2026-01-01T00:00:00.000Z', version: '0.1.0' })
    ).toBe(true);
  });
});
