import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listerSalaries } from './salaries';

describe('listerSalaries', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        donnees: { items: [], prochainCurseur: null, operations: [] },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('transmet le companyId du parametre d URL en x-paymarh-company-id', async () => {
    const companyIdUrl = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    await listerSalaries(companyIdUrl);

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const entetes = options.headers as Record<string, string>;

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/salaries'),
      expect.objectContaining({ cache: 'no-store' })
    );
    expect(entetes['x-paymarh-company-id']).toBe(companyIdUrl);
  });
});
