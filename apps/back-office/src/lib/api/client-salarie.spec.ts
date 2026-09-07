import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppelApiEchoue } from './client';
import { appelerSalarieDelete, appelerSalariePost, appelerSalariePut } from './client-salarie';

describe('client-salarie — ecritures tableaux', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ donnees: { version: 8 }, alertes: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('T01 — creer une ligne : corps et If-Match partent, nouvelle version rendue', async () => {
    const reponse = await appelerSalariePost<{ version: number }>(
      'soc-1',
      '/salaries/sal-1/personnes-a-charge',
      { prenom: 'Ali' },
      7
    );

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/salaries/sal-1/personnes-a-charge');
    expect(options.method).toBe('POST');
    expect(options.body).toBe(JSON.stringify({ prenom: 'Ali' }));
    expect((options.headers as Record<string, string>)['if-match']).toBe('7');
    expect(reponse.donnees.version).toBe(8);
  });

  it('T02 — remplacer une liste PUT : corps et If-Match partent, nouvelle version rendue', async () => {
    const reponse = await appelerSalariePut<{ version: number }>(
      'soc-1',
      '/salaries/sal-1/comptes-bancaires',
      { comptes: [] },
      4
    );

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe('PUT');
    expect(options.body).toBe(JSON.stringify({ comptes: [] }));
    expect((options.headers as Record<string, string>)['if-match']).toBe('4');
    expect(reponse.donnees.version).toBe(8);
  });

  it('T03 — supprimer : jeton en parametre URL et If-Match presents', async () => {
    await appelerSalarieDelete(
      'soc-1',
      '/salaries/sal-1/personnes-a-charge/lig-1?confirmationJeton=abc123',
      5
    );

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('confirmationJeton=abc123');
    expect(options.method).toBe('DELETE');
    expect((options.headers as Record<string, string>)['if-match']).toBe('5');
  });

  it('T04 — 409 CONFLIT_VERSION et 400 metier sont distingues', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ code: 'CONFLIT_VERSION', message: 'Conflit' }),
    });

    await expect(
      appelerSalariePost('soc-1', '/salaries/s/personnes-a-charge', {}, 1)
    ).rejects.toMatchObject({
      statut: 409,
      erreur: { code: 'CONFLIT_VERSION' },
    });

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ code: 'VALEUR_REFUSEE', message: 'Refus' }),
    });

    try {
      await appelerSalariePost('soc-1', '/salaries/s/personnes-a-charge', {}, 1);
    } catch (erreur) {
      expect(erreur).toBeInstanceOf(AppelApiEchoue);
      expect((erreur as AppelApiEchoue).statut).toBe(400);
      expect((erreur as AppelApiEchoue).erreur.code).toBe('VALEUR_REFUSEE');
    }
  });
});
